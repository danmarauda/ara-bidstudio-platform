"""
Visualization for Token Efficiency Benchmark Results

Creates VC-ready charts:
1. Token comparison (before/after)
2. Savings percentage by conversation
3. Cost savings visualization
4. Accuracy maintenance chart
"""

import json
import sys
from typing import Dict, Any
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np


class BenchmarkVisualizer:
    """Create visualizations for benchmark results"""

    def __init__(self, results_file: str):
        """Load results from JSON file"""
        with open(results_file, "r") as f:
            self.data = json.load(f)

        self.summary = self.data["summary"]
        self.results = self.data["results"]
        self.metadata = self.data["metadata"]

    def create_all_visualizations(self, output_file: str):
        """Create comprehensive visualization with all charts"""
        # Create figure with 4 subplots
        fig = plt.figure(figsize=(16, 12))
        fig.suptitle(
            "OmniMemory Token Efficiency Benchmark Results",
            fontsize=18,
            fontweight="bold",
            y=0.98,
        )

        # Chart 1: Token comparison (top left)
        ax1 = plt.subplot(2, 2, 1)
        self._create_token_comparison_chart(ax1)

        # Chart 2: Savings percentage (top right)
        ax2 = plt.subplot(2, 2, 2)
        self._create_savings_percentage_chart(ax2)

        # Chart 3: Cost savings (bottom left)
        ax3 = plt.subplot(2, 2, 3)
        self._create_cost_savings_chart(ax3)

        # Chart 4: Accuracy maintenance (bottom right)
        ax4 = plt.subplot(2, 2, 4)
        self._create_accuracy_chart(ax4)

        # Adjust layout to prevent overlap
        plt.tight_layout(rect=[0, 0.03, 1, 0.96])

        # Save figure
        plt.savefig(output_file, dpi=300, bbox_inches="tight")
        print(f"✓ Visualization saved to: {output_file}")

        # Also display summary text
        self._print_visualization_summary()

    def _create_token_comparison_chart(self, ax):
        """Chart 1: Token count comparison"""
        # Group by conversation
        conversations = {}
        for result in self.results:
            conv_id = result["conversation_id"]
            if conv_id not in conversations:
                conversations[conv_id] = {
                    "baseline": 0,
                    "omnimemory": 0,
                    "count": 0,
                }
            conversations[conv_id]["baseline"] += result["baseline_tokens"]
            conversations[conv_id]["omnimemory"] += result["omnimemory_tokens"]
            conversations[conv_id]["count"] += 1

        # Prepare data
        conv_names = [self._format_conv_name(cid) for cid in conversations.keys()]
        baseline_tokens = [data["baseline"] for data in conversations.values()]
        omnimemory_tokens = [data["omnimemory"] for data in conversations.values()]

        x = np.arange(len(conv_names))
        width = 0.35

        # Create bars
        bars1 = ax.bar(
            x - width / 2,
            baseline_tokens,
            width,
            label="Baseline (Full Context)",
            color="#ef4444",
            alpha=0.8,
        )
        bars2 = ax.bar(
            x + width / 2,
            omnimemory_tokens,
            width,
            label="OmniMemory (Compressed)",
            color="#22c55e",
            alpha=0.8,
        )

        # Customize
        ax.set_xlabel("Conversation Type", fontsize=11, fontweight="bold")
        ax.set_ylabel("Total Tokens", fontsize=11, fontweight="bold")
        ax.set_title(
            "Token Efficiency: Baseline vs OmniMemory", fontsize=13, fontweight="bold"
        )
        ax.set_xticks(x)
        ax.set_xticklabels(conv_names, rotation=45, ha="right", fontsize=9)
        ax.legend(fontsize=10)
        ax.grid(axis="y", alpha=0.3)

        # Add value labels on bars
        for bars in [bars1, bars2]:
            for bar in bars:
                height = bar.get_height()
                ax.text(
                    bar.get_x() + bar.get_width() / 2.0,
                    height,
                    f"{int(height):,}",
                    ha="center",
                    va="bottom",
                    fontsize=8,
                )

    def _create_savings_percentage_chart(self, ax):
        """Chart 2: Token savings percentage"""
        # Calculate savings per conversation
        conversations = {}
        for result in self.results:
            conv_id = result["conversation_id"]
            if conv_id not in conversations:
                conversations[conv_id] = []
            conversations[conv_id].append(result["reduction_pct"])

        # Average savings per conversation
        conv_names = [self._format_conv_name(cid) for cid in conversations.keys()]
        avg_savings = [
            sum(savings) / len(savings) for savings in conversations.values()
        ]

        # Create bars
        bars = ax.bar(
            conv_names,
            avg_savings,
            color="#3b82f6",
            alpha=0.8,
        )

        # Add target line
        ax.axhline(
            y=90, color="#22c55e", linestyle="--", linewidth=2, label="Target: 90%"
        )
        ax.axhline(
            y=85, color="#f59e0b", linestyle="--", linewidth=2, label="Minimum: 85%"
        )

        # Customize
        ax.set_xlabel("Conversation Type", fontsize=11, fontweight="bold")
        ax.set_ylabel("Token Savings (%)", fontsize=11, fontweight="bold")
        ax.set_title(
            "Token Savings by Conversation Type", fontsize=13, fontweight="bold"
        )
        ax.set_xticklabels(conv_names, rotation=45, ha="right", fontsize=9)
        ax.legend(fontsize=10)
        ax.grid(axis="y", alpha=0.3)
        ax.set_ylim([0, 100])

        # Add value labels
        for bar in bars:
            height = bar.get_height()
            color = "#22c55e" if height >= 85 else "#ef4444"
            ax.text(
                bar.get_x() + bar.get_width() / 2.0,
                height,
                f"{height:.1f}%",
                ha="center",
                va="bottom",
                fontsize=9,
                fontweight="bold",
                color=color,
            )

    def _create_cost_savings_chart(self, ax):
        """Chart 3: Cost savings"""
        # Group by conversation
        conversations = {}
        for result in self.results:
            conv_id = result["conversation_id"]
            if conv_id not in conversations:
                conversations[conv_id] = {
                    "baseline": 0,
                    "omnimemory": 0,
                    "saved": 0,
                }
            conversations[conv_id]["baseline"] += result["cost_baseline"]
            conversations[conv_id]["omnimemory"] += result["cost_omnimemory"]
            conversations[conv_id]["saved"] += result["cost_saved"]

        # Prepare data
        conv_names = [self._format_conv_name(cid) for cid in conversations.keys()]
        baseline_costs = [data["baseline"] for data in conversations.values()]
        omnimemory_costs = [data["omnimemory"] for data in conversations.values()]

        x = np.arange(len(conv_names))
        width = 0.35

        # Create bars
        bars1 = ax.bar(
            x - width / 2,
            baseline_costs,
            width,
            label="Baseline Cost",
            color="#ef4444",
            alpha=0.8,
        )
        bars2 = ax.bar(
            x + width / 2,
            omnimemory_costs,
            width,
            label="OmniMemory Cost",
            color="#22c55e",
            alpha=0.8,
        )

        # Customize
        ax.set_xlabel("Conversation Type", fontsize=11, fontweight="bold")
        ax.set_ylabel("Cost (USD)", fontsize=11, fontweight="bold")
        ax.set_title(
            "Cost Comparison: Baseline vs OmniMemory", fontsize=13, fontweight="bold"
        )
        ax.set_xticks(x)
        ax.set_xticklabels(conv_names, rotation=45, ha="right", fontsize=9)
        ax.legend(fontsize=10)
        ax.grid(axis="y", alpha=0.3)

        # Format y-axis as currency
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f"${x:.4f}"))

        # Add value labels
        for bars in [bars1, bars2]:
            for bar in bars:
                height = bar.get_height()
                ax.text(
                    bar.get_x() + bar.get_width() / 2.0,
                    height,
                    f"${height:.4f}",
                    ha="center",
                    va="bottom",
                    fontsize=8,
                )

    def _create_accuracy_chart(self, ax):
        """Chart 4: Accuracy maintenance"""
        # Calculate accuracy per conversation
        conversations = {}
        for result in self.results:
            conv_id = result["conversation_id"]
            if conv_id not in conversations:
                conversations[conv_id] = []
            conversations[conv_id].append(result["accuracy_score"])

        # Average accuracy per conversation
        conv_names = [self._format_conv_name(cid) for cid in conversations.keys()]
        avg_accuracy = [
            (sum(scores) / len(scores)) * 100 for scores in conversations.values()
        ]

        # Create bars
        bars = ax.bar(
            conv_names,
            avg_accuracy,
            color="#8b5cf6",
            alpha=0.8,
        )

        # Add target line
        ax.axhline(
            y=95, color="#22c55e", linestyle="--", linewidth=2, label="Target: 95%"
        )

        # Customize
        ax.set_xlabel("Conversation Type", fontsize=11, fontweight="bold")
        ax.set_ylabel("Accuracy (%)", fontsize=11, fontweight="bold")
        ax.set_title("Answer Accuracy Maintained", fontsize=13, fontweight="bold")
        ax.set_xticklabels(conv_names, rotation=45, ha="right", fontsize=9)
        ax.legend(fontsize=10)
        ax.grid(axis="y", alpha=0.3)
        ax.set_ylim([0, 100])

        # Add value labels
        for bar in bars:
            height = bar.get_height()
            color = "#22c55e" if height >= 95 else "#ef4444"
            ax.text(
                bar.get_x() + bar.get_width() / 2.0,
                height,
                f"{height:.1f}%",
                ha="center",
                va="bottom",
                fontsize=9,
                fontweight="bold",
                color=color,
            )

    def _format_conv_name(self, conv_id: str) -> str:
        """Format conversation ID to readable name"""
        name_map = {
            "auth_implementation": "Auth\nImpl",
            "bug_debugging": "Bug\nDebug",
            "payment_refactoring": "Payment\nRefactor",
            "performance_optimization": "Perf\nOptim",
            "stripe_integration": "Stripe\nIntegration",
        }
        return name_map.get(conv_id, conv_id)

    def _print_visualization_summary(self):
        """Print summary of what was visualized"""
        print("\n" + "=" * 70)
        print(" " * 20 + "VISUALIZATION SUMMARY")
        print("=" * 70)

        print(f"\nGenerated 4 charts:")
        print("  1. Token Comparison: Baseline vs OmniMemory token counts")
        print("  2. Savings Percentage: Token reduction % by conversation")
        print("  3. Cost Comparison: Dollar savings visualization")
        print("  4. Accuracy Maintenance: Quality preservation across tests")

        print(f"\nKey Findings:")
        print(
            f"  - Average Token Reduction: {self.summary['tokens']['reduction_pct']:.1f}%"
        )
        print(f"  - Average Accuracy: {self.summary['accuracy']['average']:.1%}")
        print(f"  - Total Cost Saved: ${self.summary['cost']['saved_total']:.4f}")

        targets_met = all(self.summary["target_met"].values())
        status = "✓ ALL TARGETS MET" if targets_met else "✗ SOME TARGETS MISSED"
        print(f"\n  {status}")
        print("=" * 70)


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        results_file = "/Users/mertozoner/Documents/claude-idea-discussion/omni-memory/benchmarks/token_efficiency_results.json"
    else:
        results_file = sys.argv[1]

    output_file = results_file.replace(".json", ".png")

    print(f"Loading results from: {results_file}")

    visualizer = BenchmarkVisualizer(results_file)
    visualizer.create_all_visualizations(output_file)

    print("\nVisualization complete!")

    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
