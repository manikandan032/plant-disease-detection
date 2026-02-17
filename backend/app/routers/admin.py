from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, DiseaseInfo, Prediction, Order
from ..auth import get_current_user
from ..schemas import UserResponse, DiseaseInfoResponse
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class UserStatusUpdate(BaseModel):
    is_active: bool

class DiseaseCreate(BaseModel):
    name: str
    crop_name: str
    description: str
    symptoms: str
    treatment: str
    preventive_measures: Optional[str] = None


class DiseaseUpdate(BaseModel):
    name: Optional[str] = None
    crop_name: Optional[str] = None
    description: Optional[str] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    preventive_measures: Optional[str] = None

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(User).all()

@router.put("/users/{user_id}/status")
def update_user_status(user_id: int, status: UserStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = status.is_active
    db.commit()
    return {"message": "User status updated"}

@router.get("/analytics")
def get_system_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_users = db.query(User).count()
    total_scans = db.query(Prediction).count()
    diseases_custom = db.query(DiseaseInfo).count()
    
    # Mock data for charts
    monthly_scans = [50, 80, 120, 200, 350, 400]
    
    return {
        "total_users": total_users,
        "total_scans": total_scans,
        "diseases_count": diseases_custom,
        "model_accuracy": 94.5,
        "scan_trend": monthly_scans
    }

@router.get("/diseases", response_model=List[DiseaseInfoResponse])
def get_diseases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Allow read for all, but edit for admin
    return db.query(DiseaseInfo).all()

@router.post("/diseases", response_model=DiseaseInfoResponse)
def add_disease(disease: DiseaseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_disease = DiseaseInfo(**disease.dict())
    db.add(new_disease)
    db.commit()
    db.refresh(new_disease)
    return new_disease


@router.put("/diseases/{disease_id}", response_model=DiseaseInfoResponse)
def update_disease(disease_id: int, disease: DiseaseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db_disease = db.query(DiseaseInfo).filter(DiseaseInfo.disease_id == disease_id).first()
    if not db_disease:
        raise HTTPException(status_code=404, detail="Disease not found")

    update_data = disease.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_disease, key, value)

    db.commit()
    db.refresh(db_disease)
    return db_disease
