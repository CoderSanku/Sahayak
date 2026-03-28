# TEST SCRIPT - 1
# from backend.engine.certificate_engine import CertificateEngine

# session_state = {
#     "active_certificate_id": "income_certificate",
#     "user_profile": {}
# }

# # Add ONE mandatory document (exact name from output)
# extracted_input = {
#     "name": "Rafzz",
#     "age": 22,
#     "submitted_docs": [
#         "Income Tax Statement / Form 16"
#     ]
# }

# engine = CertificateEngine()

# response, updated_session = engine.process(
#     session_state=session_state,
#     extracted_input=extracted_input
# )

# print("\n=== TEST 1: ONE MANDATORY PROVIDED ===")
# print("\n=== RESPONSE ===")
# print(response)

# print("\n=== UPDATED SESSION ===")
# print(updated_session)

# TEST SCRIPT - 2
# from backend.engine.certificate_engine import CertificateEngine

# session_state = {
#     "active_certificate_id": "income_certificate",
#     "user_profile": {}
# }

# # Add ALL mandatory documents (from previous output)
# extracted_input = {
#     "name": "Rafzz",
#     "age": 22,
#     "submitted_docs": [
#         "Income Tax Statement / Form 16",
#         "Pay Certificate (Current Financial Year)",
#         "Village Revenue Officer Income Report"
#     ]
# }

# engine = CertificateEngine()

# response, updated_session = engine.process(
#     session_state=session_state,
#     extracted_input=extracted_input
# )

# print("\n=== TEST 2: ALL MANDATORY PROVIDED ===")
# print("\n=== RESPONSE ===")
# print(response)

# print("\n=== UPDATED SESSION ===")
# print(updated_session)

# TEST SCRIPT - 3
from backend.engine.certificate_engine import CertificateEngine

session_state = {
    "active_certificate_id": "income_certificate",
    "user_profile": {}
}

# Add ALL mandatory + ALL required
extracted_input = {
    "name": "Rafzz",
    "age": 22,
    "submitted_docs": [
        # Mandatory
        "Income Tax Statement / Form 16",
        "Pay Certificate (Current Financial Year)",
        "Village Revenue Officer Income Report",

        # Required
        "Aadhaar Card",
        "Ration Card",
        "Electricity Bill",
        "Residence Proof",
        "Affidavit",
        "Self Declaration"
    ]
}

engine = CertificateEngine()

response, updated_session = engine.process(
    session_state=session_state,
    extracted_input=extracted_input
)

print("\n=== TEST 3: ALL DOCUMENTS PROVIDED ===")
print("\n=== RESPONSE ===")
print(response)

print("\n=== UPDATED SESSION ===")
print(updated_session)
