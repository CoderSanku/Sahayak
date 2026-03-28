class ApplicationEngine:
    """
    Determines whether user can submit application
    and calculates application readiness status.
    """

    @staticmethod
    def evaluate_application(missing_docs: dict, eligibility_result: dict):
        """
        Returns deterministic application readiness state.
        """

        # -------------------------
        # Normalize inputs
        # -------------------------
        missing_docs = missing_docs or {}
        eligibility_result = eligibility_result or {}

        mandatory_missing = missing_docs.get("mandatory_missing", []) or []
        required_missing = missing_docs.get("required_missing", []) or []

        is_eligible = bool(eligibility_result.get("is_eligible", False))

        total_required_missing = len(mandatory_missing) + len(required_missing)

        # -------------------------
        # Decision Logic
        # -------------------------

        if not is_eligible:
            return {
                "can_apply": False,
                "status": "blocked_due_to_ineligibility",
                "completion_percentage": 0
            }

        if len(mandatory_missing) > 0:
            return {
                "can_apply": False,
                "status": "missing_mandatory_documents",
                "completion_percentage": 50
            }

        if total_required_missing > 0:
            return {
                "can_apply": False,
                "status": "pending_required_documents",
                "completion_percentage": 75
            }

        return {
            "can_apply": True,
            "status": "ready_for_submission",
            "completion_percentage": 100
        }
