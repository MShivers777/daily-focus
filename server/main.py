from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from garmin_service import GarminService
from pydantic import BaseModel

app = FastAPI()
garmin = GarminService()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GarminCredentials(BaseModel):
    email: str
    password: str

@app.post("/api/garmin/auth")
async def authenticate(credentials: GarminCredentials):
    success = await garmin.authenticate(credentials.email, credentials.password)
    if not success:
        raise HTTPException(401, "Authentication failed")
    return {"status": "authenticated"}

@app.get("/api/garmin/activities/{days}")
async def get_recent_activities(days: int):
    start_date = datetime.now() - timedelta(days=days)
    activities = await garmin.get_activities(start_date)
    return activities
