import sys
# Redirect output immediately
sys.stdout = open("init_log.txt", "w")
sys.stderr = sys.stdout

from app.database import engine, Base
from app.models import User, Order, ShopInventory, Fertilizer, OrderItem, Prediction, PlantImage, DiseaseInfo
# Importing models registers them with Base.metadata

print("Creating all tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
except Exception as e:
    print(f"Error creating tables: {e}")
