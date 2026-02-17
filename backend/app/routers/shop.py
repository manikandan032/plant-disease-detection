from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, ShopInventory, Order, ShopQuery, Fertilizer, OrderItem
from ..auth import get_current_user
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class QueryCreate(BaseModel):
    shop_owner_id: int
    message: str

class ReplyCreate(BaseModel):
    reply: str

class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    stock_quantity: int
    description: Optional[str] = None
    type: Optional[str] = "Standard"
    image_url: Optional[str] = None

@router.get("/inventory")
def get_inventory(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "shop_owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(ShopInventory).filter(ShopInventory.user_id == current_user.user_id).all()

@router.post("/inventory")
def add_to_inventory(item: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "shop_owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if fertilizer exists or create
    fert = db.query(Fertilizer).filter(Fertilizer.name == item.name).first()
    if not fert:
        fert = Fertilizer(
            name=item.name, 
            category=item.category, 
            description=item.description or "Available at shop",
            type=item.type,
            usage_instructions="See packet.",
            image_url=item.image_url
        )
        db.add(fert)
        db.commit()
        db.refresh(fert)

    # Check if item already in inventory
    inventory = db.query(ShopInventory).filter(ShopInventory.user_id == current_user.user_id, ShopInventory.fertilizer_id == fert.fertilizer_id).first()
    if inventory:
        inventory.stock_quantity = item.stock_quantity
        inventory.price = item.price
    else:
        inventory = ShopInventory(
            user_id=current_user.user_id,
            fertilizer_id=fert.fertilizer_id,
            stock_quantity=item.stock_quantity,
            price=item.price
        )
        db.add(inventory)
    
    db.commit()
    return {"message": "Product added/updated"}

@router.get("/orders")
def get_shop_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "shop_owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Order).filter(Order.shop_owner_id == current_user.user_id).order_by(Order.created_at.desc()).all()

@router.get("/queries")
def get_queries(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "shop_owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    queries = db.query(ShopQuery).filter(ShopQuery.shop_owner_id == current_user.user_id).order_by(ShopQuery.created_at.desc()).all()
    # Serialize manually to include farmer name
    res = []
    for q in queries:
        res.append({
            "query_id": q.query_id,
            "farmer_name": q.farmer.name if q.farmer else "Unknown",
            "message": q.message,
            "reply": q.reply,
            "created_at": q.created_at
        })
    return res

@router.put("/queries/{query_id}/reply")
def reply_query(query_id: int, reply: ReplyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "shop_owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    q = db.query(ShopQuery).filter(ShopQuery.query_id == query_id, ShopQuery.shop_owner_id == current_user.user_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
    q.reply = reply.reply
    db.commit()
    return {"message": "Replied"}

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "shop_owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    orders = db.query(Order).filter(Order.shop_owner_id == current_user.user_id).all()
    total_revenue = sum(o.total_amount for o in orders if o.payment_status == 'Paid' or o.status == 'Completed')
    completed_orders = len([o for o in orders if o.status == 'Completed'])
    
    # Mock monthly trend
    monthly_sales = [1200, 1500, 1100, 2000, 2500, 3000] # Example data
    
    return {
        "revenue": total_revenue,
        "completed_orders": completed_orders,
        "monthly_trend": monthly_sales
    }

@router.get("/marketplace")
def get_marketplace(db: Session = Depends(get_db)):
    # Public or Farmer access
    items = db.query(ShopInventory).filter(ShopInventory.stock_quantity > 0).all()
    res = []
    for i in items:
        res.append({
            "inventory_id": i.inventory_id,
            "fertilizer_name": i.fertilizer.name,
            "shop_owner_name": i.shop_owner.name if i.shop_owner else "Unknown",
            "shop_owner_id": i.user_id,
            "price": i.price,
            "stock_quantity": i.stock_quantity,
            "description": i.fertilizer.description,
            "image_url": i.fertilizer.image_url
        })
    return res

@router.post("/upload-image")
def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.role != "shop_owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Save file
    import shutil
    import os
    
    # Ensure uploads dir exists (should be created by main.py but good to be safe)
    os.makedirs("uploads", exist_ok=True)
    
    # Generate safe filename
    safe_filename = file.filename.replace(" ", "_")
    file_location = f"uploads/{safe_filename}"
    
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/uploads/{safe_filename}"}
