# backend/engine/certificate_engine.py

from .certificate_loader import CertificateLoader
from .eligibility_engine import EligibilityEngine
from .missing_info_engine import MissingInfoEngine
from .followup.followup_decision_engine import FollowupDecisionEngine
from models.request_response import ResponsePayload
from .profile_validator import validate_user_profile


class CertificateEngine:
    """
    Simplified Document-Only Engine
    """

    def __init__(self):
        self.loader = CertificateLoader()
        self.certificates = self.loader.get_all_certificates()
        self.eligibility_engine = EligibilityEngine()

    def process(self, session_state: dict, extracted_input: dict, mode="documents"):

        # -------------------------
        # 0️⃣ Validate session
        # -------------------------
        if not session_state:
            raise ValueError("Session state cannot be empty.")

        certificate_id = session_state.get("active_certificate_id")
        if not certificate_id:
            raise ValueError("No active certificate in session.")

        certificate = self.certificates.get(certificate_id)
        if not certificate:
            raise ValueError(f"Certificate '{certificate_id}' not found.")

        session_state.setdefault("user_profile", {})
        user_profile = session_state["user_profile"]

        user_profile.setdefault("personal_info", {})
        user_profile.setdefault("submitted_docs", [])

        # -------------------------
        # 1️⃣ Merge user input
        # -------------------------
        self._merge_user_input(session_state, extracted_input)
        user_profile = session_state["user_profile"]

        validate_user_profile(user_profile)

        # -------------------------
        # 2️⃣ Missing Documents ONLY
        # -------------------------
        uploaded_documents = user_profile.get("submitted_docs", [])

        # Read language from session — supports en / hi / mr
        session_language = session_state.get("language", "en")

        missing_info_response = MissingInfoEngine.check_missing_information(
            scheme_name=certificate_id,
            user_data=user_profile,
            uploaded_documents=uploaded_documents,
            language=session_language
        )

        session_state["missing_documents"] = (
            missing_info_response.missing_documents
        )

        # -------------------------
        # 3️⃣ Follow-up (Optional)
        # -------------------------
        followup_engine = FollowupDecisionEngine()
        followup = followup_engine.decide(session_state)

        # -------------------------
        # 4️⃣ Response (DOCUMENTS ONLY)
        # -------------------------
        response = ResponsePayload.build(
            certificate_id=certificate_id,
            session_state=session_state,
            followup=followup,
            suggestions=[],
            mode="documents"   # 🔥 forced
        )

        return response, session_state

    # ------------------------------------------------------------------

    def _merge_user_input(self, session_state: dict, extracted_input: dict):

        profile = session_state.get("user_profile", {})

        for key, value in extracted_input.items():
            if value is not None:
                profile[key] = value

        session_state["user_profile"] = profile