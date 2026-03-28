class EligibilityEngine:
    """
    Handles eligibility validation logic for certificates.
    Deterministic and schema-aligned.
    """

    def check(self, session_data: dict) -> dict:
        """
        Evaluate eligibility based on session data.
        """

        session_data = session_data or {}

        certificate = session_data.get("selected_certificate", {})
        user_profile = session_data.get("user_profile", {})

        required_fields = certificate.get("eligibility_rules", [])
        missing_rules = []

        for field in required_fields:
            if not user_profile.get(field):
                missing_rules.append(field)

        if missing_rules:
            return {
                "eligible": False,
                "reason": f"Missing required eligibility fields: {missing_rules}",
                "certificate_id": None
            }

        return {
            "eligible": True,
            "reason": None,
            "certificate_id": certificate.get("certificate_id")
        }

    def evaluate_eligibility(self, certificate, user_profile):

        rules = certificate.get("eligibility", {})
        reasons = []

        personal = user_profile.get("personal_info", {})
        financial = user_profile.get("financial_info", {})
        category = user_profile.get("category_info", {})

        age = personal.get("age")
        income = financial.get("annual_income")
        state = personal.get("state")
        caste = category.get("caste")

        # --- AGE RULES ---
        min_age = rules.get("min_age")
        max_age = rules.get("max_age")

        if min_age is not None and age is not None:
            if age < min_age:
                reasons.append("MIN_AGE_NOT_MET")

        if max_age is not None and age is not None:
            if age > max_age:
                reasons.append("MAX_AGE_EXCEEDED")

        # --- INCOME RULE ---
        max_income = rules.get("max_income")

        if max_income is not None and income is not None:
            if income > max_income:
                reasons.append("INCOME_LIMIT_EXCEEDED")

        # --- STATE RULE ---
        allowed_states = rules.get("allowed_states")

        if allowed_states and state is not None:
            if state not in allowed_states:
                reasons.append("STATE_NOT_ALLOWED")

        # --- CASTE RULE ---
        allowed_castes = rules.get("allowed_castes")

        if allowed_castes and caste is not None:
            if caste not in allowed_castes:
                reasons.append("CASTE_NOT_ELIGIBLE")

        return {
            "is_eligible": len(reasons) == 0,
            "reasons": reasons
        }