# from sentence_transformers import SentenceTransformer

# model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# text = "Documents required for caste certificate"
# embedding = model.encode(text)

# print("Embedding dimension:", len(embedding))

# NOTE: API TESTING

import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("JINA_API_KEY")

API_URL = "https://api.jina.ai/v1/embeddings"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

def get_embedding(text):
    payload = {
        "model": "jina-embeddings-v3",
        "input": text
    }

    response = requests.post(API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"Error {response.status_code}: {response.text}")

    return response.json()["data"][0]["embedding"]

embedding = get_embedding("Caste certificate requires Aadhaar and address proof.")

print("Embedding length:", len(embedding))
