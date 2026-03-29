# from engine.certificate_engine import CertificateEngine
from engine.eligibility_engine import EligibilityEngine
from engine.missing_info_engine import MissingInfoEngine
from engine.followup.followup_decision_engine import FollowupDecisionEngine
from session.session_updater import update_eligibility, update_workflow
from engine.followup.decision_types import Actions
from session.session_manager import create_session
from session.session_updater import set_active_certificate
from engine.certificate_resolver import CertificateResolver


class GuidanceEngine:
    def __init__(self, session_data: dict):
        self.session_data = session_data
        self.eligibility_engine = EligibilityEngine()
        # self.certificate_engine = CertificateEngine()
        self.missing_engine = MissingInfoEngine()
        self.followup_engine = FollowupDecisionEngine()
        self.certificate_resolver = CertificateResolver()

    def process(self):

        # Resolve Certificates from user input 
        last_input = self.session_data.get("last_input", "")

        resolved_certificate = self.certificate_resolver.resolve(last_input)
        
        if resolved_certificate:
            self.session_data["selected_certificate"] = resolved_certificate
        
        
        # 1️⃣ Eligibility
        eligibility_result = self.eligibility_engine.check(self.session_data)

        # Update session eligibility
        update_eligibility(self.session_data, eligibility_result)

        if not eligibility_result["eligible"]:
            return {
                "status": "not_eligible",
                "decision": {
                    "action": Actions.SHOW_RESULT,
                    "reason": "ELIGIBILITY_FAILED",
                    "message": eligibility_result["reason"]
                }
            }

        certificate_id = eligibility_result["certificate_id"]

        # Store active certificate
        set_active_certificate(self.session_data, certificate_id)

        # 2️⃣ Missing Info
        missing_info_result = self.missing_engine.check_missing_information(
            scheme_name=certificate_id,
            user_data=self.session_data,
            uploaded_documents=self.session_data.get("uploaded_documents", []),
            language=self.session_data.get("language", "en")
        )

        missing_docs = missing_info_result.missing_documents
        is_complete = missing_info_result.is_complete

        # 3️⃣ Update Workflow
        update_workflow(
            self.session_data,
            missing_docs,
            is_complete
        )

        # 4️⃣ Delegate decision logic
        decision = self.followup_engine.decide(self.session_data)

        print("Eligibility Result:", eligibility_result)

        # Persiste updated session back into memory store
        create_session(
            self.session_data["session_id"],
            self.session_data
        )
        
        return {
            "status": "completed" if is_complete else "in_progress",
            "decision": decision,
            "is_complete": is_complete,
            "session_snapshot":self.session_data    # for debugging
        }
