import json

def build_user_prompt(payload: dict) -> str:
    language = payload.get("language", "en")

    return f"""
Here is structured certificate workflow data:

{json.dumps(payload, indent=2)}

Respond strictly in {language}.
Do not switch language.
Do not translate unless explicitly requested.

Generate a response covering ONLY:

1. Certificate name
2. Eligibility status
3. Missing mandatory documents (if any)
4. Missing required documents (if any)
5. Application status
6. Next action

If suggestions exist:
- Present them after the main response
- Do not re-evaluate eligibility
- Do not change workflow state
- Use suggestions exactly as provided

Only use the provided structured data.
Do not invent missing fields.
"""