Our test suite is a bit sparse, but we're working to improve coverage on the backend. Frontend tests will likely take
longer to implement. Our existing tests do test imports and a number of the utility functions for manipulating
annotations. These tests are integrated in our GitHub actions.

NOTE, **use Python 3.10 or above** as pydantic and certain pre-3.10 type annotations do not play well.
using `from __future__ import annotations` doesn't always solve the problem, and upgrading to Python 3.10
was a lot easier than trying to figure out why the `from __future__` didn't behave as expected

To run the tests, check your test coverage, and generate an HTML coverage report:

```commandline
 $ docker-compose -f local.yml run django coverage run -m pytest
 $ docker-compose -f local.yml run django coverage html
 $ open htmlcov/index.html
```

To run a specific test (e.g. test_analyzers):

```commandline
 $ sudo docker-compose -f local.yml run django python manage.py test opencontractserver.tests.test_analyzers --noinput
```

## Production Stack Testing

We have a dedicated test setup for validating the production Docker Compose stack, including Traefik rate limiting configuration with proper 429 response handling.

### Prerequisites

Before running production tests, you need to generate self-signed certificates for local TLS testing:

```bash
# Generate certificates (only needed once)
./contrib/generate-certs.sh
```

This creates certificates for `localhost`, `opencontracts.opensource.legal`, and other testing domains.

### Testing Rate Limiting with Production Stack

To test the production stack with rate limiting:

1. **Start the production test stack:**
   ```bash
   # Start all services (nlm-ingestor has been removed for faster startup)
   docker compose -f production.yml -f compose/test-production.yml up -d

   # Wait for services to be ready (Django takes 1-2 minutes)
   docker compose -f production.yml -f compose/test-production.yml ps
   ```

2. **Run the production rate limiting test:**
   ```bash
   # Run comprehensive rate limiting test with detailed logging
   ./scripts/test-production-rate-limiting.sh --compose-files "production.yml compose/test-production.yml"
   ```

3. **What the test validates:**
   - ✅ **TLS Configuration** - Self-signed certificates for HTTPS testing
   - ✅ **Service Connectivity** - Traefik properly routes to backend services
   - ✅ **Rate Limiting Enforcement** - Returns 429 responses when limits exceeded
   - ✅ **Frontend Limits** - 10 req/sec average, 20 burst limit
   - ✅ **API Limits** - 5 req/sec average, 10 burst limit (stricter)
   - ✅ **Detailed Logging** - Request-by-request response code logging
   - ✅ **GitHub Actions Ready** - External testing compatible with CI/CD

4. **Example test output:**
   ```
   🧪 Production Rate Limiting Test
   =============================================
   Environment: Production stack with local TLS

   === 1. Environment Check ===
   ✅ HTTPS endpoint accessible (HTTP 404)

   === 2. Frontend Rate Limiting Test ===
   Sending requests to frontend (https://localhost/):
   ✅ Request 1: 200 (Success)
   ✅ Request 2: 200 (Success)
   ...
   🚫 Request 9: 429 (RATE LIMITED)
   🚫 Request 10: 429 (RATE LIMITED)

   🎉 SUCCESS: Rate limiting is functional!
   ✅ Production environment successfully returns 429 responses
   ```

5. **Debugging and monitoring:**
   ```bash
   # Check container status
   docker compose -f production.yml -f compose/test-production.yml ps

   # View Traefik configuration logs
   docker compose -f production.yml -f compose/test-production.yml logs traefik | grep -i rate

   # Access Traefik dashboard (if available)
   curl -s http://localhost:8080/api/rawdata | jq '.middlewares'

   # Check certificate generation
   ls -la contrib/certs/
   ```

6. **Clean up:**
   ```bash
   # Stop and remove containers
   docker compose -f production.yml -f compose/test-production.yml down -v
   ```

### Configuration Details

The production test environment uses:

- **Self-signed TLS certificates** - Avoids Let's Encrypt in testing environments
- **File-based Traefik configuration** - `compose/production/traefik/working-rate-test.yml`
- **Local certificate generation** - `contrib/generate-certs.sh` for testing
- **External HTTP testing** - Compatible with GitHub Actions and CI environments
- **Removed nlm-ingestor** - Eliminated 1.21GB Docker image for faster testing
- **Detailed request logging** - Shows each HTTP response code for debugging

**Rate Limiting Configuration:**
- **Frontend**: 10 requests/second average, 20 request burst limit
- **API**: 5 requests/second average, 10 request burst limit
- **IP-based limiting**: Per-client source IP with depth=1 strategy
- **Period**: 1-second rate limiting windows
- **Response**: HTTP 429 "Too Many Requests" when exceeded

This test setup is used in GitHub Actions CI pipeline to validate that rate limiting properly returns 429 responses in production-like environments.
