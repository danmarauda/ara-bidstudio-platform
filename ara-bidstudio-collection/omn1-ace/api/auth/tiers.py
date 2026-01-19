"""
Tier System: Free → Pro → Team

Clear monetization model (unlike SuperMemory's "impossible to monetize")
"""

from typing import Dict
from datetime import datetime, timedelta
import asyncpg


# ============================================================================
# Tier Definitions
# ============================================================================

TIERS = {
    "free": {
        "name": "Free",
        "price_monthly": 0,
        "limits": {
            "requests_per_day": 100,
            "searches_per_day": 50,
            "tokens_per_month": 1_000_000,
            "projects": 1,
            "history_days": 7,
        },
        "features": [
            "Core anticipatory engine",
            "Basic predictions",
            "Personal cache",
            "7 days history",
        ],
    },
    "pro": {
        "name": "Pro",
        "price_monthly": 29,
        "limits": {
            "requests_per_day": 1_000,
            "searches_per_day": 500,
            "tokens_per_month": 10_000_000,
            "projects": -1,  # unlimited
            "history_days": 90,
        },
        "features": [
            "Everything in Free",
            "10× request limits",
            "Advanced predictions",
            "Priority support",
            "90 days history",
            "Unlimited projects",
        ],
    },
    "team": {
        "name": "Team",
        "price_monthly": 99,
        "limits": {
            "requests_per_day": 5_000,
            "searches_per_day": 2_500,
            "tokens_per_month": 50_000_000,
            "projects": -1,
            "history_days": 365,
            "team_members": 10,
        },
        "features": [
            "Everything in Pro",
            "50× request limits",
            "Team L2 cache sharing (80-90% savings)",  # UNIQUE TO US
            "Collective intelligence",  # UNIQUE TO US
            "Team analytics",
            "Up to 10 members",
            "1 year history",
        ],
    },
}


class TierLimits:
    """
    Rate limiting and quota enforcement
    """

    def __init__(self, db_pool):
        self.pool = db_pool

    async def get_usage_today(self, user_id: str) -> Dict[str, int]:
        """
        Get user's usage today

        Returns:
            {"requests": 45, "searches": 23, "tokens": 123456}
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    COALESCE(SUM(CASE WHEN operation_type = 'embed' THEN 1 ELSE 0 END), 0) as requests,
                    COALESCE(SUM(CASE WHEN operation_type = 'search' THEN 1 ELSE 0 END), 0) as searches,
                    COALESCE(SUM(tokens_used), 0) as tokens
                FROM usage_logs
                WHERE user_id = $1
                  AND DATE(created_at) = CURRENT_DATE
                """,
                user_id,
            )

        return {
            "requests": row["requests"],
            "searches": row["searches"],
            "tokens": row["tokens"],
        }

    async def check_limit(self, user_id: str, tier: str, operation: str) -> bool:
        """
        Check if user is within limits

        Args:
            user_id: User ID
            tier: "free", "pro", or "team"
            operation: "embed" or "search"

        Returns:
            True if within limits, False if exceeded
        """
        usage = await self.get_usage_today(user_id)
        limits = TIERS[tier]["limits"]

        if operation == "embed":
            return usage["requests"] < limits["requests_per_day"]
        elif operation == "search":
            return usage["searches"] < limits["searches_per_day"]
        else:
            return True

    async def record_usage(
        self,
        user_id: str,
        operation_type: str,
        tokens_used: int,
        tokens_saved: int,
    ):
        """
        Record usage for billing and analytics

        Args:
            user_id: User ID
            operation_type: "embed" or "search"
            tokens_used: Tokens used in operation
            tokens_saved: Tokens saved by optimization
        """
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO usage_logs
                    (user_id, operation_type, tokens_used, tokens_saved, created_at)
                VALUES ($1, $2, $3, $4, $5)
                """,
                user_id,
                operation_type,
                tokens_used,
                tokens_saved,
                datetime.utcnow(),
            )


# Global instance
_tier_limits = None


async def get_tier_limits() -> TierLimits:
    """Get global tier limits instance"""
    global _tier_limits
    if _tier_limits is None:
        from .api_keys import get_api_key_manager

        manager = await get_api_key_manager()
        _tier_limits = TierLimits(manager.pool)
    return _tier_limits


async def check_rate_limit(user_id: str, tier: str, operation: str) -> bool:
    """Check rate limit (convenience function)"""
    limits = await get_tier_limits()
    return await limits.check_limit(user_id, tier, operation)
