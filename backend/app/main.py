from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from . import models
from .routes import auth, students, payments

# Create database tables automatically
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Student Registry & Auth API",
    description="Backend-First API with JWT Authentication and PostgreSQL database.",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins (e.g. ["http://localhost:5173"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include sub-routers for clean architecture
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {
        "message": "SMS Razorpay Backend is Running 🚀"
    }