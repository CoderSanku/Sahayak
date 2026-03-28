def enforce_language_integrity(session_state: dict, response_payload: dict):
    """
    Ensures response payload language matches session language.
    Raises error if mismatch is detected.
    """
    session_lang = session_state.get("language", "en")
    payload_lang = response_payload.get("language", "en")

    if session_lang != payload_lang:
        raise RuntimeError(
            f"Language mismatch: session={session_lang} vs payload={payload_lang}"
        )