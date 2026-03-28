import json
import os
import numpy as np
from backend.services.embedding_service import get_embedding


# -------------------------------------------------
# Configuration (Single Source of Truth)
# -------------------------------------------------
CONFIDENCE_THRESHOLD_STRONG = 0.82
CONFIDENCE_THRESHOLD_WEAK = 0.75
MARGIN_THRESHOLD = 0.03

GENERIC_TERMS = {
    "certificate",
    "apply",
    "document",
    "help",
    "form"
}


class IntentClassifier:

    def __init__(self):
        self.index = self._load_index()
        self.precomputed_embeddings = self._precompute_name_embeddings()

    # -------------------------------------------------
    # Load Certificate Registry
    # -------------------------------------------------
    def _load_index(self):
        path = os.path.join(
            os.path.dirname(__file__),
            "../data/registry/certificate_index.json"
        )
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)["certificates"]

    # -------------------------------------------------
    # Generic Input Guard
    # -------------------------------------------------
    def _is_generic_input(self, user_input: str) -> bool:
        cleaned = user_input.lower().strip()
        tokens = cleaned.split()

        if len(tokens) <= 1:
            return True

        if cleaned in GENERIC_TERMS:
            return True

        return False

    # -------------------------------------------------
    # Generate keywords from display names
    # -------------------------------------------------
    def _generate_keywords(self, cert_data):
        keywords = []

        for lang in ["en", "hi", "mr"]:
            name = cert_data["display_name"].get(lang)
            if name:
                keywords.append(name.lower())

        return keywords
    # -------------------------------------------------
    # PRIMARY: Keyword Match
    # -------------------------------------------------
    def _keyword_match(self, user_input):
        user_input = user_input.lower()

        for cert in self.index:
            cert_id = cert["certificate_id"]
            keywords = self._generate_keywords(cert)

            for keyword in keywords:
                if keyword and keyword in user_input:
                    return cert_id, 1.0

        return None, 0.0
    
    # -------------------------------------------------
    # Precompute & Normalize embeddings
    # -------------------------------------------------
    def _precompute_name_embeddings(self):
        embeddings = {}

        for cert in self.index:
            cert_id = cert["certificate_id"]
            embeddings[cert_id] = {}

            for lang in ["en", "hi", "mr"]:
                name = cert["display_name"].get(lang)

                if not name:
                    continue

                embedding = np.array(get_embedding(name))
                norm = np.linalg.norm(embedding)

                if norm != 0:
                    embedding = embedding / norm

                embeddings[cert_id][lang] = embedding

        return embeddings

    # -------------------------------------------------
    # SECONDARY: Embedding Match with Margin Tracking
    # -------------------------------------------------
    def _embedding_match(self, user_input):
        user_embedding = np.array(get_embedding(user_input))
        norm = np.linalg.norm(user_embedding)

        if norm == 0:
            return None, 0.0, 0.0

        user_embedding = user_embedding / norm

        best_score = 0
        second_best = 0
        best_cert = None

        for cert_id, lang_embeddings in self.precomputed_embeddings.items():
            for lang, cert_embedding in lang_embeddings.items():

                score = float(np.dot(user_embedding, cert_embedding))

                if score > best_score:
                    second_best = best_score
                    best_score = score
                    best_cert = cert_id
                elif score > second_best:
                    second_best = score

        return best_cert, best_score, second_best

    # -------------------------------------------------
    # PUBLIC METHOD
    # -------------------------------------------------
    def classify(self, user_input, language="en"):

        if not user_input:
            return {
                "certificate_id": None,
                "confidence": 0,
                "method": "ambiguous"
            }

        # 1️⃣ Generic Input Guard
        if self._is_generic_input(user_input):
            return {
                "certificate_id": None,
                "confidence": 0,
                "method": "ambiguous"
            }

        # 2️⃣ Keyword Match
        cert_id, confidence = self._keyword_match(user_input)
        if cert_id:
            return {
                "certificate_id": cert_id,
                "confidence": confidence,
                "method": "keyword"
            }

        # 3️⃣ Embedding Match
        cert_id, score, second_best = self._embedding_match(user_input)

        # Margin protection
        if (score - second_best) < MARGIN_THRESHOLD:
            return {
                "certificate_id": None,
                "confidence": 0,
                "method": "ambiguous"
            }

        if score >= CONFIDENCE_THRESHOLD_STRONG:
            return {
                "certificate_id": cert_id,
                "confidence": score,
                "method": "embedding_strong"
            }

        elif score >= CONFIDENCE_THRESHOLD_WEAK:
            return {
                "certificate_id": cert_id,
                "confidence": score,
                "method": "embedding_weak"
            }

        # 4️⃣ Ambiguous
        return {
            "certificate_id": None,
            "confidence": 0,
            "method": "ambiguous"
        }