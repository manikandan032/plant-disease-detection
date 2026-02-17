from app.database import engine
from sqlalchemy import text

def inspect_and_fix():
    with engine.connect() as conn:
        print("Checking 'users' table schema...")
        try:
            result = conn.execute(text("DESCRIBE users"))
            columns = [row[0] for row in result.fetchall()]
            print(f"Existing columns: {columns}")
            
            # Check for upi_id
            if 'upi_id' not in columns:
                print("Adding missing column 'upi_id'...")
                conn.execute(text("ALTER TABLE users ADD COLUMN upi_id VARCHAR(50) NULL;"))
                conn.commit()
                print("Column 'upi_id' added.")
            else:
                print("Column 'upi_id' already exists.")
                
            # Check for role (just in case)
            if 'role' not in columns:
                print("Adding missing column 'role'...")
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'farmer';"))
                conn.commit()
                print("Column 'role' added.")
                
            # Check for is_admin (just in case)
            if 'is_admin' not in columns:
                print("Adding missing column 'is_admin'...")
                conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;"))
                conn.commit()
                print("Column 'is_admin' added.")

        except Exception as e:
            print(f"Error during inspection/fix: {e}")

if __name__ == "__main__":
    inspect_and_fix()
