def determine_next_action(missing_docs, eligibility_result):
    if not eligibility_result["is_eligible"]:
        return "not_eligible"

    if len(missing_docs["mandatory_missing"]) > 0:
        return "provide_mandatory_documents"

    if len(missing_docs["required_missing"]) > 0:
        return "submit_required_documents"

    return "ready_for_application"



def is_workflow_complete(missing_docs, eligibility_result):
    return (
        eligibility_result["is_eligible"]
        and len(missing_docs["mandatory_missing"]) == 0
        and len(missing_docs["required_missing"]) == 0
    )


