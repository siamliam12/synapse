# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import codebase

app = FastAPI(
    title="Synapse Core API",
    description="Modular backend engine for AI-driven codebase mapping.",
    version="1.0.0"
)

# Configure CORS for Next.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our modular routers
app.include_router(codebase.router)

@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "Synapse Core API"}