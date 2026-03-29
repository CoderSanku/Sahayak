from engine.input_normalizer import normalize_field

def set_active_certificate(session, cert_id):
    session["active_certificate_id"] = cert_id
    return session


def add_submitted_documents(session, doc_ids):
    existing = session["documents"]["submitted_doc_ids"]
    for doc_id in doc_ids:
        if doc_id not in existing:
            existing.append(doc_id)
    return session


def update_eligibility(session, result):

    if "eligibility" not in session:
        session["eligibility"] = {}
    session["eligibility"]["evaluated"] = True
    session["eligibility"]["is_eligible"] = result["eligible"]
    session["eligibility"]["reason"] = result.get("reason")
    return session


def update_workflow(session, missing_docs, is_complete):

    if "workflow" not in session:
        session["workflow"] = {}
    session["workflow"]["mandatory_missing"] = missing_docs.get("mandatory_missing",[])
    session["workflow"]["required_missing"] = missing_docs.get("required_missing", [])
    session["workflow"]["optional_missing"] = missing_docs.get("optional_missing", [])
    session["workflow"]["is_complete"] = is_complete
    return session

def update_user_profile(session_state, field, value):

    normalized_value = normalize_field(field, value)

    if field in session_state["user_profile"]["personal_info"]:
        session_state["user_profile"]["personal_info"][field] = normalized_value

    elif field in session_state["user_profile"]["financial_info"]:
        session_state["user_profile"]["financial_info"][field] = normalized_value

    elif field in session_state["user_profile"]["category_info"]:
        session_state["user_profile"]["category_info"][field] = normalized_value

    elif field == "submitted_docs":
        session_state["user_profile"]["submitted_docs"].append(normalized_value)