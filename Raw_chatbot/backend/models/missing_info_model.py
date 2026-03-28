from pydantic import BaseModel, Field
from typing import Dict, List, Optional


class MissingField(BaseModel):
    field_name: str
    message: str


class MissingDocument(BaseModel):
    document_name: str
    message: str

class MissingInfoResponse(BaseModel):
    scheme_name: str
    missing_fields: List[MissingField] = Field(default_factory=list)
    missing_documents: Dict[str, List[MissingDocument]]

    is_complete: bool