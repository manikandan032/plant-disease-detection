from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, models, schemas, auth, database
from datetime import datetime
import random

router = APIRouter()

# Simple Rule-Based Chatbot Logic
KEYWORDS = {
    "symptoms": ["yellow leaves", "spots", "wilting", "curling", "holes"],
    "usage": ["how to use", "apply", "dosage", "amount", "spray"],
    "prevention": ["prevent", "avoid", "protect", "stop"],
    "contact": ["shop", "buy", "store", "purchase", "call"]
}

RESPONSES = {
    "default": "I'm not sure about that. You can ask about disease symptoms, fertilizer usage, or prevention methods.",
    "symptoms": "If you see yellow leaves or spots, it might be a nutrient deficiency or fungal infection. Please upload an image for precise detection.",
    "usage": "Fertilizers should generally be applied early morning or late evening. For chemical fertilizers, follow the packet instructions strictly.",
    "prevention": "To prevent diseases, ensure crop rotation, use resistant varieties, and avoid waterlogging.",
    "contact": "You can contact registered fertilizer shop owners through our platform for products."
}

def get_bot_response(message: str) -> str:
    message = message.lower()
    
    # Check for greeting
    if any(x in message for x in ["hi", "hello", "hey"]):
        return "Hello! I am your AI Agriculture Assistant. How can I help you regarding crops or fertilizers?"
        
    # Check keywords
    for category, words in KEYWORDS.items():
        if any(word in message for word in words):
            return RESPONSES[category]
            
    return RESPONSES["default"]

@router.post("/query", response_model=schemas.ChatbotResponse)
def chatbot_query(
    query: schemas.ChatbotQuery,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    response_text = get_bot_response(query.message)
    
    # Log the interaction
    crud.log_chatbot_query(db, user_id=current_user.user_id, query=query.message, response=response_text)
    
    return {
        "response": response_text,
        "timestamp": datetime.utcnow()
    }
