import os
import requests
from fastapi import APIRouter, Query
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")

@router.get("/search")
def search_jobs(
    role: str = Query("Software Engineer"),
    location: str = Query("remote"),
    country: str = Query("us")
):
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return {"error": "Adzuna API keys are missing in backend/.env"}

    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"

    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "what": role,
        "where": location,
        "results_per_page": 10,
        "content-type": "application/json",
    }

    response = requests.get(url, params=params, timeout=15)

    if response.status_code != 200:
        return {
            "error": "Failed to fetch jobs from Adzuna",
            "status_code": response.status_code,
            "details": response.text,
        }

    data = response.json()

    jobs = []

    for item in data.get("results", []):
        jobs.append({
            "id": item.get("id"),
            "company": item.get("company", {}).get("display_name", "Unknown Company"),
            "role": item.get("title", "Unknown Role"),
            "location": item.get("location", {}).get("display_name", "Unknown Location"),
            "description": item.get("description", ""),
            "url": item.get("redirect_url", ""),
            "salary_min": item.get("salary_min"),
            "salary_max": item.get("salary_max"),
            "created": item.get("created"),
            "source": "Adzuna",
        })

    return {
        "count": len(jobs),
        "jobs": jobs,
    }