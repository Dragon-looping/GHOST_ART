Absolutely. Since your current repo has the **FastAPI + SQLite + pHash/SHA-256 + Gemini backend** and the React frontend is being built, use this as the `README.md`:

````markdown
# GHOST ART 👻🎨

### AI-Powered Artwork Provenance & Tracing Platform

GHOST ART is an AI-powered artwork provenance and tracing platform designed to help artists identify potential copies, reposts, and visually modified versions of their original artwork.

The system combines **cryptographic fingerprinting, perceptual hashing, database-based candidate retrieval, and Google Gemini visual analysis** to create an explainable artwork tracing workflow.

---

## 🚀 Problem

Digital artwork can be copied, cropped, recolored, filtered, or otherwise modified and reposted online.

Traditional file hashes fail when an image is modified because even a tiny change produces a completely different hash.

GHOST ART addresses this by combining exact fingerprinting with perceptual visual analysis.

---

## 💡 How GHOST ART Works

```text
                    Artwork Upload
                         │
                         ▼
                  FastAPI Backend
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       SHA-256 Fingerprint      Perceptual Hash
              │                     │
              └──────────┬──────────┘
                         ▼
                  SQLite Database
                         │
                         ▼
              Candidate Match Search
                         │
                         ▼
                 Top Candidate Found
                         │
                         ▼
                Google Gemini Analysis
                         │
                         ▼
          Similarities / Differences /
           Possible Modifications
                         │
                         ▼
                 Final Trace Result
````

---

## ✨ Key Features

### 🔐 Artwork Fingerprinting

Each registered artwork is processed using:

* SHA-256 for exact file fingerprinting
* Perceptual hashing (pHash) for visual similarity detection

### 🔎 Candidate Detection

The perceptual hash allows the system to identify visually similar registered artworks even when the uploaded image has been modified.

### 🤖 Gemini Visual Analysis

Google Gemini analyzes the uploaded artwork and the identified candidate to provide:

* Visual similarities
* Visual differences
* Possible modifications
* Human-readable analysis

Gemini is used as a visual analysis and explanation layer, not as a legal copyright decision-maker.

### 🗄️ Artwork Database

Registered artwork metadata and fingerprint information are stored in SQLite.

### ⚡ FastAPI Backend

The backend exposes REST APIs for:

* Artwork registration
* Artwork tracing
* Individual Gemini analysis
* Artwork comparison
* Health checking

### 📊 Explainable Results

Instead of simply returning a similarity number, GHOST ART combines fingerprint evidence with Gemini's visual observations to make the result easier to understand.

---

## 🧠 Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Python
* FastAPI
* Uvicorn

### AI

* Google Gemini API
* `google-genai` SDK

### Image Analysis

* Perceptual Hashing (pHash)
* SHA-256

### Database

* SQLite

### Development

* Git
* GitHub

---

## 📁 Project Structure

```text
GHOST_ART/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── fingerprint.py
│   │   └── gemini_service.py
│   │
│   ├── tests/
│   │   └── test_api.py
│   │
│   └── requirements.txt
│
├── frontend/
│   └── React + Vite application
│
├── data/
│   └── uploads/
│
├── .env
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Endpoint            | Method | Purpose                               |
| ------------------- | ------ | ------------------------------------- |
| `/health`           | GET    | Check whether the backend is running  |
| `/register`         | POST   | Register an artwork                   |
| `/trace`            | POST   | Find potential matching artworks      |
| `/analyze-artwork`  | POST   | Analyze a single artwork using Gemini |
| `/compare-artworks` | POST   | Compare two artworks using Gemini     |
| `/docs`             | GET    | FastAPI Swagger API documentation     |

---

## 🔍 Main Trace Workflow

The `/trace` endpoint is the primary workflow of GHOST ART.

### Step 1 — Upload

The user uploads an artwork.

### Step 2 — Fingerprinting

The backend calculates:

```text
SHA-256
+
pHash
```

### Step 3 — Candidate Retrieval

The pHash is compared with fingerprints stored in the database.

Potential candidates are ranked based on perceptual similarity.

### Step 4 — Gemini Analysis

The strongest candidate can then be analyzed by Gemini to identify visual relationships such as:

```text
Similarities
Differences
Possible Cropping
Possible Recoloring
Other Visual Modifications
```

### Step 5 — Result

The backend returns the fingerprint evidence and Gemini analysis together.

---

## 🛡️ Security

The Gemini API key is stored in a local `.env` file.

```env
GEMINI_API_KEY=your_api_key_here
```

The API key is **never exposed to the frontend**.

The `.env` file is excluded from Git using `.gitignore`.

A `.env.example` file is provided as a safe configuration template.

---

## 🧪 Testing

The backend contains automated API tests.

Run:

```bash
cd backend
python -m pytest tests
```

The project also verifies Python source compilation using:

```bash
python -m py_compile app/main.py app/gemini_service.py app/database.py app/fingerprint.py
```

---

## ▶️ Running the Backend

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## ▶️ Running the Frontend

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend communicates with the FastAPI backend.

---

## 🔬 Example Result

A successful trace can return information such as:

```json
{
  "status": "success",
  "message": "Found candidate match(es)",
  "query_phash": "...",
  "candidates": [
    {
      "id": "ART-001",
      "title": "Original Artwork",
      "creator": "Artist",
      "similarity_score": 91.0,
      "phash_distance": 6
    }
  ],
  "gemini_analysis": {
    "summary": "Strong visual similarities were identified.",
    "similarities": [],
    "differences": [],
    "possible_modifications": []
  },
  "gemini_status": "completed"
}
```

---

## 🎯 Project Goal

GHOST ART aims to make digital artwork provenance more transparent by combining **traditional image fingerprinting with multimodal AI analysis**.

Rather than relying on a single similarity score, the system provides multiple layers of evidence and an explainable visual analysis to help users investigate potential artwork copies and modifications.

---

## ⚠️ Disclaimer

GHOST ART provides technical similarity and visual analysis.

It does **not** make legal determinations about copyright ownership, infringement, or whether an artwork has been stolen.

---

## 👻 GHOST ART

### Trace the original. Understand the copy.

```

**One thing:** once the React frontend is actually finished, we should update the `Project Structure`, frontend setup, and screenshots section to match the **exact files/UI we end up with** rather than claiming anything the frontend doesn't implement yet.
```
