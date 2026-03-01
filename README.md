# 🧠 MindSaathi 
### Early Cognitive Risk Assessment & Clinical Intelligence Platform

> ⚠️ **Disclaimer:** MindSaathi is an educational and assistive tool only. It is not a medical device and does not provide medical diagnosis. Always consult licensed healthcare professionals for clinical decisions.

---

## 📖 Overview

MindSaathi is a full-stack early cognitive risk assessment system designed to detect early indicators of neurological conditions such as:

- Mild Cognitive Impairment (MCI)
- Alzheimer's Disease
- Parkinson's-related cognitive decline
- General executive dysfunction patterns

The platform combines:

- 🧪 Neuropsychological test battery  
- 🧮 Normalized ML scoring engine  
- 📊 Longitudinal progress tracker  
- 👩‍⚕️ Doctor–patient workflow  
- 🤖 Guarded AI chatbot (NeuroBot) powered by Google Gemini with RAG  

---

## 🚀 Live Links

| Resource | URL |
|----------|-----|
| 🌐 Frontend (Deployed) | _Add your frontend deployed link here_ |
| ⚙️ Backend (Deployed) | _Add your backend deployed link here_ |
| 🎥 Demo Video | _Add your demo video link here_ |

---

## 🏗️ System Architecture

```
Frontend (React + Vite + Tailwind CSS)
          │
          ▼
  FastAPI Backend (Python)
          │
          ├── ML Scoring Engine
          ├── Clinical Config (guardrails, thresholds)
          ├── Progress Tracker (longitudinal analysis)
          ├── RAG Service → NeuroBot (Gemini AI)
          └── Firebase (Auth + Firestore)
```

---

## 🧪 Cognitive Test Battery

| Test | Cognitive Domain |
|------|-----------------|
| Memory Test | Episodic memory |
| Digit Span | Working memory |
| Stroop Test | Executive control / inhibition |
| Reaction Test | Processing speed |
| Speech Test | Language & fluency patterns |
| Fluency Test | Verbal fluency |
| Tap Test | Motor coordination |

Each test:

- Collects structured performance metrics  
- Sends normalized data to backend API  
- Contributes to an aggregate **Cognitive Risk Index**

---

## 👤 User Flows

### 🧑‍💻 Patient

1. Register / Login via Firebase Auth  
2. Complete profile setup  
3. Take cognitive test battery  
4. View Risk Dashboard (overall score + domain breakdown + trends)  
5. Select a doctor (max 10 patients per doctor)  
6. Securely message doctor  
7. Chat with NeuroBot for explanations  
8. Play cognitive training games  
9. Track longitudinal progress  

---

### 👩‍⚕️ Doctor

1. Register as doctor  
2. View assigned patients dashboard  
3. Analyze score history and anomaly indicators  
4. Communicate via messaging system  
5. Manage educational content  

---

## 🤖 NeuroBot 


NeuroBot:

- Explains medical terms in plain language  
- Clarifies cognitive score meaning  
- Never diagnoses or prescribes  
- Redirects emergency language safely  
- Falls back to static KB if API key absent  

---

## 🏆 Risk Scoring Logic

```
Raw Score
   ↓
Age-Adjusted Normalization
   ↓
Domain Score × Clinical Weight
   ↓
Aggregate Risk Index
```

| Risk Score | Category |
|------------|----------|
| 0 – 30 | 🟢 Low Risk |
| 31 – 60 | 🟡 Moderate Risk |
| 61 – 100 | 🔴 Elevated Risk |

Thresholds configurable in:

```
backend/core/clinical_config.py
```

---

## 🗂️ Project Structure

```
NeuroSaathi/
│
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── rag_service.py
│   ├── core/
│   │   ├── ml_engine.py
│   │   ├── clinical_config.py
│   │   └── progress_tracker.py
│   ├── routers/
│   │   ├── analyze.py
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── content.py
│   │   ├── games.py
│   │   └── messages.py
│   ├── models/schemas.py
│   ├── knowledge_base/
│   │   ├── index.py
│   │   └── guardrails.py
│   ├── services/ai_service.py
│   ├── data/
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       ├── services/
│       ├── utils/
│       └── firebase.js
│
├── SETUP.md
├── README.md
└── LICENSE
```

---

## ⚙️ Local Setup

### 🔹 Prerequisites

- Python 3.10+
- Node.js 18+
- Firebase project with Firestore enabled
- Google Gemini API key (optional but recommended)

---

### 🔹 Backend Setup

```bash
cd backend
cp .env.example .env
# Add GEMINI_API_KEY in .env
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at:

```
http://localhost:8000
```

Swagger docs:

```
http://localhost:8000/docs
```

---

### 🔹 Frontend Setup

```bash
cd frontend
cp .env.example .env
# Add Firebase config + backend URL
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 🔐 Firebase Setup

1. Create project in Firebase Console  
2. Enable Firestore Database  
3. Add Web App and copy config to `.env`  
4. Apply Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /doctors/{doctorId} {
      allow read, write: if true;
    }
    match /results/{resultId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS |
| Auth | Firebase Authentication |
| Database | Firebase Firestore + JSON fallback |
| Backend | FastAPI (Python) |
| AI | Google Gemini |
| AI Pattern | RAG |
| ML | Custom weighted scoring (NumPy) |
| Speech | Adaptive Voice Activity Detection |

---

## 🛡️ Safety & Compliance

- ❌ No medical diagnosis  
- ❌ No medication recommendation  
- ❌ No emergency mismanagement  
- ✅ Encourages professional consultation  
- ✅ Guarded AI response framing  
- ✅ Crisis language redirection  

---

## 📈 Roadmap

- Real ML model training on clinical datasets  
- Speech-to-text biomarker extraction  
- EEG integration simulation  
- Time-series anomaly detection  
- Explainable AI (SHAP / LIME)  
- CI/CD cloud deployment  
- Federated learning  

---

## 📜 License

MIT License — see `LICENSE`.

---

**MindSaathi — bridging digital neuropsychology and modern machine intelligence, ethically.**
