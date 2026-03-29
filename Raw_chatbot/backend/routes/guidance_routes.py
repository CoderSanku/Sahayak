from fastapi import APIRouter
from services.guidance_service import GuidanceService
from session.session_manager import (
    create_session,
    get_session_data,
    update_session
)
from models.guidance_models import (
    StartGuidanceRequest,
    ContinueGuidanceRequest,
    DebugSessionRequest
)
from session.session_schema import initialize_session
import uuid


router = APIRouter()

# 🔥 Will be injected from main.py
services = None
guidance_service = None


# -------------------------------------------------------
# Utility: Get Guidance Service (Lazy Initialization)
# -------------------------------------------------------
def get_guidance_service():
    global guidance_service

    if guidance_service is None:
        if services is None:
            raise RuntimeError("Service container not initialized")
        guidance_service = GuidanceService(services)

    return guidance_service


# -------------------------------------------------------
# 1️⃣ Start New Guidance Session
# -------------------------------------------------------
@router.post("/guidance/start")
def start_guidance(request: StartGuidanceRequest):
    session_id = str(uuid.uuid4())

    session_data = initialize_session(
        session_id=session_id,
        language=request.language
    )

    create_session(session_id, session_data)

    return {
        "session_id": session_id,
        "message": "Guidance session started"
    }


# -------------------------------------------------------
# 2️⃣ Continue Guidance Session
# -------------------------------------------------------
@router.post("/guidance/continue")
def continue_guidance(request: ContinueGuidanceRequest):

    session_data = get_session_data(request.session_id)

    if not session_data:
        return {"error": "Session not found"}

    # Update last user input in session
    update_session(request.session_id, {
        "last_input": request.user_input
    })

    # 🔥 Get initialized service safely
    service = get_guidance_service()

    response = service.handle_query(
        request.user_input,
        request.session_id
    )

    return response


# -------------------------------------------------------
# 3️⃣ Debug Endpoint
# -------------------------------------------------------
@router.post("/guidance/debug")
def debug_session(request: DebugSessionRequest):
    session_data = get_session_data(request.session_id)

    if not session_data:
        return {"error": "Session not found"}

    return session_data