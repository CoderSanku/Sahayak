# test_step5_6.py

from backend.engine.eligibility_engine import EligibilityEngine
from backend.engine.profile_validator import validate_user_profile


def print_result(title, result):
    print("\n" + "=" * 50)
    print(f"TEST: {title}")
    print("=" * 50)
    print(result)


def run_tests():
    eligibility_engine = EligibilityEngine()

    # ------------------------------------------
    # Mock Certificate (Schema-Aligned)
    # ------------------------------------------
    certificate = {
        "certificate_id": "income_certificate",
        "eligibility": {
            "min_age": 18,
            "max_age": 60,
            "max_income": 200000,
            "allowed_states": ["Tamil Nadu", "Karnataka"],
            "allowed_castes": ["OBC", "SC", "ST"]
        }
    }

    # ==========================================================
    # STEP 5 TESTS – USER PROFILE VALIDATION
    # ==========================================================

    # 1️⃣ Valid Profile
    valid_user = {
        "personal_info": {"age": 30, "state": "Tamil Nadu"},
        "financial_info": {"annual_income": 150000},
        "category_info": {"caste": "OBC"},
        "submitted_docs": []
    }

    try:
        validate_user_profile(valid_user)
        print_result("Step 5 - Valid Profile", "Validation Passed ✅")
    except Exception as e:
        print_result("Step 5 - Valid Profile", f"Validation Failed ❌ {e}")

    # 2️⃣ Invalid Profile (Missing Sections)
    invalid_user = {
        "personal_info": {"age": 30}
    }

    try:
        validate_user_profile(invalid_user)
        print_result("Step 5 - Invalid Profile", "Validation Unexpectedly Passed ❌")
    except Exception as e:
        print_result("Step 5 - Invalid Profile", f"Correctly Failed ✅ {e}")

    # ==========================================================
    # STEP 6 TESTS – ELIGIBILITY ENGINE
    # ==========================================================

    # 3️⃣ Fully Eligible
    result = eligibility_engine.evaluate_eligibility(certificate, valid_user)
    print_result("Step 6 - Fully Eligible", result)

    # 4️⃣ Age Fail
    age_fail_user = valid_user.copy()
    age_fail_user["personal_info"] = {"age": 16, "state": "Tamil Nadu"}

    result = eligibility_engine.evaluate_eligibility(certificate, age_fail_user)
    print_result("Step 6 - Age Fail", result)

    # 5️⃣ Income Fail
    income_fail_user = valid_user.copy()
    income_fail_user["financial_info"] = {"annual_income": 500000}

    result = eligibility_engine.evaluate_eligibility(certificate, income_fail_user)
    print_result("Step 6 - Income Fail", result)

    # 6️⃣ State Fail
    state_fail_user = valid_user.copy()
    state_fail_user["personal_info"] = {"age": 30, "state": "Kerala"}

    result = eligibility_engine.evaluate_eligibility(certificate, state_fail_user)
    print_result("Step 6 - State Fail", result)

    # 7️⃣ Multiple Failures
    multi_fail_user = {
        "personal_info": {"age": 16, "state": "Kerala"},
        "financial_info": {"annual_income": 500000},
        "category_info": {"caste": "General"},
        "submitted_docs": []
    }

    result = eligibility_engine.evaluate_eligibility(certificate, multi_fail_user)
    print_result("Step 6 - Multiple Failures", result)


if __name__ == "__main__":
    run_tests()