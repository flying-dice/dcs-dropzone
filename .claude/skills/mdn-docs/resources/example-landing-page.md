# Authentication

Authentication controls how clients prove their identity when accessing the API. This section covers the supported authentication methods, including OAuth 2.0, API keys, and session tokens, along with reference documentation for each authentication endpoint and header.

## Guides

[Using OAuth 2.0 with your application](#)
:   Walks through the client credentials flow from registration to token refresh, with code examples for common languages.

[Authenticating with API keys](#)
:   Explains how to generate, rotate, and scope API keys for server-to-server authentication.

[Managing session tokens](#)
:   Covers session-based authentication for browser clients, including token storage, expiration, and renewal.

## Reference

### Headers

- [`Authorization`](#) — Transmits credentials or bearer tokens with each API request.

### Endpoints

- [`POST /auth/token`](#) — Issues an access token using the OAuth 2.0 client credentials grant.
- [`POST /auth/revoke`](#) — Invalidates an active access or refresh token.

## See Also

- [Security best practices](#) — General guidance on securing API credentials and connections.
- [Rate limiting](#) — How authentication interacts with per-client rate limits.
