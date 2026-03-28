from gtts import gTTS
from pydub import AudioSegment
import os

def save_as_wav(text, lang, filename):
    # 1. Generate the speech as a temporary MP3 (Google's default)
    tts = gTTS(text=text, lang=lang, slow=False)
    temp_mp3 = "temp_audio.mp3"
    tts.save(temp_mp3)

    # 2. Convert MP3 to WAV using pydub
    # This ensures you get the .wav format you need
    audio = AudioSegment.from_mp3(temp_mp3)
    audio.export(filename, format="wav")

    # 3. Clean up the temp file
    if os.path.exists(temp_mp3):
        os.remove(temp_mp3)
    
    print(f"Successfully saved {lang} audio to {filename}")

# --- Execution ---

# English (en)
save_as_wav("I want certificate", "en", "output_audio_en_1.wav")
save_as_wav("What documents are required for income certificate", "en", "output_audio_en_2.wav")

# Hindi (hi)
# save_as_wav("नमस्ते, यह हिंदी में एक रिकॉर्डिंग है।", "hi", "output_audio_hi.wav")

# Marathi (mr) - This will work even if your PC doesn't have Marathi installed!
# save_as_wav("नमस्कार, ही मराठीतील एक रेकॉर्डिंग आहे.", "mr", "output_audio_mr.wav")