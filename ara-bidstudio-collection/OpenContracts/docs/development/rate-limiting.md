# Rate Limiting Documentation

## Overview

OpenContracts implements multi-layer rate limiting to protect the application from abuse and ensure fair resource usage:

1. **Edge Rate Limiting** - Via Traefik reverse proxy (or, if you are using a different router, use its rate limiting)
2. **Application Rate Limiting** - Via django-ratelimit in GraphQL resolvers

## Architecture

### Edge Rate Limiting (Traefik)

Traefik provides the first line of defense with IP-based rate limiting:

- **Frontend**: 10 req/s average, 20 burst
- **API/GraphQL**: 5 req/s average, 10 burst
- **Flower**: 10 req/s average, 20 burst

Configuration: `compose/production/traefik/traefik.yml`

### Application Rate Limiting (Django)

Django-ratelimit provides granular control at the resolver level with user-aware rate limiting.

#### Rate Limit Tiers

Different operations have different rate limits based on their resource intensity:

| Category | Operation Type | Default Limit | Description |
|----------|---------------|---------------|-------------|
| **Authentication** | AUTH_LOGIN | 5/m | Login attempts |
| | AUTH_REGISTER | 3/m | Registration attempts |
| | AUTH_PASSWORD_RESET | 3/h | Password reset requests |
| **Read Operations** | READ_LIGHT | 100/m | Single object fetches |
| | READ_MEDIUM | 30/m | Filtered lists, searches |
| | READ_HEAVY | 10/m | Complex aggregations |
| **Write Operations** | WRITE_LIGHT | 30/m | Updates, deletes |
| | WRITE_MEDIUM | 10/m | Creates with validation |
| | WRITE_HEAVY | 5/m | Bulk operations, file uploads |
| **AI Operations** | AI_ANALYSIS | 5/m | AI analysis requests |
| | AI_EXTRACT | 10/m | AI extraction requests |
| | AI_QUERY | 20/m | AI query requests |
| **Import/Export** | EXPORT | 5/h | Export operations |
| | IMPORT | 10/h | Import operations |
| **Admin** | ADMIN_OPERATION | 100/m | Admin operations |

#### User Tier Multipliers

Rate limits are adjusted based on user type:

- **Superusers**: 10x base limit
- **Authenticated Users**: 2x base limit
- **Anonymous Users**: 1x base limit
- **Usage-Capped Users**: 0.5x base limit

## Implementation

### Adding Rate Limiting to a Mutation

```python
from config.graphql.ratelimits import graphql_ratelimit, RateLimits

class MyMutation(graphene.Mutation):
    @login_required
    @graphql_ratelimit(rate=RateLimits.WRITE_MEDIUM)
    def mutate(root, info, **kwargs):
        # Your mutation logic
        pass
```

### Adding Dynamic Rate Limiting

For user-tier-aware rate limiting:

```python
from config.graphql.ratelimits import graphql_ratelimit_dynamic, get_user_tier_rate

class MyQuery:
    @graphql_ratelimit_dynamic(get_rate=get_user_tier_rate("READ_HEAVY"))
    def resolve_expensive_query(self, info, **kwargs):
        # Your query logic
        pass
```

### Custom Rate Limits

```python
# Fixed custom rate
@graphql_ratelimit(rate="10/h", key="user_or_ip")
def my_resolver(root, info):
    pass

# Dynamic custom rate
def get_custom_rate(root, info):
    if info.context.user.is_premium:
        return "100/m"
    return "10/m"

@graphql_ratelimit_dynamic(get_rate=get_custom_rate)
def my_resolver(root, info):
    pass
```

## Configuration

### Environment Variables

Override default rate limits via environment variables:

```bash
# Override specific rate limits
RATELIMIT_AUTH_LOGIN=10/m
RATELIMIT_READ_HEAVY=20/m
RATELIMIT_AI_QUERY=50/m
```

### Django Settings

Configure in `config/settings/ratelimit.py`:

