def build_decision_state(session_state: dict) -> dict:
    """
    Converts raw session state into a normalized decision state.
    """

    workflow = session_state.get("workflow", {})

    return {
        "eligibility": session_state.get("eligibility", {
            "is_eligible": True,
            "reason": None
        }),

        "mandatory_missing":
            workflow.get("mandatory_missing", []),

        "required_missing":
            workflow.get("required_missing", []),

        "optional_missing":
            workflow.get("optional_missing", []),

        "workflow_complete":
            workflow.get("is_complete", False),

        "suggestions_offered":
            workflow.get("suggestions_offered", False),

        "last_asked_field":
            workflow.get("last_asked_field", None)
    }
