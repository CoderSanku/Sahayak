
# NOTE: TEST1
# from backend.engine.guidance_engine import GuidanceEngine

# session = {
#     "eligibility": {
#         "evaluated": False
#     },
#     "workflow": {},
#     "documents": {
#         "submitted_doc_ids": []
#     }
# }

# engine = GuidanceEngine(session)
# result = engine.process()

# print(result)

# NOTE: TEST 2
# from backend.engine.guidance_engine import GuidanceEngine

# session = {
#     "certificate_type": "income_certificate",
#     "eligibility": {
#         "evaluated": False
#     },
#     "workflow": {},
#     "documents": {
#         "submitted_doc_ids": []
#     },
#     "uploaded_documents": [],
#     "language": "en"
# }


# engine = GuidanceEngine(session)
# result = engine.process()



# print(result)

# NOTE: TEST 3

from backend.engine.guidance_engine import GuidanceEngine

# Simulate session where mandatory docs already submitted
session = {
    "certificate_type": "income_certificate",

    "workflow": {},
    "documents": {
        "submitted_doc_ids": [
            "income_tax_statement",
            "pay_certificate",
            "village_revenue_officer_report"
        ]
    },

    # Simulate uploaded docs
    "uploaded_documents": [
        "income_tax_statement_form_16",
        "pay_certificate_current_financial_year",
        "village_revenue_officer_income_report"
    ],

    "language": "en"
}

engine = GuidanceEngine(session)
result = engine.process()

print(result)
