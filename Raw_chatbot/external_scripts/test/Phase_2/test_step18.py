# test_step18.py
import json
from backend.session.session_schema import initialize_session
from backend.engine.questioning_engine import QuestioningEngine
from backend.engine.followup.followup_decision_engine import FollowupDecisionEngine
from backend.output.payload_builder import build_response_payload
from backend.engine.utils import enforce_language_integrity

def run_step18_test():
    # Mock certificate example (IDs match existing templates)
    mock_certificate = {
        "certificate_id": "income_certificate",
        "certificate_name": {
            "en": "Income Certificate",
            "hi": "आय प्रमाणपत्र",
            "mr": "उत्पन्न प्रमाणपत्र"
        },
        "issuing_authority": {
            "en": "Tehsildar Office",
            "hi": "तहसीलदार कार्यालय",
            "mr": "तहसीलदार कार्यालय"
        },
        "documents": {
            "mandatory": [
                {"doc_id": "income_certificate", "name": {"en": "Income Certificate", "hi": "आय प्रमाणपत्र", "mr": "उत्पन्न प्रमाणपत्र"}},
                {"doc_id": "pan_card", "name": {"en": "PAN Card", "hi": "पैन कार्ड", "mr": "पॅन कार्ड"}}
            ],
            "required": [
                {"doc_id": "aadhaar_card", "name": {"en": "Aadhaar Card", "hi": "आधार कार्ड", "mr": "आधार कार्ड"}}
            ],
            "optional": [
                {"doc_id": "bank_statement", "name": {"en": "Bank Statement", "hi": "बँक स्टेटमेंट", "mr": "बँक स्टेटमेंट"}}
            ]
        }
    }

    # Mock eligibility and missing docs
    mock_eligibility = {"is_eligible": True, "reason": None}
    mock_missing_docs = {
        "mandatory_missing": ["income_certificate"],  # matches template
        "required_missing": [],
        "optional_missing": []
    }
    mock_user_docs = ["pan_card"]  # matches template

    # Languages to test
    languages = ["en", "hi", "mr"]

    # Initialize engines
    qe = QuestioningEngine()
    fde = FollowupDecisionEngine()

    for lang in languages:
        print(f"\n=== Testing session language: {lang} ===")

        # Initialize session
        session_state = initialize_session(session_id=f"test_{lang}", language=lang)

        session_state["workflow"] = mock_missing_docs

        # Build payload
        payload = build_response_payload(
            certificate=mock_certificate,
            eligibility_result=mock_eligibility,
            missing_docs=mock_missing_docs,
            user_docs=mock_user_docs,
            language=session_state["language"]
        )

        # Enforce language integrity
        try:
            enforce_language_integrity(session_state, payload)
            print(f"Payload language enforcement: PASS ({payload['language']})")
        except RuntimeError as e:
            print(f"Payload language enforcement: FAIL ({e})")

        # Generate follow-up decision
        followup_decision = fde.decide(session_state)
        followup_decision["language"] = session_state["language"]  # enforce session language

        # Generate question
        question = qe.generate_question(followup_decision, session_state)
        if question:
            print(f"Question generated ({lang}): {question}")
        else:
            print(f"Question generation ({lang}): None / template missing")

        # Verify language in certificate name and issuing authority
        cert_name = payload["certificate"]["certificate_name"]
        authority = payload["certificate"]["issuing_authority"]
        print(f"Certificate name: {cert_name} | Issuing authority: {authority}")

    print("\n✅ Step 18 Multilingual continuity test completed.")

    print("DEBUG followup_decision:", followup_decision)

# 🔹 Ensure script runs when executed directly
if __name__ == "__main__":
    run_step18_test()