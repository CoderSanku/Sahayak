from fastapi import APIRouter, Query
import requests

router = APIRouter(prefix="/location", tags=["Location"])

services = None


# ── Text-based search (existing) ─────────────────────────────────────────────
@router.get("/nearest-office")
def get_nearest_office(
    taluka:  str | None = Query(default=None),
    village: str | None = Query(default=None),
):
    if services is None:
        return {"error": "Services not initialized"}

    return services.location_service.get_nearest_office(
        taluka=taluka,
        village=village
    )


# ── GPS coordinates search (Approach B) ──────────────────────────────────────
@router.get("/nearest-office-by-coords")
def get_nearest_office_by_coords(
    lat: float = Query(...),
    lon: float = Query(...),
):
    """
    Finds nearest Tehsildar office using Haversine distance.
    Requires add_coordinates.py to have been run first to populate lat/lng.
    """
    if services is None:
        return {"error": "Services not initialized"}

    return services.location_service.get_nearest_office_by_coords(lat, lon)


# ── Reverse geocode proxy (kept for display purposes) ────────────────────────
@router.get("/reverse-geocode")
def reverse_geocode(
    lat: float = Query(...),
    lon: float = Query(...),
):
    """
    Proxy for Nominatim reverse geocoding.
    Nominatim blocks direct browser requests (CORS) so we proxy through backend.
    Returns human-readable area name for display only.
    Actual nearest-office lookup uses /nearest-office-by-coords instead.
    """
    try:
        res = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lon, "format": "json", "addressdetails": 1},
            headers={"User-Agent": "Sahayak-Chatbot/1.0"},
            timeout=8
        )

        if res.status_code != 200:
            return {"error": "Geocoding service unavailable"}

        data = res.json()
        addr = data.get("address", {})

        # Build human-readable area name for display
        area = (
            addr.get("suburb") or
            addr.get("neighbourhood") or
            addr.get("village") or
            addr.get("town") or
            addr.get("city_district") or
            addr.get("county") or
            ""
        )

        return {
            "success": True,
            "area": area,
            "display": data.get("display_name", ""),
        }

    except requests.Timeout:
        return {"error": "Geocoding request timed out"}
    except Exception as e:
        return {"error": str(e)}