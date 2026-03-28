import json
from pathlib import Path


class SampleCertificateService:
    def __init__(self):
        self.data = self._load_data()

    def _load_data(self):
        file_path = Path(
            "backend/knowledge_base/T3_documents/sample_certificates_index.json"
        )

        if not file_path.exists():
            return []

        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_sample_certificate(self, certificate_id: str, language: str = "en"):
        """
        Returns sample certificate details based on certificate_id
        """

        # 🔹 Normalize input
        normalized_input = certificate_id.lower().replace(" ", "_")

        for cert in self.data:
            if cert.get("certificate_type") == normalized_input:

                return {
                    "found": True,
                    "certificate_id": normalized_input,
                    "certificate_name": cert.get("certificate_name", {}).get(language, ""),
                    "sample_pdf_url": cert.get("sample_pdf", {}).get("path"),
                    "language_type": cert.get("sample_pdf", {}).get("language_type"),
                    "issuing_authority": cert.get("issuing_authority", {}).get(language, ""),
                    "disclaimer": cert.get("disclaimer", {}).get(language, ""),
                    "language_notice": cert.get("language_notice", {}).get(language)
                }

        return {
            "found": False,
            "error": f"Sample certificate not found for '{certificate_id}'"
        }