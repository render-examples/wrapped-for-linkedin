from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.router import router

app = FastAPI(title="LinkedIn Wrapped API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api/v1")