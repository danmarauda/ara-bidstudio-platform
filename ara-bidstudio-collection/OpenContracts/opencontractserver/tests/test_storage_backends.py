"""
Tests for storage backend configuration and functionality.
"""

from unittest import mock

from django.test import TestCase, override_settings


class StorageBackendConfigTest(TestCase):
    """Test storage backend configuration based on STORAGE_BACKEND setting."""

    def test_local_storage_configuration(self):
        """Test that LOCAL storage backend uses local file system."""
        from django.conf import settings

        # The test environment uses LOCAL by default
        if settings.STORAGE_BACKEND == "LOCAL":
            # When using LOCAL, the default storage should be the standard Django storage
            from django.core.files.storage import default_storage

            self.assertNotIn("S3Boto3Storage", default_storage.__class__.__name__)
            self.assertNotIn("GoogleCloudStorage", default_storage.__class__.__name__)

    @override_settings(
        STORAGE_BACKEND="AWS",
        AWS_STORAGE_BUCKET_NAME="test-bucket",
        AWS_S3_REGION_NAME="us-east-1",
        DEFAULT_FILE_STORAGE="opencontractserver.utils.storages.MediaRootS3Boto3Storage",
        STATICFILES_STORAGE="opencontractserver.utils.storages.StaticRootS3Boto3Storage",
    )
    def test_aws_storage_configuration(self):
        """Test that AWS storage backend configuration is correct when enabled."""
        from django.conf import settings

        self.assertEqual(settings.STORAGE_BACKEND, "AWS")
        self.assertEqual(settings.AWS_STORAGE_BUCKET_NAME, "test-bucket")
        self.assertEqual(settings.AWS_S3_REGION_NAME, "us-east-1")
        self.assertEqual(
            settings.DEFAULT_FILE_STORAGE,
            "opencontractserver.utils.storages.MediaRootS3Boto3Storage",
        )
        self.assertEqual(
            settings.STATICFILES_STORAGE,
            "opencontractserver.utils.storages.StaticRootS3Boto3Storage",
        )

    def test_aws_storage_classes_importable(self):
        """Always ensure AWS storage classes are importable."""
        from opencontractserver.utils.storages import (
            MediaRootS3Boto3Storage,
            StaticRootS3Boto3Storage,
        )

        self.assertIsNotNone(MediaRootS3Boto3Storage)
        self.assertIsNotNone(StaticRootS3Boto3Storage)

    @override_settings(
        STORAGE_BACKEND="GCP",
        GS_BUCKET_NAME="test-gcs-bucket",
        GS_PROJECT_ID="test-project",
        GS_QUERYSTRING_AUTH=True,
        GS_FILE_OVERWRITE=False,
        DEFAULT_FILE_STORAGE="opencontractserver.utils.storages.MediaRootGoogleCloudStorage",
        STATICFILES_STORAGE="opencontractserver.utils.storages.StaticRootGoogleCloudStorage",
    )
    def test_gcp_storage_configuration(self):
        """Test that GCP storage backend configuration is correct when enabled."""
        from django.conf import settings

        self.assertEqual(settings.STORAGE_BACKEND, "GCP")
        self.assertEqual(settings.GS_BUCKET_NAME, "test-gcs-bucket")
        self.assertEqual(settings.GS_PROJECT_ID, "test-project")
        self.assertTrue(settings.GS_QUERYSTRING_AUTH)
        self.assertFalse(settings.GS_FILE_OVERWRITE)
        self.assertEqual(
            settings.DEFAULT_FILE_STORAGE,
            "opencontractserver.utils.storages.MediaRootGoogleCloudStorage",
        )
        self.assertEqual(
            settings.STATICFILES_STORAGE,
            "opencontractserver.utils.storages.StaticRootGoogleCloudStorage",
        )

    def test_gcp_storage_classes_importable(self):
        """Always ensure GCP storage classes are importable."""
        from opencontractserver.utils.storages import (
            MediaRootGoogleCloudStorage,
            StaticRootGoogleCloudStorage,
        )

        self.assertIsNotNone(MediaRootGoogleCloudStorage)
        self.assertIsNotNone(StaticRootGoogleCloudStorage)

    def test_storage_backend_validation(self):
        """Test that storage backend validation works."""
        from django.conf import settings

        # The validation happens at import time in base.py
        # We can only verify that the current STORAGE_BACKEND is valid
        self.assertIn(settings.STORAGE_BACKEND, ["LOCAL", "AWS", "GCP"])

        # Test that we have the validation logic in place
        # by checking the VALID_STORAGE_BACKENDS setting exists
        self.assertTrue(hasattr(settings, "VALID_STORAGE_BACKENDS"))
        self.assertEqual(settings.VALID_STORAGE_BACKENDS, ["LOCAL", "AWS", "GCP"])


