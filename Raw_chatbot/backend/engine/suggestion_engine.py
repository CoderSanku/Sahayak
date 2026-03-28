def generate_suggestions(certificate, session_state):

    language = session_state["language"]
    suggestions = []

    if session_state.get("workflow_complete"):

        if "processing_time" in certificate.get("suggestions", {}):
            suggestions.append(
                certificate["suggestions"]["processing_time"][language]
            )

        if "sample_application" in certificate.get("suggestions", {}):
            suggestions.append(
                certificate["suggestions"]["sample_application"][language]
            )

    elif not session_state.get("eligibility", {}).get("is_eligible", True):

        if "appeal_process" in certificate.get("suggestions", {}):
            suggestions.append(
                certificate["suggestions"]["appeal_process"][language]
            )


    return suggestions