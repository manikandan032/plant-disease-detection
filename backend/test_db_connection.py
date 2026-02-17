import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Database URL
DATABASE_URL = os.getenv("DATABASE_URL")
print("--------------------------------------------------")
print(f"Testing Connection to: {DATABASE_URL}")
print("--------------------------------------------------")

if not DATABASE_URL:
    print("❌ Error: DATABASE_URL is not set in .env file.")
    exit(1)

try:
    # Create Engine
    engine = create_engine(DATABASE_URL)
    
    # Try to connect
    with engine.connect() as connection:
        result = connection.execute(text("SELECT DATABASE();"))
        db_name = result.fetchone()[0]
        print(f"✅ SUCCESS! Connected to database: '{db_name}'")
        
        # Check users table
        try:
            result = connection.execute(text("SELECT COUNT(*) FROM users;"))
            count = result.fetchone()[0]
            print(f"✅ Users Table Found! Total Users: {count}")
        except Exception as e:
            print("⚠️ Connected to DB, but 'users' table not found. (Did you import the .sql file?)")

except Exception as e:
    print("❌ CONNECTION FAILED")
    print(f"Error Message: {e}")
    print("\nTroubleshooting Tips:")
    print("1. Is XAMPP/MySQL Server running?")
    print("2. Does the database 'plant_disease' exist?")
    print("3. Are the username/password in backend/.env correct?")
