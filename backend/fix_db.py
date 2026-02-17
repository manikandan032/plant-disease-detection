
import os
import sys
import time
import socket
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Force output to show immediately
sys.stdout.reconfigure(line_buffering=True)

def check_mysql_port(host, port):
    try:
        with socket.create_connection((host, port), timeout=2):
            return True
    except (socket.timeout, ConnectionRefusedError):
        return False

def main():
    print("--- Database Diagnostics & Fix Tool ---")
    load_dotenv()
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    # Handle localhost resolution on Windows
    host = "127.0.0.1"
    if "localhost" in db_url:
        db_url = db_url.replace("localhost", "127.0.0.1")
    
    # Extract port if present, else default 3306
    port = 3306
    # (Simple parsing, assuming standard URL format)
    
    # 1. Check if MySQL is running
    print(f"Checking connectivity to MySQL on {host}:{port}...")
    if not check_mysql_port(host, port):
        print("\n[CRITICAL ERROR] MySQL Server is NOT reachable.")
        print("Possible causes:")
        print("1. MySQL service is stopped.")
        print("2. MySQL is running on a different port.")
        print("\n[ACTION REQUIRED] Please START your MySQL service.")
        print("Try running in Administrator Command Prompt: net start mysql")
        print("Or check Services management console (services.msc).")
        return

    print("MySQL is running. Attempting to connect...")
    
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            print("Connected successfully.")
            
            # 2. Check Orders Table
            print("Checking 'orders' table schema...")
            try:
                result = conn.execute(text("DESCRIBE orders"))
                columns = [row[0] for row in result.fetchall()]
                print(f"Existing columns: {columns}")
                
                # Payment Method
                if 'payment_method' not in columns:
                    print("-> Adding 'payment_method' column...")
                    conn.execute(text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'UPI'"))
                else:
                    print("-> 'payment_method' OK.")

                # Payment Status
                if 'payment_status' not in columns:
                    print("-> Adding 'payment_status' column...")
                    conn.execute(text("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Unpaid'"))
                else:
                    print("-> 'payment_status' OK.")
                    
                # Transaction ID
                if 'transaction_id' not in columns:
                    print("-> Adding 'transaction_id' column...")
                    conn.execute(text("ALTER TABLE orders ADD COLUMN transaction_id VARCHAR(255)"))
                else:
                    print("-> 'transaction_id' OK.")
                    
                print("Schema verification complete.")
                conn.commit()
                
            except Exception as e:
                # If table doesn't exist, SQLAlchemy creates it on app start usually.
                # But we can check if it's strictly about missing table
                if "1146" in str(e): # Table doesn't exist
                    print("Table 'orders' does not exist yet. It will be created when you start the backend.")
                else:
                    print(f"Error checking schema: {e}")

    except Exception as e:
        print(f"Connection failed: {e}")
        return

    print("\n--- DONE ---")
    print("You can now restart your backend server: uvicorn backend.app.main:app --reload")

if __name__ == "__main__":
    main()
