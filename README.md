# 👻 Ghost Art

### AI-Powered Artwork Provenance & Ownership Verification

Ghost Art is an AI-powered artwork provenance system designed to help artists trace how their original artwork is reused, modified, or reposted across digital platforms.

The system combines **Google Gemini**, **visual similarity analysis**, **provenance graphs**, **cryptographic commitments**, and **Zero-Knowledge (ZK) proofs** to create a privacy-preserving way of establishing the relationship between an artist's original work and its online derivatives.

---

## 🚨 The Problem

Digital artwork can be:

* Cropped or resized
* Filtered or recolored
* Heavily edited
* Reposted without attribution
* Modified using AI
* Combined with other artwork

Traditional reverse-image search often struggles when an artwork has been significantly modified.

Artists need a way to answer:

> **"Is this artwork derived from my original work, and can I prove that I own the original without publicly revealing it?"**

---

## 💡 Our Solution

Ghost Art creates a **digital provenance trail** for artwork.

An artist can register an original artwork and receive a cryptographic commitment representing it.

When another artwork is submitted for analysis, Ghost Art:

1. Analyzes the artwork using **Google Gemini**
2. Extracts visual and semantic characteristics
3. Performs visual similarity analysis
4. Compares the submitted artwork against registered originals
5. Identifies possible transformations such as cropping, recoloring, filtering, or AI modification
6. Builds a provenance relationship between the original and derivative
7. Uses cryptographic commitments and ZK concepts to support privacy-preserving ownership verification

---

## ✨ Key Features

### 🎨 Artwork Analysis

Upload an artwork and analyze:

* Visual composition
* Objects and subjects
* Style
* Color characteristics
* Semantic content
* Possible transformations

### 🔍 Similarity Detection

Compare two artworks and generate a similarity assessment based on their visual characteristics.

The system can identify relationships even when the derivative has been modified.

### 🧬 Provenance Graph

Ghost Art represents artwork relationships as a graph:

```text
Original Artwork
       │
       ├── Crop
       │
       ├── Recolor
       │
       ├── Filter
       │
       └── AI Modification
              │
              ▼
        Detected Derivative
```

This creates an understandable history of how artwork can evolve.

### 🔐 Privacy-Preserving Ownership

Instead of requiring an artist to publicly expose their original artwork, Ghost Art uses a **cryptographic commitment** concept.

A commitment can act as a digital fingerprint of the original while keeping the underlying private data hidden.

### 🕵️ Zero-Knowledge Verification

Ghost Art incorporates the concept of **Zero-Knowledge proofs** to allow an artist to demonstrate possession of the original corresponding to a registered commitment without directly revealing the private original.

---

## 🤖 Role of Google Gemini

Google Gemini is a core part of the analysis pipeline.

Gemini is used for multimodal artwork understanding, including:

* Image interpretation
* Object and subject identification
* Semantic description
* Style and composition analysis
* Transformation reasoning
* Comparing characteristics between artworks
* Generating human-readable analysis

Gemini's output is combined with the application's own similarity/provenance logic rather than treating the LLM response alone as the final proof of ownership.

---

## 🏗️ System Architecture

```text
                    ┌───────────────────┐
                    │     Frontend      │
                    │   Ghost Art UI    │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      FastAPI      │
                    │    Backend API     │
                    └─────────┬─────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
       ┌─────────────────┐         ┌─────────────────┐
       │   Gemini API    │         │ Similarity /    │
       │ Artwork Analysis│         │ Provenance Logic│
       └────────┬────────┘         └────────┬────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
                    ┌───────────────────┐
                    │ Provenance /      │
                    │ Artwork Records   │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Cryptographic     │
                    │ Commitments / ZK   │
                    │ Verification Layer │
                    └───────────────────┘
```

---

## 🧰 Tech Stack

### Frontend

* React
* Vite
* TypeScript
* Modern responsive UI

### Backend

* Python
* FastAPI
* REST APIs

### AI

* Google Gemini API
* Multimodal image understanding

### Analysis

* Image similarity analysis
* Visual feature comparison
* Provenance graph representation

### Security & Privacy

* Cryptographic commitments
* Zero-Knowledge proof concepts

