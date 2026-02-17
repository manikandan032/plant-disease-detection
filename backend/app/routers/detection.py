from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from .. import crud, models, schemas, auth, database
from ..ai_engine import inference
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"

# --- Cloud Storage (GCP Example) ---
# def upload_to_gcp(file_path, destination_blob_name):
#     from google.cloud import storage
#     storage_client = storage.Client()
#     bucket = storage_client.bucket("your-bucket-name")
#     blob = bucket.blob(destination_blob_name)
#     blob.upload_from_filename(file_path)
#     return blob.public_url

@router.post("/upload", response_model=schemas.PredictionResponse)
async def upload_image(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Validate file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save locally
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # In a real cloud deployment, you would upload to S3/GCS here
    # public_url = upload_to_gcp(file_path, unique_filename)
    # For now, we use the local static URL
    image_url = f"/uploads/{unique_filename}"
    
    # Save Image to DB
    db_image = crud.create_plant_image(db, image_url=image_url, user_id=current_user.user_id)
    
    # AI Inference
    result = inference.predict_disease(file_path)
    
    # Save Prediction to DB
    db_prediction = crud.save_prediction(
        db, 
        image_id=db_image.image_id, 
        disease_name=result["disease_name"],
        confidence=result["confidence"],
        is_healthy=result["is_healthy"]
    )
    
    # Fetch Disease Info (Description, Remedies)
    # Note: In a real system, you might pre-populate the DB with this info.
    # For this demo, we check if info exists, otherwise return generic or mock data.
    disease_info = crud.get_disease_info(db, result["disease_name"])
    
    description = "No description available."
    treatment = "Consult an expert."
    
    if disease_info:
        description = disease_info.description
        treatment = disease_info.treatment
    else:
        # Fallback/Mock Data used if DB is empty for this disease
        description = result.get("description", "A fungal infection common in this plant.")
        treatment = result.get("treatment", "Apply fungicide and ensure proper drainage.")
    
    # --- Fertilizer Recommendation Logic ---
    all_ferts = crud.get_fertilizers(db)
    recommendations = []
    
    disease_lower = result["disease_name"].lower()
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
        # Normalize searchable fields
        f_type = (f.type or "").lower()
        f_category = (f.category or "").lower()
        f_name = (f.name or "").lower()

        if target_type == "General":
            # For general recommendations prefer fertilizers (not pesticides)
            if "fertilizer" in f_category or "fertilizer" in f_type or "fertilizer" in f_name:
                recommendations.append(f)
        else:
            # Match by explicit keywords in type/category/name
            key = target_type.lower()
            if key in f_type or key in f_category or key in f_name:
                recommendations.append(f)
            
    if not recommendations:
        # Fallback to organic fertilizers if available
        recommendations = [f for f in all_ferts if "organic" in (f.type or "").lower() or "organic" in (f.category or "").lower()]
    
    return {
        "prediction_id": db_prediction.prediction_id,
        "disease_name": db_prediction.disease_name,
        "confidence": db_prediction.confidence,
        "is_healthy": db_prediction.is_healthy,
        "description": description,
        "treatment": treatment,
        "recommended_fertilizers": recommendations,
        "recommended_fertilizer": result.get("recommended_fertilizer")
    }

@router.get("/history", response_model=list[schemas.PlantImageResponse])
def get_history(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    return crud.get_user_history(db, user_id=current_user.user_id)
