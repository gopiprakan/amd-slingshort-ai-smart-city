import os
from datetime import datetime

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

# Support both package execution (`python -m backend.app`) and direct script execution
try:
    from backend.classifier_service import predict_department
except ModuleNotFoundError:
    from classifier_service import predict_department
from backend.db import get_db_connection, close_db_connection
from models.duplicate_detector import is_duplicate
from models.priority_scorer import calculate_priority

# Blueprint for complaint-related routes
complaint_bp = Blueprint("complaint_bp", __name__)

# Upload configuration
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# Build absolute upload path inside backend/ and create it if missing
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER_PATH = os.path.join(BACKEND_DIR, UPLOAD_FOLDER)
os.makedirs(UPLOAD_FOLDER_PATH, exist_ok=True)


def allowed_file(filename):
    """
    Check whether uploaded file has an allowed image extension.
    """
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def ensure_assigned_team_column(connection):
    """
    Safe migration: add assigned_team column if missing.
    """
    cursor = connection.cursor()
    cursor.execute("PRAGMA table_info(complaints)")
    columns = [column["name"] for column in cursor.fetchall()]

    if "assigned_team" not in columns:
        cursor.execute("ALTER TABLE complaints ADD COLUMN assigned_team TEXT")
        connection.commit()


def ensure_sla_columns(connection):
    """
    Safe migration: add SLA tracking columns if missing.
    """
    cursor = connection.cursor()
    cursor.execute("PRAGMA table_info(complaints)")
    columns = [column["name"] for column in cursor.fetchall()]

    updates = []
    if "assigned_time" not in columns:
        updates.append("ALTER TABLE complaints ADD COLUMN assigned_time TEXT")
    if "sla_deadline" not in columns:
        updates.append("ALTER TABLE complaints ADD COLUMN sla_deadline TEXT")
    if "completed_time" not in columns:
        updates.append("ALTER TABLE complaints ADD COLUMN completed_time TEXT")
    if "sla_status" not in columns:
        updates.append("ALTER TABLE complaints ADD COLUMN sla_status TEXT DEFAULT 'PENDING'")

    if updates:
        for query in updates:
            cursor.execute(query)
        connection.commit()


def ensure_assignment_logs_table(connection):
    """
    Safe migration: ensure assignment log table exists.
    """
    cursor = connection.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS assignment_logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER,
            action_type TEXT,
            assigned_to TEXT,
            previous_status TEXT,
            new_status TEXT,
            performed_by TEXT,
            timestamp TEXT,
            notes TEXT,
            FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        )
        """
    )
    connection.commit()


def insert_assignment_log(
    cursor,
    complaint_id,
    action_type,
    assigned_to=None,
    previous_status=None,
    new_status=None,
    performed_by="System",
    notes=None,
):
    cursor.execute(
        """
        INSERT INTO assignment_logs (
            complaint_id,
            action_type,
            assigned_to,
            previous_status,
            new_status,
            performed_by,
            timestamp,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            complaint_id,
            action_type,
            assigned_to,
            previous_status,
            new_status,
            performed_by,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            notes,
        ),
    )


def parse_timestamp(value):
    """
    Parse SQLite timestamp text safely.
    """
    if not value:
        return None

    candidates = [
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
    ]

    for fmt in candidates:
        try:
            return datetime.strptime(str(value), fmt)
        except ValueError:
            continue
    return None


