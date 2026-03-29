from engine.orchestrator import GuidanceOrchestrator


class GuidanceService:

    def __init__(self, services):
        self.orchestrator = GuidanceOrchestrator(services)

    def handle_query(self, user_input: str, session_id: str, language: str = "en"):
        """
        Main entry point for chatbot queries.
        """

        response = self.orchestrator.process(user_input, session_id)

        # Attach language so output layer can use it
        response["language"] = language

        return response