import os
import json
import uuid
import boto3
from botocore.config import Config
from src.utils.db import build_api_response, get_user_id_from_event

s3_client = boto3.client(
    "s3",
    config=Config(signature_version="s3v4")
)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf", "webp"}

def handler(event, context):
    print(f"[PresignUpload] Event: {json.dumps(event)}")
    try:
        body = json.loads(event.get("body", "{}"))
    except Exception:
        return build_api_response(400, {"error": "INVALID_JSON", "message": "Request body must be valid JSON"})

    file_name = body.get("fileName", "evidence_document.jpg")
    content_type = body.get("contentType", "image/jpeg")
    
    ext = file_name.split(".")[-1].lower() if "." in file_name else "jpg"
    if ext not in ALLOWED_EXTENSIONS:
        return build_api_response(400, {
            "error": "UNSUPPORTED_FILE_TYPE",
            "message": f"Allowed extensions are: {', '.join(ALLOWED_EXTENSIONS)}"
        })

    bucket_name = os.environ.get("EVIDENCE_BUCKET", "grievease-evidence-bucket")
    user_id = get_user_id_from_event(event)
    file_uuid = str(uuid.uuid4())[:8]
    safe_file_name = "".join(c for c in file_name if c.isalnum() or c in "._-")
    s3_key = f"evidence/{user_id}/{file_uuid}-{safe_file_name}"
    expires_in = 300  # 5 minutes

    try:
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": bucket_name,
                "Key": s3_key,
                "ContentType": content_type
            },
            ExpiresIn=expires_in,
            HttpMethod="PUT"
        )

        return build_api_response(200, {
            "uploadUrl": presigned_url,
            "s3Key": s3_key,
            "bucket": bucket_name,
            "expiresInSeconds": expires_in
        })
    except Exception as e:
        print(f"[PresignUpload] Error generating presigned URL: {str(e)}")
        return build_api_response(500, {
            "error": "PRESIGN_FAILED",
            "message": f"Could not generate upload URL: {str(e)}"
        })
