"""Erreurs métier : même nommage que Cognito / les PSP pour que le front traite les deux à l'identique.

Format des réponses d'erreur : {"error": "<Nom>", "message": "<texte>"}.
"""
from fastapi import Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    def __init__(self, status: int, name: str, message: str = ""):
        super().__init__(message or name)
        self.status = status
        self.name = name
        self.message = message or name


def bad_request(name: str, message: str = "") -> ApiError:
    return ApiError(400, name, message)


def unauthorized(name: str = "NotAuthenticated", message: str = "") -> ApiError:
    return ApiError(401, name, message)


def forbidden(name: str, message: str = "") -> ApiError:
    return ApiError(403, name, message)


def not_found(name: str = "NotFound", message: str = "") -> ApiError:
    return ApiError(404, name, message)


def conflict(name: str, message: str = "") -> ApiError:
    return ApiError(409, name, message)


async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status, content={"error": exc.name, "message": exc.message}
    )
