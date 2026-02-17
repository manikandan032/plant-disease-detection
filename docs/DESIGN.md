**Abstract**
- **Project:** Plant Disease Detection & Management Platform: a full-stack system that ingests plant images, detects diseases with a trained AI model, and provides a marketplace + management interfaces for farmers and sellers.
- **Scope:** Image-based disease detection, recommendations (fertilizers/controls), order/shop management, user authentication, and admin tools for dataset & model updates.
- **Contributions:** End-to-end pipeline combining an inference engine (`app/ai_engine`), REST APIs (FastAPI routers), relational DB for metadata, and a simple frontend for users and admins.

**Data Flow Diagram (DFD)**
- **Level 0 (context):** User -> Frontend -> Backend API -> Database & AI Engine -> Backend returns results to Frontend.
- **Level 1 (detailed flow):**
  - User uploads image via `detection` UI -> Frontend POST `/detect` -> Backend saves image metadata, forwards image to `ai_engine.inference` -> Model returns disease prediction (+ confidence) -> Backend stores detection record and suggested treatments -> Notifications / Orders created if user requests supplies.

PlantUML (DFD):
```
@startuml
actor User
node Frontend
node Backend
database DB
node AIEngine

User -> Frontend : upload image / request
Frontend -> Backend : POST /api/detect (image)
Backend -> DB : store image metadata
Backend -> AIEngine : infer(image)
AIEngine -> Backend : prediction
Backend -> DB : store detection + suggestions
Backend -> Frontend : response (disease, confidence, suggestions)
@enduml
```

**ER Diagram**
- **Entities (high-level):** Users, Products, Orders, Fertilizers, Detections, DiseaseProfiles, Images, ChatMessages, AdminActions.

PlantUML (ER):
```
@startuml
entity users {
  * user_id : uuid
  --
  username
  email
  hashed_password
  role
}
entity images {
  * image_id : uuid
  --
  user_id : uuid
  path
  uploaded_at
}
entity detections {
  * detection_id : uuid
  --
  image_id : uuid
  disease_id : uuid
  confidence : float
  created_at
}
entity disease_profiles {
  * disease_id : uuid
  --
  name
  description
  treatment
}
entity products {
  * product_id : uuid
  --
  name
  price
  stock
}
entity orders {
  * order_id : uuid
  --
  user_id : uuid
  total_amount
  status
}

users ||--o{ images : uploads
images ||--o{ detections : "has"
disease_profiles ||--o{ detections : "identified"
users ||--o{ orders : places
orders ||--o{ products : contains
@enduml
```

**Architecture Diagram**
- **Layers:**
  - Presentation: static frontend pages (`frontend/*.html`, `js/`, `css/`)
  - API: FastAPI app in `backend/app/main.py` and routers under `routers/`
  - Business: `crud.py`, `ai_engine` (inference + training)
  - Data: relational DB (SQL), uploads folder for images
  - External: optional cloud storage, model file `crop_disease_model.h5` for inference

PlantUML (Architecture):
```
@startuml
rectangle Frontend
rectangle Backend as API
database Postgres
rectangle AIEngine
Storage(Uploads)

Frontend --> API : REST
API --> Postgres : SQL
API --> AIEngine : model infer
API --> Uploads : save images
AIEngine --> model : load crop_disease_model.h5
@enduml
```

**Table Design (SQL schemas)**
- The following are core tables in normalized form. Use UUIDs for PKs, timestamps, and proper FK constraints.

```
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE images (
  image_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE disease_profiles (
  disease_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  treatment TEXT
);

CREATE TABLE detections (
  detection_id UUID PRIMARY KEY,
  image_id UUID REFERENCES images(image_id) ON DELETE CASCADE,
  disease_id UUID REFERENCES disease_profiles(disease_id),
  confidence REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE products (
  product_id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(user_id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
  order_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE order_items (
  item_id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(product_id),
  qty INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

CREATE TABLE chat_messages (
  msg_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Dataset (images) — schema & guidance**
-- **Columns / features:**
- `image_id (uuid)`, `user_id`, `filename`, `path`, `disease_label` (string), `bounding_boxes` (optional JSON), `capture_date`, `location` (optional lat/lon), `notes`.
-- **Source:** Public plant disease image datasets (e.g., PlantVillage) and in-field collections. Keep provenance for each image.
-- **Format:** JPEG/PNG for images; CSV/JSON manifest for labels. Example manifest row:

```
image_id,filename,disease_label,user_id,location,capture_date
f47ac10b-58cc-4372-a567-0e02b2c3d479,leaf_001.jpg,Early_blight,00000000-0000-0000-0000-000000000001,"12.34,56.78",2024-05-10
```

-- **Preprocessing suggestions:**
- Resize to model input (e.g., 224x224 or 299x299), normalize pixel values, augment (rotations, flips, color jitter), and store compressed versions for inference.

**Modules & Design Page**
- **`app/main.py`**: Application entry. Creates FastAPI app, includes routers, middleware, and startup/shutdown handlers.
- **`app/database.py`**: DB session factory, connection pool setup.
- **`app/models.py`**: ORM models mapping to the tables above.
- **`app/schemas.py`**: Pydantic input/output models for request validation and responses.
- **`app/crud.py`**: Database operations layer (create_user, get_user_by_email, create_detection, list_products, create_order).
- **`app/auth.py`**: JWT-based auth helpers, password hashing, dependency functions (`get_current_user`).
- **`app/routers/*`**: Router responsibilities:
  - `detection.py`: POST `/api/detect` (image upload), GET detection history. Calls `ai_engine.inference`.
  - `users.py`: Signup, login, profile endpoints.
  - `shop.py`: Browse products, product details.
  - `orders.py`: Create order, list orders, update status (admin).
  - `fertilizers.py`: CRUD for fertilizer products and suggestions mapped to disease profiles.
  - `admin.py`: Dataset ingestion, model retrain hooks, user/product moderation.
  - `chatbot.py`: Simple endpoint for Q&A / advice, stores chat history.

- **`app/ai_engine/inference.py`**: Loads `crop_disease_model.h5` (on startup) and exposes `infer(image_bytes)` returning `{disease_id, name, confidence}`. Keep inference deterministic and handle batching if needed.
- **`app/ai_engine/train_model.py`**: Training script that consumes labeled dataset, outputs model and a model-metadata JSON (version, classes, input size).

**API Contracts (examples)**
- `POST /api/detect`
  - Request: multipart/form-data {file: image}
  - Response: {detection_id, disease: {id, name}, confidence, suggestions: [product_ids]} 

- `POST /api/auth/login` -> returns JWT access token.

**Operational Notes**
- Store model weights separately (not in VCS) and version them. Use `ai_engine/model_metadata.json` to track model version and classes.
- Save raw uploads in `backend/uploads/` (or cloud) and store only paths in DB. Keep retention policy for privacy.
- Use migrations (`init_tables.py`, `migrate_add_is_active.py`) to evolve schema.

**Next Steps / Optional Deliverables**
- Export PlantUML diagrams to PNG/SVG and add to `docs/`.
- Produce a short architecture slide deck and a minimal API Postman collection.

---
Generated on: 2026-01-21
