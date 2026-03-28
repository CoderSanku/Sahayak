import pandas as pd
import json
import re
from pathlib import Path

# ---------- CONFIG ----------
EN_FILE = Path("../source_data/locations_en.xlsx")
MR_FILE = Path("../source_data/locations_mr.xlsx")
OUTPUT_FILE = Path("../output/tehsildar_offices_master.json")

STATE_NAME = "Maharashtra"
DEPARTMENT_NAME = "Tehsildar Office"

# ---------- HELPERS ----------
def slugify(text):
    text = str(text).lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    return re.sub(r"\s+", "_", text)

def normalize_email(email):
    if not isinstance(email, str):
        return ""
    return email.replace("[dot]", ".").replace(" ", "").strip()

# ---------- MAIN ----------
def merge_excels():
    df_en = pd.read_excel(EN_FILE)
    df_mr = pd.read_excel(MR_FILE)

    # Use geo_tag as merge key
    merged_df = pd.merge(
        df_en,
        df_mr,
        on="geo_tag",
        suffixes=("_en", "_mr"),
        how="inner"
    )

    offices = []

    for _, row in merged_df.iterrows():
        taluka_id = slugify(row["taluka_en"])
        village_id = slugify(row["village_en"])

        office = {
            "office_id": f"{village_id}_tehsildar",
            "taluka": {
                "id": taluka_id,
                "name": {
                    "en": row["taluka_en"],
                    "mr": row["taluka_mr"]
                }
            },
            "village": {
                "id": village_id,
                "name": {
                    "en": row["village_en"],
                    "mr": row["village_mr"]
                }
            },
            "center": {
                "incharge_name": {
                    "en": row["incharge_name_en"],
                    "mr": row["incharge_name_mr"]
                },
                "address": {
                    "en": row["address_en"],
                    "mr": row["address_mr"]
                },
                "geo_tag": row["geo_tag"],
                "contact_number": str(row["contact_number_en"]),
                "email_id": normalize_email(row["email_id_en"])
            }
        }

        offices.append(office)

    master_json = {
        "metadata": {
            "state": STATE_NAME,
            "department": DEPARTMENT_NAME,
            "total_centers": len(offices)
        },
        "offices": offices
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(master_json, f, ensure_ascii=False, indent=2)

    print("✅ Master location JSON generated")
    print(f"📊 Total offices merged: {len(offices)}")


if __name__ == "__main__":
    merge_excels()
