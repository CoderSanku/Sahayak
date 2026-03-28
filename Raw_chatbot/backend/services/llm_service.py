import requests
import os
from prompts.system_prompt import SYSTEM_PROMPT
from prompts.response_prompt import build_user_prompt
from dotenv import load_dotenv

load_dotenv()

# Replace with your actual Groq API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# The correct Groq endpoint for chat completions
GROQ_CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

def generate_certificate_response(payload: dict) -> str:
    user_prompt = build_user_prompt(payload)

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "model": "llama-3.1-8b-instant",  # Meta's 8B model running on Groq LPU
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 1024  # Optional: limits the length of the response
    }

    # Making the POST request to Groq
    response = requests.post(GROQ_CHAT_ENDPOINT, headers=headers, json=body)

    # Automatically raises an error for 4XX or 5XX status codes
    response.raise_for_status()

    # Groq returns a standard OpenAI-style JSON structure
    return response.json()["choices"][0]["message"]["content"]

