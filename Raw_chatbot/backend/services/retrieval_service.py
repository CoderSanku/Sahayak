import os
import pickle
import requests
import numpy as np
import faiss
from dotenv import load_dotenv

# =====================================================
# CONFIGURATION
# =====================================================

load_dotenv()

JINA_API_KEY = os.getenv("JINA_API_KEY")
JINA_URL = "https://api.jina.ai/v1/embeddings"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {JINA_API_KEY}"
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTOR_STORE_PATH = os.path.join(BASE_DIR, "vector_store")

INDEX_PATH = os.path.join(VECTOR_STORE_PATH, "faiss_index.bin")
METADATA_PATH = os.path.join(VECTOR_STORE_PATH, "metadata.pkl")


# =====================================================
# LOAD VECTOR STORE
# =====================================================

def load_vector_store():
    if not os.path.exists(INDEX_PATH):
        raise FileNotFoundError("FAISS index not found.")

    if not os.path.exists(METADATA_PATH):
        raise FileNotFoundError("Metadata file not found.")

    index = faiss.read_index(INDEX_PATH)

    with open(METADATA_PATH, "rb") as f:
        metadata = pickle.load(f)

    return index, metadata


# =====================================================
# EMBED QUERY
# =====================================================

def embed_query(query: str) -> np.ndarray:
    payload = {
        "model": "jina-embeddings-v3",
        "input": query,
        "truncate": True
    }

    response = requests.post(JINA_URL, headers=HEADERS, json=payload)

    if response.status_code != 200:
        raise Exception(f"Query embedding failed: {response.text}")

    embedding = response.json()["data"][0]["embedding"]
    vector = np.array(embedding, dtype="float32").reshape(1, -1)

    # Normalize for cosine similarity
    faiss.normalize_L2(vector)

    return vector



# =====================================================
# SIMPLE RULE-BASED TOPIC CLASSIFIER
# =====================================================

def classify_topic(query: str) -> str:
    query = query.lower()

    if any(word in query for word in ["document", "required", "mandatory", "certificate"]):
        return "T1"

    if any(word in query for word in ["office", "address", "location", "contact", "taluka"]):
        return "T2"

    if any(word in query for word in ["sample", "format", "pdf"]):
        return "T3"

    if any(word in query for word in ["complaint", "grievance"]):
        return "T4"

    return None  # fallback → search all



# =====================================================
# SEARCH FUNCTION
# =====================================================

def search(query: str, top_k: int = 3):
    index, metadata = load_vector_store()

    query_vector = embed_query(query)

    # 🔹 Step 1: Classify topic
    predicted_topic = classify_topic(query)

    if predicted_topic:
        # 🔹 Step 2: Filter metadata
        filtered_indices = [
            i for i, item in enumerate(metadata)
            if item["metadata"].get("topic") == predicted_topic
        ]

        if not filtered_indices:
            print("No documents found for predicted topic. Searching full index.")
        else:
            # 🔹 Step 3: Create temporary filtered index
            filtered_vectors = []

            for i in filtered_indices:
                vector = index.reconstruct(i)
                filtered_vectors.append(vector)

            filtered_vectors = np.vstack(filtered_vectors).astype("float32")
            faiss.normalize_L2(filtered_vectors)

            temp_index = faiss.IndexFlatIP(filtered_vectors.shape[1])
            temp_index.add(filtered_vectors)

            scores, local_indices = temp_index.search(query_vector, top_k)

            results = []
            for score, local_idx in zip(scores[0], local_indices[0]):
                if local_idx < len(filtered_indices):
                    original_idx = filtered_indices[local_idx]
                    result = {
                        "score": float(score),
                        "content": metadata[original_idx]["content"],
                        "metadata": metadata[original_idx]["metadata"]
                    }
                    results.append(result)

            return results

    # 🔹 Fallback: search full index
    scores, indices = index.search(query_vector, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < len(metadata):
            result = {
                "score": float(score),
                "content": metadata[idx]["content"],
                "metadata": metadata[idx]["metadata"]
            }
            results.append(result)

    return results


# =====================================================
# TEST RUN
# =====================================================

if __name__ == "__main__":
    print("\n===== RETRIEVAL TEST =====\n")

    test_query = "Where can I apply for caste certificate?"

    results = search(test_query, top_k=3)

    for i, r in enumerate(results):
        print(f"\nResult {i+1}")
        print("Score:", r["score"])
        print("Metadata:", r["metadata"])
        print("Content:\n", r["content"])
