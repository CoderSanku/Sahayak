# backend/routes/voice_routes.py

from fastapi import APIRouter, UploadFile, File
from typing import Optional

from ..engine.input_normalizer import normalize_input
from ..services.service_container import ServiceContainer

router = APIRouter(prefix="/voice", tags=["Voice"])

services: ServiceContainer | None = None


def normalize_language(lang: str) -> str:
    """
    Restrict detected language to supported system languages.
    """

    supported = ["en", "hi", "mr"]

    if lang in supported:
        return lang

    return "en"


@router.post("/voice-input")
async def voice_input(
    audio: UploadFile = File(...),
    session_id: str = "voice_session"
):
    """
    Accept audio input, convert to text, and send to chatbot.
    """

    try:

        if services is None:
            return {
                "success": False,
                "error": "Service container not initialized"
            }

        audio_bytes = await audio.read()

        voice_service = services.voice_service
        guidance_service = services.guidance_service

        # ---------------------------------
        # STEP 1 — Speech to Text
        # ---------------------------------

        transcription = voice_service.transcribe_audio(audio_bytes)

        if not transcription["success"]:
            return {
                "success": False,
                "message": "I could not clearly understand the audio. Please try again.",
                "error": transcription["error"]
            }

        user_message = transcription["text"]

        language = normalize_language(
            transcription.get("language", "en")
        )

        # ---------------------------------
        # STEP 2 — Normalize user input
        # ---------------------------------

        user_message = normalize_input(
            user_message,
            language
        )

        # Debug logs (useful during demo)
        print("Voice Transcript:", user_message)
        print("Detected Language:", language)

        # --------------------------------->
        # STEP 3 — Send to chatbot
        # ---------------------------------

        response = guidance_service.handle_query(
            user_input=user_message,
            session_id=session_id
        )

        return {
            "success": True,
            "voice_input": user_message,
            "language": language,
            "status": "success",
            "data": response
        }

    except Exception as e:

        return {
            "success": False,
            "error": "Voice endpoint failed",
            "details": str(e)
        }