"""
Standardized error exception handler for REST Framework API.
Enforces standard error envelope: {"error": {"code": "...", "message": "..."}}
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        code = "INVALID_REQUEST"
        message = "An error occurred while processing the request."

        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            code = "AUTHENTICATION_REQUIRED"
            message = "Authentication credentials were not provided or are invalid."
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            code = "FORBIDDEN"
            message = "You do not have permission to perform this action."
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            code = "NOT_FOUND"
            message = "The requested resource was not found."
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            code = "QUOTA_EXCEEDED"
            message = "Rate or quota limit exceeded."
        elif response.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE:
            code = "FILE_TOO_LARGE"
            message = "The uploaded file is too large."
        elif response.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE:
            code = "UNSUPPORTED_FILE_TYPE"
            message = "The submitted media type is not supported."
        elif isinstance(response.data, dict):
            if "detail" in response.data:
                message = str(response.data["detail"])
            elif "error" in response.data and isinstance(response.data["error"], dict):
                return response
            else:
                first_key = next(iter(response.data))
                first_val = response.data[first_key]
                if isinstance(first_val, list) and len(first_val) > 0:
                    message = f"{first_key}: {first_val[0]}"
                else:
                    message = f"{first_key}: {first_val}"

        response.data = {
            "error": {
                "code": code,
                "message": message
            }
        }

    return response
