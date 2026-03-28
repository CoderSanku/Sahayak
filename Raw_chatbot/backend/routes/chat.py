from fastapi import APIRouter
from ..services.intent_classifier import IntentClassifier
from ..engine.certificate_engine import CertificateEngine
from ..services.sample_certificate_service import SampleCertificateService
from ..services.location_service import LocationService  # ✅ NEW

router = APIRouter(prefix="/chat")

intent_classifier = IntentClassifier()
certificate_engine = CertificateEngine()
sample_service = SampleCertificateService()
location_service = LocationService()  # ✅ NEW


@router.post("/")
def chat(payload: dict):

    user_message = payload.get("message")
    session_state = payload.get("session_state", {})
    language = session_state.get("language", "en")

    # ---------------------------------------------
    # Safety check
    # ---------------------------------------------
    if not user_message:
        return {
            "status": "error",
            "message": "Message cannot be empty."
        }

    message_lower = user_message.lower().strip()

    print("MESSAGE:", message_lower)

    # ---------------------------------------------
    # 🚨 STEP 0: LOCATION INTENT (STEP 15 FIX)
    # ---------------------------------------------
    location_keywords = [
        "office",
        "near me",
        "nearest",
        "tehsildar",
        "location",
        "where is",
        "find office"
    ]

    if any(keyword in message_lower for keyword in location_keywords):
        print("📍 LOCATION MODE ACTIVATED")

        # ⚠️ TEMP: Hardcoded for testing
        result = location_service.get_nearest_office(
            taluka="malad",
            village="borivali"
        )

        return {
            "status": "success",
            "type": "location",
            "data": result,
            "session_state": session_state
        }

    # ---------------------------------------------
    # STEP 1: DOCUMENT INTENT DETECTION
    # ---------------------------------------------
    doc_keywords = [
        "document", "documents", "doc", "docs",
        "required", "requirement", "requirements",
        "paper", "papers",
        "needed", "need",
        "what do i need",
        "what is required",
        "what are required"
    ]

    is_document_intent = any(keyword in message_lower for keyword in doc_keywords)

    mode = "documents"

    print("DOC INTENT:", is_document_intent)
    print("MODE:", mode)

    # ---------------------------------------------
    # STEP 2: Intent Classification
    # ---------------------------------------------
    if not session_state.get("active_certificate_id"):

        intent_result = intent_classifier.classify(
            user_input=user_message,
            language=language
        )

        cert_id = intent_result.get("certificate_id")
        confidence = intent_result.get("confidence", 0)
        method = intent_result.get("method")

        if method in ["keyword", "embedding_strong"]:

            session_state["active_certificate_id"] = cert_id
            session_state["intent_confidence"] = confidence
            session_state["intent_method"] = method

        elif method == "embedding_weak":

            suggested_cert = next(
                (cert for cert in intent_classifier.index
                 if cert["certificate_id"] == cert_id),
                None
            )

            if suggested_cert:
                display_name = suggested_cert["display_name"][language]

                return {
                    "status": "confirmation_required",
                    "suggested_certificate_id": cert_id,
                    "suggested_certificate_name": display_name,
                    "confidence": confidence,
                    "message": f"Did you mean {display_name}?",
                    "session_state": session_state
                }

        else:
            return {
                "status": "clarification_required",
                "message": "Which certificate are you looking for?",
                "options": [
                    cert["display_name"][language]
                    for cert in intent_classifier.index
                ],
                "session_state": session_state
            }

    # ---------------------------------------------
    # STEP 3: Run Certificate Engine
    # ---------------------------------------------
    extracted_input = {
        "raw_message": user_message
    }

    response_payload, updated_session = certificate_engine.process(
        session_state,
        extracted_input,
        mode=mode
    )

    # ---------------------------------------------
    # STEP 4: Attach SAMPLE
    # ---------------------------------------------
    try:
        # Use certificate_id (always English snake_case) for T3 sample lookup
        # certificate_name is already localized so cannot be used as a key
        cert_key = response_payload["certificate"]["certificate_id"]

        sample_result = sample_service.get_sample_certificate(cert_key)

        final_response = {
            "status": "success",
            "data": response_payload,
            "session_state": updated_session
        }

        if sample_result.get("found"):
            final_response["sample"] = sample_result

        return final_response

    except Exception as e:
        print("Sample Fetch Error:", e)

        return {
            "status": "success",
            "data": response_payload,
            "session_state": updated_session
        }