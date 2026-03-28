import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

body = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say hello in one sentence."}
    ],
    "temperature": 0.2,
    "max_tokens": 100
}

response = requests.post(GROQ_CHAT_ENDPOINT, headers=headers, json=body)

print("Loaded API Key:", GROQ_API_KEY)

print("Status Code:", response.status_code)
print("Response JSON:", response.json())
