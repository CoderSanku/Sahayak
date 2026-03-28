import os
import json
import pickle
import requests
import numpy as np
import faiss
from tqdm import tqdm
from dotenv import load_dotenv

# =====================================================
# CONFIGURATION
# =====================================================

load_dotenv()

JINA_API_KEY = os.getenv("JINA_API_KEY")

if not JINA_API_KEY:
    raise ValueError("JINA_API_KEY not found in .env file")

JINA_URL = "https://api.jina.ai/v1/embeddings"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {JINA_API_KEY}"
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOWLEDGE_PATH = os.path.join(BASE_DIR, "knowledge_base")
VECTOR_STORE_PATH = os.path.join(BASE_DIR, "vector_store")

os.makedirs(VECTOR_STORE_PATH, exist_ok=True)

# =====================================================
# STEP 1: Convert Structured JSON → Clean Text
# =====================================================

def convert_to_text(entry: dict) -> str:
    text_parts = []

    for key, value in entry.items():

        if isinstance(value, dict):
            for lang, content in value.items():
                text_parts.append(f"{key} ({lang}): {content}")

        elif isinstance(value, list):
            text_parts.append(f"{key}: {', '.join(map(str, value))}")

        else:
            text_parts.append(f"{key}: {value}")

    return "\n".join(text_parts)



# =====================================================
# STEP 2: Load All JSON Files Recursively
# =====================================================

def load_documents():
    documents = []

    print("Loading knowledge base files...")

    for root, dirs, files in os.walk(KNOWLEDGE_PATH):
        for file in files:
            if file.endswith(".json"):
                file_path = os.path.join(root, file)

                # 🔹 Extract topic from folder name (T1_documents → T1)
                folder_name = os.path.basename(root)
                topic = folder_name.split("_")[0]

                # 🔹 Extract certificate_type and info_type from filename
                filename_without_ext = file.replace(".json", "")
                parts = filename_without_ext.split("_")

                info_type = parts[-1]  # I1 / I2 / I3
                certificate_type = "_".join(parts[:-1])  # caste_certificate

                with open(file_path, "r", encoding="utf-8") as f:
                    try:
                        data = json.load(f)
                    except Exception as e:
                        print(f"Error reading {file}: {e}")
                        continue

                    # CASE 1: File is a list
                    if isinstance(data, list):
                        for entry in data:
                            documents.append({
                                "content": convert_to_text(entry),
                                "metadata": {
                                    "topic": topic,
                                    "certificate_type": certificate_type,
                                    "info_type": info_type,
                                    "source_file": file
                                }
                            })

                    # CASE 2: File is a single dictionary
                    elif isinstance(data, dict):
                        documents.append({
                            "content": convert_to_text(data),
                            "metadata": {
                                "topic": topic,
                                "certificate_type": certificate_type,
                                "info_type": info_type,
                                "source_file": file
                            }
                        })

                    else:
                        print(f"Skipping {file} (unsupported format)")

    print(f"Loaded {len(documents)} documents for embedding.\n")
    return documents

# =====================================================
# STEP 3: Generate Embedding Using Jina API
# =====================================================

def get_embedding(text: str) -> np.ndarray:
    """
    Generates embedding vector using Jina API.
    Ensures input is valid and returns float32 numpy array.
    """

    if not isinstance(text, str):
        raise TypeError("Embedding input must be a string.")

    text = text.strip()

    if not text:
        raise ValueError("Embedding input text cannot be empty.")

    payload = {
        "model": "jina-embeddings-v3",
        "input": text,
        "truncate": True
    }

    try:
        response = requests.post(
            JINA_URL,
            headers=HEADERS,
            json=payload,
            timeout=30
        )
    except requests.RequestException as e:
        raise ConnectionError(f"Embedding API connection failed: {e}")

    if response.status_code != 200:
        raise RuntimeError(
            f"Embedding failed [{response.status_code}]: {response.text}"
        )

    try:
        embedding = response.json()["data"][0]["embedding"]
    except (KeyError, IndexError):
        raise ValueError("Invalid embedding response format from Jina API.")

    return np.array(embedding, dtype=np.float32)


# =====================================================
# STEP 4: Build FAISS Index
# =====================================================

def build_faiss_index(documents):
    embeddings = []
    metadata_store = []

    print("Generating embeddings...")

    for doc in tqdm(documents):
        try:
            emb = get_embedding(doc["content"])
            embeddings.append(emb)
            metadata_store.append(doc)
        except Exception as e:
            print(f"Embedding failed for a document: {e}")

    if not embeddings:
        raise ValueError("No embeddings generated. Check API or data.")

    embeddings = np.vstack(embeddings).astype("float32")

# 🔹 Normalize vectors for cosine similarity
    faiss.normalize_L2(embeddings)

    dimension = embeddings.shape[1]

    print(f"\nEmbedding dimension detected: {dimension}")

# 🔹 Use Inner Product index (for cosine similarity)
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings) # type: ignore


    # Save FAISS index
    faiss.write_index(index, os.path.join(VECTOR_STORE_PATH, "faiss_index.bin"))

    # Save metadata separately
    with open(os.path.join(VECTOR_STORE_PATH, "metadata.pkl"), "wb") as f:
        pickle.dump(metadata_store, f)

    print("\nFAISS index built successfully!")
    print(f"Total vectors indexed: {index.ntotal}")
    print("Vector store saved in:", VECTOR_STORE_PATH)


# =====================================================
# MAIN EXECUTION
# =====================================================

if __name__ == "__main__":
    print("\n========== EMBEDDING PIPELINE STARTED ==========\n")

    docs = load_documents()
    build_faiss_index(docs)

    print("\n========== EMBEDDING PIPELINE COMPLETED ==========\n")
