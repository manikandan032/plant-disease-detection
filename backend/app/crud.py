from sqlalchemy.orm import Session
from . import models, schemas, auth

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    # Default role to farmer if not specified, but usually it should be in the UI
    role = getattr(user, "role", "farmer")
    db_user = models.User(email=user.email, name=user.name, hashed_password=hashed_password, role=role)
    
    # Check if this is the first user? Optionally make them admin. 
    # For now, let's hardcode a specific email for admin or just manual update.
    # If the email is 'admin@plant.com', make them admin by default for demo
    if user.email == 'admin@gmail.com':
        db_user.is_admin = True
        db_user.role = "admin"
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_plant_image(db: Session, image_url: str, user_id: int):
    db_image = models.PlantImage(image_url=image_url, user_id=user_id)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def save_prediction(db: Session, image_id: int, disease_name: str, confidence: float, is_healthy: bool):
    db_pred = models.Prediction(
        image_id=image_id, 
        disease_name=disease_name, 
        confidence=confidence, 
        is_healthy=is_healthy
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)
    return db_pred

def get_user_history(db: Session, user_id: int):
    return db.query(models.PlantImage).filter(models.PlantImage.user_id == user_id).order_by(models.PlantImage.upload_date.desc()).all()

def get_disease_info(db: Session, disease_name: str):
    return db.query(models.DiseaseInfo).filter(models.DiseaseInfo.name == disease_name).first()

def create_disease_info(db: Session, name: str, desc: str, treat: str):
    # Check if exists
    existing = db.query(models.DiseaseInfo).filter(models.DiseaseInfo.name == name).first()
    if existing:
        return existing
    db_info = models.DiseaseInfo(name=name, description=desc, treatment=treat)
    db.add(db_info)
    db.commit()
    return db_info
    
def get_all_images(db: Session):
    return db.query(models.PlantImage).order_by(models.PlantImage.upload_date.desc()).all()

def get_stats(db: Session):
    total_users = db.query(models.User).count()
    total_images = db.query(models.PlantImage).count()
    diseased = db.query(models.Prediction).filter(models.Prediction.is_healthy == False).count()
    healthy = db.query(models.Prediction).filter(models.Prediction.is_healthy == True).count()
    return {
        "total_users": total_users,
        "total_images": total_images,
        "diseased_count": diseased,
        "healthy_count": healthy
    }

# --- Fertilizer CRUD ---
def get_fertilizers(db: Session):
    return db.query(models.Fertilizer).all()

def create_fertilizer(db: Session, fertilizer: schemas.FertilizerCreate):
    db_fert = models.Fertilizer(**fertilizer.model_dump())
    db.add(db_fert)
    db.commit()
    db.refresh(db_fert)
    return db_fert

# --- Inventory CRUD ---
def get_shop_inventory(db: Session, user_id: int):
    return db.query(models.ShopInventory).filter(models.ShopInventory.user_id == user_id).all()

def add_inventory_item(db: Session, inventory: schemas.InventoryCreate, user_id: int):
    # Check if exists
    existing = db.query(models.ShopInventory).filter(
        models.ShopInventory.user_id == user_id, 
        models.ShopInventory.fertilizer_id == inventory.fertilizer_id
    ).first()
    
    if existing:
        existing.stock_quantity += inventory.stock_quantity
        existing.price = inventory.price # Update price
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_item = models.ShopInventory(**inventory.model_dump(), user_id=user_id)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

def get_marketplace_inventory(db: Session):
    return db.query(models.ShopInventory).filter(models.ShopInventory.stock_quantity > 0).all()

def decrease_stock(db: Session, inventory_id: int, quantity: int = 1):
    item = db.query(models.ShopInventory).filter(models.ShopInventory.inventory_id == inventory_id).first()
    if item and item.stock_quantity >= quantity:
        item.stock_quantity -= quantity
        db.commit()
        db.refresh(item)
        return True
    return False

# --- Chatbot CRUD ---
def log_chatbot_query(db: Session, user_id: int, query: str, response: str):
    db_log = models.ChatbotLog(user_id=user_id, query=query, response=response)
    db.add(db_log)
    db.commit()
    return db_log
