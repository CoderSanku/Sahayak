from ..session.session_updater import set_active_certificate


class GuidanceOrchestrator:

    def __init__(self, services):
        self.intent_classifier = services.intent_classifier
        self.session_manager = services.session_manager
        self.certificate_engine = services.certificate_engine
        self.location_service = services.location_service  # ✅ Step 15

    def process(self, user_input: str, session_id: str):

        print("🔥 ORCHESTRATOR RUNNING")

        # ---------------------------------------------------
        # 1️⃣ Load session
        # ---------------------------------------------------
        session = self.session_manager.get_session_data(session_id)
        if not session:
            return {"error": "Session not found"}

        language = session.get("language", "en")

        # ---------------------------------------------------
        # 🚨 2️⃣ LOCATION INTENT CHECK
        # ---------------------------------------------------
        user_text = user_input.lower()

        location_keywords = [
            "office",
            "near me",
            "nearest",
            "tehsildar",
            "location",
            "where is",
            "find office"
        ]

        if any(keyword in user_text for keyword in location_keywords):
            print("📍 LOCATION INTENT TRIGGERED")
            return self.location_service.get_nearest_office(user_input)

        # ---------------------------------------------------
        # 3️⃣ Detect certificate using classifier
        # ---------------------------------------------------
        classification = self.intent_classifier.classify(
            user_input,
            language
        )

        certificate_id = classification.get("certificate_id")

        if not certificate_id:
            return {
                "error": "Could not resolve certificate",
                "confidence": classification.get("confidence"),
                "method": classification.get("method")
            }

        # ---------------------------------------------------
        # 4️⃣ Update session with active certificate
        # ---------------------------------------------------
        session = set_active_certificate(session, certificate_id)

        # ---------------------------------------------------
        # 5️⃣ Run deterministic certificate engine
        # ---------------------------------------------------
        structured_input = {
            "raw_input": user_input
        }

        response, updated_session = self.certificate_engine.process(
            session,
            structured_input
        )

        # ---------------------------------------------------
        # 6️⃣ Save updated session
        # ---------------------------------------------------
        self.session_manager.update_session(session_id, updated_session)

        return response