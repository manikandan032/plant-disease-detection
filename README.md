# Cloud-Based Intelligent Plant Disease Detection System

A complete, production-ready system for detecting plant diseases using Deep Learning (CNN), employing a modern cloud-native architecture.

## 🚀 Key Features
- **Deep Learning Core**: Custom CNN model trained on PlantVillage dataset.
- **Farmer-Friendly UI**: Simple, glassmorphism-based design for easy interaction.
- **Full-Stack Architecture**: FastAPI (Python) Backend + Vanilla JS Frontend.
- **Cloud Ready**: Designed for deployment on AWS/GCP/Azure.
- **Role-Based Access**: Secure Admin and User panels.

---

## 🛠️ Tech Stack
- **Frontend**: HTML5, CSS3 (Glassmorphism), JavaScript (ES6+)
- **Backend**: Python 3.9+, FastAPI, SQLAlchemy
- **AI/ML**: TensorFlow 2.x, Keras, NumPy, Pillow
- **Database**: SQLite (Dev) / PostgreSQL (Prod)

---

## 🏃‍♂️ Local Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *Server will start at `http://127.0.0.1:8000`*

### 2. Frontend Setup
1. Navigate to the `frontend` directory.
2. Open `index.html` in your browser. 
   *Recommended: Use VS Code "Live Server" extension for best experience.*

### 3. Usage
1. Go to the **Register** page on the frontend.
2. **Admin Access**: Register with email **`admin@plant.com`** to automatically get Admin privileges.
3. Login and upload a leaf image to test detection.

---

## 🤖 AI Model & Training
The system comes with a **Mock Inference Mode** enabled by default so you can test the full flow immediately without downloading massive datasets.

### To Train the Real Model:
1. Download the **PlantVillage Dataset** (approx 1GB).
2. Place it in `backend/dataset/PlantVillage`.
3. Run the training script:
   ```bash
   python -m ai_engine.train_model
   ```
   *This will generate `backend/ai_engine/plant_disease_model.h5`.*
4. The backend will automatically detect the `.h5` file and switch to **Real Inference Mode**.

---

## ☁️ Cloud Architecture & Deployment (GCP Example)

This system is architected for **Google Cloud Platform (GCP)**.

### Architecture Diagram
Users -> App Engine (FastAPI) -> Load Balancer
         |
         +-> Cloud Storage (Images)
         +-> Cloud SQL (PostgreSQL DB)
         +-> AI Service (TensorFlow)

### Deployment Steps

#### 1. Database (Cloud SQL)
- Create a PostgreSQL instance in Cloud SQL.
- Update `backend/app/database.py` with the connection string.
  ```python
  SQLALCHEMY_DATABASE_URL = "postgresql://user:pass@IP:5432/dbname"
  ```

#### 2. Storage (Cloud Storage)
- Create a Bucket `plant-disease-uploads`.
- Uncomment the GCP Storage code in `backend/app/routers/detection.py`.
- Ensure Service Account keys are set in `backend/.env`.

#### 3. Backend (App Engine)
1. Create `backend/app.yaml`:
   ```yaml
   runtime: python39
   entrypoint: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
2. Deploy:
   ```bash
   gcloud app deploy
   ```

#### 4. Frontend (Firebase Hosting or GCS static)
- Host the `frontend` folder content on Firebase Hosting or an S3/GCS bucket configured for static website hosting.
- Update `API_BASE_URL` in `js/app.js` to point to your App Engine URL.

---

## 🔮 Future Enhancements (Roadmap)
- [ ] Mobile App (React Native)
- [ ] Multi-language support (i18n)
- [ ] Real-time weather integration API
- [ ] IoT Soil Sensor Module

---

**Developed for MCA Final Year Project.**
