from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Table, Enum, Text
from sqlalchemy.orm import relationship
from .database import Base
import enum
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(50), default="farmer") # farmer, shop_owner, admin
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    upi_id = Column(String(50), nullable=True) # For Shop Owners
    license_number = Column(String(100), nullable=True) # For Shop Owers
    location = Column(String(255), nullable=True)
    crops_grown = Column(Text, nullable=True) # JSON or CSV string
    created_at = Column(DateTime, default=datetime.utcnow)
    
    images = relationship("PlantImage", back_populates="owner")
    inventory = relationship("ShopInventory", back_populates="shop_owner")
    notifications = relationship("Notification", back_populates="user")
    support_tickets = relationship("SupportTicket", back_populates="user")
    chatbot_logs = relationship("ChatbotLog", back_populates="user")

class PlantImage(Base):
    __tablename__ = "plant_images"
    image_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    image_url = Column(String(500))
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="images")
    prediction = relationship("Prediction", back_populates="image", uselist=False)

class Prediction(Base):
    __tablename__ = "predictions"
    prediction_id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("plant_images.image_id"))
    disease_name = Column(String(255))
    confidence = Column(Float)
    is_healthy = Column(Boolean)
    severity = Column(String(50), default="Low") # Low, Medium, High
    
    image = relationship("PlantImage", back_populates="prediction")

class DiseaseInfo(Base):
    __tablename__ = "disease_info"
    disease_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    crop_name = Column(String(100))
    description = Column(Text)
    symptoms = Column(Text) 
    treatment = Column(Text)
    preventive_measures = Column(Text)

    # Many-to-Many relationship with fertilizers/pesticides
    recommended_products = relationship("Fertilizer", secondary="disease_product_link", back_populates="associated_diseases")

# Association table for Disease <-> Fertilizer/Pesticide
disease_product_link = Table(
    "disease_product_link",
    Base.metadata,
    Column("disease_id", Integer, ForeignKey("disease_info.disease_id"), primary_key=True),
    Column("fertilizer_id", Integer, ForeignKey("fertilizers.fertilizer_id"), primary_key=True),
)

class Fertilizer(Base):
    __tablename__ = "fertilizers"
    fertilizer_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    type = Column(String(100)) # Organic / Chemical
    category = Column(String(100), default="Fertilizer") # Fertilizer, Pesticide
    description = Column(Text)
    usage_instructions = Column(Text)
    safety_precautions = Column(Text)
    image_url = Column(String(500), nullable=True)
    
    inventory_items = relationship("ShopInventory", back_populates="fertilizer")
    associated_diseases = relationship("DiseaseInfo", secondary="disease_product_link", back_populates="recommended_products")

class ShopInventory(Base):
    __tablename__ = "shop_inventory"
    inventory_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id")) # The Shop Owner
    fertilizer_id = Column(Integer, ForeignKey("fertilizers.fertilizer_id"))
    stock_quantity = Column(Integer, default=0)
    price = Column(Float, default=0.0)
    
    shop_owner = relationship("User", back_populates="inventory")
    fertilizer = relationship("Fertilizer", back_populates="inventory_items")

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.user_id")) # Farmer
    shop_owner_id = Column(Integer, ForeignKey("users.user_id")) # Shop Owner
    total_amount = Column(Float)
    status = Column(String(50), default="Pending") # Pending, Shipped, Delivered, Cancelled
    payment_status = Column(String(50), default="Unpaid")
    payment_method = Column(String(50), default="UPI")
    transaction_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    buyer = relationship("User", foreign_keys=[buyer_id])
    shop_owner = relationship("User", foreign_keys=[shop_owner_id])
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    inventory_id = Column(Integer, ForeignKey("shop_inventory.inventory_id"))
    quantity = Column(Integer)
    price_at_purchase = Column(Float)
    
    order = relationship("Order", back_populates="items")
    inventory = relationship("ShopInventory")

class Notification(Base):
    __tablename__ = "notifications"
    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    message = Column(Text)
    type = Column(String(50), default="Info") # Alert, Order, Info
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    ticket_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    subject = Column(String(255))
    message = Column(Text)
    status = Column(String(50), default="Open")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="support_tickets")

class ChatbotLog(Base):
    __tablename__ = "chatbot_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    query = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chatbot_logs") 

class ShopQuery(Base):
    __tablename__ = "shop_queries"
    query_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.user_id"))
    shop_owner_id = Column(Integer, ForeignKey("users.user_id"))
    message = Column(Text)
    reply = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("User", foreign_keys=[farmer_id])
    shop_owner = relationship("User", foreign_keys=[shop_owner_id])

class WeatherLog(Base):
    __tablename__ = "weather_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    temperature = Column(Float)
    humidity = Column(Float)
    condition = Column(String(100))
    risk_level = Column(String(50)) # Low, Medium, High
    alert_message = Column(Text, nullable=True)
