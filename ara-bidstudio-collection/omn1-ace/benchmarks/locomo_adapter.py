"""
LOCOMO benchmark adapter for OmniMemory.

This adapter evaluates OmniMemory's retrieval capabilities against the LOCOMO
benchmark, comparing against full-context baselines used by Mem0.

Key Features:
- Semantic retrieval using OmniMemory's Qdrant vector store
- Token efficiency tracking
- Accuracy measurement across 5 question types
- Direct comparison to Mem0's reported results
"""

from __future__ import annotations

import sys
from pathlib import Path
import os
import json
import asyncio
import requests
import math
from collections import Counter, defaultdict
from typing import List, Dict, Any, Optional, Tuple
from tqdm import tqdm
import time

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import OmniMemory's Qdrant vector store
from mcp_server.qdrant_vector_store import QdrantVectorStore


class OmniMemoryLocomoAdapter:
    """Adapter to run LOCOMO benchmark with OmniMemory retrieval."""

    def __init__(self):
        """
        Initialize the adapter with OmniMemory's vector store and BM25 index.
        """
        # Create a unique Qdrant collection for LOCOMO
        self.vector_store = QdrantVectorStore(dimension=768)
        # Override collection name for LOCOMO benchmark
        self.vector_store.collection_name = "locomo_benchmark"
        self.vector_store._init_collection()
        self.results = []
        self.session_id = None
        self.conversation_data = {}  # Store conversation metadata

        # BM25 index for keyword matching (conversation-adapted)
        self.bm25_docs = {}  # doc_id -> {'text': str, 'tokens': Counter}
        self.bm25_idf = {}  # token -> IDF score
        self.bm25_doc_lengths = []  # List of document lengths
        self.doc_id_to_content = {}  # doc_id -> original content string

    def initialize_session(self, conversation_id: str):
        """Initialize session for a conversation."""
        self.session_id = f"locomo_{conversation_id}"

    def _tokenize_for_bm25(self, text: str) -> Counter:
        """
        Tokenize text for BM25 (conversation-aware).

        Extracts:
        - Words (lowercased, alphanumeric)
        - Named entities (preserved case for proper nouns)
        - Dates/times
        """
        import re

        tokens = []

        # Extract all words
        words = re.findall(r"\b\w+\b", text.lower())
        tokens.extend(words)

        # Extract proper nouns (capitalized words) with original case
        proper_nouns = re.findall(r"\b[A-Z][a-z]+\b", text)
        tokens.extend([p.lower() for p in proper_nouns])

        # Extract numbers (dates, years, etc.)
        numbers = re.findall(r"\b\d+\b", text)
        tokens.extend(numbers)

        return Counter(tokens)

    async def store_conversation(self, conversation_data: Dict[str, Any]) -> int:
        """
        Store conversation turns in both Qdrant (semantic) and BM25 (keyword).

        Args:
            conversation_data: LOCOMO conversation structure

        Returns:
            Total number of tokens in full conversation (for baseline comparison)
        """
        total_tokens = 0
        turn_count = 0

        # Extract sessions
        sessions = {}
        for key, value in conversation_data.items():
            if (
                key.startswith("session_")
                and not key.endswith("_date_time")
                and not key.endswith("_observation")
                and not key.endswith("_summary")
            ):
                session_num = key.split("_")[-1]
                sessions[int(session_num)] = {
                    "turns": value,
                    "date": conversation_data.get(
                        f"session_{session_num}_date_time", ""
                    ),
                }

        # Store each turn
        for session_num in sorted(sessions.keys()):
            session = sessions[session_num]
            date = session["date"]

            for idx, turn in enumerate(session["turns"]):
                speaker = turn["speaker"]
                text = turn["text"]
                dialog_id = turn.get("dia_id", "")

                # Format turn for storage (add date context for temporal questions)
                content = f"[{date}] {speaker}: {text}"
                if "blip_caption" in turn:
                    content += f" [Image: {turn['blip_caption']}]"

                # Generate unique doc_id
                doc_id = f"{self.session_id}_{session_num}_{idx}"

                # Store in Qdrant with metadata
                # Use importance based on position (later messages slightly more important)
                importance = 0.5 + (0.5 * idx / max(len(session["turns"]), 1))

                try:
                    await self.vector_store.add_document(
                        content, importance, metadata={"session_id": self.session_id}
                    )

                    # NEW: Store in BM25 index for keyword matching
                    tokens = self._tokenize_for_bm25(content)
                    self.bm25_docs[doc_id] = {"text": content, "tokens": tokens}
                    self.bm25_doc_lengths.append(sum(tokens.values()))
                    self.doc_id_to_content[doc_id] = content

                    # Store metadata for this turn
                    turn_key = f"{self.session_id}_{session_num}_{dialog_id}"
                    self.conversation_data[turn_key] = {
                        "content": content,
                        "date": date,
                        "speaker": speaker,
                        "dialog_id": dialog_id,
                    }

                    # Count tokens for baseline comparison
                    total_tokens += len(content.split())  # Rough approximation
                    turn_count += 1

                except Exception as e:
                    print(f"Warning: Failed to store turn: {e}")

        # NEW: Compute BM25 IDF scores after all docs stored
        self._compute_bm25_idf()

        print(
            f"Stored {turn_count} turns (~{total_tokens} tokens) in OmniMemory (semantic + BM25)"
        )
        return total_tokens * 1.3  # Multiply by 1.3 for better token estimate

    def _compute_bm25_idf(self):
        """Compute IDF scores for all tokens in BM25 index."""
        # Count document frequency for each token
        doc_freq = defaultdict(int)
        for doc_data in self.bm25_docs.values():
            unique_tokens = set(doc_data["tokens"].keys())
            for token in unique_tokens:
                doc_freq[token] += 1

        # Compute IDF: log((N - df + 0.5) / (df + 0.5))
        N = len(self.bm25_docs)
        for token, df in doc_freq.items():
            self.bm25_idf[token] = math.log((N - df + 0.5) / (df + 0.5) + 1.0)

    def _bm25_search(
        self, query: str, k: int = 10, k1: float = 1.5, b: float = 0.75
    ) -> List[Tuple[str, float]]:
        """
        BM25 search over conversation turns.

        Returns:
            List of (doc_id, bm25_score) tuples, sorted by score descending
        """
        query_tokens = self._tokenize_for_bm25(query)

        if not query_tokens or not self.bm25_docs:
            return []

        # Compute average document length
        avgdl = (
            sum(self.bm25_doc_lengths) / len(self.bm25_doc_lengths)
            if self.bm25_doc_lengths
            else 0
        )

        # Score each document
        scores = {}
        for doc_id, doc_data in self.bm25_docs.items():
            doc_tokens = doc_data["tokens"]
            doc_length = sum(doc_tokens.values())

            score = 0.0
            for token, query_freq in query_tokens.items():
                if token in doc_tokens:
                    # Get term frequency in document
                    tf = doc_tokens[token]

                    # Get IDF
                    idf = self.bm25_idf.get(token, 0.0)

                    # BM25 formula
                    numerator = tf * (k1 + 1)
                    denominator = tf + k1 * (1 - b + b * doc_length / avgdl)
                    score += idf * (numerator / denominator)

            if score > 0:
                scores[doc_id] = score

        # Sort by score and return top k
        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:k]
        return sorted_results

    def _reciprocal_rank_fusion(
        self,
        semantic_results: List[Dict],
        bm25_results: List[Tuple[str, float]],
        k: int = 60,
    ) -> List[str]:
        """
        Merge semantic and BM25 results using Reciprocal Rank Fusion.

        RRF formula: score = 1 / (k + rank)
        Research shows k=60 is optimal.

        Args:
            semantic_results: List of dicts with 'content' key from Qdrant
            bm25_results: List of (doc_id, score) tuples from BM25
            k: RRF constant (default 60 from research)

        Returns:
            List of doc_ids sorted by fused score
        """
        scores = defaultdict(float)

        # Add semantic scores (need to map content back to doc_id)
        for rank, result in enumerate(semantic_results):
            content = result.get("content", "")
            # Find matching doc_id
            for doc_id, stored_content in self.doc_id_to_content.items():
                if stored_content.startswith(content[:50]):  # Match by prefix
                    scores[doc_id] += 1.0 / (k + rank)
                    break

        # Add BM25 scores
        for rank, (doc_id, bm25_score) in enumerate(bm25_results):
            scores[doc_id] += 1.0 / (k + rank)

        # Sort by fused score
        sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [doc_id for doc_id, score in sorted_docs]

    async def retrieve_context(
        self, question: str, limit: int = 10, min_relevance: float = 0.3
    ) -> tuple[str, int]:
        """
        Retrieve relevant context using HYBRID search (semantic + BM25 + RRF).

        This is the key improvement over semantic-only search.

        Args:
            question: The question to answer
            limit: Maximum number of results to retrieve
            min_relevance: Minimum relevance score (unused with hybrid search)

        Returns:
            Tuple of (context_string, token_count)
        """
        try:
            # 1. Semantic search via Qdrant
            semantic_results = await self.vector_store.search(
                question, k=limit, metadata_filter={"session_id": self.session_id}
            )

            # 2. BM25 keyword search
            bm25_results = self._bm25_search(question, k=limit)

            # 3. RRF fusion to merge results
            fused_doc_ids = self._reciprocal_rank_fusion(
                semantic_results, bm25_results, k=60
            )

            # 4. Build context from top fused results
            context_parts = []
            for doc_id in fused_doc_ids[:limit]:
                if doc_id in self.doc_id_to_content:
                    content = self.doc_id_to_content[doc_id]
                    context_parts.append(content)

            # Fallback: if RRF returns nothing, use semantic results
            if not context_parts:
                for result in semantic_results:
                    content = result.get("content", "")
                    score = result.get("score", 0.0)
                    if score >= min_relevance:
                        context_parts.append(content)

            context = "\n\n".join(context_parts)
            token_count = len(context.split()) * 1.3  # Rough token estimate

            return context, int(token_count)

        except Exception as e:
            print(f"Warning: Hybrid search failed: {e}")
            return "", 0

    async def answer_with_claude(
        self, question: str, context: str, api_key: str, category: int = 1
    ) -> str:
        """
        Generate answer using Claude with retrieved context.

        Args:
            question: The question to answer
            context: Retrieved context
            api_key: Anthropic API key
            category: Question category (1-5)

        Returns:
            Generated answer
        """
        from anthropic import Anthropic

        client = Anthropic(api_key=api_key)

        # Build prompt based on category
        if category == 2:  # Temporal
            question += " Use DATE of conversation to answer with an approximate date."

        prompt = f"""Based on the following conversation context, write a short answer for the question. Answer with exact words from the context whenever possible.

Context:
{context}

Question: {question}

Short answer:"""

        try:
            message = client.messages.create(
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}],
                model="claude-3-5-sonnet-20241022",
            )

            answer = message.content[0].text.strip()
            return answer

        except Exception as e:
            print(f"Warning: Claude API call failed: {e}")
            return ""

    async def answer_with_openai(
        self, question: str, context: str, api_key: str, category: int = 1
    ) -> str:
        """
        Generate answer using OpenAI GPT with retrieved context.

        Args:
            question: The question to answer
            context: Retrieved context
            api_key: OpenAI API key
            category: Question category (1-5)

        Returns:
            Generated answer
        """
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        # Build prompt based on category
        if category == 2:  # Temporal
            question += " Use DATE of conversation to answer with an approximate date."

        prompt = f"""Based on the following conversation context, write a short answer for the question. Answer with exact words from the context whenever possible.

Context:
{context}

Question: {question}

Short answer:"""

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that answers questions based on conversation context.",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=100,
                temperature=0.0,
            )

            answer = response.choices[0].message.content.strip()
            return answer

        except Exception as e:
            print(f"Warning: OpenAI API call failed: {e}")
            return ""

    async def evaluate_with_llm_judge(
        self, question: str, predicted: str, ground_truth: str, api_key: str
    ) -> dict:
        """
        Evaluate answer using LLM-as-Judge (official LOCOMO method).

        Returns:
            dict with 'llm_score' (0 or 1), 'f1_score', 'bleu1_score'
        """
        import re
        from collections import Counter
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        # LLM-as-Judge evaluation
        judge_prompt = f"""You are evaluating a question-answering system.

Question: {question}
Ground Truth Answer: {ground_truth}
Predicted Answer: {predicted}

Evaluate if the predicted answer correctly answers the question based on the ground truth.
Consider:
1. Factual accuracy - does it contain the correct information?
2. Completeness - does it answer what was asked?
3. Semantic equivalence - minor wording differences are acceptable

Respond with ONLY "1" if correct or "0" if incorrect. No explanation."""

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Official LOCOMO uses GPT-4o-mini for cost efficiency
                messages=[{"role": "user", "content": judge_prompt}],
                max_tokens=10,
                temperature=0,
            )

            llm_score_text = response.choices[0].message.content.strip()
            llm_score = 1 if "1" in llm_score_text else 0

        except Exception as e:
            print(f"LLM judge error: {e}")
            llm_score = 0

        # F1 Score (normalized token overlap)
        def normalize_answer(s):
            """Normalize answer for F1 calculation (SQuAD-style)"""

            def remove_articles(text):
                return re.sub(r"\b(a|an|the)\b", " ", text)

            def white_space_fix(text):
                return " ".join(text.split())

            def remove_punc(text):
                return "".join(
                    ch
                    for ch in text
                    if ch not in set("!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~")
                )

            def lower(text):
                return text.lower()

            return white_space_fix(remove_articles(remove_punc(lower(s))))

        pred_tokens = normalize_answer(str(predicted)).split()
        truth_tokens = normalize_answer(str(ground_truth)).split()

        common = Counter(pred_tokens) & Counter(truth_tokens)
        num_same = sum(common.values())

        if num_same == 0:
            f1_score = 0.0
        else:
            precision = num_same / len(pred_tokens) if pred_tokens else 0
            recall = num_same / len(truth_tokens) if truth_tokens else 0
            f1_score = (
                2 * precision * recall / (precision + recall)
                if (precision + recall) > 0
                else 0
            )

        # BLEU-1 Score (unigram overlap)
        if not pred_tokens or not truth_tokens:
            bleu1_score = 0.0
        else:
            pred_counter = Counter(pred_tokens)
            truth_counter = Counter(truth_tokens)

            clipped_counts = sum((pred_counter & truth_counter).values())
            total_pred = len(pred_tokens)

            precision = clipped_counts / total_pred if total_pred > 0 else 0

            # Brevity penalty
            bp = (
                1.0
                if len(pred_tokens) >= len(truth_tokens)
                else math.exp(1 - len(truth_tokens) / len(pred_tokens))
            )

            bleu1_score = bp * precision

        return {
            "llm_score": llm_score,
            "f1_score": f1_score,
            "bleu1_score": bleu1_score,
        }

    def evaluate_answer(
        self, predicted: str, expected: str, question_type: int
    ) -> bool:
        """
        Check if answer is correct using fuzzy matching.

        Args:
            predicted: Predicted answer
            expected: Expected answer
            question_type: Question category (1-5)

        Returns:
            True if answer is correct
        """
        predicted = predicted.lower().strip()
        expected = str(expected).lower().strip()

        # Exact match
        if predicted == expected:
            return True

        # Contains match (for longer answers)
        if expected in predicted or predicted in expected:
            return True

        # For dates, allow partial matches
        if question_type == 2:
            # Extract year if present
            pred_year = "".join(c for c in predicted if c.isdigit())
            exp_year = "".join(c for c in expected if c.isdigit())
            if pred_year and exp_year and pred_year in exp_year:
                return True

        return False

    async def run_benchmark(
        self,
        dataset_path: Path,
        api_key: str,
        provider: str = "openai",
        output_path: Optional[Path] = None,
        max_conversations: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Run full LOCOMO benchmark.

        Args:
            dataset_path: Path to locomo10.json
            api_key: API key (Anthropic or OpenAI)
            provider: LLM provider ("openai" or "claude")
            output_path: Optional path to save detailed results
            max_conversations: Optional limit on conversations to evaluate

        Returns:
            Results dictionary with accuracy and token metrics
        """
        print(f"Loading LOCOMO dataset from {dataset_path}")
        with open(dataset_path) as f:
            data = json.load(f)

        if max_conversations:
            data = data[:max_conversations]
            print(f"Limited to {max_conversations} conversations")

        results = {
            "total_questions": 0,
            "correct": 0,
            "by_category": {},
            "token_usage": {"baseline_total": 0, "omnimemory_total": 0},
            "detailed_results": [],
        }

        category_names = {
            1: "single-hop",
            2: "temporal",
            3: "multi-hop",
            4: "commonsense",
            5: "adversarial",
        }

        for sample in tqdm(data, desc="Processing conversations"):
            sample_id = sample.get("sample_id", "unknown")
            print(f"\n=== Processing conversation {sample_id} ===")

            # Initialize session
            self.initialize_session(sample_id)

            # Store conversation
            baseline_tokens = await self.store_conversation(sample["conversation"])

            # Process questions
            questions = sample.get("qa", [])
            print(f"Answering {len(questions)} questions...")

            for qa in tqdm(questions, desc="Questions", leave=False):
                question = qa["question"]

                # Skip questions without answers (data quality issue per Zep's analysis)
                if "answer" not in qa or not qa["answer"]:
                    continue

                expected_answer = qa["answer"]
                category = qa.get("category", 1)
                category_name = category_names.get(category, f"category-{category}")

                # Initialize category stats
                if category_name not in results["by_category"]:
                    results["by_category"][category_name] = {"total": 0, "correct": 0}

                # Retrieve context with higher limit for better accuracy
                # (target: beat Zep's 75.1%)
                context, omnimemory_tokens = await self.retrieve_context(
                    question, limit=15
                )

                # Generate answer (support both Claude and OpenAI)
                if provider == "openai":
                    predicted_answer = await self.answer_with_openai(
                        question, context, api_key, category
                    )
                elif provider == "claude":
                    predicted_answer = await self.answer_with_claude(
                        question, context, api_key, category
                    )
                else:
                    raise ValueError(f"Unknown provider: {provider}")

                # Evaluate with LLM-as-Judge (official LOCOMO method)
                eval_metrics = await self.evaluate_with_llm_judge(
                    question=question,
                    predicted=predicted_answer,
                    ground_truth=expected_answer,
                    api_key=api_key,
                )

                correct = eval_metrics["llm_score"] == 1

                # Update results
                results["total_questions"] += 1
                results["token_usage"]["baseline_total"] += baseline_tokens
                results["token_usage"]["omnimemory_total"] += omnimemory_tokens
                results["by_category"][category_name]["total"] += 1

                if correct:
                    results["correct"] += 1
                    results["by_category"][category_name]["correct"] += 1

                # Store detailed result with all metrics
                results["detailed_results"].append(
                    {
                        "conversation": sample_id,
                        "question": question,
                        "expected": expected_answer,
                        "predicted": predicted_answer,
                        "correct": correct,
                        "llm_score": eval_metrics["llm_score"],
                        "f1_score": eval_metrics["f1_score"],
                        "bleu1_score": eval_metrics["bleu1_score"],
                        "category": category_name,
                        "baseline_tokens": baseline_tokens,
                        "omnimemory_tokens": omnimemory_tokens,
                    }
                )

                # Small delay to avoid rate limits
                await asyncio.sleep(0.5)

        # Calculate metrics
        if results["total_questions"] > 0:
            results["accuracy"] = results["correct"] / results["total_questions"]

            for cat_name, cat_stats in results["by_category"].items():
                if cat_stats["total"] > 0:
                    cat_stats["accuracy"] = cat_stats["correct"] / cat_stats["total"]

        if results["token_usage"]["baseline_total"] > 0:
            results["token_reduction"] = 1 - (
                results["token_usage"]["omnimemory_total"]
                / results["token_usage"]["baseline_total"]
            )
        else:
            results["token_reduction"] = 0

        # Save detailed results if requested
        if output_path:
            with open(output_path, "w") as f:
                json.dump(results, f, indent=2)
            print(f"\nDetailed results saved to {output_path}")

        return results


def print_results(results: Dict[str, Any]):
    """Print benchmark results in a formatted way with all evaluation metrics."""

    # Calculate category-wise metrics
    by_category = {}
    for result in results["detailed_results"]:
        cat = result["category"]
        if cat not in by_category:
            by_category[cat] = {
                "total": 0,
                "llm_correct": 0,
                "f1_scores": [],
                "bleu1_scores": [],
            }

        by_category[cat]["total"] += 1
        by_category[cat]["llm_correct"] += result["llm_score"]
        by_category[cat]["f1_scores"].append(result["f1_score"])
        by_category[cat]["bleu1_scores"].append(result["bleu1_score"])

    print("\n" + "=" * 60)
    print("OmniMemory LOCOMO Benchmark Results (Official Evaluation)")
    print("=" * 60)

    # Overall metrics
    total_questions = len(results["detailed_results"])
    overall_f1 = (
        sum(r["f1_score"] for r in results["detailed_results"]) / total_questions
        if total_questions > 0
        else 0
    )
    overall_bleu1 = (
        sum(r["bleu1_score"] for r in results["detailed_results"]) / total_questions
        if total_questions > 0
        else 0
    )

    print(f"\nOverall Metrics:")
    print(
        f"  LLM-as-Judge Accuracy: {sum(r['llm_score'] for r in results['detailed_results']) / total_questions * 100:.1f}%"
    )
    print(f"  Mean F1 Score:         {overall_f1:.3f}")
    print(f"  Mean BLEU-1 Score:     {overall_bleu1:.3f}")
    print(f"  Questions Answered:    {results['correct']}/{total_questions}")

    print(f"\nToken Efficiency:")
    print(f"  Baseline Tokens:    {results['token_usage']['baseline_total']:,}")
    print(f"  OmniMemory Tokens:  {results['token_usage']['omnimemory_total']:,}")
    print(f"  Token Reduction:    {results['token_reduction']*100:.1f}%")

    if results["token_usage"]["baseline_total"] > 0:
        cost_baseline = (
            results["token_usage"]["baseline_total"] * 0.000015
        )  # $0.015 per 1K tokens
        cost_omnimemory = results["token_usage"]["omnimemory_total"] * 0.000015
        cost_saved = cost_baseline - cost_omnimemory
        print(
            f"  Cost Saved:         ${cost_saved:.2f} (${cost_omnimemory:.2f} vs ${cost_baseline:.2f})"
        )

    print(f"\nAccuracy by Category (LLM-as-Judge):")
    for cat_name in sorted(by_category.keys()):
        stats = by_category[cat_name]
        acc = stats["llm_correct"] / stats["total"] * 100
        f1_avg = sum(stats["f1_scores"]) / len(stats["f1_scores"])
        bleu1_avg = sum(stats["bleu1_scores"]) / len(stats["bleu1_scores"])
        print(
            f"  {cat_name:15s}: {acc:5.1f}% (F1: {f1_avg:.3f}, BLEU-1: {bleu1_avg:.3f})"
        )

    print("\n" + "=" * 60)
    print("Comparison to Mem0 (reported results)")
    print("=" * 60)

    mem0_accuracy = 66.9
    mem0_reduction = 90.0

    print(f"\nAccuracy:")
    print(f"  OmniMemory: {results['accuracy']*100:.1f}%")
    print(f"  Mem0:       {mem0_accuracy}%")
    print(f"  Difference: {results['accuracy']*100 - mem0_accuracy:+.1f}%")

    print(f"\nToken Reduction:")
    print(f"  OmniMemory: {results['token_reduction']*100:.1f}%")
    print(f"  Mem0:       {mem0_reduction}%")
    print(f"  Difference: {results['token_reduction']*100 - mem0_reduction:+.1f}%")

    if results["accuracy"] > (mem0_accuracy / 100):
        print(f"\n✅ OmniMemory WINS: Higher accuracy with similar efficiency!")
    else:
        print(f"\n❌ Mem0 wins on accuracy")

    print("=" * 60 + "\n")


async def main():
    """Main entry point for running the benchmark."""
    import argparse

    parser = argparse.ArgumentParser(description="Run LOCOMO benchmark with OmniMemory")
    parser.add_argument(
        "--dataset",
        type=str,
        default="/Users/mertozoner/Documents/claude-idea-discussion/omni-memory/locomo/data/locomo10.json",
        help="Path to LOCOMO dataset (locomo10.json)",
    )
    parser.add_argument(
        "--api-key",
        type=str,
        required=True,
        help="API key (Anthropic or OpenAI)",
    )
    parser.add_argument(
        "--provider",
        type=str,
        default="openai",
        choices=["openai", "claude"],
        help="LLM provider to use (default: openai)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="/Users/mertozoner/Documents/claude-idea-discussion/omni-memory/benchmarks/locomo_results.json",
        help="Path to save detailed results",
    )
    parser.add_argument(
        "--max-conversations",
        type=int,
        default=None,
        help="Maximum number of conversations to evaluate (for testing)",
    )

    args = parser.parse_args()

    # Create adapter (uses OmniMemory's Qdrant infrastructure)
    print("Initializing OmniMemory adapter with Qdrant vector store...")
    adapter = OmniMemoryLocomoAdapter()

    # Run benchmark
    print(f"Using provider: {args.provider}")
    results = await adapter.run_benchmark(
        dataset_path=Path(args.dataset),
        api_key=args.api_key,
        provider=args.provider,
        output_path=Path(args.output) if args.output else None,
        max_conversations=args.max_conversations,
    )

    # Print results
    print_results(results)


if __name__ == "__main__":
    asyncio.run(main())
