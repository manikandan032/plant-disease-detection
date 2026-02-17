from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import users, detection, admin, shop, chatbot, fertilizers, orders
import os

# Create Database Tables (for SQLite/Dev)
# In production, use Alembic for migrations
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Plant Disease Detection System",
    description="Cloud-Based Intelligent Plant Disease Detection System API",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8001",
    "http://localhost:8001",
    "http://127.0.0.1:8002",
    "http://localhost:8002",
    "*" # For ease of dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(detection.router, prefix="/api/detect", tags=["Detection"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(shop.router, prefix="/api/shop", tags=["Shop"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(fertilizers.router, prefix="/api/fertilizers", tags=["Fertilizers"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Intelligent Plant Disease Detection System API"}

# Create uploads directory if not exists
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
