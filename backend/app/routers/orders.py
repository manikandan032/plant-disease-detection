from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(
    tags=["Orders"]
)

@router.post("/", response_model=schemas.OrderResponse)
def create_order(order: schemas.OrderCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can place orders")
    
    # Check Shop Owner
    shop_owner = db.query(models.User).filter(models.User.user_id == order.shop_owner_id, models.User.role == "shop_owner").first()
    if not shop_owner:
        raise HTTPException(status_code=404, detail="Shop owner not found")
        
    total_amount = 0.0
    order_items = []
    
    # Validate items and calculate total
    for item in order.items:
        inventory_item = db.query(models.ShopInventory).filter(models.ShopInventory.inventory_id == item.inventory_id).first()
        if not inventory_item:
            raise HTTPException(status_code=404, detail=f"Inventory item {item.inventory_id} not found")
        
        if inventory_item.stock_quantity < item.quantity:
             raise HTTPException(status_code=400, detail=f"Insufficient stock for item {inventory_item.fertilizer.name}")
             
        total_amount += inventory_item.price * item.quantity
        
        # Deduct stock (Simple implementation)
        inventory_item.stock_quantity -= item.quantity
        
        new_order_item = models.OrderItem(
            inventory_id=item.inventory_id,
            quantity=item.quantity,
            price_at_purchase=inventory_item.price
        )
        order_items.append(new_order_item)

    new_order = models.Order(
        buyer_id=current_user.user_id,
        shop_owner_id=order.shop_owner_id,
        total_amount=total_amount,
        status="Pending",
        payment_status="Paid", # Dummy Payment: Auto-mark as paid
        payment_method=order.payment_method,
        transaction_id="DUMMY_TXN_12345" # Dummy transaction ID
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Add items
    for item in order_items:
        item.order_id = new_order.order_id
        db.add(item)
    
    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/farmer", response_model=List[schemas.OrderResponse])
def get_farmer_orders(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can view their orders")
    
    orders = db.query(models.Order).filter(models.Order.buyer_id == current_user.user_id).order_by(models.Order.created_at.desc()).all()
    return orders

@router.get("/shop", response_model=List[schemas.OrderResponse])
def get_shop_orders(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can view their received orders")
    
    orders = db.query(models.Order).filter(models.Order.shop_owner_id == current_user.user_id).order_by(models.Order.created_at.desc()).all()
    return orders

@router.put("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(order_id: int, status_update: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if current_user.user_id != order.shop_owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    order.status = status_update
    db.commit()
    db.refresh(order)
    return order

@router.get("/{order_id}/payment-info")
def get_payment_info(order_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Allow buyer or shop owner
    if current_user.user_id not in [order.buyer_id, order.shop_owner_id]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    shop_owner = order.shop_owner
    if not shop_owner.upi_id:
        raise HTTPException(status_code=400, detail="Shop owner has not set a UPI ID")
        
    upi_string = f"upi://pay?pa={shop_owner.upi_id}&pn={shop_owner.name}&am={order.total_amount}&tn=Order_{order.order_id}"
    return {"upi_string": upi_string, "shop_owner_name": shop_owner.name, "amount": order.total_amount}