```python
# Enable/disable rate limiting
RATELIMIT_ENABLE = True

# Disable in tests
RATELIMIT_DISABLE = getattr(settings, "TESTING", False)

# Cache backend
RATELIMIT_USE_CACHE = "default"

# Fail behavior when cache unavailable
RATELIMIT_FAIL_OPEN = False  # Deny requests if cache is down

# IP extraction for proxies
RATELIMIT_IP_META_KEY = "HTTP_X_FORWARDED_FOR"

# IPv6 subnet grouping
RATELIMIT_IPV6_MASK = 64
```

## Monitoring

### Rate Limit Headers

The application adds rate limit information to response headers:

- `X-RateLimit-Limit`: The rate limit for this endpoint
- `X-RateLimit-Remaining`: Requests remaining (when available)

### Logging

Rate limit violations are logged:

```python
logger.warning(
    f"Rate limit exceeded for {func.__name__} - Key: {limit_key}, Rate: {rate}"
)
```

### Metrics

Monitor rate limiting effectiveness through:

1. **Traefik Metrics**: Edge rate limit hits
2. **Application Logs**: Django rate limit violations
3. **Redis Monitoring**: Rate limit key patterns

## Error Handling

### GraphQL Errors

Rate limit exceeded returns a GraphQL error:

```json
{
  "errors": [{
    "message": "Rate limit exceeded: Maximum 5 requests per minute. Please try again later.",
    "extensions": {
      "code": "RATE_LIMIT_EXCEEDED"
    }
  }]
}
```

### Client Handling

Clients should:

1. Respect rate limit errors
2. Implement exponential backoff
3. Cache responses when possible
4. Batch requests efficiently

## Testing

### Unit Tests

Test rate limiting in isolation:

```python
from django.test import TestCase, RequestFactory
from config.graphql.ratelimits import graphql_ratelimit

class RateLimitTests(TestCase):
    def test_rate_limit_exceeded(self):
        @graphql_ratelimit(rate="1/m")
        def resolver(root, info):
            return "success"

        # First call succeeds
        result = resolver(None, self.mock_info)

        # Second call fails
        with self.assertRaises(RateLimitExceeded):
            resolver(None, self.mock_info)
```

### Integration Tests

Test with actual GraphQL queries:

```python
def test_mutation_rate_limit(self):
    # Make requests up to the limit
    for _ in range(5):
        response = self.client.post('/graphql', {
            'query': 'mutation { createDocument(...) { ok } }'
        })
        self.assertEqual(response.status_code, 200)

    # Next request should be rate limited
    response = self.client.post('/graphql', {
        'query': 'mutation { createDocument(...) { ok } }'
    })
    self.assertIn('Rate limit exceeded', response.json()['errors'][0]['message'])
```

### Load Testing

Use the test script:

```bash
python scripts/test-django-ratelimit.py
```

## Best Practices

1. **Choose Appropriate Limits**: Balance security with usability
2. **Use Dynamic Rates**: Adjust limits based on user tier
3. **Cache Expensive Operations**: Reduce need for repeated queries
4. **Monitor and Adjust**: Review logs and adjust limits as needed
5. **Document Limits**: Inform API users of rate limits
6. **Graceful Degradation**: Provide helpful error messages

## Troubleshooting

### Rate Limits Not Working

1. Check Redis connection:
```python
from django.core.cache import cache
cache.set('test', 'value')
print(cache.get('test'))
```

2. Verify decorator order (login_required should be first):
```python
@login_required  # First
@graphql_ratelimit(...)  # Second
def mutate(...):
```

3. Check settings:
```python
from django.conf import settings
print(settings.RATELIMIT_ENABLE)
print(settings.RATELIMIT_DISABLE)
```

### Too Restrictive

- Increase limits for authenticated users
- Implement caching to reduce requests
- Consider pagination for large datasets

### Bypassing Rate Limits

- Ensure IPv6 subnet masking is configured
- Monitor for distributed attacks
- Implement additional security measures (CAPTCHA, etc.)

## Future Enhancements

1. **Sliding Window Algorithm**: More accurate rate limiting
2. **Per-Organization Limits**: Team-based rate limits
3. **Adaptive Rate Limiting**: Adjust based on system load
4. **Rate Limit Quotas**: Daily/monthly quotas for heavy operations
5. **WebSocket Rate Limiting**: Extend to real-time connections
