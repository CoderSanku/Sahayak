# backend/routes/status_routes.py
# API route for application status check.
# Currently queries Supabase directly via the Python client.
# Admin panel will update the `status` and `admin_note` fields
# in the `applications` table — this route just reads them.
#
# Endpoints:
#   GET /status/{application_id}  → returns application row or 404

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import os
from supabase import create_client, Client

router = APIRouter(prefix="/status", tags=["status"])

# ── Supabase client ────────────────────────────────────────────────────────────
# Reads from environment variables (same as frontend .env)
SUPABASE_URL  = os.getenv("SUPABASE_URL")
SUPABASE_KEY  = os.getenv("SUPABASE_ANON_KEY")   # use SERVICE key on backend (not anon)

def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase credentials not configured in environment."
        )
    return create_client(SUPABASE_URL, SUPABASE_KEY)


@router.get("/{application_id}")
async def get_application_status(application_id: str):
    """
    Returns the current status of an application.

    Response shape:
    {
        "found": true,
        "application_id": "APP-260323-4821",
        "certificate_name": "Caste Certificate",
        "applicant_name": "Rahul Sharma",
        "status": "pending" | "approved" | "generated" | "rejected",
        "admin_note": "string or null",
        "created_at": "ISO timestamp"
    }
    """
    app_id = application_id.strip().upper()

    try:
        supabase: Client = get_supabase()

        response = supabase \
            .table("applications") \
            .select(
                "application_id, certificate_name, applicant_name, "
                "status, admin_note, created_at"
            ) \
            .eq("application_id", app_id) \
            .single() \
            .execute()

        if not response.data:
            return JSONResponse(status_code=404, content={"found": False})

        return JSONResponse(content={
            "found":            True,
            "application_id":   response.data["application_id"],
            "certificate_name": response.data["certificate_name"],
            "applicant_name":   response.data["applicant_name"],
            "status":           response.data["status"],
            "admin_note":       response.data.get("admin_note"),
            "created_at":       response.data.get("created_at"),
        })

    except HTTPException:
        raise
    except Exception as e:
        # Row not found throws an exception in supabase-py when using .single()
        if "PGRST116" in str(e) or "no rows" in str(e).lower():
            return JSONResponse(status_code=404, content={"found": False})
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ── Admin-only endpoint (wire up when admin panel is ready) ───────────────────
# This is left as a stub — the admin panel will call PATCH /status/{id}
# to update status + admin_note.
#
# @router.patch("/{application_id}")
# async def update_application_status(application_id: str, body: dict):
#     """
#     Called by admin panel to update status.
#     Body: { "status": "approved" | "generated" | "rejected", "admin_note": "..." }
#     Requires admin auth (add dependency when admin panel is implemented).
#     """
#     pass