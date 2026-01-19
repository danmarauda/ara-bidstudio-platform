"""
Enhanced storage backends with connection pooling and client reuse.
"""

import logging
import threading

from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage as BaseS3Storage

logger = logging.getLogger(__name__)

# Thread-local storage for boto3 clients
_thread_local = threading.local()


class PooledS3Boto3Storage(BaseS3Storage):
    """
    S3 storage with connection pooling and client reuse.

    Improves performance by:
    1. Reusing boto3 S3 clients across requests within a thread
    2. Configuring connection pool size for concurrent operations
    3. Adding retry logic for resilience
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.max_pool_connections = getattr(settings, "AWS_S3_CONNECTION_POOL_SIZE", 10)
        logger.info(
            f"Initializing S3 storage with connection pool size: {self.max_pool_connections}"
        )

    @property
    def connection(self):
        """
        Get or create a cached boto3 S3 resource with connection pooling.
        Thread-safe implementation using thread-local storage.
        """
        if not hasattr(_thread_local, "s3_connection"):
            import boto3
            from botocore.config import Config

            boto_config = Config(
                max_pool_connections=self.max_pool_connections,
                retries={"max_attempts": 3, "mode": "adaptive"},
            )

            session = boto3.Session(
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                aws_session_token=self.security_token,
                region_name=self.region_name,
            )
            _thread_local.s3_connection = session.resource(
                "s3",
                use_ssl=self.use_ssl,
                endpoint_url=self.endpoint_url,
                config=boto_config,
            )
            logger.debug("Created new S3 resource with connection pooling")

        return _thread_local.s3_connection


class PooledMediaRootS3Storage(PooledS3Boto3Storage):
    """Media files storage with connection pooling."""

    location = "media"
    file_overwrite = False


class PooledStaticRootS3Storage(PooledS3Boto3Storage):
    """Static files storage with connection pooling."""

    location = "static"
    default_acl = "public-read"
