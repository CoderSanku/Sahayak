from ..engine.certificate_loader import CertificateLoader
from ..output.payload_builder import build_response_payload


class ResponsePayload:
    """
    Central structured response builder.
    Compatible with:
    - Step 9 (Structured Payload)
    - Step 10 (Prompt Control)
    - Step 17 (Optional Suggestion Layer)
    """

    @staticmethod
    def build(
        certificate_id: str,
        session_state: dict,
        followup: dict,
        suggestions: list | None = None,
        mode: str = "application"
    ) -> dict:
        """
        Build final structured response payload.
        """

        # -----------------------------
        # Load certificate using existing loader structure
        # -----------------------------
        loader = CertificateLoader()
        certificates = loader.get_all_certificates()

        certificate = certificates.get(certificate_id)

        if not certificate:
            raise ValueError(f"Certificate '{certificate_id}' not found.")

        # -----------------------------
        # Extract session components
        # -----------------------------
        eligibility_result = session_state.get("eligibility", {})

        missing_docs = session_state.get("missing_documents", {
            "mandatory_missing": [],
            "required_missing": [],
            "optional_missing": []
        })

        user_docs = (
            session_state
            .get("user_profile", {})
            .get("submitted_docs", [])
        )

        language = session_state.get("language", "en")

        # -----------------------------
        # Build structured payload
        # -----------------------------
        payload = build_response_payload(
            certificate=certificate,
            eligibility_result=eligibility_result,
            missing_docs=missing_docs,
            user_docs=user_docs,
            language=language,
            suggestions=suggestions or [],
            mode=mode
        )

        return payload