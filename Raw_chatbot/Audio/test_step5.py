
import requests

url = "http://127.0.0.1:8000/voice/voice-input"

files = {
    "audio": open("output_audio_en.wav", "rb")
}

response = requests.post(url, files=files)

print(response.json())