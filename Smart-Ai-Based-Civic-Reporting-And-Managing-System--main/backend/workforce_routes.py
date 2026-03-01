from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta

from backend.db import close_db_connection, get_db_connection

workforce_bp = Blueprint("workforce_bp", __name__, url_prefix="/workforce")


def calculate_sla_deadline(priority):
    now = datetime.now()
    priority_value = str(priority or "").lower()

    if priority_value == "critical":
        return now + timedelta(hours=4)
    if priority_value == "high":
        return now + timedelta(hours=24)
    if priority_value == "medium":
        return now + timedelta(hours=48)
    return now + timedelta(hours=72)


def ensure_sla_columns(connection):
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
    performed_by="Officer",
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


@workforce_bp.route("/workers/<int:department_id>", methods=["GET"])
def get_workers_by_department(department_id):
    connection = None
    try:
        connection = get_db_connection()
        connection.execute("PRAGMA foreign_keys = ON;")
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                w.worker_id,
                w.worker_name,
                w.team_id,
                w.status,
                w.phone,
                w.created_at,
                t.team_name,
                t.department_id
            FROM workers w
            JOIN teams t ON w.team_id = t.team_id
            WHERE t.department_id = ?
            ORDER BY w.worker_id ASC
            """,
            (department_id,),
        )
        workers = [dict(row) for row in cursor.fetchall()]

        return jsonify({"department_id": department_id, "workers": workers, "total": len(workers)}), 200
    except Exception as db_error:
        return jsonify({"error": f"Failed to fetch workers: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@workforce_bp.route("/workers/available/<int:department_id>", methods=["GET"])
def get_available_workers_by_department(department_id):
    connection = None
    try:
        connection = get_db_connection()
        connection.execute("PRAGMA foreign_keys = ON;")
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                w.worker_id,
                w.worker_name,
                w.team_id,
                w.status,
                w.phone,
                w.created_at,
                t.team_name,
                t.department_id
            FROM workers w
            JOIN teams t ON w.team_id = t.team_id
            WHERE t.department_id = ?
              AND LOWER(COALESCE(w.status, '')) = 'available'
            ORDER BY w.worker_id ASC
            """,
            (department_id,),
        )
        workers = [dict(row) for row in cursor.fetchall()]

        return jsonify({"department_id": department_id, "workers": workers, "total": len(workers)}), 200
    except Exception as db_error:
        return jsonify({"error": f"Failed to fetch available workers: {db_error}"}), 500
    finally:
        close_db_connection(connection)


@workforce_bp.route("/assign", methods=["POST"])
def assign_worker_to_complaint():
    connection = None
    try:
        payload = request.get_json(silent=True) or {}
        complaint_id = payload.get("complaint_id")
        worker_id = payload.get("worker_id")

        if complaint_id is None or worker_id is None:
            return jsonify({"error": "Fields 'complaint_id' and 'worker_id' are required."}), 400

        connection = get_db_connection()
        connection.execute("PRAGMA foreign_keys = ON;")
        ensure_sla_columns(connection)
        ensure_assignment_logs_table(connection)
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT complaint_id, priority_level
            FROM complaints
            WHERE complaint_id = ?
            """,
            (complaint_id,),
        )
        complaint = cursor.fetchone()
        if complaint is None:
            return jsonify({"error": "Complaint not found"}), 404

        cursor.execute("SELECT worker_id, status FROM workers WHERE worker_id = ?", (worker_id,))
        worker = cursor.fetchone()
        if worker is None:
            return jsonify({"error": "Worker not found"}), 404

        if str(worker["status"] or "").lower() != "available":
            return jsonify({"error": "Worker is not available"}), 409

        cursor.execute(
            """
            SELECT status
            FROM complaints
            WHERE complaint_id = ?
            """,
            (complaint_id,),
        )
        complaint_status_row = cursor.fetchone()
        previous_status = complaint_status_row["status"] if complaint_status_row else None

        cursor.execute(
            """
            SELECT a.worker_id
            FROM assignments a
            WHERE a.complaint_id = ?
            ORDER BY a.assigned_at DESC, a.assignment_id DESC
            LIMIT 1
            """,
            (complaint_id,),
        )
        previous_assignment = cursor.fetchone()
        action_type = "ASSIGNED"
        if previous_assignment and int(previous_assignment["worker_id"]) != int(worker_id):
            action_type = "REASSIGNED"

        cursor.execute(
            """
            INSERT INTO assignments (complaint_id, worker_id, status)
            VALUES (?, ?, 'active')
            """,
            (complaint_id, worker_id),
        )
        assignment_id = cursor.lastrowid

        cursor.execute(
            """
            UPDATE workers
            SET status = 'assigned'
            WHERE worker_id = ?
            """,
            (worker_id,),
        )

        assigned_time = datetime.now()
        sla_deadline = calculate_sla_deadline(complaint["priority_level"])
        cursor.execute(
            """
            UPDATE complaints
            SET assigned_time = ?,
                sla_deadline = ?,
                sla_status = 'ON_TIME'
            WHERE complaint_id = ?
            """,
            (
                assigned_time.strftime("%Y-%m-%d %H:%M:%S"),
                sla_deadline.strftime("%Y-%m-%d %H:%M:%S"),
                complaint_id,
            ),
        )

        cursor.execute(
            """
            SELECT
                w.worker_name,
                t.team_name
            FROM workers w
            LEFT JOIN teams t
              ON t.team_id = w.team_id
            WHERE w.worker_id = ?
            """,
            (worker_id,),
        )
        worker_meta = cursor.fetchone()
        assigned_to = (
            f"{worker_meta['worker_name']} ({worker_meta['team_name']})"
            if worker_meta and worker_meta["team_name"]
            else (worker_meta["worker_name"] if worker_meta else str(worker_id))
        )
        insert_assignment_log(
            cursor,
            complaint_id=complaint_id,
            action_type=action_type,
            assigned_to=assigned_to,
            previous_status=previous_status,
            new_status="Assigned",
            performed_by="Officer",
            notes="Worker assigned to complaint.",
        )

        connection.commit()

        return jsonify(
            {
                "message": "Worker assigned successfully",
                "assignment_id": assignment_id,
                "complaint_id": complaint_id,
                "worker_id": worker_id,
            }
        ), 200
    except Exception as db_error:
        return jsonify({"error": f"Failed to assign worker: {db_error}"}), 500
    finally:
        close_db_connection(connection)
