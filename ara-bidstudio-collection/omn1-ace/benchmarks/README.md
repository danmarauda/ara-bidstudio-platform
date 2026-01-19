# OmniMemory Benchmarks

This directory contains comprehensive performance benchmarks for OmniMemory:
1. **Phase 1 Caching Benchmarks** - HotCache and FileHashCache performance
2. **Competitive Benchmarks** - Comparisons with SuperMemory, Mem0, and Zep

## Overview

The benchmark suite tests:

1. **HotCache** (In-memory LRU cache)
   - GET operations (P95 < 1ms)
   - PUT operations (P95 < 1ms)
   - LRU eviction behavior
   - Memory efficiency

2. **FileHashCache** (Persistent hash-based cache)
   - LOOKUP operations (P95 < 5ms)
   - STORE operations (P95 < 10ms)
   - Hash calculation performance
   - Disk I/O efficiency

3. **Concurrent Access**
   - Multi-threaded performance
   - Scaling factor (10 threads > 5x speedup)
   - Thread safety verification

4. **Memory Usage**
   - Cache memory overhead (< 2x actual data)
   - Memory efficiency tracking

## Running the Benchmarks

### Prerequisites

```bash
# Install required dependencies
pip install psutil

# Ensure you have the Phase 1 implementation files:
# - mcp_server/hot_cache.py
# - omnimemory-metrics-service/src/file_hash_cache.py
```

### Run Full Benchmark Suite

```bash
cd /Users/mertozoner/Documents/claude-idea-discussion/omni-memory
python3 benchmarks/benchmark_phase1.py
```

### Expected Output

The benchmark will:

1. Run all performance tests
2. Display real-time results in console
3. Generate JSON report at `/tmp/benchmark_results.json`
4. Generate Markdown report at `/tmp/benchmark_report.md`
5. Return exit code 0 if all tests pass, 1 if any fail

### Performance Targets

| Component | Metric | Target | P95 Threshold |
|-----------|--------|--------|---------------|
| HotCache GET | Latency | < 1ms | P95 |
| HotCache PUT | Latency | < 1ms | P95 |
| FileHashCache LOOKUP | Latency | < 5ms | P95 |
| FileHashCache STORE | Latency | < 10ms | P95 |
| Concurrent (10 threads) | Scaling | > 5x | Ratio |
| Memory Overhead | Efficiency | < 2x | Ratio |

## Benchmark Details

### Test Data

The benchmark generates realistic test data:

- **Python Code**: 1KB - 1MB files with realistic syntax
- **JSON Data**: Nested structures with arrays and objects
- **Log Files**: Multi-line log entries with timestamps
- **Markdown Docs**: API documentation with code blocks

### Test Scenarios

1. **Cold Start**: Empty caches, all misses
2. **Hot Cache**: All hits from in-memory cache
3. **Warm Cache**: Mix of hits and misses
4. **Large Files**: 1MB, 5MB, 10MB files
5. **Many Files**: 1000+ small files
6. **Concurrent**: 1, 5, 10, 20, 50 threads

### Metrics Measured

- **Latency**: P50, P95, P99, Mean
- **Throughput**: Operations per second
- **Memory**: MB used by process
- **CPU**: Percentage during benchmark
- **Hit Rate**: Cache hit percentage
- **Evictions**: Number of LRU evictions

## Reports

### JSON Report (`/tmp/benchmark_results.json`)

```json
{
  "summary": {
    "total_tests": 8,
    "passed": 8,
    "failed": 0,
    "pass_rate": 100.0
  },
  "results": [...],
  "detailed_metrics": {...},
  "performance_targets": {...},
  "test_environment": {...}
}
```

### Markdown Report (`/tmp/benchmark_report.md`)

Human-readable report with:
- Summary table
- Detailed results per benchmark
- Full metrics in JSON
- Test environment info

## Interpreting Results

### Pass/Fail Criteria

- **PASS**: Metric meets or exceeds target
- **FAIL**: Metric does not meet target

### Common Issues

1. **High Latency**
   - Check system load (other processes)
   - Verify disk I/O is not throttled
   - Check available memory

2. **Low Throughput**
   - CPU throttling
   - Disk speed limitations
   - Thread contention

3. **Poor Scaling**
   - Lock contention in concurrent access
   - GIL limitations (Python)
   - CPU core count

4. **High Memory Overhead**
   - Python object overhead
   - String encoding overhead
   - Metadata storage

## Customization

### Modify Test Parameters

Edit `benchmark_phase1.py`:

```python
# Change iteration counts
metrics = self.measure_performance(operation_func, iterations=1000)

# Change cache sizes
cache = HotCache(max_size_mb=100)
cache = FileHashCache(db_path=db_path, max_cache_size_mb=1000)

# Change test data sizes
test_content = self.test_data_generator.generate_python_code(10)  # 10KB

# Change thread counts
thread_counts = [1, 5, 10, 20, 50]
```

### Add New Benchmarks

```python
def benchmark_custom_test(self):
    """Benchmark custom scenario"""
    print("\n" + "="*60)
    print("Benchmarking Custom Test")
    print("="*60)

    # Setup
    cache = HotCache(max_size_mb=100)

    # Define operation
    def custom_operation():
        # Your test here
        pass

    # Measure
    metrics = self.measure_performance(custom_operation, iterations=100)

    # Validate
    target_ms = 5.0
    p95_ms = metrics.p95() * 1000
    passed = p95_ms < target_ms

    # Record
    self.results.append(BenchmarkResult(
        name="Custom Test",
        metric="p95_latency",
        value=p95_ms,
        unit="ms",
        passed=passed,
        target=target_ms,
        percentile="p95"
    ))

    # Report
    print(f"  P95 Latency: {p95_ms:.3f}ms")
```

## Troubleshooting

### Import Errors

```bash
# Verify paths
ls -la /Users/mertozoner/Documents/claude-idea-discussion/omni-memory/mcp_server/hot_cache.py
ls -la /Users/mertozoner/Documents/claude-idea-discussion/omni-memory/omnimemory-metrics-service/src/file_hash_cache.py

# Check Python path
python3 -c "import sys; print('\n'.join(sys.path))"
```

### Permission Errors

```bash
# Temp directory permissions
mkdir -p /tmp
chmod 755 /tmp
```

### Missing Dependencies

```bash
pip install --upgrade psutil
```

## CI/CD Integration

### Run in CI Pipeline

```yaml
# .github/workflows/benchmark.yml
- name: Run Performance Benchmarks
  run: |
    python3 benchmarks/benchmark_phase1.py
    cat /tmp/benchmark_report.md >> $GITHUB_STEP_SUMMARY
```

### Set Performance Baselines

```bash
# Save baseline
python3 benchmarks/benchmark_phase1.py
cp /tmp/benchmark_results.json benchmarks/baseline.json

# Compare against baseline
python3 benchmarks/compare_results.py benchmarks/baseline.json /tmp/benchmark_results.json
```

## Contact

For issues or questions about the benchmark suite:
- File an issue in the repository
- Contact the OmniMemory team
