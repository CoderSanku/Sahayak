import whisper
import tempfile
import os


class VoiceService:
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name
        self.model = None  # ✅ Don't load at startup

    def _get_model(self):
        if self.model is None:
            self.model = whisper.load_model(self.model_name)  # ✅ Load only when first used
        return self.model

    def transcribe_audio(self, audio_bytes: bytes) -> dict:
        if not audio_bytes:
            return {"success": False, "error": "No audio received"}

        if len(audio_bytes) < 2000:
            return {"success": False, "error": "Audio too short or empty"}

        temp_path = None

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
                temp_audio.write(audio_bytes)
                temp_path = temp_audio.name

            model = self._get_model()  # ✅ Only loads when transcribe is actually called

            result = model.transcribe(
                temp_path,
                task="transcribe",
                fp16=False
            )

            text = str(result.get("text", "")).strip()
            language = result.get("language", "unknown")

            if not text or len(text) < 2:
                return {"success": False, "error": "Speech unclear or noisy"}

            return {"success": True, "text": text, "language": language}

        except Exception as e:
            return {"success": False, "error": "Voice processing failed", "details": str(e)}

        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)