def refresh_sla_status_state(connection):
    """
    Update SLA status for complaints.
    """
    ensure_sla_columns(connection)

    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT
            complaint_id,
            status,
            assigned_time,
            sla_deadline,
            sla_status
        FROM complaints
        """
    )
    complaint_rows = cursor.fetchall()

    now_time = datetime.now()
    updates = []

    for row in complaint_rows:
        complaint_id = row["complaint_id"]
        status = str(row["status"] or "").lower()
        deadline = parse_timestamp(row["sla_deadline"])

        current_sla_status = row["sla_status"] or "PENDING"

        if status == "resolved":
            next_sla_status = "COMPLETED"
        elif deadline:
            if now_time > deadline:
                next_sla_status = "OVERDUE"
            else:
                next_sla_status = "ON_TIME"
        elif row["assigned_time"]:
            next_sla_status = "ON_TIME"
        else:
            next_sla_status = "PENDING"

        needs_update = next_sla_status != current_sla_status

        if needs_update:
            updates.append(
                (
                    next_sla_status,
                    complaint_id,
                )
            )

    if updates:
        cursor.executemany(
            """
            UPDATE complaints
            SET sla_status = ?
            WHERE complaint_id = ?
            """,
            updates,
        )
        connection.commit()


@complaint_bp.route("/submit-complaint", methods=["POST"])
def submit_complaint():
    """
    Process a complaint using:
    1) Department classification
    2) Duplicate detection (placeholder comparison for now)
    3) Priority scoring
    """
    try:
        # Support both JSON and multipart/form-data.
        # If multipart is used, text fields come from request.form and file comes from request.files.
        is_multipart = (
            request.content_type and "multipart/form-data" in request.content_type
        )
        data = request.form if is_multipart else (request.get_json(silent=True) or {})

        # Required field validation
        print("Data", data)
        description = data.get("description")
        print("Description", description)
        if not description:
            return jsonify({"error": "Field 'description' is required."}), 400

        # Optional inputs with safe defaults
        severity = data.get("severity", "low")
        people_affected = int(data.get("people_affected", 0))
        near_sensitive_raw = data.get("near_sensitive_location", False)
        print("Necessary console", severity, people_affected, near_sensitive_raw)
        if isinstance(near_sensitive_raw, str):
            near_sensitive_location = near_sensitive_raw.lower() in {"true", "1", "yes"}
        else:
            near_sensitive_location = bool(near_sensitive_raw)

        # Latitude/longitude are needed by duplicate detector
        # For now, same coordinates are used for incoming and placeholder complaint
        latitude = float(data.get("latitude", 0.0))
        longitude = float(data.get("longitude", 0.0))

        # Handle optional uploaded image file from multipart/form-data
        image_path = None
        uploaded_file = request.files.get("image")
        print("Uploaded file", uploaded_file)
        if uploaded_file and uploaded_file.filename:
            if not allowed_file(uploaded_file.filename):
                return jsonify(
                    {"error": "Invalid file type. Allowed: png, jpg, jpeg"}
                ), 400

            # Create a safe and unique filename to avoid overwriting existing files
            safe_name = secure_filename(uploaded_file.filename)
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
            unique_filename = f"{timestamp}_{safe_name}"

            # Save under backend/uploads and keep relative path in DB
            file_save_path = os.path.join(UPLOAD_FOLDER_PATH, unique_filename)
            uploaded_file.save(file_save_path)
            image_path = f"{UPLOAD_FOLDER}/{unique_filename}"

        # 1) Predict department from complaint text
        department = predict_department(description)
        print("Predicted Department", department)
        # 2) Duplicate detection against placeholder existing complaint
        duplicate_result, similarity, distance = is_duplicate(
            description,
            "sample existing complaint",
            latitude,
            longitude,
            latitude,
            longitude,
        )

        # 3) Calculate complaint priority
        priority = calculate_priority(
            severity,
            people_affected,
            near_sensitive_location,
        )

        # 4) Store processed complaint into database
        connection = None
        try:
            # Open DB connection
            connection = get_db_connection()
            cursor = connection.cursor()

            # Convert department name to department_id
            cursor.execute(
                """
                SELECT department_id
                FROM departments
                WHERE department_name = ?
                """,
                (department,),
            )
            department_row = cursor.fetchone()
            department_id = department_row["department_id"] if department_row else None

            # Insert complaint with derived department, priority, and optional image path
            cursor.execute(
                """
                INSERT INTO complaints (
                    description,
                    latitude,
                    longitude,
                    department_id,
                    priority_level,
                    status,
                    image_path
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    description,
                    latitude,
                    longitude,
                    department_id,
                    priority,
                    "Pending",
                    image_path,
                ),
            )

            # Save transaction
            connection.commit()
        except Exception as db_error:
            print("Error caused by db", db_error)
            return jsonify({"error": f"Database operation failed: {db_error}"}), 500
        finally:
            # Always close DB connection safely
            close_db_connection(connection)

        # Return processing result as JSON
        return jsonify(
            {
                "message": "Complaint processed and stored successfully",
                "image_path": image_path,
                "department": department,
                "priority": priority,
                "is_duplicate": duplicate_result,
                "similarity_score": similarity,
                "distance_km": distance,
            }
        ), 200

    except (TypeError, ValueError):
        # Handles bad numeric/boolean inputs in JSON
        return jsonify({"error": "Invalid input types in request body."}), 400
    except Exception as error:
        # Generic safety catch for unexpected runtime issues
        return jsonify({"error": f"Complaint processing failed: {error}"}), 500


