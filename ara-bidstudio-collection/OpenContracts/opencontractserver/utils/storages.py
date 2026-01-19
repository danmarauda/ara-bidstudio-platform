from storages.backends.s3boto3 import S3Boto3Storage

# Only import GoogleCloudStorage if it's available
try:
    from storages.backends.gcloud import GoogleCloudStorage
except ImportError:
    # If Google Cloud Storage dependencies aren't installed,
    # create a placeholder class
    class GoogleCloudStorage:
        def __init__(self, *args, **kwargs):
            raise ImportError(
                "Google Cloud Storage dependencies are not installed. "
                "Install with: pip install django-storages[google]"
            )


class StaticRootS3Boto3Storage(S3Boto3Storage):
    location = "static"
    default_acl = "public-read"


class MediaRootS3Boto3Storage(S3Boto3Storage):
    location = "media"
    file_overwrite = False


class StaticRootGoogleCloudStorage(GoogleCloudStorage):
    """
    Google Cloud Storage backend for static files.
    Static files are typically public and cached.
    """

    location = "static"
    default_acl = "publicRead"  # GCS uses camelCase for ACLs

    def get_object_parameters(self, name):
        """
        Set object parameters for static files.
        Override cache control for specific file types if needed.
        """
        params = super().get_object_parameters(name)
        # Ensure proper content type is set
        if not params.get("content_type"):
            import mimetypes

            content_type, _ = mimetypes.guess_type(name)
            if content_type:
                params["content_type"] = content_type
        return params


class MediaRootGoogleCloudStorage(GoogleCloudStorage):
    """
    Google Cloud Storage backend for media files.
    Media files are typically private and require authentication.
    """

    location = "media"
    file_overwrite = False
    default_acl = None  # Keep files private by default

    def get_object_parameters(self, name):
        """
        Set object parameters for media files.
        Ensure proper security headers are set.
        """
        params = super().get_object_parameters(name)

        # Set content disposition for downloads
        import os

        filename = os.path.basename(name)
        params["content_disposition"] = f'attachment; filename="{filename}"'

        # Ensure proper content type is set
        if not params.get("content_type"):
            import mimetypes

            content_type, _ = mimetypes.guess_type(name)
            if content_type:
                params["content_type"] = content_type
            else:
                params["content_type"] = "application/octet-stream"

        # Security headers for sensitive files
        params.setdefault("metadata", {})
        params["metadata"]["X-Content-Type-Options"] = "nosniff"
        params["metadata"]["X-Frame-Options"] = "DENY"

        return params