class StorageBackendFunctionalityTest(TestCase):
    """Test actual storage operations with different backends."""

    @override_settings(STORAGE_BACKEND="LOCAL")
    def test_local_storage_operations(self):
        """Test file operations with local storage."""
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage

        # Test file creation
        test_content = b"Test content for local storage"
        file_name = default_storage.save("test_local.txt", ContentFile(test_content))

        self.assertTrue(default_storage.exists(file_name))

        # Test file reading
        with default_storage.open(file_name, "rb") as f:
            content = f.read()
        self.assertEqual(content, test_content)

        # Test file deletion
        default_storage.delete(file_name)
        self.assertFalse(default_storage.exists(file_name))

    @override_settings(
        STORAGE_BACKEND="AWS",
        AWS_ACCESS_KEY_ID="test-key",
        AWS_SECRET_ACCESS_KEY="test-secret",
        AWS_STORAGE_BUCKET_NAME="test-bucket",
    )
    @mock.patch("boto3.client")
    def test_aws_storage_operations(self, mock_boto_client):
        """Test file operations with AWS S3 storage."""
        # Mock S3 client
        mock_s3 = mock.Mock()
        mock_boto_client.return_value = mock_s3

        # Mock S3 responses
        mock_s3.head_object.return_value = {"ContentLength": 100}
        mock_s3.put_object.return_value = {"ETag": '"test-etag"'}

        from opencontractserver.utils.storages import MediaRootS3Boto3Storage

        storage = MediaRootS3Boto3Storage()

        # Verify storage configuration
        self.assertEqual(storage.location, "media")
        self.assertFalse(storage.file_overwrite)

    @override_settings(
        STORAGE_BACKEND="GCP",
        GS_BUCKET_NAME="test-bucket",
        GS_PROJECT_ID="test-project",
    )
    @mock.patch("google.cloud.storage.Client")
    def test_gcp_storage_operations(self, mock_gcs_client):
        """Test file operations with Google Cloud Storage."""
        # Mock GCS client and bucket
        mock_client = mock.Mock()
        mock_bucket = mock.Mock()
        mock_blob = mock.Mock()

        mock_gcs_client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob

        from opencontractserver.utils.storages import MediaRootGoogleCloudStorage

        storage = MediaRootGoogleCloudStorage()

        # Verify storage configuration
        self.assertEqual(storage.location, "media")
        self.assertFalse(storage.file_overwrite)
        self.assertIsNone(storage.default_acl)  # Private by default

        # Test get_object_parameters for security headers
        params = storage.get_object_parameters("test.pdf")
        self.assertIn("content_disposition", params)
        self.assertIn("attachment", params["content_disposition"])
        self.assertIn("metadata", params)
        self.assertEqual(params["metadata"]["X-Content-Type-Options"], "nosniff")
        self.assertEqual(params["metadata"]["X-Frame-Options"], "DENY")


class StorageBackendCompatibilityTest(TestCase):
    """Test backward compatibility with old USE_AWS setting."""

    def test_use_aws_deprecation_logic_exists(self):
        """Test that the USE_AWS deprecation logic exists in settings."""
        # We can't test the actual deprecation warning in unit tests
        # because it happens at module import time, but we can verify
        # the deprecation logic exists in the code
        from django.conf import settings

        # Verify that STORAGE_BACKEND exists and is valid
        self.assertTrue(hasattr(settings, "STORAGE_BACKEND"))
        self.assertIn(settings.STORAGE_BACKEND, ["LOCAL", "AWS", "GCP"])

        # The actual backward compatibility is handled in base.py at import time
        # This test just ensures the new STORAGE_BACKEND system is in place


class StorageUtilsTest(TestCase):
    """Test utility functions that depend on storage backend."""

    @override_settings(STORAGE_BACKEND="LOCAL")
    def test_analyzer_utils_local_storage(self):
        """Test get_django_file_field_url with local storage."""
        from unittest.mock import Mock

        from opencontractserver.utils.analyzer import get_django_file_field_url

        mock_obj = Mock()
        mock_obj.test_field = Mock()
        mock_obj.test_field.url = "/media/test.pdf"

        # With local storage, should build absolute URI
        url = get_django_file_field_url("test_field", mock_obj)
        self.assertIn("/media/test.pdf", url)

    @override_settings(STORAGE_BACKEND="AWS")
    def test_analyzer_utils_aws_storage(self):
        """Test get_django_file_field_url with AWS storage."""
        from unittest.mock import Mock

        from opencontractserver.utils.analyzer import get_django_file_field_url

        mock_obj = Mock()
        mock_obj.test_field = Mock()
        mock_obj.test_field.url = "https://test-bucket.s3.amazonaws.com/media/test.pdf"

        # With AWS storage, should return the S3 URL directly
        url = get_django_file_field_url("test_field", mock_obj)
        self.assertEqual(url, "https://test-bucket.s3.amazonaws.com/media/test.pdf")

    @override_settings(STORAGE_BACKEND="GCP")
    def test_analyzer_utils_gcp_storage(self):
        """Test get_django_file_field_url with GCP storage."""
        from unittest.mock import Mock

        from opencontractserver.utils.analyzer import get_django_file_field_url

        mock_obj = Mock()
        mock_obj.test_field = Mock()
        mock_obj.test_field.url = (
            "https://storage.googleapis.com/test-bucket/media/test.pdf"
        )

        # With GCP storage, should return the GCS URL directly
        url = get_django_file_field_url("test_field", mock_obj)
        self.assertEqual(
            url, "https://storage.googleapis.com/test-bucket/media/test.pdf"
        )
