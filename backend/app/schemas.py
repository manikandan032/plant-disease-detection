from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "farmer"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    upi_id: Optional[str] = None
    license_number: Optional[str] = None
    location: Optional[str] = None
    crops_grown: Optional[str] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    user_id: int
    is_admin: bool
    is_active: bool
    upi_id: Optional[str] = None
    license_number: Optional[str] = None
    location: Optional[str] = None
    crops_grown: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Fertilizer Schemas ---
class FertilizerBase(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    usage_instructions: Optional[str] = None
    safety_precautions: Optional[str] = None
    category: str = "Fertilizer"
    image_url: Optional[str] = None

class FertilizerCreate(FertilizerBase):
    pass

class FertilizerResponse(FertilizerBase):
    fertilizer_id: int
    class Config:
        from_attributes = True

# --- Inventory Schemas ---
class InventoryBase(BaseModel):
    fertilizer_id: int
    stock_quantity: int
    price: float

class InventoryCreate(InventoryBase):
    pass

class InventoryResponse(InventoryBase):
    inventory_id: int
    fertilizer_name: Optional[str] = None # Helper field
    shop_owner_id: Optional[int] = None
    shop_owner_name: Optional[str] = None
    class Config:
        from_attributes = True

# --- Chatbot Schemas ---
class ChatbotQuery(BaseModel):
    message: str

class ChatbotResponse(BaseModel):
    response: str
    timestamp: datetime

# --- Prediction/Image Schemas ---
class PredictionBase(BaseModel):
    disease_name: str
    confidence: float
    is_healthy: bool
    severity: str = "Low"

class PredictionResponse(PredictionBase):
    prediction_id: int
    description: Optional[str] = None
    treatment: Optional[str] = None
    recommended_products: List[FertilizerResponse] = []
    class Config:
        from_attributes = True

class PlantImageBase(BaseModel):
    image_url: str

class PlantImageResponse(PlantImageBase):
    image_id: int
    upload_date: datetime
    prediction: Optional[PredictionResponse] = None
    class Config:
        from_attributes = True

# --- Token Schema ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str # Returning role in token response is helpful

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Order Schemas ---
class OrderItemCreate(BaseModel):
    inventory_id: int
    quantity: int

class OrderCreate(BaseModel):
    shop_owner_id: int
    items: List[OrderItemCreate]
    payment_method: str = "UPI"

class OrderItemResponse(BaseModel):
    item_id: int
    inventory_id: int
    quantity: int
    price_at_purchase: float
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    order_id: int
    buyer_id: int
    shop_owner_id: int
    total_amount: float
    status: str
    payment_status: str
    items: List[OrderItemResponse] = []
    created_at: datetime
    class Config:
        from_attributes = True

# --- Dashboard Stats ---
class AdminStats(BaseModel):
    total_users: int
    total_images: int
    diseased_count: int
    model_accuracy: float = 94.2 # Mocked
    popular_fertilizers: List[dict] = []

# --- Notifications & Support ---
class NotificationResponse(BaseModel):
    notification_id: int
    message: str
    type: str # Info, Alert, Order
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class SupportTicketCreate(BaseModel):
    subject: str
    message: str

class SupportTicketResponse(SupportTicketCreate):
    ticket_id: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Disease Info ---
class DiseaseInfoCreate(BaseModel):
    name: str
    crop_name: Optional[str] = None
    description: Optional[str] = None
    treatment: Optional[str] = None
    symptoms: Optional[str] = None

class DiseaseInfoResponse(DiseaseInfoCreate):
    disease_id: int
    class Config:
        from_attributes = True

# --- Weather ---
class WeatherResponse(BaseModel):
    temp: float
    condition: str
    humidity: int
    wind_speed: float
    location: str
