# How rate limiting works

This guide explains the rate limiting system used by the platform API. It covers how the token bucket algorithm manages request allowances, which HTTP headers communicate rate limit status, and how clients should handle [`429 Too Many Requests`](#) responses. Familiarity with basic HTTP request-response mechanics is assumed.

## The token bucket algorithm

The platform uses a *token bucket* algorithm to enforce rate limits. Each client application is assigned a bucket that holds a fixed number of tokens. Every API request consumes one token. Tokens are replenished at a constant rate — for most endpoints, 120 tokens per minute.

When the bucket is full, additional tokens are discarded rather than queued, meaning unused capacity does not accumulate beyond the bucket’s maximum size. When the bucket is empty, the server rejects incoming requests with a `429 Too Many Requests` status until tokens replenish.

This model permits short bursts of traffic (up to the bucket’s capacity) while enforcing a sustainable average rate over time. A client that sends 30 requests in one second can do so as long as sufficient tokens remain, but sustained traffic above the replenishment rate eventually exhausts the bucket.

> **Note:** Rate limits are applied per client application, identified by `client_id`. Multiple users sharing the same client credentials share a single token bucket.

## Rate limit headers

Every API response includes headers that report the current state of the client’s token bucket. These headers allow clients to monitor their remaining capacity without trial and error.

`X-RateLimit-Limit`
:   The maximum number of requests permitted within the current rate limit window.
This value corresponds to the bucket’s total capacity.

`X-RateLimit-Remaining`
:   The number of requests that can still be made before the bucket is exhausted.
This value decreases with each request and increases as tokens replenish.

`Retry-After`
:   Present only on `429` responses. Specifies the number of seconds the client should
wait before retrying. The value reflects the time until at least one token becomes
available.

### Reading rate limit headers in a response

A typical successful response includes the rate limit headers alongside the response body:

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 87

{
  "data": { "id": "usr_12345", "name": "Jane Doe" }
}
```

The `X-RateLimit-Remaining` value of `87` indicates 87 requests remain before the bucket empties.

## Handling `429` responses

When the token bucket is empty, the server returns a `429 Too Many Requests` response with a `Retry-After` header:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 12
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0

{
  "error": "rate_limit_exceeded",
  "error_description": "Request limit reached. Retry after 12 seconds."
}
```

Clients should respect the `Retry-After` value and pause requests for the specified duration. Ignoring this header and continuing to send requests does not accelerate token replenishment and may result in extended throttling.

### Implementing retry logic

A robust client implements exponential backoff as a fallback in case the `Retry-After` header is absent or the retry still returns `429`. The recommended approach:

1. Read the `Retry-After` header value.
1. Wait for the specified number of seconds.
1. Retry the request.
1. If the retry also returns `429`, double the wait time (up to a maximum of 60 seconds) and retry again.
1. After five consecutive `429` responses, log the failure and stop retrying.

```python
import time
import requests

def request_with_retry(url, headers, max_retries=5):
    wait = 1
    for attempt in range(max_retries):
        response = requests.get(url, headers=headers)
        if response.status_code != 429:
            return response
        retry_after = int(response.headers.get("Retry-After", wait))
        time.sleep(retry_after)
        wait = min(wait * 2, 60)
    return response
```

The function reads `Retry-After` when available and falls back to exponential backoff otherwise. The maximum wait is capped at 60 seconds to prevent indefinite blocking.

## Rate limits by endpoint

Not all endpoints share the same limits. The following table summarizes the default rate limits for common endpoint categories:

|Endpoint category      |Requests per minute|Bucket size|
|-----------------------|-------------------|-----------|
|Authentication         |60                 |60         |
|Read operations (GET)  |120                |120        |
|Write operations (POST)|60                 |60         |
|Bulk operations        |10                 |10         |


> **Warning:** Bulk operation endpoints have significantly lower rate limits. Clients
> that batch large operations should monitor `X-RateLimit-Remaining` closely and
> implement request queuing to avoid hitting the limit.

## See Also

- [`429 Too Many Requests`](#) — Reference page for the rate limit status code.
- [`Retry-After` header](#) — Reference page for the retry timing header.
- [Authentication](#) — Rate limits are scoped per authenticated client.
- [Error handling](#) — General patterns for handling API error responses.
- [RFC 6585 — Additional HTTP Status Codes](https://datatracker.ietf.org/doc/html/rfc6585) — The specification defining `429 Too Many Requests`.
