"""
Storage backend warming to eliminate cold start delays.

This module pre-initializes storage backends to avoid the ~400ms
cold start penalty on first access.
"""

import logging
import os

from django.conf import settings
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


def warm_storage_backend():
    """
    Pre-warm the storage backend to avoid cold start delays.

    This should be called during Django startup to initialize
    boto3/GCS clients before the first request.
    """
    try:
        # Log which process is warming up (useful for multi-worker setups)
        pid = os.getpid()
        logger.info(f"[PID {pid}] Starting storage backend warming...")

        # CRITICAL: Generate an actual URL to fully initialize the storage
        # Just accessing connection isn't enough - we need to trigger the full
        # boto3 initialization that happens on first URL generation

        if settings.STORAGE_BACKEND == "AWS":
            # For S3, generate a URL to trigger full initialization
            # This forces boto3 client creation AND signature generation setup
            try:
                # First, access the connection to initialize the client
                if hasattr(default_storage, "connection"):
                    _ = default_storage.connection
                    logger.info(f"[PID {pid}] S3 connection initialized")

                # Then generate a URL for a fake file - this triggers all initialization
                default_storage.url("__storage_warmup_test__.txt")
                logger.info(
                    f"[PID {pid}] S3 storage backend warmed up successfully (generated test URL)"
                )

                # Optionally, generate a few more URLs to fully warm the caches
                for i in range(3):
                    _ = default_storage.url(f"__warmup_{i}__.txt")

            except Exception as e:
                logger.info(f"[PID {pid}] S3 storage backend warmed up (partial: {e})")

        elif settings.STORAGE_BACKEND == "GCP":
            # For GCS, similar approach
            try:
                if hasattr(default_storage, "client"):
                    _ = default_storage.client
                    logger.info(f"[PID {pid}] GCS client initialized")

                default_storage.url("__storage_warmup_test__.txt")
                logger.info(f"[PID {pid}] GCS storage backend warmed up successfully")
            except Exception as e:
                logger.info(f"[PID {pid}] GCS storage backend warmed up (partial: {e})")

        else:
            # For local storage, no warming needed
            logger.info(f"[PID {pid}] Local storage backend - no warming needed")

        logger.info(f"[PID {pid}] Storage backend warming completed")

    except Exception as e:
        logger.warning(f"[PID {pid}] Failed to warm storage backend: {e}")
        # Don't fail startup if warming fails


def warm_storage_in_thread():
    """
    Warm storage backend in a background thread to not block startup.
    """
    import threading

    thread = threading.Thread(target=warm_storage_backend, daemon=True)
    thread.start()
    return thread
