"""
Step 17 – Optional Suggestion Layer Test Script
"""

from backend.engine.certificate_engine import CertificateEngine


def print_divider(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def build_base_profile(submitted_docs, language="en"):
    """
    Validator-safe complete profile.
    """

    return {
        "active_certificate_id": "income_certificate",
        "language": language,
        "user_profile": {
            "personal_info": {
                "full_name": "Test User",
                "age": 30,
                "gender": "male",
                "state": "Test State"  # Required by validator
            },
            "contact_info": {
                "mobile": "9999999999",
                "email": "test@example.com"
            },
            "address_info": {
                "district": "Test District",
                "state": "Test State"
            },
            "financial_info": {
                "annual_income": 250000,
                "employment_type": "salaried"
            },
            "category_info": {          # ✅ FIX ADDED
                "caste": "OBC"
            },
            "submitted_docs": submitted_docs
        }
    }


def test_complete_workflow():
    print_divider("TEST 1: COMPLETE WORKFLOW (Suggestions SHOULD appear)")

    session_state = build_base_profile([
        "income_tax_statement_form_16",
        "pay_certificate_current_financial_year",
        "village_revenue_officer_income_report",
        "aadhaar_card",
        "ration_card",
        "electricity_bill",
        "residence_proof",
        "general_affidavit",
        "self_declaration"
    ])

    engine = CertificateEngine()
    response, _ = engine.process(session_state, {})

    print("Workflow Complete:", response["workflow"]["is_complete"])
    print("Can Apply:", response["application"]["can_apply"])
    print("Suggestions:", response["suggestions"])

    assert response["workflow"]["is_complete"] is True
    assert response["application"]["can_apply"] is True
    assert len(response["suggestions"]) > 0

    print("✅ PASS")


def test_incomplete_workflow():
    print_divider("TEST 2: INCOMPLETE WORKFLOW (Suggestions SHOULD NOT appear)")

    session_state = build_base_profile([
        "income_tax_statement_form_16"
    ])

    engine = CertificateEngine()
    response, _ = engine.process(session_state, {})

    print("Workflow Complete:", response["workflow"]["is_complete"])
    print("Suggestions:", response["suggestions"])

    assert response["workflow"]["is_complete"] is False
    assert response["suggestions"] == []

    print("✅ PASS")


def test_multilingual_suggestions():
    print_divider("TEST 3: MULTILINGUAL CHECK (Hindi)")

    session_state = build_base_profile([
        "income_tax_statement_form_16",
        "pay_certificate_current_financial_year",
        "village_revenue_officer_income_report",
        "aadhaar_card",
        "ration_card",
        "electricity_bill",
        "residence_proof",
        "general_affidavit",
        "self_declaration"
    ], language="hi")

    engine = CertificateEngine()
    response, _ = engine.process(session_state, {})

    print("Language:", response["language"])
    print("Certificate Name:", response["certificate"]["certificate_name"])
    print("Suggestions:", response["suggestions"])

    assert response["language"] == "hi"
    assert len(response["suggestions"]) > 0

    print("✅ PASS")


if __name__ == "__main__":
    test_complete_workflow()
    test_incomplete_workflow()
    test_multilingual_suggestions()

    print_divider("ALL STEP 17 TESTS PASSED SUCCESSFULLY")