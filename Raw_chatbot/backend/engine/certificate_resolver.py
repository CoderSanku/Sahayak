# backend/engine/certificate_resolver.py

from backend.engine.certificate_loader import CertificateLoader
from difflib import get_close_matches
import re


class CertificateResolver:
    """
    Resolves user input into a certificate configuration.
    Multilingual + fuzzy matching.
    """

    def __init__(self):
        self.loader = CertificateLoader()

    def _normalize(self, text: str) -> str:
        """
        Normalize input:
        - lowercase
        - remove extra spaces
        - remove special characters
        """
        text = text.lower().strip()
        text = re.sub(r"[^\w\s]", "", text)
        text = re.sub(r"\s+", " ", text)
        return text

    def resolve(self, user_input: str, session) -> dict | None:
        if not user_input:
            return None

        user_input = self._normalize(user_input)

        certificates = self.loader.get_all_certificates()

        # Build multilingual name map
        name_map = {}

        for cert_id, cert_data in certificates.items():
            names = cert_data["certificate_name"]

            for lang in ["en", "hi", "mr"]:
                if lang in names and names[lang]:
                    normalized_name = self._normalize(names[lang])
                    name_map[normalized_name] = cert_data

        # 1️⃣ Exact match
        if user_input in name_map:
            return name_map[user_input]

        # 2️⃣ Fuzzy match
        matches = get_close_matches(
            user_input,
            name_map.keys(),
            n=1,
            cutoff=0.5  # adjust if needed
        )

        if matches:
            return name_map[matches[0]]

        # 3️⃣ Keyword scoring fallback
        best_match = None
        best_score = 0

        for name, cert_data in name_map.items():
            name_words = set(name.split())
            input_words = set(user_input.split())

            # Remove common word "certificate"
            name_words.discard("certificate")
            input_words.discard("certificate")

            score = len(name_words.intersection(input_words))

            if score > best_score:
                best_score = score
                best_match = cert_data

        return best_match