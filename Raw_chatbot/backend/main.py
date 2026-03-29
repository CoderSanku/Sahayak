import sys
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from services.service_container import ServiceContainer
from routes import guidance_routes, voice_routes, location_routes
from routes.sample_routes import router as sample_router
from routes.chat import router as chat_router
from routes.status_routes import router as status_router

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

# Create ONE global container
services = ServiceContainer()

# Inject into routes
guidance_routes.services = services
voice_routes.services = services
location_routes.services = services

# Register Routers
app.include_router(guidance_routes.router)
app.include_router(voice_routes.router)
app.include_router(location_routes.router)
app.include_router(sample_router)
app.include_router(chat_router)
app.include_router(status_router)

# Static file serving
app.mount("/static", StaticFiles(directory="assets"), name="static")
