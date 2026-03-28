# questioning_engine.py
import json
import os


class QuestioningEngine:
    """
    Generates localized questions based on follow-up decisions and session state.
    Compatible with flattened question_templates.json.
    """

    def __init__(self):
        template_path = os.path.join(
            os.path.dirname(__file__),
            "templates",
            "question_templates.json"
        )

        with open(template_path, "r", encoding="utf-8") as f:
            self.templates = json.load(f)

        # Centralized target mapping
        self.target_mapping = {
            # Income & Wealth
            "income_proof": "income_certificate",
            "income_proof_3yr": "income_certificate_last_3_years",
            "tax_proof": "income_tax_statement_form_16",
            "revenue_report": "village_revenue_officer_income_report",

            # Identity & Residence
            "id_proof": "pan_card",
            "residence_proof": "aadhaar_card",
            "ration_card_proof": "ration_card",
            "voter_id": "voter_id_card",
            "utility_bill": "electricity_bill",
            "photo": "applicant_photograph",

            # Education & Vital Records
            "school_certificate": "school_leaving_certificate",
            "birth_certificate": "birth_certificate",
            "marriage_certificate": "marriage_registration_certificate",
            "academic_records": "educational_records",

            # Property
            "valuation_report": "property_valuation_report",
            "land_records": "khata_extract",
            "ownership_proof": "house_ownership_certificate",
            "society_share": "share_certificate",
            "property_card": "property_sheet",

            # Legal
            "stamp_affidavit": "affidavit_100_stamp",
            "sample_b_affidavit": "affidavit_sample_b",
            "self_declaration": "self_declaration",
            "name_change_proof": "government_gazette",
            "employment_proof": "mill_worker_proof",
            "caste_evidence": "caste_evidence_pre_cutoff",

            # Profile
            "age_proof": "age",
            "annual_income_field": "income",
            "eta_info": "processing_time"
        }

    def generate_question(self, followup_decision: dict, session_state: dict) -> str | None:
        """
        Converts a follow-up decision into a localized question string.
        """

        if not followup_decision:
            return None

        action = followup_decision.get("action")
        target = followup_decision.get("target")
        language = session_state.get("language", "en")

        # ✅ No question needed
        if not target or not isinstance(target, str):
            return None

        # Apply mapping
        target = self.target_mapping.get(target, target)

        # Avoid repeating same question
        conversation = session_state.setdefault("conversation", {})
        last_asked = conversation.get("last_question_type")

        if last_asked == target:
            return None

        conversation["last_question_type"] = target

        # Supported actions
        if action in {"ASK_QUESTION", "REQUEST_DOCUMENT", "OFFER_OPTION"}:
            return self._find_question(target, language)

        return None

    def _find_question(self, key: str, language: str) -> str | None:
        """
        Direct lookup in flattened template JSON.
        """

        entry = self.templates.get(key)

        if not entry or not isinstance(entry, dict):
            return None

        # Return language-specific question
        return entry.get(language)