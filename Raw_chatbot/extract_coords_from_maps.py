"""
extract_coords_from_maps.py
============================
Extracts lat/lng from Google Maps short URLs (maps.app.goo.gl/...)
by following the redirect chain and parsing the final URL.

No API key needed. Uses your existing geo_tag data.
Much faster than Nominatim geocoding.

HOW TO RUN:
    cd Raw_chatbot
    python backend/extract_coords_from_maps.py

Takes ~3-5 minutes for 178 offices (1 request/second to be safe).
Safe to re-run — skips offices that already have coordinates.
"""

import json
import re
import time
import requests
from pathlib import Path

JSON_PATH = Path("external_scripts/location_builder/location_builder/output/tehsildar_offices_master.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

# Regex to find @lat,lng in expanded Google Maps URL
# Matches patterns like @19.2307186,72.8567065 or @19.2307,72.8567
COORD_PATTERN = re.compile(r'@(-?\d+\.\d+),(-?\d+\.\d+)')


def expand_and_extract(short_url: str):
    """
    Follow redirects from a maps.app.goo.gl short URL.
    Extract lat/lng from the final expanded URL.
    Returns (lat, lng) or (None, None).
    """
    try:
        # Follow all redirects, get final URL
        r = requests.get(
            short_url,
            headers=HEADERS,
            allow_redirects=True,
            timeout=10
        )

        final_url = r.url
        # Also check all intermediate URLs in redirect chain
        all_urls = [resp.url for resp in r.history] + [final_url]

        for url in all_urls:
            match = COORD_PATTERN.search(url)
            if match:
                lat = float(match.group(1))
                lng = float(match.group(2))
                # Sanity check — Maharashtra is roughly lat 15-22, lng 72-81
                if 15 <= lat <= 25 and 68 <= lng <= 82:
                    return lat, lng

        # If no coords found in URL, try parsing the page content
        # Google Maps sometimes embeds coords in the HTML
        content_match = COORD_PATTERN.search(r.text[:5000])
        if content_match:
            lat = float(content_match.group(1))
            lng = float(content_match.group(2))
            if 15 <= lat <= 25 and 68 <= lng <= 82:
                return lat, lng

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
    to_process   = len(offices) - already_done
    print(f"Already have coords: {already_done}")
    print(f"To process: {to_process}")
    print()

    if to_process == 0:
        print("All offices already have coordinates!")
        return

    success = 0
    failed  = 0
    skipped = 0

    for i, office in enumerate(offices):
        office_id = office.get("office_id", f"office_{i}")

        # Skip if already has coordinates
        if office["center"].get("lat") and office["center"].get("lng"):
            skipped += 1
            continue

        geo_tag = office["center"].get("geo_tag", "")
        if not geo_tag:
            print(f"[{i+1}/{len(offices)}] {office_id} — no geo_tag, skipping")
            failed += 1
            continue

        print(f"[{i+1}/{len(offices)}] {office_id}")
        print(f"    URL: {geo_tag}")

        lat, lng = expand_and_extract(geo_tag)

        if lat and lng:
            office["center"]["lat"] = lat
            office["center"]["lng"] = lng
            print(f"    ✅ {lat}, {lng}")
            success += 1
        else:
            print(f"    ❌ Could not extract coordinates")
            failed += 1

        # Save every 10 offices
        if (i + 1) % 10 == 0:
            JSON_PATH.write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            print(f"    💾 Progress saved ({success} extracted so far)")

        # Small delay to avoid hammering Google
        time.sleep(0.5)

    # Final save
    JSON_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print()
    print("=" * 50)
    print(f"✅ Extracted: {success}")
    print(f"⚠️  Skipped:  {skipped} (already had coords)")
    print(f"❌ Failed:   {failed}")
    print(f"💾 Saved to: {JSON_PATH}")

    if failed > 0:
        print()
        print(f"For the {failed} that failed, run add_coordinates.py")
        print("as a fallback — it uses address-based geocoding for remaining ones.")

    print()
    print("Restart the backend after this completes.")


if __name__ == "__main__":
    main()