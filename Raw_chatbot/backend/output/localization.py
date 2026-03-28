def localize_documents(doc_ids, certificate, language):

    all_docs = (
        certificate["documents"]["mandatory"]
        + certificate["documents"]["required"]
        + certificate["documents"]["optional"]
    )

    localized_map = {
        doc["doc_id"]: doc["name"][language]
        for doc in all_docs
    }

    return [
        localized_map[doc_id]
        for doc_id in doc_ids
        if doc_id in localized_map
    ]