---

## 🔄 Application Flow

```text
Artist
  │
  ▼
Upload Original Artwork
  │
  ▼
Artwork Analysis
  │
  ▼
Generate Digital Commitment
  │
  ▼
Register Artwork
  │
  ▼
Derivative Artwork Found
  │
  ▼
Analyze Derivative
  │
  ▼
Compare With Registered Artwork
  │
  ▼
Similarity + Transformation Analysis
  │
  ▼
Create Provenance Relationship
  │
  ▼
Ownership Verification
```

---

## 📡 API Overview

The backend exposes endpoints for artwork analysis and comparison.

### Analyze Artwork

```http
POST /analyze-artwork
```

Accepts an artwork and returns an AI-generated analysis containing relevant visual and semantic information.

### Compare Artworks

```http
POST /compare
```

Compares two artworks and returns similarity/provenance-related analysis.

Example conceptual response:

```json
{
  "similarity": 91,
  "relationship": "Likely derivative",
  "transformations": [
    "Cropping",
    "Color modification",
    "Filtering"
  ]
}
```

> The similarity value is generated by the application's analysis pipeline and should be treated as an analytical signal, not absolute legal proof of ownership.

---

## 🧪 Demo Scenario

### Original

An artist registers an original digital artwork.

Ghost Art creates a cryptographic commitment associated with the artwork.

### Derivative

Someone uploads a modified version:

```text
Original
   ↓
Crop
   ↓
Color Change
   ↓
AI Enhancement
   ↓
Reposted Artwork
```

Ghost Art analyzes the derivative and compares it with registered artwork.

The system can then present:

* Similarity assessment
* Detected transformations
* Related original artwork
* Provenance relationship
* Ownership-verification status

---

## 📁 Project Structure

```text
ghost-art/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── routes/
│   ├── services/
│   └── requirements.txt
│
├── README.md
└── .env
```

> The exact structure may evolve as the prototype develops.

---

## ⚙️ Environment Variables

Create a `.env` file in the backend:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Never commit API keys or other secrets to GitHub.

---

## 🚀 Running Locally

### 1. Clone the repository

```bash
git clone <repository-url>
cd ghost-art
```

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The FastAPI server will be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

---

## 🔒 Security Considerations

Ghost Art is designed around privacy-preserving ownership verification.

Important principles:

* Original artwork does not need to be publicly exposed for commitment-based verification.
* API keys are stored using environment variables.
* Cryptographic commitments can provide tamper-evident references.
* ZK proofs can allow verification without revealing the underlying private information.

The current hackathon prototype demonstrates the architecture and workflow; production deployment would require a formally implemented and audited ZK system, secure storage, authentication, and stronger provenance infrastructure.

---

## 🎯 Hackathon MVP

The prototype focuses on demonstrating the complete core flow:

```text
Upload
  ↓
Gemini Analysis
  ↓
Artwork Comparison
  ↓
Similarity Detection
  ↓
Transformation Detection
  ↓
Provenance Visualization
  ↓
Ownership Verification Concept
```

The goal is to demonstrate how AI and privacy-preserving cryptography can work together to address digital artwork provenance.

---

## 🔮 Future Scope

* Automatic discovery of artwork reposts across platforms
* Larger-scale visual similarity search
* Persistent provenance graphs
* On-chain artwork commitments
* Production-grade ZK proof circuits
* Artist identity and authentication
* Browser extension for detecting derivative artwork
* Marketplace and social-platform integrations
* Advanced AI-generated-content detection
* Decentralized provenance infrastructure

---

## 👥 Team

**Ghost Art**

Built for a hackathon to explore the intersection of:

**AI × Digital Art × Provenance × Privacy × Cryptography**

---

## 📜 Disclaimer

Ghost Art is a research and hackathon prototype. Similarity scores and AI-generated analyses are indicators for investigation and do not by themselves establish legal ownership, copyright infringement, or authorship.

---

## ⭐ Vision

> **Make digital art traceable without making artists sacrifice their privacy.**

Ghost Art aims to give creators a way to understand where their work goes, how it changes, and how ownership can be verified without unnecessarily exposing the original.