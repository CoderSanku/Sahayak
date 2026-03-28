# backend/engine/certificate_loader.py

import os
import json
from typing import Dict, Any


class CertificateLoader:
    def __init__(self) -> None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(base_dir)

        self.data_path = os.path.join(backend_dir, "data", "certificates")

        if not os.path.exists(self.data_path):
            raise FileNotFoundError(
                f"Certificates folder not found at: {self.data_path}"
            )

        self.certificates: Dict[str, Dict[str, Any]] = {}

        # ✅ Load once at startup
        self._load_certificates()

    def _load_certificates(self) -> None:
        """
        Load all certificate JSON files into memory.
        """

        for filename in os.listdir(self.data_path):
            if not filename.endswith(".json"):
                continue

            filepath = os.path.join(self.data_path, filename)

            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except json.JSONDecodeError:
                raise ValueError(f"Invalid JSON format in file: {filename}")

            # Handle both dict and list formats
            if isinstance(data, list):
                if not data:
                    raise ValueError(f"Empty list in {filename}")
                certificate = data[0]
            elif isinstance(data, dict):
                certificate = data
            else:
                raise ValueError(f"Unsupported JSON format in {filename}")

            cert_id = certificate.get("certificate_id")

            if not cert_id:
                raise ValueError(f"Missing 'certificate_id' in {filename}")

            if cert_id in self.certificates:
                raise ValueError(
                    f"Duplicate certificate_id '{cert_id}' found in {filename}"
                )

            self.certificates[cert_id] = certificate

    def get_certificate(self, cert_id: str) -> Dict[str, Any] | None:
        """
        Retrieve a certificate configuration by ID.
        """
        return self.certificates.get(cert_id)

    def get_all_certificates(self) -> Dict[str, Dict[str, Any]]:
        """
        Return all loaded certificates.
        """
        return self.certificates
