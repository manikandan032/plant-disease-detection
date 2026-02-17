from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, models, schemas, auth, database
from typing import List

router = APIRouter()

@router.get("/", response_model=List[schemas.FertilizerResponse])
def list_fertilizers(db: Session = Depends(database.get_db)):
    return crud.get_fertilizers(db)

@router.post("/", response_model=schemas.FertilizerResponse)
def create_fertilizer(
    fertilizer: schemas.FertilizerCreate, 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if current_user.role not in ["shop_owner", "admin"] and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin or Shop Owner access required")
    return crud.create_fertilizer(db, fertilizer)

@router.get("/recommend/{disease_name}", response_model=List[schemas.FertilizerResponse])
def recommend_fertilizers(disease_name: str, db: Session = Depends(database.get_db)):
    # Simple logic to map disease string to fertilizer type
    all_ferts = crud.get_fertilizers(db)
    recommendations = []
    
    disease_lower = disease_name.lower()
    
    target_type = ""
    if "bacterial" in disease_lower:
        target_type = "Bactericide"
    elif "fungal" in disease_lower or "blight" in disease_lower or "rust" in disease_lower:
        target_type = "Fungicide"
    elif "healthy" in disease_lower:
        target_type = "Growth Promoter"
    else:
        target_type = "General"

    for f in all_ferts:
        # Match type or generic logic
        if target_type in f.type or target_type == "General":
            recommendations.append(f)
            
    # If no specific match, return all organic ones as safe bet
    if not recommendations:
        recommendations = [f for f in all_ferts if "Organic" in f.type]
        
    return recommendations
