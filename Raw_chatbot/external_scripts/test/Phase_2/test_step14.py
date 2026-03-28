


# 1️⃣ Create session
from backend.engine.guidance_engine import GuidanceEngine
from backend.session.session_schema import initialize_session


session = initialize_session(session_id="test123")

# 2️⃣ Provide certificate type (eligibility requirement)
session["certificate_type"] = "income_certificate"

# 3️⃣ Simulate uploaded documents
session["uploaded_documents"] = ["Aadhaar Card",
    "Ration Card",]   # try changing this

# 4️⃣ Run GuidanceEngine
engine = GuidanceEngine(session)
result = engine.process()

print("Result:")
print(result)
print("Workflow:")
print(session["workflow"])



