import base64
import logging
from typing import Any, Optional

import requests
from django.conf import settings
from django.core.files.storage import default_storage
from requests.exceptions import ConnectionError, RequestException, Timeout

from opencontractserver.documents.models import Document
from opencontractserver.pipeline.base.file_types import FileTypeEnum
from opencontractserver.pipeline.base.parser import BaseParser
from opencontractserver.types.dicts import OpenContractDocExport
from opencontractserver.utils.cloud import maybe_add_cloud_run_auth

logger = logging.getLogger(__name__)


class DoclingParser(BaseParser):
    """
    A parser that delegates PDF document parsing to a Docling microservice via REST API
    instead of running the processing locally. This helps isolate complex dependencies
    and improves performance by offloading processing to a dedicated container.
    """

    title = "Docling Parser (REST)"
    description = "Parses PDF documents using Docling microservice API."
    author = "OpenContracts Team"
    dependencies = ["requests"]
    supported_file_types = [FileTypeEnum.PDF]

    def __init__(self):
        """Initialize the Docling REST parser with service URL from settings."""
        super().__init__()  # Call to superclass __init__

        # Priority order for service URL:
        # 1. PIPELINE_SETTINGS configuration (if specified)
        # 2. Django settings attribute (which reads from env vars)
        # Note: Environment variables are ONLY read in Django settings, not here

        self.service_url = getattr(settings, "DOCLING_PARSER_SERVICE_URL")

        # Allow configuring the timeout
        self.request_timeout = getattr(settings, "DOCLING_PARSER_TIMEOUT")

        # Optional explicit flag to force Cloud Run IAM auth (useful for custom domains)
        self.use_cloud_run_iam_auth = bool(
            getattr(settings, "use_cloud_run_iam_auth", False)
        )

        logger.info(f"DoclingParser initialized with service URL: {self.service_url}")

    @staticmethod
    def _maybe_add_cloud_run_auth(
        url: str, headers: dict[str, str], force: bool = False
    ) -> dict[str, str]:
        """
        Attach an Authorization bearer with a Google Cloud Run identity token when applicable.

        Args:
            url: The service URL we are calling (used to derive target audience).
            headers: Existing headers to be augmented.
            force: If True, force adding IAM auth regardless of the domain.

        Returns:
            A possibly augmented headers dict. If token acquisition fails, returns original headers.
        """
        try:
            from urllib.parse import urlparse

            parsed = urlparse(url)
            is_cloud_run = parsed.scheme == "https" and parsed.netloc.endswith(
                ".run.app"
            )
            if not (is_cloud_run or force):
                return headers

            audience = f"{parsed.scheme}://{parsed.netloc}"

            # Lazy import to avoid hard dependency in non-GCP environments
            import google.auth.transport.requests
            import google.oauth2.id_token

            request = google.auth.transport.requests.Request()
            id_token = google.oauth2.id_token.fetch_id_token(request, audience)
            if id_token:
                headers["Authorization"] = f"Bearer {id_token}"
                logger.debug(
                    "Attached Google Cloud Run IAM id_token to Docling request headers."
                )
            else:
                logger.warning(
                    "Failed to obtain Google Cloud Run IAM id_token for Docling."
                )
        except Exception as e:
            logger.warning(f"Docling Cloud Run IAM auth header not added: {e}")
        return headers

    def _parse_document_impl(
        self, user_id: int, doc_id: int, **all_kwargs
    ) -> Optional[OpenContractDocExport]:
        """
        Delegates document parsing to the Docling microservice.

        Args:
            user_id (int): The ID of the user parsing the document.
            doc_id (int): The ID of the target Document in the database.
            **all_kwargs: Additional optional arguments (e.g. "force_ocr", "llm_enhanced_hierarchy", etc.)
                These can come from PIPELINE_SETTINGS or be passed directly.
                - force_ocr (bool): Force OCR processing even if text is detectable
                - roll_up_groups (bool): Roll up items under the same heading into single relationships
                - llm_enhanced_hierarchy (bool): Apply experimental LLM-based hierarchy enhancement

        Returns:
            Optional[OpenContractDocExport]: A dictionary containing the doc metadata,
            annotations ("labelled_text"), and relationships (including grouped relationships).
        """
        logger.info(
            f"DoclingParser - Parsing doc {doc_id} for user {user_id} with effective kwargs: {all_kwargs}"
        )

        document = Document.objects.get(pk=doc_id)
        doc_path = document.pdf_file.name

        # Get settings from all_kwargs (which includes PIPELINE_SETTINGS and direct_kwargs)
        force_ocr = all_kwargs.get("force_ocr", False)
        roll_up_groups = all_kwargs.get(
            "roll_up_groups", True
        )  # Defaulting to True as per original PARSER_KWARGS
        llm_enhanced_hierarchy = all_kwargs.get("llm_enhanced_hierarchy", False)

        if force_ocr:
            logger.info(
                "Force OCR is enabled - this adds extra processing time and may not be necessary. "
                "We normally try to intelligently determine if OCR is needed."
            )

        # Read the PDF file from storage
        try:
            with default_storage.open(doc_path, "rb") as pdf_file:
                pdf_bytes = pdf_file.read()

            # Convert PDF bytes to base64 for JSON request
            pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

            # Extract filename from path
            filename = doc_path.split("/")[-1]

            # Prepare the request payload
            payload = {
                "filename": filename,
                "pdf_base64": pdf_base64,
                "force_ocr": force_ocr,
                "roll_up_groups": roll_up_groups,
                "llm_enhanced_hierarchy": llm_enhanced_hierarchy,
            }

            # Send request to the microservice
            logger.info(f"Sending PDF to Docling parser service: {self.service_url}")
            try:
                headers: dict[str, str] = {"Content-Type": "application/json"}
                # Attach Cloud Run IAM id_token if applicable/forced
                headers = maybe_add_cloud_run_auth(
                    self.service_url, headers, force=self.use_cloud_run_iam_auth
                )

                response = requests.post(
                    self.service_url,
                    json=payload,
                    headers=headers,
                    timeout=self.request_timeout,
                )
                response.raise_for_status()  # Raise exception for 4XX/5XX responses
            except Timeout:
                logger.error(
                    f"Request to Docling parser service timed out after {self.request_timeout} seconds"
                )
                return None
            except ConnectionError:
                logger.error(
                    f"Failed to connect to Docling parser service at {self.service_url}"
                )
                return None
            except RequestException as e:
                logger.error(f"Request to Docling parser service failed: {e}")
                if hasattr(e, "response") and e.response:
                    logger.error(f"Response content: {e.response.text}")
                return None

            # Parse the response
            result = response.json()

            # Handle potential differences in field names (snake_case vs camelCase)
            normalized_result = self._normalize_response(result)

            logger.info(
                f"Successfully processed document {doc_id} through Docling parser service"
            )
            return normalized_result

        except Exception as e:
            import traceback

            stacktrace = traceback.format_exc()
            logger.error(f"Docling REST parser failed: {e}\n{stacktrace}")
            return None

    def _normalize_response(self, response_data: dict[str, Any]) -> dict[str, Any]:
        """
        Normalize the response to ensure compatibility with both snake_case and camelCase field names.

        Args:
            response_data: The raw response data from the microservice

        Returns:
            A normalized response with all required fields
        """
        # Dictionary of field name mappings: camelCase -> snake_case
        field_mappings = {
            "pawlsFileContent": "pawls_file_content",
            "pageCount": "page_count",
            "docLabels": "doc_labels",
            "labelledText": "labelled_text",
        }

        # Create a normalized response with both snake_case and camelCase keys
        normalized_data = {}

        for key, value in response_data.items():
            normalized_key = field_mappings.get(key, key)
            normalized_data[normalized_key] = value

            # If we have a snake_case name but the response used camelCase,
            # ensure we also include the camelCase name for backwards compatibility
            if key != normalized_key:
                normalized_data[key] = value

        return normalized_data
