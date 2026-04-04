# Get User Mod Release

**Stable**

Getting a user mod release returns the full details of a single [release](#) for a [mod](#) owned by the authenticated user, including its assets, symbolic link definitions, and mission scripts. Only maintainers of the mod may retrieve it.

| Property      | Value                                                            |
|---------------|------------------------------------------------------------------|
| Applies to    | Webapp                                                           |
| Trigger       | Client requests `GET /api/user-mods/:id/releases/:releaseId`     |
| Preconditions | The user is authenticated and is a maintainer of the mod         |

## Inputs

`id`
:   **String, required (path parameter).** The identifier of the mod.

`releaseId`
:   **String, required (path parameter).** The identifier of the release.

### Assertions

| Assertion | Status |
|-----------|--------|
| The user must be authenticated | <Badge type="tip" text="Implemented" /> |
| The mod must exist | <Badge type="tip" text="Implemented" /> |
| The authenticated user must be a maintainer of the mod | <Badge type="tip" text="Implemented" /> |
| The release must exist | <Badge type="tip" text="Implemented" /> |

### Outputs

`ModReleaseData`
:   Returned with `200 OK` when the release is found and the user is a maintainer.

`{ code: 404, error: "ModNotFoundError" | "NotMaintainerError" | "ReleaseNotFoundError" }`
:   Returned when the mod does not exist, the user is not a maintainer, or the release does not exist.

`401 Unauthorized`
:   Returned when the session cookie is absent or invalid.

### Effects

None. This is a read-only operation.

## Behavior

```mermaid
flowchart TD
    Start([GET /api/user-mods/:id/releases/:releaseId]) --> Auth{Authenticated?}

    Auth -- No --> Reject401([401 Unauthorized])
    Auth -- Yes --> ModExists{Mod exists?}

    ModExists -- No --> Reject404A(["404 ModNotFoundError"])
    ModExists -- Yes --> IsMaintainer{User is maintainer?}

    IsMaintainer -- No --> Reject404B(["404 NotMaintainerError"])
    IsMaintainer -- Yes --> ReleaseExists{Release exists?}

    ReleaseExists -- No --> Reject404C(["404 ReleaseNotFoundError"])
    ReleaseExists -- Yes --> Done([200 ModReleaseData])

    style Reject401 fill:#f87171,color:#fff
    style Reject404A fill:#f87171,color:#fff
    style Reject404B fill:#f87171,color:#fff
    style Reject404C fill:#f87171,color:#fff
    style Done fill:#4ade80,color:#000
```

## See Also

- [Get user mod releases](/webapp/spec/get-user-mod-releases) — Spec page for listing all releases for this mod.
- [Update release](/webapp/spec/update-release) — Spec page for editing this release's content.
- [Delete release](/webapp/spec/delete-release) — Spec page for removing this release.
