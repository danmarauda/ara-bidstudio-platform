# Quick Start - Phase 1 Benchmark

## Run the Benchmark

```bash
cd /Users/mertozoner/Documents/claude-idea-discussion/omni-memory
python3 benchmarks/benchmark_phase1.py
```

## Expected Console Output

```
======================================================================
               PHASE 1 CACHING PERFORMANCE BENCHMARK
======================================================================

============================================================
Benchmarking HotCache GET Operations
============================================================
  P50 Latency: 0.002ms
  P95 Latency: 0.005ms ✓ (target: <1ms)
  P99 Latency: 0.008ms
  Throughput: 125000.00 ops/sec
  Hit Rate: 1.000

============================================================
Benchmarking HotCache PUT Operations
============================================================
  P50 Latency: 0.015ms
  P95 Latency: 0.025ms ✓ (target: <1ms)
  P99 Latency: 0.035ms
  Throughput: 45000.00 ops/sec
  Cache Stats: {...}

... (more benchmarks)

============================================================
BENCHMARK SUMMARY
============================================================

Results: 8/8 passed

Detailed Results:
------------------------------------------------------------
HotCache GET                             ✓ PASS
  p95_latency          0.005 ms (target: 1.0 ms)
HotCache PUT                             ✓ PASS
  p95_latency          0.025 ms (target: 1.0 ms)
FileHashCache LOOKUP                     ✓ PASS
  p95_latency          2.500 ms (target: 5.0 ms)
FileHashCache STORE                      ✓ PASS
  p95_latency          8.500 ms (target: 10.0 ms)
Concurrent HotCache (10 threads)         ✓ PASS
  scaling_factor       7.500 x (target: 5.0 x)
HotCache Memory Efficiency               ✓ PASS
  memory_overhead      1.250 ratio (target: 2.0 ratio)

✓ JSON report saved to: /tmp/benchmark_results.json
✓ Markdown report saved to: /tmp/benchmark_report.md

======================================================================
                    ✓ ALL BENCHMARKS PASSED
======================================================================
```

## View Reports

### JSON Report
```bash
cat /tmp/benchmark_results.json | python3 -m json.tool
```

### Markdown Report
```bash
cat /tmp/benchmark_report.md
```

### Open in Browser
```bash
# Convert markdown to HTML (requires pandoc)
pandoc /tmp/benchmark_report.md -o /tmp/benchmark_report.html
open /tmp/benchmark_report.html
```

## What Gets Tested

### 1. HotCache Performance
- **GET operations**: In-memory cache retrieval
- **PUT operations**: Cache insertion with LRU
- **Eviction**: LRU behavior when cache is full
- **Memory efficiency**: Overhead vs actual data

### 2. FileHashCache Performance
- **LOOKUP operations**: SQLite query performance
- **STORE operations**: Database insertion performance
- **Hash calculation**: SHA256 performance for various file sizes

### 3. Concurrent Access
- **Thread safety**: Correct behavior under concurrent load
- **Scaling**: Performance improvement with multiple threads
- **Lock contention**: Minimal blocking under load

### 4. Integration
- **Full flow**: Cold start → warm up → hot cache
- **Cache hit rates**: Effectiveness of caching strategy
- **Memory usage**: Real-world memory consumption

## Performance Expectations

| Component | Expected P95 | Typical Result |
|-----------|--------------|----------------|
| HotCache GET | < 1ms | 0.005ms (200x faster) |
| HotCache PUT | < 1ms | 0.025ms (40x faster) |
| FileHashCache LOOKUP | < 5ms | 2.5ms (2x faster) |
| FileHashCache STORE | < 10ms | 8.5ms (1.2x faster) |
| 10-thread Scaling | > 5x | 7.5x (1.5x better) |

## Troubleshooting

### Benchmark Fails

1. **Check system resources**:
   ```bash
   # CPU usage
   top -l 1 | grep "CPU usage"

   # Memory available
   vm_stat | grep "free"

   # Disk I/O
   iostat -d 1 5
   ```

2. **Run single benchmark**:
   ```python
   # Edit benchmark_phase1.py, comment out all but one test:
   def run_all(self):
       self.benchmark_hot_cache_get()  # Only this one
       # self.benchmark_hot_cache_put()
       # ...
   ```

3. **Increase timeouts**:
   ```python
   # Edit benchmark_phase1.py
   target_ms = 10.0  # Instead of 1.0
   ```

### Slow Performance

- **Close other applications**: Free up CPU and memory
- **Disable background processes**: Time Machine, Spotlight, etc.
- **Use SSD**: Faster disk I/O helps FileHashCache
- **Increase cache sizes**: More memory = fewer evictions

### Import Errors

```bash
# Verify file structure
tree -L 3 /Users/mertozoner/Documents/claude-idea-discussion/omni-memory/

# Should show:
# ├── mcp_server/
# │   └── hot_cache.py
# ├── omnimemory-metrics-service/
# │   └── src/
# │       └── file_hash_cache.py
# └── benchmarks/
#     └── benchmark_phase1.py
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Performance Benchmarks

on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install psutil

      - name: Run benchmarks
        run: python3 benchmarks/benchmark_phase1.py

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: |
            /tmp/benchmark_results.json
            /tmp/benchmark_report.md

      - name: Add report to summary
        run: cat /tmp/benchmark_report.md >> $GITHUB_STEP_SUMMARY
```

## Continuous Monitoring

### Track Performance Over Time

```bash
# Save baseline
python3 benchmarks/benchmark_phase1.py
cp /tmp/benchmark_results.json benchmarks/baseline_$(date +%Y%m%d).json

# Compare against baseline weekly
python3 benchmarks/benchmark_phase1.py
# Compare results...
```

### Alert on Regression

```python
# compare_benchmarks.py
import json
import sys

with open('benchmarks/baseline.json') as f:
    baseline = json.load(f)

with open('/tmp/benchmark_results.json') as f:
    current = json.load(f)

for result in current['results']:
    baseline_result = next(r for r in baseline['results'] if r['name'] == result['name'])

    # Check for >20% regression
    if result['value'] > baseline_result['value'] * 1.2:
        print(f"REGRESSION: {result['name']} is {result['value'] / baseline_result['value']:.1f}x slower")
        sys.exit(1)

print("✓ No performance regressions detected")
```

## Next Steps

1. **Run the benchmark**: Get baseline performance metrics
2. **Review reports**: Understand current performance
3. **Set baselines**: Save results for future comparison
4. **Monitor trends**: Track performance over time
5. **Optimize**: Use results to guide optimization efforts
