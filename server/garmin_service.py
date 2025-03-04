from garminconnect import (
    Garmin,
    GarminConnectConnectionError,
    GarminConnectTooManyRequestsError,
    GarminConnectAuthenticationError
)
import asyncio
import json
from datetime import datetime, timedelta

class GarminService:
    def __init__(self):
        self.client = None
        
    async def authenticate(self, email: str, password: str) -> bool:
        try:
            self.client = Garmin(email, password)
            self.client.login()
            return True
        except (
            GarminConnectConnectionError,
            GarminConnectAuthenticationError,
            GarminConnectTooManyRequestsError
        ) as err:
            print(f"Authentication error: {err}")
            return False

    async def get_activities(self, start_date: datetime, end_date: datetime = None):
        if not end_date:
            end_date = datetime.now()
            
        try:
            activities = self.client.get_activities_by_date(
                start_date.strftime("%Y-%m-%d"),
                end_date.strftime("%Y-%m-%d")
            )
            
            return [{
                'activity_id': activity.get('activityId'),
                'name': activity.get('activityName'),
                'type': activity.get('activityType').get('typeKey'),
                'date': activity.get('startTimeLocal'),
                'duration': activity.get('duration'),
                'distance': activity.get('distance'),
                'calories': activity.get('calories'),
                'avg_hr': activity.get('averageHR'),
                'max_hr': activity.get('maxHR'),
                'training_load': activity.get('trainingLoadPeak')
            } for activity in activities]
            
        except Exception as err:
            print(f"Error fetching activities: {err}")
            return []
