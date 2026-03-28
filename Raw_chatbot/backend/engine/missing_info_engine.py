from typing import Dict, List
from backend.models.missing_info_model import (
    MissingDocument,
    MissingInfoResponse
)
from backend.config.scheme_requirements import SCHEME_REQUIREMENTS


class MissingInfoEngine:
    """
    Handles detection of missing documents for schemes.
    """

    # -------------------------------------------------
    # Normalize Uploaded Documents
    # -------------------------------------------------
    @staticmethod
    def normalize_uploaded_documents(
        scheme_config: Dict,
        uploaded_documents: List[str],
        language: str = "en"
    ) -> List[str]:

        uploaded_documents = uploaded_documents or []
        scheme_config = scheme_config or {}

        documents = scheme_config.get("documents", {}) or {}

        all_docs = (
            documents.get("mandatory", []) +
            documents.get("required", []) +
            documents.get("optional", [])
        )

        # Build lookup map for faster matching
        lookup = {}

        for doc in all_docs:
            doc_id = doc.get("doc_id")
            names = doc.get("name", {}) or {}

            localized = names.get(language) or names.get("en")
            if localized:
                lookup[localized.strip().lower()] = doc_id

        normalized = []

        for user_input in uploaded_documents:
            if not user_input:
                continue

            key = user_input.strip().lower()
            normalized.append(lookup.get(key, user_input))

        return list(set(normalized))  # remove duplicates

    # -------------------------------------------------
    # Check Missing Information
    # -------------------------------------------------
    @staticmethod
    def check_missing_information(
        scheme_name: str,
        user_data: Dict,
        uploaded_documents: List[str],
        language: str = "en"
    ) -> MissingInfoResponse:

        scheme_config = SCHEME_REQUIREMENTS.get(scheme_name)

        if not scheme_config:
            raise ValueError(f"Scheme '{scheme_name}' not configured")

        documents_config = scheme_config.get("documents", {}) or {}

        uploaded_documents = MissingInfoEngine.normalize_uploaded_documents(
            scheme_config,
            uploaded_documents,
            language
        )

        uploaded_set = set(uploaded_documents)

        mandatory_missing = []
        required_missing = []
        optional_missing = []

        # Helper to localize safely
        def localize(doc):
            names = doc.get("name", {}) or {}
            return names.get(language) or names.get("en") or doc.get("doc_id")

        # Mandatory
        for doc in documents_config.get("mandatory", []) or []:
            doc_id = doc.get("doc_id")
            if doc_id and doc_id not in uploaded_set:
                name = localize(doc)
                mandatory_missing.append(
                    MissingDocument(
                        document_name=name,
                        message=f"{name} document is required"
                    )
                )

        # Required
        for doc in documents_config.get("required", []) or []:
            doc_id = doc.get("doc_id")
            if doc_id and doc_id not in uploaded_set:
                name = localize(doc)
                required_missing.append(
                    MissingDocument(
                        document_name=name,
                        message=f"{name} is required"
                    )
                )

        # Optional
        for doc in documents_config.get("optional", []) or []:
            doc_id = doc.get("doc_id")
            if doc_id and doc_id not in uploaded_set:
                name = localize(doc)
                optional_missing.append(
                    MissingDocument(
                        document_name=name,
                        message=f"{name} can improve processing"
                    )
                )

        is_complete = len(mandatory_missing) == 0 and len(required_missing) == 0

        return MissingInfoResponse(
            scheme_name=scheme_config.get("certificate_name", {}).get(
                language,
                scheme_config.get("certificate_name", {}).get("en", "")
            ),
            missing_fields=[],  # still unused
            missing_documents={
                "mandatory_missing": mandatory_missing,
                "required_missing": required_missing,
                "optional_missing": optional_missing
            },
            is_complete=is_complete
        )
