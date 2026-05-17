from flask import Flask, jsonify
from pydantic import ValidationError
from werkzeug.exceptions import HTTPException


class AppError(Exception):
    status_code = 500
    code = "internal_error"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.code)
        self.message = message or self.code


class Unauthenticated(AppError):
    status_code = 401
    code = "unauthenticated"


class Forbidden(AppError):
    status_code = 403
    code = "forbidden"


class NotFound(AppError):
    status_code = 404
    code = "not_found"


class Conflict(AppError):
    status_code = 409
    code = "conflict"


def _error_response(code: str, message: str, status: int, details=None):
    body = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return jsonify(body), status


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(AppError)
    def _handle_app_error(err: AppError):
        return _error_response(err.code, err.message, err.status_code)

    @app.errorhandler(ValidationError)
    def _handle_validation_error(err: ValidationError):
        details = [
            {"loc": list(e.get("loc", ())), "msg": e.get("msg", "")}
            for e in err.errors()
        ]
        return _error_response(
            "validation_failed", "Request body failed validation.", 400, details
        )

    @app.errorhandler(HTTPException)
    def _handle_http_exception(err: HTTPException):
        code_map = {
            400: "bad_request",
            401: "unauthenticated",
            403: "forbidden",
            404: "not_found",
            405: "method_not_allowed",
            409: "conflict",
            415: "unsupported_media_type",
        }
        code = code_map.get(err.code or 500, "internal_error")
        message = err.description or err.name or "HTTP error"
        return _error_response(code, message, err.code or 500)

    @app.errorhandler(Exception)
    def _handle_uncaught(err: Exception):  # noqa: ARG001 - swallow stacktrace
        return _error_response("internal_error", "Internal server error.", 500)
