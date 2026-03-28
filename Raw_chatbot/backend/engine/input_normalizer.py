import re


def normalize_field(value: str):
    """
    Existing system normalizer used across engines.
    Keeps backward compatibility.
    """

    if not value:
        return value

    return value.strip().lower()


def normalize_input(text: str, language: str):
    """
    Voice normalization layer.
    Converts Hindi/Marathi roman speech into English keywords
    so the intent classifier can understand it.
    """

    if not text:
        return text

    text = text.lower()

    # Split sentence into words safely
    tokens = re.findall(r'\b\w+\b', text)

    # -------------------------
    # Hindi Romanization
    # -------------------------
    if language == "hi":

        replacements = {

            # general
            "praman": "certificate",
            "pramang": "certificate",
            "patra": "certificate",
            "certificateg": "certificate",

            "dastavej": "documents",
            "dastavay": "documents",
            "dastave": "documents",

            "kya": "what",
            "kon": "which",
            "kaun": "which",
            "whichd": "which",

            # income
            "aay": "income",
            "ay": "income",
            "kamai": "income",

            # caste
            "jati": "caste",
            "jaati": "caste",

            # domicile
            "adhivas": "domicile",

            # residence
            "niwas": "residence",
            "rehne": "residence",

            # heir
            "waris": "heir",
            "utradhikari": "heir",

            # senior citizen
            "varisth": "senior",
            "nagrik": "citizen",

            # women reservation
            "mahila": "women",
            "arakshan": "reservation"
        }

    # -------------------------
    # Marathi Romanization
    # -------------------------
    elif language == "mr":

        replacements = {

            # general
            "praman": "certificate",
            "pramal": "certificate",
            "patra": "certificate",
            "certificatesati": "certificate",
            "dakhla": "certificate",
            "dakhala": "certificate",
            "dkhla": "certificate",
            "dakla": "certificate",

            "kagad": "documents",
            "kagat": "documents",
            "patre": "documents",

            "konti": "which",
            "hunti": "which",
            "kay": "what",

            # income
            "utpann": "income",
            "uttpan": "income",
            "utpan": "income",
            "kamai": "income",

            # caste
            "jat": "caste",
            "jaat": "caste",

            # domicile
            "adhivas": "domicile",

            # residence
            "rahivasi": "residence",
            "rehivasi": "residence",

            # heir
            "waras": "heir",
            "varasdar": "heir",

            # senior citizen
            "jyeshtha": "senior",
            "jeyshta": "senior",
            "nagrik": "citizen",

            # women reservation
            "mahila": "women",
            "stree": "women",
            "arakshan": "reservation"
        }

    else:
        return text

    normalized_tokens = []

    for word in tokens:
        normalized_tokens.append(replacements.get(word, word))

    normalized_text = " ".join(normalized_tokens)

    # Canonical certificate phrase fixes
    normalized_text = normalized_text.replace("income certificate", "income_certificate")
    normalized_text = normalized_text.replace("caste certificate", "caste_certificate")
    normalized_text = normalized_text.replace("domicile certificate", "domicile_certificate")
    normalized_text = normalized_text.replace("residence certificate", "residence_certificate")
    normalized_text = normalized_text.replace("senior citizen certificate", "senior_citizen_certificate")
    normalized_text = normalized_text.replace("non creamy layer certificate", "non_creamy_layer_certificate")
    normalized_text = normalized_text.replace("age nationality domicile certificate", "age_nationality_domicile_certificate")

    return normalized_text