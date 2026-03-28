import whisper
import tempfile
import os


class VoiceService:
    """
    Handles speech-to-text transcription using Whisper.
    Includes validation and noise handling.
    """

    def __init__(self, model_name: str = "base"):
        """
        Load Whisper model once during initialization.
        """
        self.model = whisper.load_model(model_name)

    def transcribe_audio(self, audio_bytes: bytes) -> dict:
        """
        Convert audio bytes to text.

        Returns:
        {
            "success": True,
            "text": "...",
            "language": "en"
        }
        """

        # ---------------------------------
        # STEP 1 — Validate audio presence
        # ---------------------------------

        if not audio_bytes:
            return {
                "success": False,
                "error": "No audio received"
            }

        # Very small audio usually means noise or empty recording
        if len(audio_bytes) < 2000:
            return {
                "success": False,
                "error": "Audio too short or empty"
            }

        temp_path = None

        try:

            # ---------------------------------
            # STEP 2 — Save temporary audio
            # ---------------------------------

            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
                temp_audio.write(audio_bytes)
                temp_path = temp_audio.name

            # ---------------------------------
            # STEP 3 — Run Whisper transcription
            # ---------------------------------

            result = self.model.transcribe(
                temp_path,
                task="transcribe",
                fp16=False
            )

            text = str(result.get("text", "")).strip()
            language = result.get("language", "unknown")

            # ---------------------------------
            # STEP 4 — Detect unclear speech
            # ---------------------------------

            if not text or len(text) < 2:
                return {
                    "success": False,
                    "error": "Speech unclear or noisy"
                }

            return {
                "success": True,
                "text": text,
                "language": language
            }

        except Exception as e:

            return {
                "success": False,
                "error": "Voice processing failed",
                "details": str(e)
            }

        finally:

            # ---------------------------------
            # STEP 5 — Ensure temp file cleanup
            # ---------------------------------

            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)