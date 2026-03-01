import sqlite3


def initialize_database():
    """Create database tables, seed sample records, and run safe schema updates."""
    # Connect to SQLite database file (it will be created if it does not exist)
    connection = sqlite3.connect("smart_city.db")

    # Make sure foreign key constraints are enforced in SQLite
    connection.execute("PRAGMA foreign_keys = ON;")

    # Create a cursor object to execute SQL commands
    cursor = connection.cursor()

    # Create departments table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS departments (
            department_id INTEGER PRIMARY KEY AUTOINCREMENT,
            department_name TEXT NOT NULL,
            description TEXT
        )
        """
    )

    # Create field_teams table
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

    # Create complaints table (only if it does not exist)
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
            assigned_team_id INTEGER,
            FOREIGN KEY (department_id) REFERENCES departments(department_id),
            FOREIGN KEY (assigned_team_id) REFERENCES field_teams(team_id)
        )
        """
    )

    # Safe migration step:
    # Check existing columns first, then add image_path only if missing.
    # This avoids table recreation and keeps all existing complaint data intact.
    cursor.execute("PRAGMA table_info(complaints)")
    existing_columns = [column[1] for column in cursor.fetchall()]

    if "image_path" not in existing_columns:
        cursor.execute("ALTER TABLE complaints ADD COLUMN image_path TEXT")
        print("Migration complete: 'image_path' column added to complaints table.")
    else:
        print("Migration skipped: 'image_path' column already exists in complaints table.")

    # Insert sample departments only if table is empty
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

    # Insert sample field teams only if table is empty
    cursor.execute("SELECT COUNT(*) FROM field_teams")
    team_count = cursor.fetchone()[0]

    if team_count == 0:
        # Get department IDs by name so teams map correctly
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

    # Save all changes and close connection
    connection.commit()
    connection.close()

    print("Database initialized successfully")


if __name__ == "__main__":
    initialize_database()
