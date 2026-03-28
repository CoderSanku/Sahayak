# backend/engine/profile_validator.py

def validate_user_profile(user_profile: dict) -> bool:
    """
    Ensures profile structure integrity during conversation.
    Does NOT enforce completeness.
    """

    if not isinstance(user_profile, dict):
        raise ValueError("User profile must be a dictionary.")

    # -------------------------
    # Ensure base sections exist
    # -------------------------
    user_profile.setdefault("personal_info", {})
    user_profile.setdefault("financial_info", {})
    user_profile.setdefault("category_info", {})
    user_profile.setdefault("submitted_docs", [])

    # -------------------------
    # Type safety (only if fields exist)
    # -------------------------
    personal = user_profile["personal_info"]
    financial = user_profile["financial_info"]
    category = user_profile["category_info"]
    submitted_docs = user_profile["submitted_docs"]

    if "age" in personal and not isinstance(personal["age"], int):
        raise ValueError("Age must be integer")

    if "annual_income" in financial and not isinstance(
        financial["annual_income"], (int, float)
    ):
        raise ValueError("Annual income must be numeric")

    if "state" in personal and not isinstance(personal["state"], str):
        raise ValueError("State must be string")

    if "caste" in category and not isinstance(category["caste"], str):
        raise ValueError("Caste must be string")

    if not isinstance(submitted_docs, list):
        raise ValueError("submitted_docs must be list")

    return True