"""
STEP 20 – FULL INTEGRATION TEST
Tests:
Route → Service → Orchestrator → Engines → Session → Payload
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def pretty_print(title, data):
    print("\n" + "="*60)
    print(title)
    print("="*60)
    print(json.dumps(data, indent=4))


# -------------------------------------------------------
# 1️⃣ Start Session
# -------------------------------------------------------
print("\n🚀 Starting new session...")
start_response = requests.post(
    f"{BASE_URL}/guidance/start",
    json={"language": "en"}
)

start_data = start_response.json()
pretty_print("Start Session Response", start_data)

session_id = start_data.get("session_id")

if not session_id:
    print("❌ Session creation failed")
    exit()


# -------------------------------------------------------
# 2️⃣ Ask for Certificate
# -------------------------------------------------------
print("\n📄 Requesting Income Certificate...")
continue_response = requests.post(
    f"{BASE_URL}/guidance/continue",
    json={
        "session_id": session_id,
        "user_input": "I want income certificate"
    }
)

print("Status Code:", continue_response.status_code)
print("Raw Text:", continue_response.text)

continue_data = continue_response.json()
pretty_print("Guidance Response", continue_data)


# -------------------------------------------------------
# 3️⃣ Validate Core Keys
# -------------------------------------------------------
required_keys = [
    "certificate",
    "eligibility",
    "documents",
    "workflow",
    "application",
    "language"
]

missing_keys = [k for k in required_keys if k not in continue_data]

if missing_keys:
    print(f"\n❌ Missing keys in payload: {missing_keys}")
else:
    print("\n✅ Structured payload validated")


# -------------------------------------------------------
# 4️⃣ Simulate Next User Input (Optional Flow Test)
# -------------------------------------------------------
print("\n🧾 Submitting dummy document...")
continue_response_2 = requests.post(
    f"{BASE_URL}/guidance/continue",
    json={
        "session_id": session_id,
        "user_input": "I have submitted income proof"
    }
)

continue_data_2 = continue_response_2.json()
pretty_print("Second Guidance Response", continue_data_2)


# -------------------------------------------------------
# 5️⃣ Debug Session Check
# -------------------------------------------------------
print("\n🔍 Checking Session State...")
debug_response = requests.post(
    f"{BASE_URL}/guidance/debug",
    json={"session_id": session_id}
)

debug_data = debug_response.json()
pretty_print("Session Debug Data", debug_data)



print("\n🎉 STEP 20 INTEGRATION TEST COMPLETED")