# engine/document_engine.py

from typing import Dict, List


class DocumentEngine:
    """
    Single source of truth for all document-related logic:
    - Normalization
    - Categorization
    - Missing detection
    - Localization
    - Completion evaluation
    """

    # -------------------------------------------------
    # Extract documents by category
    # -------------------------------------------------
    @staticmethod
    def get_documents_by_category(certificate: Dict) -> Dict:
        certificate = certificate or {}
        documents = certificate.get("documents", {}) or {}

        return {
            "mandatory": [
                doc.get("doc_id")
                for doc in documents.get("mandatory", []) or []
                if doc.get("doc_id")
            ],
            "required": [
                doc.get("doc_id")
                for doc in documents.get("required", []) or []
                if doc.get("doc_id")
            ],
            "optional": [
                doc.get("doc_id")
                for doc in documents.get("optional", []) or []
                if doc.get("doc_id")
            ],
        }

    # -------------------------------------------------
    # Normalize uploaded documents
    # -------------------------------------------------
    @staticmethod
    def normalize_uploaded_documents(
        certificate: Dict,
        uploaded_documents: List[str],
        language: str = "en"
    ) -> List[str]:

        uploaded_documents = uploaded_documents or []
        certificate = certificate or {}

        documents = certificate.get("documents", {}) or {}

        all_docs = (
            documents.get("mandatory", []) +
            documents.get("required", []) +
            documents.get("optional", [])
        )

        # Build lookup map
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

        return list(set(normalized))

    # -------------------------------------------------
    # Detect missing documents
    # -------------------------------------------------
    @staticmethod
    def detect_missing_documents(
        certificate: Dict,
        uploaded_documents: List[str]
    ) -> Dict:

        uploaded_documents = uploaded_documents or []
        uploaded_set = set(uploaded_documents)

        docs = DocumentEngine.get_documents_by_category(certificate)

        missing = {
            "mandatory_missing": [],
            "required_missing": [],
            "optional_missing": [],
        }

        for doc_id in docs["mandatory"]:
            if doc_id not in uploaded_set:
                missing["mandatory_missing"].append(doc_id)

        for doc_id in docs["required"]:
            if doc_id not in uploaded_set:
                missing["required_missing"].append(doc_id)

        for doc_id in docs["optional"]:
            if doc_id not in uploaded_set:
                missing["optional_missing"].append(doc_id)

        return missing

    # -------------------------------------------------
    # Document completion evaluation
    # -------------------------------------------------
    @staticmethod
    def evaluate_document_completion(missing_docs: Dict) -> bool:
        missing_docs = missing_docs or {}
        mandatory_missing = missing_docs.get("mandatory_missing", []) or []
        required_missing = missing_docs.get("required_missing", []) or []

        return len(mandatory_missing) == 0 and len(required_missing) == 0

    # -------------------------------------------------
    # Localize document names
    # -------------------------------------------------
    @staticmethod
    def localize_doc_names(
        certificate: Dict,
        doc_ids: List[str],
        language: str = "en"
    ) -> List[str]:

        certificate = certificate or {}
        doc_ids = doc_ids or []

        documents = certificate.get("documents", {}) or {}

        all_docs = (
            documents.get("mandatory", []) +
            documents.get("required", []) +
            documents.get("optional", [])
        )

        localized = []

        for doc in all_docs:
            doc_id = doc.get("doc_id")
            if doc_id in doc_ids:
                names = doc.get("name", {}) or {}
                localized.append(
                    names.get(language)
                    or names.get("en")
                    or doc_id
                )

        return localized
