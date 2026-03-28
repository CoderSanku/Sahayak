import json
import os
import math
import requests


def haversine(lat1, lon1, lat2, lon2):
    """
    Returns distance in kilometres between two lat/lng points.
    Uses the Haversine formula.
    """
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


class LocationService:

    def __init__(self):
        BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))

        self.data_path = os.path.join(
            BASE_DIR,
            "external_scripts",
            "location_builder",
            "location_builder",
            "output",
            "tehsildar_offices_master.json"
        )

        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.offices = data.get("offices", [])
        except Exception as e:
            print(f"[ERROR] Failed to load location data: {e}")
            self.offices = []

    # ── Format office for response ──────────────────────────────────────────
    def _format_office(self, office, distance_km=None):
        result = {
            "office_id":  office.get("office_id"),
            "taluka":     office["taluka"]["name"]["en"],
            "village":    office["village"]["name"]["en"],
            "address":    office["center"]["address"]["en"],
            "incharge":   office["center"]["incharge_name"]["en"],
            "contact":    office["center"]["contact_number"],
            "map": {
                "label": "Open in Google Maps",
                "url":   office["center"]["geo_tag"]
            }
        }
        if distance_km is not None:
            result["distance_km"] = round(distance_km, 2)
        return result

    # ── Geocoding: convert typed location to coordinates ────────────────────────
    def _geocode_location(self, location_text):
        """
        Convert typed location (e.g., 'Kalyan, Mumbai') to lat/lng using Nominatim.
        Returns (lat, lon) or None if not found.
        """
        try:
            # Add 'Maharashtra, India' to improve accuracy for Mumbai region
            search_text = f"{location_text}, Maharashtra, India"
            
            response = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": search_text,
                    "format": "json",
                    "limit": 1,
                },
                headers={"User-Agent": "Sahayak-Chatbot/1.0"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return float(data[0]["lat"]), float(data[0]["lon"])
        except Exception as e:
            print(f"[ERROR] Geocoding failed: {e}")
        
        return None

    # ── Text-based search: geocode then find nearest office ────────────────────
    def _text_search(self, taluka=None, village=None):
        taluka  = taluka.lower().strip()  if taluka  else None
        village = village.lower().strip() if village else None

        # First try exact match in our data
        for office in self.offices:
            t_name = office["taluka"]["name"]["en"].lower().strip()
            v_name = office["village"]["name"]["en"].lower().strip()

            if taluka and village:
                if taluka in t_name and village in v_name:
                    return self._format_office(office)
            elif taluka:
                if taluka in t_name:
                    return self._format_office(office)
            elif village:
                if village in v_name:
                    return self._format_office(office)

        # If no exact match in our data, try geocoding the typed location
        # and find nearest office using Haversine (same as GPS!)
        if taluka:
            search_location = taluka
            if village:
                search_location = f"{village}, {taluka}"
            
            coords = self._geocode_location(search_location)
            if coords:
                user_lat, user_lon = coords
                # Use same distance-based search as GPS
                result = self._distance_search(user_lat, user_lon)
                if result and "message" not in result:
                    result["note"] = f"Found nearest office to '{taluka}' using location search"
                    return result

        return None

    # ── Distance-based search (used when user gives GPS coordinates) ─────────
    def _distance_search(self, user_lat, user_lon):
        """
        Finds the nearest office by straight-line distance using Haversine.
        Only works for offices that have lat/lng in the JSON.
        Falls back to first office in list if none have coordinates.
        """
        best_office   = None
        best_distance = float("inf")

        for office in self.offices:
            lat = office["center"].get("lat")
            lng = office["center"].get("lng")

            if lat is None or lng is None:
                continue

            dist = haversine(user_lat, user_lon, lat, lng)

            if dist < best_distance:
                best_distance = dist
                best_office   = office

        if best_office:
            return self._format_office(best_office, distance_km=best_distance)

        return {"message": "No office coordinates available. Please run add_coordinates.py first."}

    # ── Public API ───────────────────────────────────────────────────────────
    def get_nearest_office(self, user_input=None, taluka=None, village=None):
        """Text-based search: first exact match, then geocode + distance search."""
        if not taluka and not village and user_input:
            taluka, village = self._extract_location(user_input)

        result = self._text_search(taluka=taluka, village=village)
        if result:
            return result
        
        return {"message": "Could not find office. Please try a different location."}

    def get_nearest_office_by_coords(self, lat: float, lon: float):
        """Distance-based search using GPS coordinates."""
        return self._distance_search(lat, lon)

    # ── Extract taluka/village from free text ────────────────────────────────
    def _extract_location(self, user_input):
        if not user_input:
            return None, None
        text = user_input.lower()
        if " in " in text:
            location_part = text.split(" in ")[1]
            if "," in location_part:
                village, taluka = location_part.split(",", 1)
                return taluka.strip(), village.strip()
            else:
                return location_part.strip(), None
        return None, None