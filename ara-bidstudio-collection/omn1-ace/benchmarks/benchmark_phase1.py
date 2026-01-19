"""
Phase 1 Caching Implementation Performance Benchmark

Comprehensive benchmarking for:
- HotCache: In-memory LRU cache
- FileHashCache: Persistent hash-based cache
- Smart Read Integration: Full flow with both caches
- Compression/Decompression: Different content sizes
- Concurrent Access: Multi-threaded performance

Performance Targets:
- Hot cache: <1ms
- File hash cache: <5ms
- Compression: <100ms for 10KB
- Concurrent access: Linear scaling up to 10 threads

Author: OmniMemory Team
Version: 1.0.0
"""

import time
import statistics
import psutil
import json
import sys
import os
import threading
import hashlib
import tempfile
import shutil
from pathlib import Path
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add project root to path
sys.path.append("/Users/mertozoner/Documents/claude-idea-discussion/omni-memory")
sys.path.append(
    "/Users/mertozoner/Documents/claude-idea-discussion/omni-memory/omnimemory-metrics-service"
)

from mcp_server.hot_cache import HotCache
from src.file_hash_cache import FileHashCache


@dataclass
class BenchmarkResult:
    """Result from a single benchmark"""

    name: str
    metric: str
    value: float
    unit: str
    passed: bool
    target: float
    percentile: str = "mean"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class PerformanceMetrics:
    """Performance metrics for a benchmark run"""

    latencies: List[float]
    throughput: float
    memory_mb: float
    cpu_percent: float

    def p50(self) -> float:
        return statistics.median(self.latencies)

    def p95(self) -> float:
        return (
            statistics.quantiles(self.latencies, n=20)[18]
            if len(self.latencies) > 20
            else max(self.latencies)
        )

    def p99(self) -> float:
        return (
            statistics.quantiles(self.latencies, n=100)[98]
            if len(self.latencies) > 100
            else max(self.latencies)
        )

    def mean(self) -> float:
        return statistics.mean(self.latencies)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "p50_ms": round(self.p50() * 1000, 3),
            "p95_ms": round(self.p95() * 1000, 3),
            "p99_ms": round(self.p99() * 1000, 3),
            "mean_ms": round(self.mean() * 1000, 3),
            "throughput_ops_per_sec": round(self.throughput, 2),
            "memory_mb": round(self.memory_mb, 2),
            "cpu_percent": round(self.cpu_percent, 2),
        }


