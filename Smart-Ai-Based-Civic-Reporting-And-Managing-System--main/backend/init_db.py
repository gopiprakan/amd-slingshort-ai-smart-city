import sqlite3


def seed_workforce_data(cursor):
    """Seed workforce teams/workers only when workforce tables are empty."""
    cursor.execute("SELECT COUNT(*) FROM teams")
    team_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM workers")
    worker_count = cursor.fetchone()[0]

    if team_count > 0 or worker_count > 0:
      return

    cursor.execute("SELECT department_id, department_name FROM departments")
    departments = cursor.fetchall()

    for department_id, department_name in departments:
        team_ids = []

        for team_index in range(1, 5):
            team_name = f"{department_name} Team {team_index}"
            cursor.execute(
                """
                INSERT INTO teams (team_name, department_id)
                VALUES (?, ?)
                """,
                (team_name, department_id),
            )
            team_ids.append(cursor.lastrowid)

        for team_id in team_ids:
            for worker_index in range(1, 5):
                worker_name = f"Worker {team_id}-{worker_index}"
                phone = f"90000{team_id:02d}{worker_index:02d}"
                cursor.execute(
                    """
                    INSERT INTO workers (worker_name, team_id, status, phone)
                    VALUES (?, ?, 'available', ?)
                    """,
                    (worker_name, team_id, phone),
                )


def initialize_database():
    """Create database tables, seed sample records, and run safe schema updates."""
    connection = sqlite3.connect("smart_city.db")
    connection.execute("PRAGMA foreign_keys = ON;")
    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS departments (
            department_id INTEGER PRIMARY KEY AUTOINCREMENT,
            department_name TEXT NOT NULL,
            description TEXT
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS field_teams (
            team_id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT,
            department_id INTEGER,
            current_status TEXT,
            base_location TEXT,
            FOREIGN KEY (department_id) REFERENCES departments(department_id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS complaints (
            complaint_id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            department_id INTEGER,
            priority_level TEXT,
            status TEXT DEFAULT 'Pending',
            submitted_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            assigned_team TEXT,
            assigned_time TEXT,
            sla_deadline TEXT,
            completed_time TEXT,
            sla_status TEXT DEFAULT 'PENDING',
            assigned_team_id INTEGER,
            FOREIGN KEY (department_id) REFERENCES departments(department_id),
            FOREIGN KEY (assigned_team_id) REFERENCES field_teams(team_id)
        )
        """
    )

    # Workforce management tables
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS teams (
            team_id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL,
            department_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(department_id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS workers (
            worker_id INTEGER PRIMARY KEY AUTOINCREMENT,
            worker_name TEXT NOT NULL,
            team_id INTEGER,
            status TEXT DEFAULT 'available',
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams(team_id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS assignments (
            assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER,
            worker_id INTEGER,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id),
            FOREIGN KEY (worker_id) REFERENCES workers(worker_id)
        )
        """
    )

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

    cursor.execute("PRAGMA table_info(complaints)")
    existing_columns = [column[1] for column in cursor.fetchall()]

    if "image_path" not in existing_columns:
        cursor.execute("ALTER TABLE complaints ADD COLUMN image_path TEXT")
        print("Migration complete: 'image_path' column added to complaints table.")
    else:
        print("Migration skipped: 'image_path' column already exists in complaints table.")

    if "assigned_team" not in existing_columns:
        cursor.execute("ALTER TABLE complaints ADD COLUMN assigned_team TEXT")
        print("Migration complete: 'assigned_team' column added to complaints table.")
    else:
        print("Migration skipped: 'assigned_team' column already exists in complaints table.")

    if "assigned_time" not in existing_columns:
        cursor.execute("ALTER TABLE complaints ADD COLUMN assigned_time TEXT")
        print("Migration complete: 'assigned_time' column added to complaints table.")
    else:
        print("Migration skipped: 'assigned_time' column already exists in complaints table.")

    if "sla_deadline" not in existing_columns:
        cursor.execute("ALTER TABLE complaints ADD COLUMN sla_deadline TEXT")
        print("Migration complete: 'sla_deadline' column added to complaints table.")
    else:
        print("Migration skipped: 'sla_deadline' column already exists in complaints table.")

    if "completed_time" not in existing_columns:
        cursor.execute("ALTER TABLE complaints ADD COLUMN completed_time TEXT")
        print("Migration complete: 'completed_time' column added to complaints table.")
    else:
        print("Migration skipped: 'completed_time' column already exists in complaints table.")

    if "sla_status" not in existing_columns:
        cursor.execute("ALTER TABLE complaints ADD COLUMN sla_status TEXT DEFAULT 'PENDING'")
        print("Migration complete: 'sla_status' column added to complaints table.")
    else:
        print("Migration skipped: 'sla_status' column already exists in complaints table.")

    cursor.execute("SELECT COUNT(*) FROM departments")
    department_count = cursor.fetchone()[0]

    if department_count == 0:
        departments = [
            ("Sanitation", "Handles garbage collection and waste management"),
            ("Water Supply", "Handles water pipeline and supply related issues"),
            ("Electrical", "Handles street lights and electrical infrastructure"),
            ("Road Maintenance", "Handles potholes and road repair work"),
        ]
        cursor.executemany(
            "INSERT INTO departments (department_name, description) VALUES (?, ?)",
            departments,
        )

    cursor.execute("SELECT COUNT(*) FROM field_teams")
    team_count = cursor.fetchone()[0]

    if team_count == 0:
        cursor.execute("SELECT department_id, department_name FROM departments")
        department_rows = cursor.fetchall()
        department_map = {name: dept_id for dept_id, name in department_rows}

        field_teams = [
            ("Clean Sweep Team A", department_map.get("Sanitation"), "Available", "Zone 1"),
            ("Clean Sweep Team B", department_map.get("Sanitation"), "On Duty", "Zone 3"),
            ("Water Rapid Response", department_map.get("Water Supply"), "Available", "Zone 2"),
            ("Power Line Unit", department_map.get("Electrical"), "On Duty", "Zone 4"),
            ("Road Repair Squad", department_map.get("Road Maintenance"), "Available", "Zone 5"),
        ]
        cursor.executemany(
            """
            INSERT INTO field_teams (team_name, department_id, current_status, base_location)
            VALUES (?, ?, ?, ?)
            """,
            field_teams,
        )

    seed_workforce_data(cursor)

    connection.commit()
    connection.close()

    print("Database initialized successfully")


if __name__ == "__main__":
    initialize_database()
