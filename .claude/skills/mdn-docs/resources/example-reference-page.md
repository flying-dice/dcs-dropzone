# `POST /auth/token`

**Stable**

The **`POST /auth/token`** endpoint issues an access token using the [OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749) client credentials grant. A client exchanges its credentials for a bearer token that authorizes subsequent API requests.

|Property      |Value                                  |
|--------------|---------------------------------------|
|HTTP method   |`POST`                                 |
|Authentication|Client credentials (ID + secret)       |
|Content type  |`application/x-www-form-urlencoded`    |
|Rate limited  |Yes — 60 requests per minute per client|

## Syntax

```http
POST /auth/token HTTP/1.1
Host: api.example.com
Content-Type: application/x-www-form-urlencoded

client_id=<client_id>&client_secret=<client_secret>&grant_type=<grant_type>
```

## Parameters

`client_id`
:   **String, required.** The unique identifier assigned to the application during
[client registration](#client-registration).

`client_secret`
:   **String, required.** The secret key paired with the `client_id`. This value must
be kept confidential and should never be exposed in client-side code.

`grant_type`
:   **String, required.** The OAuth 2.0 grant type. For the client credentials flow,
this must be set to `"client_credentials"`. No other grant types are accepted at
this endpoint.

## Description

The token endpoint validates the provided `client_id` and `client_secret` against the
registered credentials in the authorization server. If validation succeeds, the server
returns a JSON object containing a bearer access token, its type, and its lifetime in
seconds.

The issued token grants access scoped to the permissions associated with the client
application. Token scope cannot exceed the permissions assigned during registration.

Tokens are short-lived. The `expires_in` field indicates the number of seconds until
the token becomes invalid. Clients should request a new token before expiration rather
than caching tokens indefinitely.

> **Warning:** The `client_secret` is transmitted in the request body. All requests to
> this endpoint must use HTTPS. Sending credentials over an unencrypted connection
> exposes them to interception.

## Examples

### Requesting an access token

The following request exchanges client credentials for a bearer token.

```http
POST /auth/token HTTP/1.1
Host: api.example.com
Content-Type: application/x-www-form-urlencoded

client_id=app_8f3k2m&client_secret=sk_live_abc123xyz&grant_type=client_credentials
```

The server responds with a JSON object containing the token:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIi...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

The `access_token` value is included in subsequent requests using the
[`Authorization`](#) header:

```http
GET /resources HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIi...
```

### Handling an invalid request

If the `client_id` or `client_secret` is incorrect, the server returns a
[`401 Unauthorized`](#) response:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "invalid_client",
  "error_description": "Client authentication failed."
}
```

## Error responses

|Status code            |Error code       |Description                                  |
|-----------------------|-----------------|---------------------------------------------|
|`400 Bad Request`      |`invalid_request`|A required parameter is missing or malformed.|
|`401 Unauthorized`     |`invalid_client` |Client credentials are incorrect.            |
|`429 Too Many Requests`|`rate_limit`     |The client has exceeded the rate limit.      |

## Specifications

|Specification                                                                                    |Status           |
|-------------------------------------------------------------------------------------------------|-----------------|
|[RFC 6749 — The OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749)|Internet Standard|
|[RFC 6750 — Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750)                   |Internet Standard|

## See Also

- [`POST /auth/revoke`](#) — Revokes an active access token.
- [`Authorization` header](#) — Transmits the bearer token with API requests.
- [Using OAuth 2.0 with your application](#) — Guide covering the full client credentials flow.
- [`429 Too Many Requests`](#) — Rate limit status code returned when request limits are exceeded.
