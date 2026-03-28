from ..engine.utils import enforce_language_integrity


def build_response_payload(
    certificate: dict,
    eligibility_result: dict,
    missing_docs: dict,
    user_docs: list,
    language: str,
    suggestions: list,
    mode: str = "documents"
):

    def localize(doc_ids):
        if not doc_ids:
            return []

        formatted = []

        for doc in doc_ids:
            if hasattr(doc, "document_name"):
                # Use document_name — already localized by MissingInfoEngine
                formatted.append(doc.document_name)
            elif isinstance(doc, str):
                formatted.append(doc)
            else:
                formatted.append(str(doc))

        return formatted

    # -------------------------------------------------
    # ✅ ONLY DOCUMENT MODE
    # -------------------------------------------------
    payload = {
        "certificate": {
            "certificate_id": certificate["certificate_id"],
            "certificate_name": certificate["certificate_name"][language],
            "issuing_authority": certificate["issuing_authority"][language]
        },

        "documents": {
            "mandatory": localize(missing_docs.get("mandatory_missing", [])),
            "required": localize(missing_docs.get("required_missing", [])),
            "optional": localize(missing_docs.get("optional_missing", []))
        },

        "language": language,
        "suggestions": suggestions or []
    }

    enforce_language_integrity({"language": language}, payload)

    return payload