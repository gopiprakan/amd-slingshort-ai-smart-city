import sqlite3


def get_db_connection():
    """
    Create and return a connection to the SQLite database.
    """
    # Connect to the local SQLite database file
    connection = sqlite3.connect("smart_city.db")

    # Allow accessing row values using column names (like dict keys)
    connection.row_factory = sqlite3.Row

    return connection


def close_db_connection(connection):
    """
    Safely close the database connection if it exists.
    """
    if connection is not None:
        connection.close()


if __name__ == "__main__":
    # Test block: connect, list all table names, and close connection
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query SQLite system table to get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        print("Tables in smart_city.db:")
        if not tables:
            print("No tables found.")
        else:
            for table in tables:
                print(f"- {table['name']}")
    except sqlite3.Error as error:
        print(f"Database error: {error}")
    finally:
        close_db_connection(conn)
