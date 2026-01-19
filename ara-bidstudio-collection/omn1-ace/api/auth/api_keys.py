"""
API Key Authentication System

All users (free, pro, team) require API keys.
Unlike OpenMemory (no auth) and SuperMemory (unclear auth).
"""

import os
import hashlib
import secrets
from typing import Optional, Dict
from datetime import datetime, timedelta
import asyncpg


class APIKeyManager:
    """
    Manage API keys for all tiers
    """

    def __init__(self, db_url: str):
        self.db_url = db_url
        self.pool = None

    async def initialize(self):
        """Initialize database connection pool"""
        self.pool = await asyncpg.create_pool(self.db_url, min_size=2, max_size=10)

    def generate_api_key(self) -> str:
        """
        Generate secure API key

        Format: omn1_sk_<32 chars>
        """
        random_part = secrets.token_urlsafe(24)
        return f"omn1_sk_{random_part}"

    async def create_user(self, email: str, tier: str = "free") -> Dict[str, str]:
        """
        Create new user with API key

        Args:
            email: User email
            tier: "free", "pro", or "team"

        Returns:
            {"user_id": ..., "api_key": ..., "tier": ...}
        """
        api_key = self.generate_api_key()
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        async with self.pool.acquire() as conn:
            user_id = await conn.fetchval(
                """
                INSERT INTO users (email, api_key_hash, tier, created_at)
                VALUES ($1, $2, $3, $4)
                RETURNING user_id
                """,
                email,
                api_key_hash,
                tier,
                datetime.utcnow(),
            )

        return {
            "user_id": str(user_id),
            "api_key": api_key,  # Show ONCE, never again
            "tier": tier,
            "created_at": datetime.utcnow().isoformat(),
        }

    async def verify_api_key(self, api_key: str) -> Optional[Dict]:
        """
        Verify API key and return user info

        Args:
            api_key: API key from request header

        Returns:
            User dict or None if invalid
        """
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT user_id, email, tier, team_id, created_at
                FROM users
                WHERE api_key_hash = $1
                  AND (expires_at IS NULL OR expires_at > $2)
                """,
                api_key_hash,
                datetime.utcnow(),
            )

        if not row:
            return None

        return {
            "user_id": str(row["user_id"]),
            "email": row["email"],
            "tier": row["tier"],
            "team_id": str(row["team_id"]) if row["team_id"] else None,
        }


# Global instance
_api_key_manager = None


async def get_api_key_manager() -> APIKeyManager:
    """Get global API key manager instance"""
    global _api_key_manager
    if _api_key_manager is None:
        db_url = os.getenv(
            "DATABASE_URL", "postgresql://omn1:password@localhost:5432/omn1_ace"
        )
        _api_key_manager = APIKeyManager(db_url)
        await _api_key_manager.initialize()
    return _api_key_manager


async def verify_api_key(api_key: str) -> Optional[Dict]:
    """Verify API key (convenience function)"""
    manager = await get_api_key_manager()
    return await manager.verify_api_key(api_key)


def get_user_tier(user: Dict) -> str:
    """Extract tier from user dict"""
    return user.get("tier", "free")
