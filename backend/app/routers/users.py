from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import crud, models, schemas, auth, database
from datetime import timedelta
from typing import List

router = APIRouter()

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=form_data.email)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_user_me(
    user_update: schemas.UserUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if user_update.name: current_user.name = user_update.name
    if user_update.upi_id: current_user.upi_id = user_update.upi_id
    if user_update.location: current_user.location = user_update.location
    if user_update.license_number: current_user.license_number = user_update.license_number
    if user_update.crops_grown: current_user.crops_grown = user_update.crops_grown
    if user_update.password:
        current_user.hashed_password = auth.get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

# --- Notifications ---
@router.get("/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Mock some notifications if none exist
    notifs = db.query(models.Notification).filter(models.Notification.user_id == current_user.user_id).order_by(models.Notification.created_at.desc()).all()
    if not notifs:
        # Create a welcome notification
        welcome = models.Notification(user_id=current_user.user_id, message="Welcome to PlantShield!", type="Info")
        db.add(welcome)
        db.commit()
        db.refresh(welcome)
        notifs = [welcome]
    return notifs

# --- Support Tickets ---
@router.post("/support", response_model=schemas.SupportTicketResponse)
def create_ticket(ticket: schemas.SupportTicketCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_ticket = models.SupportTicket(
        user_id=current_user.user_id,
        subject=ticket.subject,
        message=ticket.message
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

# --- Weather (Mock) ---
@router.get("/weather", response_model=schemas.WeatherResponse)
def get_weather(current_user: models.User = Depends(auth.get_current_user)):
    # In a real app, use OpenWeatherMap API with current_user.location
    import random
    conditions = ["Sunny", "Partly Cloudy", "Rainy", "Cloudy"]
    return {
        "temp": round(random.uniform(20, 35), 1),
        "condition": random.choice(conditions),
        "humidity": random.randint(40, 90),
        "wind_speed": round(random.uniform(5, 20), 1),
        "location": current_user.location or "Unknown Location"
    }
