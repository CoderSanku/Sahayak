# backend/routes/sample_routes.py

from fastapi import APIRouter, Query
from services.service_container import container

router = APIRouter(prefix="/samples", tags=["Sample Certificates"])


@router.get("/sample-certificate")
def get_sample_certificate(certificate: str = Query(...)):
    """
    Retrieve a sample certificate PDF.
    """

    try:

        sample_service = container.sample_certificate_service

        result = sample_service.get_sample_certificate(certificate)

        return {
            "success": True,
            "sample": result
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }