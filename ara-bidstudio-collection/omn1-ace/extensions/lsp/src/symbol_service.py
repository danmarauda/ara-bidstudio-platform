"""
Symbol Service

High-level service for symbol-level file operations with caching,
compression, and metrics tracking.

This is the main entry point for MCP tools to interact with LSP functionality.
"""

import asyncio
import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

from .lsp_client_wrapper import LSPClientManager

logger = logging.getLogger(__name__)


class SymbolService:
    """
    High-level service for symbol-level operations.

    Features:
    - Automatic language detection
    - Result caching
    - Metrics tracking
    - Compression integration
    - Error handling and fallbacks

    Usage:
        service = SymbolService()
        await service.start()

        # Read specific symbol
        result = await service.read_symbol("auth.py", "authenticate")

        # Get file overview
        overview = await service.get_overview("auth.py")

        await service.stop()
    """

    def __init__(self, workspace_root: Optional[str] = None):
        """
        Initialize symbol service.

        Args:
            workspace_root: Root directory of the workspace
        """
        self.workspace_root = workspace_root or str(Path.cwd())
        self.lsp_manager = LSPClientManager(workspace_root=self.workspace_root)
        self.cache: Dict[str, Any] = {}
        self.metrics = {
            "total_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "total_tokens_saved": 0,
            "errors": 0,
        }
        logger.info("Initialized Symbol Service")

    async def start(self):
        """Start the symbol service."""
        logger.info("Symbol service started")

    async def stop(self):
        """Stop the symbol service and cleanup."""
        await self.lsp_manager.stop_all()
        logger.info("Symbol service stopped")

    async def read_symbol(
        self, file_path: str, symbol: str, compress: bool = True
    ) -> Dict[str, Any]:
        """
        Read a specific symbol from a file.

        Args:
            file_path: Path to the file
            symbol: Symbol name to read
            compress: Apply compression to result (default: True)

        Returns:
            Dictionary with symbol content and metadata
        """
        self.metrics["total_requests"] += 1

        try:
            # Check cache
            cache_key = self._get_cache_key(file_path, symbol)
            if cache_key in self.cache:
                self.metrics["cache_hits"] += 1
                logger.debug(f"Cache hit for {file_path}:{symbol}")
                return self.cache[cache_key]

            self.metrics["cache_misses"] += 1

            # Get LSP client for file
            client = await self.lsp_manager.get_client_for_file(file_path)
            if not client:
                return self._error_response(
                    f"Unsupported file type: {Path(file_path).suffix}"
                )

            # Get symbol content
            result = await client.get_symbol_content(file_path, symbol)

            if not result:
                return self._error_response(
                    f"Symbol '{symbol}' not found in {file_path}"
                )

            # Track metrics
            self.metrics["total_tokens_saved"] += result.get("tokens_saved", 0)

            # Apply compression if requested
            if compress:
                result = await self._compress_result(result)

            # Cache result
            self.cache[cache_key] = result

            # Add service metadata
            result["service"] = {
                "cache_hit": False,
                "timestamp": datetime.utcnow().isoformat(),
                "compressed": compress,
            }

            return result

        except Exception as e:
            self.metrics["errors"] += 1
            logger.error(f"Error reading symbol: {e}")
            return self._error_response(str(e))

    async def get_overview(
        self, file_path: str, include_details: bool = False, compress: bool = True
    ) -> Dict[str, Any]:
        """
        Get structural overview of a file.

        Args:
            file_path: Path to the file
            include_details: Include signatures and docstrings
            compress: Apply compression to result

        Returns:
            Dictionary with file structure overview
        """
        self.metrics["total_requests"] += 1

        try:
            # Check cache
            cache_key = self._get_cache_key(file_path, f"overview_{include_details}")
            if cache_key in self.cache:
                self.metrics["cache_hits"] += 1
                logger.debug(f"Cache hit for overview: {file_path}")
                return self.cache[cache_key]

            self.metrics["cache_misses"] += 1

            # Get LSP client for file
            client = await self.lsp_manager.get_client_for_file(file_path)
            if not client:
                return self._error_response(
                    f"Unsupported file type: {Path(file_path).suffix}"
                )

            # Get file overview
            result = await client.get_file_overview(file_path, include_details)

            if not result:
                return self._error_response(f"Failed to get overview for {file_path}")

            # Track metrics
            self.metrics["total_tokens_saved"] += result.get("tokens_saved", 0)

            # Apply compression if requested
            if compress:
                result = await self._compress_result(result)

            # Cache result
            self.cache[cache_key] = result

            # Add service metadata
            result["service"] = {
                "cache_hit": False,
                "timestamp": datetime.utcnow().isoformat(),
                "compressed": compress,
            }

            return result

        except Exception as e:
            self.metrics["errors"] += 1
            logger.error(f"Error getting overview: {e}")
            return self._error_response(str(e))

    async def find_references(self, file_path: str, symbol: str) -> Dict[str, Any]:
        """
        Find all references to a symbol.

        Args:
            file_path: File containing the symbol
            symbol: Symbol name

        Returns:
            Dictionary with reference locations
        """
        self.metrics["total_requests"] += 1

        try:
            # Get LSP client for file
            client = await self.lsp_manager.get_client_for_file(file_path)
            if not client:
                return self._error_response(
                    f"Unsupported file type: {Path(file_path).suffix}"
                )

            # Find references
            references = await client.find_references(file_path, symbol)

            result = {
                "symbol": symbol,
                "file_path": file_path,
                "references": references,
                "total_references": len(references),
                "service": {"timestamp": datetime.utcnow().isoformat()},
            }

            return result

        except Exception as e:
            self.metrics["errors"] += 1
            logger.error(f"Error finding references: {e}")
            return self._error_response(str(e))

    async def _compress_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply OmniMemory compression to result.

        This would integrate with the existing compression service.
        For now, it's a placeholder.
        """
        # TODO: Integrate with OmniMemory compression service
        # result["compressed_content"] = compress(result["content"])
        return result

    def _get_cache_key(self, file_path: str, operation: str) -> str:
        """Generate cache key for a file operation."""
        # Include file modification time in cache key
        try:
            mtime = Path(file_path).stat().st_mtime
            key_str = f"{file_path}:{operation}:{mtime}"
            return hashlib.md5(key_str.encode()).hexdigest()
        except Exception:
            return hashlib.md5(f"{file_path}:{operation}".encode()).hexdigest()

    def _error_response(self, message: str) -> Dict[str, Any]:
        """Create error response."""
        return {
            "error": True,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def get_metrics(self) -> Dict[str, Any]:
        """Get service metrics."""
        cache_rate = 0.0
        if self.metrics["total_requests"] > 0:
            cache_rate = self.metrics["cache_hits"] / self.metrics["total_requests"]

        return {
            **self.metrics,
            "cache_hit_rate": round(cache_rate * 100, 2),
            "avg_tokens_saved_per_request": round(
                self.metrics["total_tokens_saved"]
                / max(self.metrics["total_requests"], 1),
                2,
            ),
        }

    def get_status(self) -> Dict[str, Any]:
        """Get service status."""
        return {
            "service": "symbol_service",
            "status": "running",
            "workspace_root": self.workspace_root,
            "lsp_clients": self.lsp_manager.get_status(),
            "metrics": self.get_metrics(),
            "cache_size": len(self.cache),
        }
