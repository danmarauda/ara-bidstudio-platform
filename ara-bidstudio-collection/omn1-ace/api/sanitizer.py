"""
Response Sanitizer - Hide ALL Technical Details from Users

Users should NEVER see:
- Database paths
- Service URLs
- Model names
- Compression ratios
- Cache tiers
- Internal implementation details

Users SHOULD see:
- "It's working"
- "You saved X tokens and $Y"
- "Here's your content"
"""

from typing import Dict, Any


class ResponseSanitizer:
    """
    Sanitize all responses to hide implementation details

    Philosophy: Users care about VALUE, not HOW
    """

    @staticmethod
    def sanitize_embed_response(raw: dict, mode: str = "user") -> dict:
        """
        Sanitize embedding response

        HIDE: embedding values, cache_tier, compression_ratio, etc.
        SHOW: optimized status, efficiency metrics
        """
        if mode == "internal":
            return raw  # Admin sees everything

        # User sees minimal, value-focused response
        return {
            "optimized": True,
            "efficiency": {
                "tokens_saved": raw.get("tokens_saved", 0),
                "cost_saved": f"${raw.get('tokens_saved', 0) * 0.000015:.4f}",
            },
        }

    @staticmethod
    def sanitize_search_response(raw: dict, mode: str = "user") -> dict:
        """
        Sanitize search response

        HIDE: search_mode, fusion_method, indexes used, etc.
        SHOW: results, relevance
        """
        if mode == "internal":
            return raw

        return {
            "results": [
                {"content": result["content"], "relevance": result.get("score", 1.0)}
                for result in raw.get("results", [])
            ]
        }

    @staticmethod
    def sanitize_prediction_response(raw: dict, mode: str = "user") -> dict:
        """
        Sanitize prediction response

        HIDE: strategy names, confidence scores, internal logic
        SHOW: suggested files
        """
        if mode == "internal":
            return raw

        return {
            "suggested_files": [
                pred["file"]
                for pred in raw.get("predictions", [])
                if pred.get("confidence", 0) > 0.7
            ]
        }

    @staticmethod
    def sanitize_health(raw: dict, mode: str = "user") -> dict:
        """
        Sanitize health check

        HIDE: database paths, service URLs, stack details
        SHOW: just status
        """
        if mode == "internal":
            # Even internal mode hides actual paths, just status
            return {
                "status": raw.get("status"),
                "services": raw.get("services", {}),  # "connected" not URLs
            }

        # User mode: minimal
        return {"status": raw.get("status", "unknown")}

    @staticmethod
    def sanitize_error(error: Exception, error_id: str) -> dict:
        """
        Sanitize error messages

        HIDE: Stack traces, internal paths, service names
        SHOW: User-friendly message, support ID
        """
        import logging

        logger = logging.getLogger(__name__)

        # Log full error server-side
        logger.error(f"Error {error_id}: {str(error)}", exc_info=error)

        # Return generic message to user
        return {
            "error": "An error occurred. Please try again.",
            "support_id": error_id,
            "help": "Contact support with this ID if the issue persists",
        }
