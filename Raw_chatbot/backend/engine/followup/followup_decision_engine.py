# followup_decision_engine.py
from .decision_types import Actions, Reasons


class FollowupDecisionEngine:
    """
    Determines next conversational action
    based on session workflow state.
    """

    def decide(self, session: dict) -> dict:
        """
        Decide next action based on workflow state.
        Always returns a consistent response structure.
        """

        workflow = session.get("workflow", {}) or {}

        mandatory_missing = workflow.get("mandatory_missing", []) or []
        required_missing = workflow.get("required_missing", []) or []
        optional_missing = workflow.get("optional_missing", []) or []

        language = session.get("language", "en")

        # 1️⃣ Mandatory documents missing
        if mandatory_missing:
            return {
                "action": Actions.REQUEST_DOCUMENT,
                "reason": Reasons.MISSING_DOCUMENT,
                "documents": mandatory_missing,
                "target": mandatory_missing[0],   # ✅ FIX ADDED
                "priority": "mandatory",
                "language": language
            }

        # 2️⃣ Required documents missing
        if required_missing:
            return {
                "action": Actions.REQUEST_DOCUMENT,
                "reason": Reasons.MISSING_DOCUMENT,
                "documents": required_missing,
                "target": required_missing[0],    # ✅ FIX ADDED
                "priority": "required",
                "language": language
            }

        # 3️⃣ Optional documents missing
        if optional_missing:
            return {
                "action": Actions.OFFER_OPTION,
                "reason": Reasons.ENHANCEMENT,
                "documents": optional_missing,
                "target": optional_missing[0],    # ✅ FIX ADDED
                "priority": "optional",
                "language": language
            }

        # 4️⃣ Workflow complete
        return {
            "action": Actions.SHOW_RESULT,
            "reason": Reasons.COMPLETE,
            "documents": [],
            "target": None,                      # ✅ Explicit
            "priority": None,
            "language": language
        }