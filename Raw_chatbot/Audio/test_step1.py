from backend.services.voice_service import VoiceService

def test_voice_en():

    voice = VoiceService()

    with open("output_audio_en.wav", "rb") as f:
        audio = f.read()

    result = voice.transcribe_audio(audio)

    print(result)

def test_voice_hi():

    voice = VoiceService()

    with open("output_audio_hi.wav", "rb") as f:
        audio = f.read()

    result = voice.transcribe_audio(audio)

    print(result)

def test_voice_mr():

    voice = VoiceService()

    with open("output_audio_mr.wav", "rb") as f:
        audio = f.read()

    result = voice.transcribe_audio(audio)

    print(result)


if __name__ == "__main__":
    test_voice_en()
    test_voice_hi()
    test_voice_mr()