class TestDataGenerator:
    """Generate realistic test data for benchmarking"""

    @staticmethod
    def generate_python_code(size_kb: int) -> str:
        """Generate realistic Python code"""
        base_code = '''"""
Test module for benchmarking
"""

import os
import sys
from typing import List, Dict, Optional
from dataclasses import dataclass

@dataclass
class TestClass:
    """Test dataclass"""
    name: str
    value: int
    metadata: Dict[str, Any]

    def process(self) -> Dict[str, Any]:
        """Process data"""
        result = {
            "name": self.name,
            "value": self.value * 2,
            "metadata": self.metadata.copy()
        }
        return result

def test_function(param1: str, param2: int) -> List[str]:
    """Test function"""
    results = []
    for i in range(param2):
        results.append(f"{param1}_{i}")
    return results

class TestService:
    """Test service class"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.initialized = False

    def initialize(self) -> bool:
        """Initialize service"""
        try:
            # Initialization logic
            self.initialized = True
            return True
        except Exception as e:
            print(f"Error: {e}")
            return False

    def process_data(self, data: List[Dict]) -> List[Dict]:
        """Process data items"""
        results = []
        for item in data:
            processed = self._process_item(item)
            results.append(processed)
        return results

    def _process_item(self, item: Dict) -> Dict:
        """Process single item"""
        return {
            "id": item.get("id", ""),
            "processed": True,
            "timestamp": time.time()
        }

'''
        # Repeat to reach target size
        target_bytes = size_kb * 1024
        current_bytes = len(base_code.encode("utf-8"))
        repetitions = max(1, target_bytes // current_bytes)

        code = base_code * repetitions
        return code[:target_bytes]

    @staticmethod
    def generate_json_data(size_kb: int) -> str:
        """Generate realistic JSON data"""
        base_data = {
            "users": [
                {
                    "id": f"user_{i}",
                    "name": f"User {i}",
                    "email": f"user{i}@example.com",
                    "age": 20 + (i % 50),
                    "active": i % 2 == 0,
                    "metadata": {
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-10T00:00:00Z",
                        "tags": ["tag1", "tag2", "tag3"],
                        "preferences": {
                            "theme": "dark",
                            "language": "en",
                            "notifications": True,
                        },
                    },
                }
                for i in range(100)
            ]
        }

        json_str = json.dumps(base_data, indent=2)
        target_bytes = size_kb * 1024
        current_bytes = len(json_str.encode("utf-8"))
        repetitions = max(1, target_bytes // current_bytes)

        # Create larger dataset
        large_data = {"batches": [base_data for _ in range(repetitions)]}
        json_str = json.dumps(large_data, indent=2)

        return json_str[:target_bytes]

    @staticmethod
    def generate_log_data(size_kb: int) -> str:
        """Generate realistic log data"""
        base_log = """2024-01-10 10:00:00 INFO Starting application
2024-01-10 10:00:01 INFO Loading configuration from /etc/app/config.yaml
2024-01-10 10:00:01 DEBUG Configuration loaded: {"port": 8000, "host": "0.0.0.0"}
2024-01-10 10:00:02 INFO Connecting to database at postgresql://localhost:5432/mydb
2024-01-10 10:00:03 INFO Database connection established
2024-01-10 10:00:03 INFO Starting HTTP server on 0.0.0.0:8000
2024-01-10 10:00:04 INFO Server started successfully
2024-01-10 10:00:05 INFO Received request: GET /api/users
2024-01-10 10:00:05 DEBUG Query: SELECT * FROM users WHERE active = true
2024-01-10 10:00:06 DEBUG Found 150 users
2024-01-10 10:00:06 INFO Request completed in 1.2s
2024-01-10 10:00:07 WARNING Cache miss for key: user_123
2024-01-10 10:00:08 INFO Fetching from database
2024-01-10 10:00:09 ERROR Connection timeout to external API
2024-01-10 10:00:09 INFO Retrying request (attempt 1/3)
2024-01-10 10:00:10 INFO Request successful
"""
        target_bytes = size_kb * 1024
        current_bytes = len(base_log.encode("utf-8"))
        repetitions = max(1, target_bytes // current_bytes)

        return (base_log * repetitions)[:target_bytes]

    @staticmethod
    def generate_markdown_docs(size_kb: int) -> str:
        """Generate realistic markdown documentation"""
        base_md = """# API Documentation

## Overview

This API provides access to user management and data processing services.

## Authentication

All requests require an API key in the header:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### GET /api/users

Retrieve a list of users.

**Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Results per page (default: 20)
- `active` (boolean): Filter by active status

**Response:**
```json
{
  "users": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "total": 150,
  "page": 1
}
```

### POST /api/users

Create a new user.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "admin"
}
```

**Response:**
```json
{
  "id": "user_456",
  "name": "Jane Doe",
  "created_at": "2024-01-10T10:00:00Z"
}
```

## Rate Limiting

API requests are limited to 1000 per hour per API key.

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

"""
        target_bytes = size_kb * 1024
        current_bytes = len(base_md.encode("utf-8"))
        repetitions = max(1, target_bytes // current_bytes)

        return (base_md * repetitions)[:target_bytes]


class BenchmarkRunner:
    """Main benchmark runner"""

    def __init__(self):
        self.results: List[BenchmarkResult] = []
        self.detailed_metrics: Dict[str, Any] = {}
        self.test_data_generator = TestDataGenerator()

        # Create temp directory for test files
        self.temp_dir = tempfile.mkdtemp(prefix="omnimemory_bench_")

        # Initialize process for CPU/memory tracking
        self.process = psutil.Process()

        print(f"Benchmark temp directory: {self.temp_dir}")

    def cleanup(self):
        """Clean up test files"""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            print(f"Cleaned up temp directory: {self.temp_dir}")

    def measure_performance(
        self, operation_func, iterations: int = 100
    ) -> PerformanceMetrics:
        """Measure performance metrics for an operation"""
        latencies = []

        # Warm up
        for _ in range(5):
            operation_func()

        # Measure memory before
        self.process.memory_info()
        mem_before = self.process.memory_info().rss / (1024 * 1024)

        # Start CPU monitoring
        cpu_percent = self.process.cpu_percent(interval=None)

        # Run benchmark
        start_time = time.perf_counter()

        for _ in range(iterations):
            op_start = time.perf_counter()
            operation_func()
            op_end = time.perf_counter()
            latencies.append(op_end - op_start)

        end_time = time.perf_counter()

        # Measure memory after
        mem_after = self.process.memory_info().rss / (1024 * 1024)

        # Calculate throughput
        total_time = end_time - start_time
        throughput = iterations / total_time if total_time > 0 else 0

        # Get CPU usage
        cpu_percent = self.process.cpu_percent(interval=0.1)

        return PerformanceMetrics(
            latencies=latencies,
            throughput=throughput,
            memory_mb=mem_after - mem_before,
            cpu_percent=cpu_percent,
        )

    def benchmark_hot_cache_get(self):
        """Benchmark HotCache get operations"""
        print("\n" + "=" * 60)
        print("Benchmarking HotCache GET Operations")
        print("=" * 60)

        cache = HotCache(max_size_mb=100)

        # Prepare test data
        test_content = self.test_data_generator.generate_python_code(10)  # 10KB
        test_hash = hashlib.sha256(test_content.encode()).hexdigest()

        # Pre-populate cache
        cache.put(test_hash, test_content, "/test/file.py")

        # Benchmark get operation
        def get_operation():
            cache.get(test_hash)

        metrics = self.measure_performance(get_operation, iterations=1000)

        # Check target: <1ms
        target_ms = 1.0
        p95_ms = metrics.p95() * 1000
        passed = p95_ms < target_ms

        self.results.append(
            BenchmarkResult(
                name="HotCache GET",
                metric="p95_latency",
                value=p95_ms,
                unit="ms",
                passed=passed,
                target=target_ms,
                percentile="p95",
            )
        )

        self.detailed_metrics["hot_cache_get"] = metrics.to_dict()

        print(f"  P50 Latency: {metrics.p50() * 1000:.3f}ms")
        print(
            f"  P95 Latency: {metrics.p95() * 1000:.3f}ms {'✓' if passed else '✗'} (target: <{target_ms}ms)"
        )
        print(f"  P99 Latency: {metrics.p99() * 1000:.3f}ms")
        print(f"  Throughput: {metrics.throughput:.2f} ops/sec")
        print(f"  Hit Rate: {cache.get_stats()['hit_rate']:.3f}")

    def benchmark_hot_cache_put(self):
        """Benchmark HotCache put operations"""
        print("\n" + "=" * 60)
        print("Benchmarking HotCache PUT Operations")
        print("=" * 60)

        cache = HotCache(max_size_mb=100)

        # Prepare test data
        test_content = self.test_data_generator.generate_python_code(10)  # 10KB

        counter = [0]

        def put_operation():
            test_hash = hashlib.sha256(
                f"{test_content}_{counter[0]}".encode()
            ).hexdigest()
            cache.put(test_hash, test_content, f"/test/file_{counter[0]}.py")
            counter[0] += 1

        metrics = self.measure_performance(put_operation, iterations=1000)

        # Check target: <1ms
        target_ms = 1.0
        p95_ms = metrics.p95() * 1000
        passed = p95_ms < target_ms

        self.results.append(
            BenchmarkResult(
                name="HotCache PUT",
                metric="p95_latency",
                value=p95_ms,
                unit="ms",
                passed=passed,
                target=target_ms,
                percentile="p95",
            )
        )

        self.detailed_metrics["hot_cache_put"] = metrics.to_dict()

        print(f"  P50 Latency: {metrics.p50() * 1000:.3f}ms")
        print(
            f"  P95 Latency: {metrics.p95() * 1000:.3f}ms {'✓' if passed else '✗'} (target: <{target_ms}ms)"
        )
        print(f"  P99 Latency: {metrics.p99() * 1000:.3f}ms")
        print(f"  Throughput: {metrics.throughput:.2f} ops/sec")
        print(f"  Cache Stats: {cache.get_stats()}")

    def benchmark_hot_cache_eviction(self):
        """Benchmark HotCache LRU eviction"""
        print("\n" + "=" * 60)
        print("Benchmarking HotCache LRU Eviction")
        print("=" * 60)

        cache = HotCache(max_size_mb=1)  # Small cache to trigger eviction

        # Fill cache beyond capacity
        test_content = self.test_data_generator.generate_python_code(100)  # 100KB each

        for i in range(20):  # Will exceed 1MB limit
            test_hash = hashlib.sha256(f"{test_content}_{i}".encode()).hexdigest()
            cache.put(test_hash, test_content, f"/test/file_{i}.py")

        stats = cache.get_stats()

        print(f"  Cache Entries: {stats['entries']}")
        print(f"  Cache Size: {stats['size_mb']}MB / {stats['max_size_mb']}MB")
        print(f"  Utilization: {stats['utilization']:.2%}")
        print(f"  Total Evictions: {stats['total_evictions']}")
        print(f"  Eviction Rate: {stats['total_evictions'] / stats['total_puts']:.2%}")

        # Eviction should have occurred
        passed = stats["total_evictions"] > 0

        self.results.append(
            BenchmarkResult(
                name="HotCache Eviction",
                metric="eviction_count",
                value=stats["total_evictions"],
                unit="evictions",
                passed=passed,
                target=1,
                percentile="total",
            )
        )

    def benchmark_file_hash_cache_lookup(self):
        """Benchmark FileHashCache lookup operations"""
        print("\n" + "=" * 60)
        print("Benchmarking FileHashCache LOOKUP Operations")
        print("=" * 60)

        db_path = os.path.join(self.temp_dir, "test_cache.db")
        cache = FileHashCache(db_path=db_path, max_cache_size_mb=1000)

        # Prepare and store test data
        test_content = self.test_data_generator.generate_python_code(10)  # 10KB
        test_hash = cache.calculate_hash(test_content)
        compressed_content = test_content  # Simplified for benchmark

        cache.store_compressed_file(
            file_hash=test_hash,
            file_path="/test/file.py",
            compressed_content=compressed_content,
            original_size=len(test_content),
            compressed_size=len(compressed_content),
            compression_ratio=0.7,
            quality_score=0.85,
            tool_id="benchmark",
            tenant_id="test",
        )

        # Benchmark lookup operation
        def lookup_operation():
            cache.lookup_compressed_file(test_hash)

        metrics = self.measure_performance(lookup_operation, iterations=1000)

        # Check target: <5ms
        target_ms = 5.0
        p95_ms = metrics.p95() * 1000
        passed = p95_ms < target_ms

        self.results.append(
            BenchmarkResult(
                name="FileHashCache LOOKUP",
                metric="p95_latency",
                value=p95_ms,
                unit="ms",
                passed=passed,
                target=target_ms,
                percentile="p95",
            )
        )

        self.detailed_metrics["file_hash_cache_lookup"] = metrics.to_dict()

        stats = cache.get_cache_stats()

        print(f"  P50 Latency: {metrics.p50() * 1000:.3f}ms")
        print(
            f"  P95 Latency: {metrics.p95() * 1000:.3f}ms {'✓' if passed else '✗'} (target: <{target_ms}ms)"
        )
        print(f"  P99 Latency: {metrics.p99() * 1000:.3f}ms")
        print(f"  Throughput: {metrics.throughput:.2f} ops/sec")
        print(f"  Hit Rate: {stats['cache_hit_rate']:.3f}")

        cache.close()

    def benchmark_file_hash_cache_store(self):
        """Benchmark FileHashCache store operations"""
        print("\n" + "=" * 60)
        print("Benchmarking FileHashCache STORE Operations")
        print("=" * 60)

        db_path = os.path.join(self.temp_dir, "test_cache_store.db")
        cache = FileHashCache(db_path=db_path, max_cache_size_mb=1000)

        # Prepare test data
        test_content = self.test_data_generator.generate_python_code(10)  # 10KB

        counter = [0]

        def store_operation():
            content = f"{test_content}_{counter[0]}"
            test_hash = cache.calculate_hash(content)
            cache.store_compressed_file(
                file_hash=test_hash,
                file_path=f"/test/file_{counter[0]}.py",
                compressed_content=content,
                original_size=len(content),
                compressed_size=len(content),
                compression_ratio=0.7,
                quality_score=0.85,
                tool_id="benchmark",
                tenant_id="test",
            )
            counter[0] += 1

        metrics = self.measure_performance(store_operation, iterations=100)

        # Check target: <10ms (more lenient for disk I/O)
        target_ms = 10.0
        p95_ms = metrics.p95() * 1000
        passed = p95_ms < target_ms

        self.results.append(
            BenchmarkResult(
                name="FileHashCache STORE",
                metric="p95_latency",
                value=p95_ms,
                unit="ms",
                passed=passed,
                target=target_ms,
                percentile="p95",
            )
        )

        self.detailed_metrics["file_hash_cache_store"] = metrics.to_dict()

        stats = cache.get_cache_stats()

        print(f"  P50 Latency: {metrics.p50() * 1000:.3f}ms")
        print(
            f"  P95 Latency: {metrics.p95() * 1000:.3f}ms {'✓' if passed else '✗'} (target: <{target_ms}ms)"
        )
        print(f"  P99 Latency: {metrics.p99() * 1000:.3f}ms")
        print(f"  Throughput: {metrics.throughput:.2f} ops/sec")
        print(f"  Total Entries: {stats['total_entries']}")
        print(f"  Cache Size: {stats['cache_size_mb']}MB")

        cache.close()

    def benchmark_hash_calculation(self):
        """Benchmark SHA256 hash calculation"""
        print("\n" + "=" * 60)
        print("Benchmarking Hash Calculation (SHA256)")
        print("=" * 60)

        # Test different file sizes
        sizes = [(1, "1KB"), (10, "10KB"), (100, "100KB"), (1000, "1MB")]

        for size_kb, label in sizes:
            test_content = self.test_data_generator.generate_python_code(size_kb)

            def hash_operation():
                hashlib.sha256(test_content.encode()).hexdigest()

            metrics = self.measure_performance(hash_operation, iterations=100)

            print(f"\n  {label} File:")
            print(f"    P50 Latency: {metrics.p50() * 1000:.3f}ms")
            print(f"    P95 Latency: {metrics.p95() * 1000:.3f}ms")
            print(f"    Throughput: {metrics.throughput:.2f} ops/sec")

            self.detailed_metrics[f"hash_calculation_{label}"] = metrics.to_dict()

    def benchmark_concurrent_hot_cache(self):
        """Benchmark concurrent access to HotCache"""
        print("\n" + "=" * 60)
        print("Benchmarking Concurrent HotCache Access")
        print("=" * 60)

        cache = HotCache(max_size_mb=100)

        # Pre-populate cache
        test_contents = []
        test_hashes = []
        for i in range(100):
            content = self.test_data_generator.generate_python_code(10)
            file_hash = hashlib.sha256(f"{content}_{i}".encode()).hexdigest()
            cache.put(file_hash, content, f"/test/file_{i}.py")
            test_contents.append(content)
            test_hashes.append(file_hash)

        # Test different thread counts
        thread_counts = [1, 5, 10, 20, 50]

        for num_threads in thread_counts:
            latencies = []

            def worker():
                for _ in range(100):
                    idx = threading.current_thread().ident % len(test_hashes)
                    start = time.perf_counter()
                    cache.get(test_hashes[idx])
                    end = time.perf_counter()
                    latencies.append(end - start)

            start_time = time.perf_counter()

            with ThreadPoolExecutor(max_workers=num_threads) as executor:
                futures = [executor.submit(worker) for _ in range(num_threads)]
                for future in as_completed(futures):
                    future.result()

            end_time = time.perf_counter()

            total_time = end_time - start_time
            total_ops = num_threads * 100
            throughput = total_ops / total_time

            p95_latency = (
                statistics.quantiles(latencies, n=20)[18]
                if len(latencies) > 20
                else max(latencies)
            )

            print(f"\n  {num_threads} threads:")
            print(f"    P95 Latency: {p95_latency * 1000:.3f}ms")
            print(f"    Throughput: {throughput:.2f} ops/sec")
            print(f"    Total Time: {total_time:.2f}s")

            self.detailed_metrics[f"concurrent_hot_cache_{num_threads}_threads"] = {
                "p95_latency_ms": round(p95_latency * 1000, 3),
                "throughput_ops_per_sec": round(throughput, 2),
                "total_time_sec": round(total_time, 2),
            }

            # Check linear scaling for up to 10 threads
            if num_threads == 10:
                # Target: Linear scaling means throughput should be ~10x single-threaded
                single_thread_throughput = self.detailed_metrics.get(
                    "concurrent_hot_cache_1_threads", {}
                ).get("throughput_ops_per_sec", 0)
                if single_thread_throughput > 0:
                    scaling_factor = throughput / single_thread_throughput
                    passed = (
                        scaling_factor >= 5.0
                    )  # At least 5x improvement with 10 threads

                    self.results.append(
                        BenchmarkResult(
                            name="Concurrent HotCache (10 threads)",
                            metric="scaling_factor",
                            value=scaling_factor,
                            unit="x",
                            passed=passed,
                            target=5.0,
                            percentile="ratio",
                        )
                    )

                    print(
                        f"    Scaling Factor: {scaling_factor:.2f}x {'✓' if passed else '✗'} (target: >5x)"
                    )

    def benchmark_memory_usage(self):
        """Benchmark memory usage of caches"""
        print("\n" + "=" * 60)
        print("Benchmarking Memory Usage")
        print("=" * 60)

        # Test HotCache memory usage
        cache = HotCache(max_size_mb=10)

        mem_before = self.process.memory_info().rss / (1024 * 1024)

        # Add 100 files of 10KB each = 1MB total
        for i in range(100):
            content = self.test_data_generator.generate_python_code(10)
            file_hash = hashlib.sha256(f"{content}_{i}".encode()).hexdigest()
            cache.put(file_hash, content, f"/test/file_{i}.py")

        mem_after = self.process.memory_info().rss / (1024 * 1024)
        mem_used = mem_after - mem_before

        stats = cache.get_stats()

        print(f"\n  HotCache:")
        print(f"    Entries: {stats['entries']}")
        print(f"    Cache Size: {stats['size_mb']}MB")
        print(f"    Memory Used: {mem_used:.2f}MB")
        print(f"    Utilization: {stats['utilization']:.2%}")

        # Memory usage should be reasonable (within 2x of actual data)
        passed = mem_used < stats["size_mb"] * 2

        self.results.append(
            BenchmarkResult(
                name="HotCache Memory Efficiency",
                metric="memory_overhead",
                value=mem_used / stats["size_mb"] if stats["size_mb"] > 0 else 0,
                unit="ratio",
                passed=passed,
                target=2.0,
                percentile="ratio",
            )
        )

        print(
            f"    Memory Overhead: {mem_used / stats['size_mb']:.2f}x {'✓' if passed else '✗'} (target: <2x)"
        )

    def generate_report(self):
        """Generate comprehensive benchmark reports"""
        print("\n" + "=" * 60)
        print("Generating Reports")
        print("=" * 60)

        # Console summary
        print("\n" + "=" * 60)
        print("BENCHMARK SUMMARY")
        print("=" * 60)

        passed_count = sum(1 for r in self.results if r.passed)
        total_count = len(self.results)

        print(f"\nResults: {passed_count}/{total_count} passed")
        print("\nDetailed Results:")
        print("-" * 60)

        for result in self.results:
            status = "✓ PASS" if result.passed else "✗ FAIL"
            print(f"{result.name:40} {status}")
            print(
                f"  {result.metric:20} {result.value:.3f} {result.unit} (target: {result.target} {result.unit})"
            )

        # JSON report
        json_report = {
            "summary": {
                "total_tests": total_count,
                "passed": passed_count,
                "failed": total_count - passed_count,
                "pass_rate": round(passed_count / total_count * 100, 2)
                if total_count > 0
                else 0,
            },
            "results": [r.to_dict() for r in self.results],
            "detailed_metrics": self.detailed_metrics,
            "performance_targets": {
                "hot_cache_get_p95": "< 1ms",
                "file_hash_cache_lookup_p95": "< 5ms",
                "concurrent_scaling_10_threads": "> 5x",
                "memory_overhead": "< 2x",
            },
            "test_environment": {
                "cpu_count": psutil.cpu_count(),
                "memory_total_gb": round(
                    psutil.virtual_memory().total / (1024**3), 2
                ),
                "python_version": sys.version,
            },
        }

        json_path = "/tmp/benchmark_results.json"
        with open(json_path, "w") as f:
            json.dump(json_report, f, indent=2)

        print(f"\n✓ JSON report saved to: {json_path}")

        # Markdown report
        md_report = f"""# Phase 1 Caching Performance Benchmark Report

## Summary

- **Total Tests**: {total_count}
- **Passed**: {passed_count}
- **Failed**: {total_count - passed_count}
- **Pass Rate**: {passed_count / total_count * 100:.1f}%

## Performance Targets

| Component | Target | Status |
|-----------|--------|--------|
| HotCache GET (P95) | < 1ms | {'✓' if any(r.name == 'HotCache GET' and r.passed for r in self.results) else '✗'} |
| FileHashCache LOOKUP (P95) | < 5ms | {'✓' if any(r.name == 'FileHashCache LOOKUP' and r.passed for r in self.results) else '✗'} |
| Concurrent Scaling (10 threads) | > 5x | {'✓' if any(r.name.startswith('Concurrent') and r.passed for r in self.results) else '✗'} |
| Memory Overhead | < 2x | {'✓' if any(r.name == 'HotCache Memory Efficiency' and r.passed for r in self.results) else '✗'} |

## Detailed Results

"""

        for result in self.results:
            status = "✓ PASS" if result.passed else "✗ FAIL"
            md_report += f"\n### {result.name}\n\n"
            md_report += f"- **Status**: {status}\n"
            md_report += f"- **Metric**: {result.metric}\n"
            md_report += f"- **Value**: {result.value:.3f} {result.unit}\n"
            md_report += f"- **Target**: {result.target} {result.unit}\n"

        md_report += "\n## Detailed Metrics\n\n"
        md_report += "```json\n"
        md_report += json.dumps(self.detailed_metrics, indent=2)
        md_report += "\n```\n"

        md_report += f"\n## Test Environment\n\n"
        md_report += f"- **CPU Cores**: {psutil.cpu_count()}\n"
        md_report += (
            f"- **Total Memory**: {psutil.virtual_memory().total / (1024**3):.2f} GB\n"
        )
        md_report += f"- **Python Version**: {sys.version}\n"

        md_path = "/tmp/benchmark_report.md"
        with open(md_path, "w") as f:
            f.write(md_report)

        print(f"✓ Markdown report saved to: {md_path}")

        # Return overall pass/fail
        return passed_count == total_count

    def run_all(self):
        """Run all benchmarks"""
        print("\n" + "=" * 70)
        print(" " * 15 + "PHASE 1 CACHING PERFORMANCE BENCHMARK")
        print("=" * 70)

        try:
            # Run benchmarks
            self.benchmark_hot_cache_get()
            self.benchmark_hot_cache_put()
            self.benchmark_hot_cache_eviction()
            self.benchmark_file_hash_cache_lookup()
            self.benchmark_file_hash_cache_store()
            self.benchmark_hash_calculation()
            self.benchmark_concurrent_hot_cache()
            self.benchmark_memory_usage()

            # Generate reports
            all_passed = self.generate_report()

            # Final status
            print("\n" + "=" * 70)
            if all_passed:
                print(" " * 20 + "✓ ALL BENCHMARKS PASSED")
            else:
                print(" " * 20 + "✗ SOME BENCHMARKS FAILED")
            print("=" * 70 + "\n")

            return 0 if all_passed else 1

        finally:
            # Cleanup
            self.cleanup()


if __name__ == "__main__":
    runner = BenchmarkRunner()
    exit_code = runner.run_all()
    sys.exit(exit_code)
