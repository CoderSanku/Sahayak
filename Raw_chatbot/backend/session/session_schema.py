def initialize_session(session_id: str, language: str = "en") -> dict:
    return {
        "session_id": session_id,

        "active_certificate_id": None,

        "language": language,   # locked after initialization

        "documents": {
            "submitted_doc_ids": []
        },

        "eligibility": {
            "evaluated": False,
            "is_eligible": None,
            "reason": None
        },

        "workflow": {
            "mandatory_missing": [],
            "required_missing": [],
            "optional_missing": [],
            "is_complete": False,
            "last_next_action": None
        },

        "conversation": {
            "last_question_type": None
        }
    }

# backend/session/session_schema.py

def default_user_profile():
    return {
        "personal_info": {
            "age": None,
            "gender": None,
            "citizenship": None,
            "state": None
        },
        "financial_info": {
            "annual_income": None
        },
        "category_info": {
            "caste": None
        },
        "submitted_docs": []
    }

def set_session_language(session_state: dict, language: str) -> str:
    """
    Lock session language on first set. Do not overwrite unless explicitly requested.
    """
    if not session_state.get("language"):
        session_state["language"] = language
    return session_state["language"]