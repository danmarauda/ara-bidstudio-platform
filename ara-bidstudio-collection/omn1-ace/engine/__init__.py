"""
Omn1-ACE Anticipatory Engine

The core intelligence that makes us 85% predictive vs 0% for competitors.
"""

from .anticipation.multi_strategy_predictor import (
    MultiStrategyPredictor,
    Prediction,
)
from .anticipation.prefetcher import BackgroundPrefetcher

__all__ = [
    "MultiStrategyPredictor",
    "BackgroundPrefetcher",
    "Prediction",
]
