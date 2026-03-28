"""
add_coordinates.py
==================
One-time script — run this ONCE to add lat/lng to all 178 offices.

HOW TO RUN:
    cd Raw_chatbot
    python add_coordinates.py

It reads tehsildar_offices_master.json, calls Nominatim to geocode
each office address, and saves lat/lng back into the same JSON file.

Takes ~6-8 minutes (1 request/second to respect Nominatim rate limit).
Safe to re-run — skips offices that already have coordinates.
"""

import json
import time
import requests
from pathlib import Path

JSON_PATH = Path("external_scripts/location_builder/location_builder/output/tehsildar_offices_master.json")

# Nominatim requires a real User-Agent
HEADERS = {"User-Agent": "Sahayak-Chatbot-Geocoder/1.0 (final-year-project)"}

def geocode(address: str) -> tuple:
    """Returns (lat, lng) or (None, None) on failure."""
    try:
        res = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": address + ", Mumbai, Maharashtra, India",
                "format": "json",
                "limit": 1,
                "addressdetails": 0,
            },
            headers=HEADERS,
            timeout=10,
        )
        results = res.json()
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
        return None, None
    except Exception as e:
        print(f"    ERROR: {e}")
        return None, None


def main():
    print(f"Loading {JSON_PATH}...")
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    offices = data.get("offices", [])
    print(f"Total offices: {len(offices)}")

    already_done = sum(1 for o in offices if o["center"].get("lat"))
    print(f"Already geocoded: {already_done}")
    print(f"To geocode: {len(offices) - already_done}")
    print()

    success = 0
    failed  = 0
    skipped = 0

    for i, office in enumerate(offices):
        office_id = office.get("office_id", f"office_{i}")

        # Skip if already has coordinates
        if office["center"].get("lat") and office["center"].get("lng"):
            skipped += 1
            continue

        address = office["center"]["address"]["en"]
        print(f"[{i+1}/{len(offices)}] {office_id}")
        print(f"    Address: {address[:70]}...")

        lat, lng = geocode(address)

        if lat and lng:
            office["center"]["lat"] = lat
            office["center"]["lng"] = lng
            print(f"    ✅ {lat}, {lng}")
            success += 1
        else:
            # Try with just village + taluka + Mumbai as fallback
            taluka  = office["taluka"]["name"]["en"]
            village = office["village"]["name"]["en"]
            fallback = f"{village}, {taluka}, Mumbai, Maharashtra"
            print(f"    Retrying with: {fallback}")

            lat, lng = geocode(fallback)
            if lat and lng:
                office["center"]["lat"] = lat
                office["center"]["lng"] = lng
                print(f"    ✅ (fallback) {lat}, {lng}")
                success += 1
            else:
                print(f"    ❌ Could not geocode")
                failed += 1

        # Save after every 10 offices so progress is not lost on crash
        if (i + 1) % 10 == 0:
            JSON_PATH.write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            print(f"    💾 Progress saved ({i+1} processed)")

        # Nominatim rate limit: max 1 request/second
        time.sleep(1.1)

    # Final save
    JSON_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print()
    print("=" * 50)
    print(f"✅ Success:  {success}")
    print(f"⚠️  Skipped:  {skipped} (already had coords)")
    print(f"❌ Failed:   {failed}")
    print(f"💾 Saved to: {JSON_PATH}")
    print()
    print("Now restart the backend — it will load the updated JSON with coordinates.")


if __name__ == "__main__":
    main()