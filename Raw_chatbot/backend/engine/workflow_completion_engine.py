def evaluate_workflow_completion(state: dict) -> dict:
    """
    Determines whether the certificate workflow is complete.
    """

    eligibility = state.get("eligibility", {})
    if not eligibility.get("is_eligible", False):
        return {
            "workflow_complete": False,
            "completion_reason": "INELIGIBLE"
        }

    missing_fields = state.get("missing_fields", [])
    if isinstance(missing_fields, list) and len(missing_fields) > 0:
        return {
            "workflow_complete": False,
            "completion_reason": "MISSING_PROFILE_DATA"
        }

    missing_documents = state.get("missing_documents", {})
    if isinstance(missing_documents, dict):
        total_missing_docs = (
            len(missing_documents.get("mandatory_missing", [])) +
            len(missing_documents.get("required_missing", []))
        )

        if total_missing_docs > 0:
            return {
                "workflow_complete": False,
                "completion_reason": "MISSING_DOCUMENTS"
            }

    return {
        "workflow_complete": True,
        "completion_reason": "ALL_REQUIREMENTS_MET"
    }
