import io

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request, send_file
from gridfs.errors import NoFile

from ..auth.guards import require_user
from ..db import get_gridfs_bucket
from ..errors import NotFound
from .schemas import ALLOWED_MIME, MAX_BYTES

images_bp = Blueprint("images", __name__, url_prefix="/api/images")


def _bad_request(message: str):
    return jsonify({"error": {"code": "validation_failed", "message": message}}), 400


@images_bp.post("")
def upload_image():
    require_user()

    file = request.files.get("file")
    if file is None:
        return _bad_request("file is required.")

    filename = file.filename or ""
    if filename == "" or "." not in filename:
        return _bad_request("filename must include an extension.")

    if file.mimetype not in ALLOWED_MIME:
        return _bad_request(
            f"unsupported mime type; allowed: {', '.join(sorted(ALLOWED_MIME))}."
        )

    data = file.read()
    if len(data) == 0:
        return _bad_request("file is empty.")
    if len(data) > MAX_BYTES:
        return _bad_request(f"file exceeds {MAX_BYTES} bytes.")

    bucket = get_gridfs_bucket()
    oid = bucket.upload_from_stream(
        filename,
        io.BytesIO(data),
        metadata={"contentType": file.mimetype},
    )
    return jsonify({"id": str(oid)}), 201


@images_bp.get("/<image_id>")
def get_image(image_id: str):
    try:
        oid = ObjectId(image_id)
    except (InvalidId, TypeError):
        raise NotFound("Image not found.")

    bucket = get_gridfs_bucket()
    try:
        grid_out = bucket.open_download_stream(oid)
    except NoFile:
        raise NotFound("Image not found.")

    metadata = grid_out.metadata or {}
    return send_file(
        io.BytesIO(grid_out.read()),
        mimetype=metadata.get("contentType", "application/octet-stream"),
    )
