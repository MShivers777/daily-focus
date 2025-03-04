const GARMIN_API_URL = process.env.NEXT_PUBLIC_GARMIN_API_URL || 'http://localhost:8000';

export async function authenticateGarmin(email, password) {
    const response = await fetch(`${GARMIN_API_URL}/api/garmin/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error('Garmin authentication failed');
    }

    return response.json();
}

export async function fetchGarminActivities(days = 7) {
    const response = await fetch(`${GARMIN_API_URL}/api/garmin/activities/${days}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch Garmin activities');
    }

    return response.json();
}
