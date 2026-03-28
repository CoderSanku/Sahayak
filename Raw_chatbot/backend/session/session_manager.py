# Simple in-memory session storage
# (Later we will replace with Redis or DB)

_sessions = {}


def create_session(session_id: str, data: dict):
    """
    Create or update a session.
    """
    _sessions[session_id] = data


def get_session_data(session_id: str) -> dict:
    """
    Retrieve session data.
    """
    return _sessions.get(session_id)


def update_session(session_id: str, new_data: dict):
    """
    Update session data.
    """
    if session_id in _sessions:
        _sessions[session_id].update(new_data)
    else:
        _sessions[session_id] = new_data
