class ServiceContainer:

    def __init__(self):

        # -------- Core Logic --------
        from .intent_classifier import IntentClassifier
        from ..engine.certificate_engine import CertificateEngine
        from ..engine.document_engine import DocumentEngine
        from ..engine.eligibility_engine import EligibilityEngine
        from ..engine.missing_info_engine import MissingInfoEngine
        from ..engine.followup.followup_decision_engine import FollowupDecisionEngine
        from .voice_service import VoiceService

        # -------- Functional Modules --------
        from ..session import session_manager
        from ..engine import suggestion_engine
        from ..engine import workflow_completion_engine
        from ..output.payload_builder import build_response_payload

        # -------- Phase 3 --------
        from .guidance_service import GuidanceService
        from .location_service import LocationService
        from .sample_certificate_service import SampleCertificateService

        # -------- Instantiate Core Engines --------
        self.intent_classifier = IntentClassifier()
        self.certificate_engine = CertificateEngine()
        self.document_engine = DocumentEngine()
        self.eligibility_engine = EligibilityEngine()
        self.missing_info_engine = MissingInfoEngine()
        self.followup_engine = FollowupDecisionEngine()

        # -------- Phase 3 Services --------
        self.voice_service = VoiceService()
        self.location_service = LocationService()
        self.sample_certificate_service = SampleCertificateService()

        # -------- Attach Functional Modules --------
        self.session_manager = session_manager
        self.suggestion_engine = suggestion_engine
        self.workflow_engine = workflow_completion_engine
        self.payload_builder = build_response_payload

        # -------- Create Guidance Service --------
        self.guidance_service = GuidanceService(self)


# ✅ Global instance
container = ServiceContainer()