@complaint_bp.route("/complaints", methods=["GET"])
def get_all_complaints():
    """
    Retrieve all complaints from the database in latest-first order.
    """
    connection = None
    try:
        # Open DB connection and fetch complaint records
        connection = get_db_connection()
        ensure_assigned_team_column(connection)
        refresh_sla_status_state(connection)
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT
                complaint_id,
                description,
                latitude,
                longitude,
                department_id,
                priority_level,
                status,
                assigned_team,
                assigned_time,
                sla_deadline,
                completed_time,
                sla_status,
                submitted_time
            FROM complaints
            ORDER BY submitted_time DESC
            """
        )
        complaint_rows = cursor.fetchall()

        # Convert sqlite rows to normal Python dictionaries
        complaints = [dict(row) for row in complaint_rows]

        # Return total count and full complaint list
        return jsonify(
            {
                "total": len(complaints),
                "complaints": complaints,
            }
        ), 200

    except Exception as db_error:
        return jsonify({"error": f"Database fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/complaints/priority/<priority_level>", methods=["GET"])
def get_complaints_by_priority(priority_level):
    """
    Retrieve complaints filtered by a specific priority level.
    """
    connection = None
    try:
        # Open DB connection and fetch filtered complaint records
        connection = get_db_connection()
        refresh_sla_status_state(connection)
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT
                complaint_id,
                description,
                latitude,
                longitude,
                department_id,
                priority_level,
                status,
                assigned_time,
                sla_deadline,
                completed_time,
                sla_status,
                submitted_time
            FROM complaints
            WHERE priority_level = ?
            ORDER BY submitted_time DESC
            """,
            (priority_level,),
        )
        complaint_rows = cursor.fetchall()

        # Convert sqlite rows to normal Python dictionaries
        complaints = [dict(row) for row in complaint_rows]

        # Return requested priority, count, and matching complaints
        return jsonify(
            {
                "priority": priority_level,
                "total": len(complaints),
                "complaints": complaints,
            }
        ), 200

    except Exception as db_error:
        return jsonify({"error": f"Database fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/complaints/stats", methods=["GET"])
def get_complaint_stats():
    """
    Return complaint statistics summary:
    - total complaints
    - complaint counts by priority level
    """
    connection = None
    try:
        # Open DB connection
        connection = get_db_connection()
        refresh_sla_status_state(connection)
        cursor = connection.cursor()

        # Query total complaint count
        cursor.execute("SELECT COUNT(*) AS total_count FROM complaints")
        total_count = cursor.fetchone()["total_count"]

        # Query complaint counts grouped by priority level
        cursor.execute(
            """
            SELECT priority_level, COUNT(*) AS count
            FROM complaints
            GROUP BY priority_level
            """
        )
        grouped_rows = cursor.fetchall()

        # Start with all priorities set to 0
        by_priority = {
            "Critical": 0,
            "High": 0,
            "Medium": 0,
            "Low": 0,
        }

        # Fill counts from query results
        for row in grouped_rows:
            priority_name = row["priority_level"]
            count = row["count"]
            if priority_name in by_priority:
                by_priority[priority_name] = count

        # Return stats response
        return jsonify(
            {
                "total": total_count,
                "by_priority": by_priority,
            }
        ), 200

    except Exception as db_error:
        return jsonify({"error": f"Database stats failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/complaints/locations", methods=["GET"])
def get_complaint_locations():
    """
    Retrieve complaint location coordinates for heatmap visualization.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT latitude, longitude
            FROM complaints
            WHERE latitude IS NOT NULL
              AND longitude IS NOT NULL
            """
        )
        rows = cursor.fetchall()
        locations = [dict(row) for row in rows]
        return jsonify(locations), 200
    except Exception as db_error:
        return jsonify({"error": f"Complaint location fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/dashboard/summary", methods=["GET"])
def get_dashboard_summary():
    """
    Return officer dashboard summary built from complaint records.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # KPI counters
        cursor.execute(
            """
            SELECT COUNT(*) AS count
            FROM complaints
            WHERE LOWER(COALESCE(status, '')) NOT IN ('resolved', 'closed')
            """
        )
        active_complaints = cursor.fetchone()["count"]

        cursor.execute(
            """
            SELECT COUNT(*) AS count
            FROM complaints
            WHERE priority_level = 'Critical'
              AND LOWER(COALESCE(status, '')) NOT IN ('resolved', 'closed')
            """
        )
        critical_unresolved = cursor.fetchone()["count"]

        cursor.execute(
            """
            SELECT COUNT(*) AS count
            FROM complaints
            WHERE DATE(submitted_time) = DATE('now', 'localtime')
            """
        )
        complaints_today = cursor.fetchone()["count"]

        cursor.execute(
            """
            SELECT COUNT(*) AS count
            FROM complaints
            WHERE LOWER(COALESCE(status, '')) NOT IN ('resolved', 'closed')
              AND submitted_time <= DATETIME('now', '-72 hours')
            """
        )
        overdue_count = cursor.fetchone()["count"]

        cursor.execute(
            """
            SELECT AVG((JULIANDAY('now') - JULIANDAY(submitted_time)) * 24.0) AS avg_hours
            FROM complaints
            WHERE LOWER(COALESCE(status, '')) IN ('resolved', 'closed')
            """
        )
        avg_hours_row = cursor.fetchone()
        avg_resolution_hours = round(avg_hours_row["avg_hours"], 2) if avg_hours_row["avg_hours"] is not None else 0

        # Urgent complaints list (critical/high unresolved, newest first)
        cursor.execute(
            """
            SELECT
                complaint_id,
                description,
                department_id,
                priority_level,
                submitted_time
            FROM complaints
            WHERE priority_level IN ('Critical', 'High')
              AND LOWER(COALESCE(status, '')) NOT IN ('resolved', 'closed')
            ORDER BY
                CASE priority_level
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    ELSE 3
                END,
                submitted_time DESC
            LIMIT 10
            """
        )
        urgent_rows = cursor.fetchall()
        urgent_complaints = [
            {
                "id": row["complaint_id"],
                "description": row["description"],
                "department": row["department_id"],
                "priority": row["priority_level"],
                "submitted_time": row["submitted_time"],
            }
            for row in urgent_rows
        ]

        # Recent activity feed
        cursor.execute(
            """
            SELECT
                complaint_id,
                status,
                priority_level,
                submitted_time
            FROM complaints
            ORDER BY submitted_time DESC
            LIMIT 12
            """
        )
        feed_rows = cursor.fetchall()
        activity_feed = [
            {
                "id": row["complaint_id"],
                "title": f"Complaint #{row['complaint_id']}",
                "description": f"Status: {row['status']} | Priority: {row['priority_level']}",
                "timestamp": row["submitted_time"],
            }
            for row in feed_rows
        ]

        # Department workload table
        cursor.execute(
            """
            SELECT
                department_id,
                SUM(CASE WHEN LOWER(COALESCE(status, '')) NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS active_count,
                SUM(CASE WHEN LOWER(COALESCE(status, '')) = 'pending' THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN LOWER(COALESCE(status, '')) IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS resolved_count
            FROM complaints
            GROUP BY department_id
            ORDER BY active_count DESC, pending_count DESC
            """
        )
        workload_rows = cursor.fetchall()
        department_workload = [
            {
                "department_id": row["department_id"],
                "active_complaints": row["active_count"],
                "pending_complaints": row["pending_count"],
                "resolved_complaints": row["resolved_count"],
            }
            for row in workload_rows
        ]

        return jsonify(
            {
                "active_complaints": active_complaints,
                "critical_unresolved": critical_unresolved,
                "complaints_today": complaints_today,
                "overdue_count": overdue_count,
                "avg_resolution_time": avg_resolution_hours,
                "urgent_complaints": urgent_complaints,
                "activity_feed": activity_feed,
                "department_workload": department_workload,
            }
        ), 200
    except Exception as db_error:
        return jsonify({"error": f"Dashboard summary failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)




@complaint_bp.route("/dashboard/urgent", methods=["GET"])
def get_urgent_complaints():
    """
    Return urgent complaints for officer action center.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        refresh_sla_status_state(connection)

        cursor.execute(
            """
            SELECT
                complaint_id,
                description,
                priority_level,
                status,
                department_id,
                submitted_time,
                ROUND((JULIANDAY('now', 'localtime') - JULIANDAY(submitted_time)) * 24.0, 2) AS hours_pending
            FROM complaints
            WHERE priority_level = 'Critical'
               OR (
                    LOWER(COALESCE(status, '')) = 'pending'
                    AND submitted_time <= DATETIME('now', 'localtime', '-24 hours')
               )
            ORDER BY
                CASE priority_level
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                    ELSE 5
                END,
                hours_pending DESC
            """
        )
        rows = cursor.fetchall()

        complaints = [
            {
                "complaint_id": row["complaint_id"],
                "description": row["description"],
                "priority_level": row["priority_level"],
                "status": row["status"],
                "department_id": row["department_id"],
                "submitted_time": row["submitted_time"],
                "hours_pending": row["hours_pending"],
            }
            for row in rows
        ]

        return jsonify({
            "urgent_count": len(complaints),
            "complaints": complaints,
        }), 200
    except Exception as db_error:
        return jsonify({"error": f"Urgent complaints fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/dashboard/department-workload", methods=["GET"])
def get_department_workload():
    """
    Return active complaint workload by department.
    Active means status is not 'Resolved'.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                COALESCE(d.department_name, CAST(c.department_id AS TEXT), 'Unknown') AS department,
                COUNT(*) AS active
            FROM complaints c
            LEFT JOIN departments d
              ON c.department_id = d.department_id
            WHERE LOWER(COALESCE(c.status, '')) != 'resolved'
            GROUP BY COALESCE(d.department_name, CAST(c.department_id AS TEXT), 'Unknown')
            ORDER BY active DESC, department ASC
            """
        )
        rows = cursor.fetchall()

        workload = [
            {
                "department": row["department"],
                "active": row["active"],
            }
            for row in rows
        ]

        return jsonify(workload), 200
    except Exception as db_error:
        return jsonify({"error": f"Department workload fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/dashboard/sla-status", methods=["GET"])
def get_sla_status():
    """
    Return SLA violations and at-risk unresolved complaints.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                complaint_id,
                priority_level,
                ROUND((JULIANDAY('now', 'localtime') - JULIANDAY(submitted_time)) * 24.0, 2) AS hours_pending,
                CASE
                    WHEN priority_level = 'Critical' THEN 6
                    WHEN priority_level = 'High' THEN 24
                    WHEN priority_level = 'Medium' THEN 48
                    WHEN priority_level = 'Low' THEN 72
                    ELSE 72
                END AS sla_limit,
                status,
                department_id
            FROM complaints
            WHERE LOWER(COALESCE(status, '')) != 'resolved'
            ORDER BY
                CASE priority_level
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                    ELSE 5
                END,
                hours_pending DESC
            """
        )
        rows = cursor.fetchall()

        violations = []
        at_risk = []

        for row in rows:
            item = {
                "complaint_id": row["complaint_id"],
                "priority_level": row["priority_level"],
                "hours_pending": row["hours_pending"],
                "sla_limit": row["sla_limit"],
                "status": row["status"],
                "department_id": row["department_id"],
            }

            if row["hours_pending"] > row["sla_limit"]:
                violations.append(item)
            elif row["hours_pending"] >= (row["sla_limit"] - 2):
                at_risk.append(item)

        return jsonify(
            {
                "violations": violations,
                "at_risk": at_risk,
                "total_violations": len(violations),
                "total_at_risk": len(at_risk),
            }
        ), 200
    except Exception as db_error:
        return jsonify({"error": f"SLA status fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/dashboard/escalations", methods=["GET"])
def get_dashboard_escalations():
    """
    Return unresolved complaints that crossed escalation threshold.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                complaint_id,
                priority_level,
                ROUND((JULIANDAY('now', 'localtime') - JULIANDAY(submitted_time)) * 24.0, 2) AS hours_pending,
                CASE
                    WHEN priority_level = 'Critical' THEN 6
                    WHEN priority_level = 'High' THEN 24
                    WHEN priority_level = 'Medium' THEN 48
                    WHEN priority_level = 'Low' THEN 72
                    ELSE 72
                END AS sla_limit,
                department_id,
                status
            FROM complaints
            WHERE LOWER(COALESCE(status, '')) != 'resolved'
            """
        )
        rows = cursor.fetchall()

        escalated_complaints = []

        for row in rows:
            multiplier = 2 if row["priority_level"] in ("Critical", "Low") else 1.5
            escalation_threshold = round(row["sla_limit"] * multiplier, 2)

            if row["hours_pending"] > escalation_threshold:
                escalated_complaints.append(
                    {
                        "complaint_id": row["complaint_id"],
                        "priority_level": row["priority_level"],
                        "hours_pending": row["hours_pending"],
                        "sla_limit": row["sla_limit"],
                        "escalation_threshold": escalation_threshold,
                        "department_id": row["department_id"],
                        "status": row["status"],
                    }
                )

        escalated_complaints.sort(key=lambda item: item["hours_pending"], reverse=True)

        return jsonify(
            {
                "escalated_count": len(escalated_complaints),
                "escalated_complaints": escalated_complaints,
            }
        ), 200
    except Exception as db_error:
        return jsonify({"error": f"Escalations fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/dashboard/department-performance", methods=["GET"])
def get_department_performance():
    """
    Return department-wise performance metrics.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                d.department_name AS department,
                COUNT(c.complaint_id) AS total_count,
                SUM(CASE WHEN LOWER(COALESCE(c.status, '')) = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
                AVG(
                    CASE
                        WHEN LOWER(COALESCE(c.status, '')) = 'resolved'
                        THEN (JULIANDAY('now', 'localtime') - JULIANDAY(c.submitted_time)) * 24.0
                        ELSE NULL
                    END
                ) AS avg_resolution_hours,
                SUM(
                    CASE
                        WHEN LOWER(COALESCE(c.status, '')) != 'resolved' AND
                             ((JULIANDAY('now', 'localtime') - JULIANDAY(c.submitted_time)) * 24.0) >
                             CASE
                                WHEN c.priority_level = 'Critical' THEN 6
                                WHEN c.priority_level = 'High' THEN 24
                                WHEN c.priority_level = 'Medium' THEN 48
                                WHEN c.priority_level = 'Low' THEN 72
                                ELSE 72
                             END
                        THEN 1
                        ELSE 0
                    END
                ) AS sla_violations,
                SUM(
                    CASE
                        WHEN LOWER(COALESCE(c.status, '')) != 'resolved' AND
                             ((JULIANDAY('now', 'localtime') - JULIANDAY(c.submitted_time)) * 24.0) >
                             (
                               CASE
                                  WHEN c.priority_level = 'Critical' THEN 6
                                  WHEN c.priority_level = 'High' THEN 24
                                  WHEN c.priority_level = 'Medium' THEN 48
                                  WHEN c.priority_level = 'Low' THEN 72
                                  ELSE 72
                               END *
                               CASE
                                  WHEN c.priority_level IN ('Critical', 'Low') THEN 2
                                  ELSE 1.5
                               END
                             )
                        THEN 1
                        ELSE 0
                    END
                ) AS escalations
            FROM departments d
            LEFT JOIN complaints c
              ON c.department_id = d.department_id
            GROUP BY d.department_id, d.department_name
            ORDER BY d.department_name ASC
            """
        )
        rows = cursor.fetchall()

        result = []

        for row in rows:
            total_count = row['total_count'] or 0
            resolved_count = row['resolved_count'] or 0
            resolution_rate = round((resolved_count / total_count) * 100, 2) if total_count > 0 else 0
            avg_resolution_hours = round(row['avg_resolution_hours'], 2) if row['avg_resolution_hours'] is not None else 0
            sla_violations = row['sla_violations'] or 0
            escalations = row['escalations'] or 0

            performance_score = round(max(0, min(100, resolution_rate - (sla_violations * 2) - (escalations * 3))), 2)

            result.append(
                {
                    'department': row['department'],
                    'resolution_rate': resolution_rate,
                    'avg_resolution_hours': avg_resolution_hours,
                    'sla_violations': sla_violations,
                    'escalations': escalations,
                    'performance_score': performance_score,
                }
            )

        return jsonify(result), 200
    except Exception as db_error:
        return jsonify({'error': f'Department performance fetch failed: {db_error}'}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/dashboard/resolution-efficiency", methods=["GET"])
def get_resolution_efficiency():
    """
    Return resolution efficiency analytics based on resolved complaints.
    """
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("PRAGMA table_info(complaints)")
        complaint_columns = [column["name"] for column in cursor.fetchall()]

        if "resolution_time" not in complaint_columns:
            return jsonify(
                {
                    "avg_resolution_by_priority": [],
                    "avg_resolution_by_department": [],
                    "fastest_department": None,
                    "slowest_department": None,
                    "overall_avg_resolution_hours": 0,
                }
            ), 200

        cursor.execute(
            """
            SELECT
                priority_level,
                ROUND(AVG((JULIANDAY(resolution_time) - JULIANDAY(submitted_time)) * 24.0), 2) AS avg_resolution_hours
            FROM complaints
            WHERE LOWER(COALESCE(status, '')) = 'resolved'
              AND resolution_time IS NOT NULL
            GROUP BY priority_level
            ORDER BY
                CASE priority_level
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                    ELSE 5
                END
            """
        )
        priority_rows = cursor.fetchall()
        avg_resolution_by_priority = [
            {
                "priority_level": row["priority_level"],
                "avg_resolution_hours": row["avg_resolution_hours"] if row["avg_resolution_hours"] is not None else 0,
            }
            for row in priority_rows
        ]

        cursor.execute(
            """
            SELECT
                COALESCE(d.department_name, CAST(c.department_id AS TEXT), 'Unknown') AS department,
                ROUND(AVG((JULIANDAY(c.resolution_time) - JULIANDAY(c.submitted_time)) * 24.0), 2) AS avg_resolution_hours
            FROM complaints c
            LEFT JOIN departments d
              ON c.department_id = d.department_id
            WHERE LOWER(COALESCE(c.status, '')) = 'resolved'
              AND c.resolution_time IS NOT NULL
            GROUP BY COALESCE(d.department_name, CAST(c.department_id AS TEXT), 'Unknown')
            ORDER BY avg_resolution_hours ASC
            """
        )
        department_rows = cursor.fetchall()
        avg_resolution_by_department = [
            {
                "department": row["department"],
                "avg_resolution_hours": row["avg_resolution_hours"] if row["avg_resolution_hours"] is not None else 0,
            }
            for row in department_rows
        ]

        cursor.execute(
            """
            SELECT ROUND(AVG((JULIANDAY(resolution_time) - JULIANDAY(submitted_time)) * 24.0), 2) AS overall_avg
            FROM complaints
            WHERE LOWER(COALESCE(status, '')) = 'resolved'
              AND resolution_time IS NOT NULL
            """
        )
        overall_row = cursor.fetchone()
        overall_avg_resolution_hours = overall_row["overall_avg"] if overall_row["overall_avg"] is not None else 0

        fastest_department = avg_resolution_by_department[0] if avg_resolution_by_department else None
        slowest_department = avg_resolution_by_department[-1] if avg_resolution_by_department else None

        return jsonify(
            {
                "avg_resolution_by_priority": avg_resolution_by_priority,
                "avg_resolution_by_department": avg_resolution_by_department,
                "fastest_department": fastest_department,
                "slowest_department": slowest_department,
                "overall_avg_resolution_hours": overall_avg_resolution_hours,
            }
        ), 200
    except Exception as db_error:
        return jsonify({"error": f"Resolution efficiency fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/complaints/<int:complaint_id>", methods=["GET"])
def get_complaint_detail(complaint_id):
    """
    Retrieve full details for a single complaint.
    """
    connection = None
    try:
        connection = get_db_connection()
        ensure_assigned_team_column(connection)
        refresh_sla_status_state(connection)
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                c.complaint_id,
                c.description,
                c.department_id,
                c.priority_level,
                c.status,
                c.submitted_time,
                c.assigned_time,
                c.completed_time,
                c.sla_deadline,
                c.sla_status,
                c.image_path,
                c.latitude,
                c.longitude,
                w.worker_name,
                t.team_name
            FROM complaints c
            LEFT JOIN assignments a
              ON a.complaint_id = c.complaint_id
            LEFT JOIN workers w
              ON a.worker_id = w.worker_id
            LEFT JOIN teams t
              ON w.team_id = t.team_id
            WHERE c.complaint_id = ?
            ORDER BY a.assigned_at DESC
            LIMIT 1
            """,
            (complaint_id,),
        )
        row = cursor.fetchone()

        if row is None:
            return jsonify({"error": "Complaint not found"}), 404

        response = {
            "complaint_id": row["complaint_id"],
            "description": row["description"],
            "department_id": row["department_id"],
            "priority_level": row["priority_level"],
            "status": row["status"],
            "submitted_time": row["submitted_time"],
            "assigned_time": row["assigned_time"],
            "completed_time": row["completed_time"],
            "sla_deadline": row["sla_deadline"],
            "sla_status": row["sla_status"],
            "image_path": row["image_path"],
            "latitude": row["latitude"],
            "longitude": row["longitude"],
            "assigned_worker": {
                "worker_name": row["worker_name"],
                "team_name": row["team_name"],
            } if row["worker_name"] or row["team_name"] else None,
        }

        return jsonify(response), 200
    except Exception as db_error:
        return jsonify({"error": f"Database fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/complaints/department/<department_name>", methods=["GET"])
def get_complaints_by_department(department_name):
    """
    Retrieve complaints filtered by department name.
    """
    connection = None
    try:
        # Open DB connection
        connection = get_db_connection()
        refresh_sla_status_state(connection)
        cursor = connection.cursor()

        # Step 1: Convert department_name to department_id
        cursor.execute(
            """
            SELECT department_id
            FROM departments
            WHERE department_name = ?
            """,
            (department_name,),
        )
        department_row = cursor.fetchone()

        # Return 404 if department does not exist
        if department_row is None:
            return jsonify({"error": "Department not found"}), 404

        department_id = department_row["department_id"]

        # Step 2: Fetch complaints for the matching department_id
        cursor.execute(
            """
            SELECT
                complaint_id,
                description,
                latitude,
                longitude,
                department_id,
                priority_level,
                status,
                assigned_time,
                sla_deadline,
                completed_time,
                sla_status,
                submitted_time
            FROM complaints
            WHERE department_id = ?
            ORDER BY submitted_time DESC
            """,
            (department_id,),
        )
        complaint_rows = cursor.fetchall()

        # Convert sqlite rows to normal Python dictionaries
        complaints = [dict(row) for row in complaint_rows]

        # Return department-wise complaint data
        return jsonify(
            {
                "department": department_name,
                "total": len(complaints),
                "complaints": complaints,
            }
        ), 200

    except Exception as db_error:
        return jsonify({"error": f"Database fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/complaints/<int:complaint_id>/status", methods=["PUT"])
def update_complaint_status(complaint_id):
    """
    Update the status of a specific complaint.
    """
    connection = None
    try:
        # Read JSON body safely
        data = request.get_json(silent=True) or {}
        new_status = data.get("status")

        # Validate required status input
        if not new_status:
            return jsonify({"error": "Field 'status' is required."}), 400

        # Open DB connection
        connection = get_db_connection()
        ensure_assignment_logs_table(connection)
        cursor = connection.cursor()

        # Check complaint exists
        cursor.execute(
            "SELECT complaint_id, status FROM complaints WHERE complaint_id = ?",
            (complaint_id,),
        )
        complaint_row = cursor.fetchone()

        if complaint_row is None:
            return jsonify({"error": "Complaint not found"}), 404

        previous_status = complaint_row["status"]
        normalized_status = str(new_status).lower()

        if normalized_status == "resolved":
            completed_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                """
                UPDATE complaints
                SET status = ?,
                    completed_time = ?,
                    sla_status = 'COMPLETED'
                WHERE complaint_id = ?
                """,
                (new_status, completed_time, complaint_id),
            )

            cursor.execute(
                """
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                  AND name IN ('workers', 'assignments')
                """
            )
            available_tables = {row["name"] for row in cursor.fetchall()}

            if "workers" in available_tables and "assignments" in available_tables:
                cursor.execute(
                    """
                    SELECT worker_id
                    FROM assignments
                    WHERE complaint_id = ?
                      AND LOWER(COALESCE(status, '')) = 'active'
                    ORDER BY assigned_at DESC
                    LIMIT 1
                    """,
                    (complaint_id,),
                )
                assignment_row = cursor.fetchone()

                if assignment_row is not None:
                    worker_id = assignment_row["worker_id"]
                    cursor.execute(
                        """
                        UPDATE workers
                        SET status = 'available'
                        WHERE worker_id = ?
                        """,
                        (worker_id,),
                    )
                    cursor.execute(
                        """
                        UPDATE assignments
                        SET status = 'completed'
                        WHERE complaint_id = ?
                          AND worker_id = ?
                          AND LOWER(COALESCE(status, '')) = 'active'
                        """,
                        (complaint_id, worker_id),
                    )
            insert_assignment_log(
                cursor,
                complaint_id=complaint_id,
                action_type="RESOLVED",
                previous_status=previous_status,
                new_status=new_status,
                performed_by="Officer",
                notes="Complaint marked as resolved.",
            )
        else:
            cursor.execute(
                """
                UPDATE complaints
                SET status = ?
                WHERE complaint_id = ?
                """,
                (new_status, complaint_id),
            )
            insert_assignment_log(
                cursor,
                complaint_id=complaint_id,
                action_type="STATUS_CHANGED",
                previous_status=previous_status,
                new_status=new_status,
                performed_by="Officer",
                notes="Complaint status updated.",
            )

        # Commit transaction
        connection.commit()

        # Return success response
        return jsonify(
            {
                "message": "Complaint status updated successfully",
                "complaint_id": complaint_id,
                "new_status": new_status,
            }
        ), 200

    except Exception as db_error:
        return jsonify({"error": f"Database update failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/complaints/<int:complaint_id>/assign", methods=["PUT"])
def assign_complaint(complaint_id):
    """
    Assign a complaint to a team.
    """
    connection = None
    try:
        data = request.get_json(silent=True) or {}
        team_name = data.get("team")

        if not team_name:
            return jsonify({"error": "Field 'team' is required."}), 400

        connection = get_db_connection()
        ensure_assigned_team_column(connection)
        ensure_assignment_logs_table(connection)
        cursor = connection.cursor()

        cursor.execute(
            "SELECT complaint_id, assigned_team, status FROM complaints WHERE complaint_id = ?",
            (complaint_id,),
        )
        complaint_row = cursor.fetchone()

        if complaint_row is None:
            return jsonify({"error": "Complaint not found"}), 404

        previous_team = complaint_row["assigned_team"]
        action_type = "REASSIGNED" if previous_team and previous_team != team_name else "ASSIGNED"

        cursor.execute(
            """
            UPDATE complaints
            SET assigned_team = ?
            WHERE complaint_id = ?
            """,
            (team_name, complaint_id),
        )
        insert_assignment_log(
            cursor,
            complaint_id=complaint_id,
            action_type=action_type,
            assigned_to=team_name,
            previous_status=complaint_row["status"],
            new_status=complaint_row["status"],
            performed_by="Officer",
            notes="Complaint assigned to team.",
        )
        connection.commit()

        return jsonify(
            {
                "message": "Complaint assigned successfully",
                "complaint_id": complaint_id,
                "team": team_name,
            }
        ), 200

    except Exception as db_error:
        return jsonify({"error": f"Database update failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@complaint_bp.route("/complaints/<int:complaint_id>/history", methods=["GET"])
def get_complaint_history(complaint_id):
    """
    Return assignment and status change history for a complaint.
    """
    connection = None
    try:
        connection = get_db_connection()
        ensure_assignment_logs_table(connection)
        cursor = connection.cursor()

        cursor.execute(
            "SELECT complaint_id FROM complaints WHERE complaint_id = ?",
            (complaint_id,),
        )
        complaint_row = cursor.fetchone()
        if complaint_row is None:
            return jsonify({"error": "Complaint not found"}), 404

        cursor.execute(
            """
            SELECT
                log_id,
                complaint_id,
                action_type,
                assigned_to,
                previous_status,
                new_status,
                performed_by,
                timestamp,
                notes
            FROM assignment_logs
            WHERE complaint_id = ?
            ORDER BY
                CASE WHEN timestamp IS NULL OR TRIM(timestamp) = '' THEN 1 ELSE 0 END,
                timestamp ASC,
                log_id ASC
            """,
            (complaint_id,),
        )
        logs = [dict(row) for row in cursor.fetchall()]

        return jsonify({"complaint_id": complaint_id, "history": logs, "total": len(logs)}), 200
    except Exception as db_error:
        return jsonify({"error": f"History fetch failed: {db_error}"}), 500
    finally:
        close_db_connection(connection)
