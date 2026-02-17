
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.getcwd())

print("Attempting to import app.main...")
try:
    from app.main import app
    print("Import successful!")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
