from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application
app = FastAPI(
    title="Ghost Art API",
    description="Backend API for Ghost Art MVP",
    version="0.1.0",
)

# Enable CORS for React frontend communication during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all HTTP headers
)


@app.get("/health")
def health_check():
    """Health endpoint confirming that the API server is running."""
    return {
        "status": "ok",
        "message": "Ghost Art API is running"
    }


@app.post("/register")
def register_artwork():
    """Placeholder endpoint for artwork registration (logic to be implemented in future parts)."""
    return {
        "status": "placeholder",
        "message": "Artwork registration endpoint placeholder"
    }


@app.post("/trace")
def trace_artwork():
    """Placeholder endpoint for artwork tracing (logic to be implemented in future parts)."""
    return {
        "status": "placeholder",
        "message": "Artwork trace endpoint placeholder"
    }
