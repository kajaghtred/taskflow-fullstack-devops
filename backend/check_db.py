from database import test_database_connection

if __name__ == "__main__":
    try:
        test_database_connection()
        print("Database connection successful!")
    except Exception as error:
        print("Database connection failed.")
        print(f"Error: {error}")
        raise