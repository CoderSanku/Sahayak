from pydantic import BaseModel
from typing import Optional


class StartGuidanceRequest(BaseModel):
    language: str


class ContinueGuidanceRequest(BaseModel):
    session_id: str
    user_input: str


class DebugSessionRequest(BaseModel):
    session_id: str