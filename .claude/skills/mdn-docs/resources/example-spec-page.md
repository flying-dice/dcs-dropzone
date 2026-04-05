# {Behavior Name}

**{Status: Stable | Experimental | Deprecated}**

{Single opening paragraph: one to three sentences defining what this behavior is and what it does. Link to related concepts on first mention.}

| Property      | Value                                              |
|---------------|----------------------------------------------------|
| Applies to    | {App: Daemon, Webapp, or Launcher}                 |
| Trigger       | {What initiates this behavior}                     |
| Preconditions | {What must be true before the behavior can occur}  |

## Inputs

`{parameterName}`
:   **{Type}, required.** {Description of the parameter.}

`{anotherParameter}`
:   **{Type}, optional.** {Description. State the default if applicable.}

### Assertions

| Assertion | Status |
|-----------|--------|
| {Condition that must hold for the operation to proceed} | <Badge type="tip" text="Implemented" /> |
| {Another precondition checked at runtime} | <Badge type="warning" text="Not Implemented" /> |

### Outputs

`{ReturnType}`
:   {Description of what is returned on success.}

`{ErrorType}`
:   {When this error is returned and what it means.}

`{AnotherErrorType}`
:   {When this error is returned and what it means.}

### Effects

| Effect | Status |
|--------|--------|
| {Side effect on disk, database, or external system} | <Badge type="tip" text="Implemented" /> |
| {Another side effect} | <Badge type="tip" text="Implemented" /> |
| {Planned side effect not yet implemented} | <Badge type="warning" text="Not Implemented" /> |

## Behavior

```mermaid
flowchart TD
    Start([{behaviorName} {params}]) --> Guard1{First guard check?}

    Guard1 -- No --> Err1([Reject: ErrorType])
    Guard1 -- Yes --> Guard2{Second guard check?}

    Guard2 -- No --> Err2([Reject: AnotherErrorType])
    Guard2 -- Yes --> Action[Perform main action]

    Action --> Result{Action succeeded?}

    Result -- No --> Fail[Handle failure]
    Result -- Yes --> SideEffect[Apply side effects]

    SideEffect --> Done([Behavior complete])

    Fail -.-> Rollback[Roll back changes]

    style Err1 fill:#f87171,color:#fff
    style Err2 fill:#f87171,color:#fff
    style Fail fill:#f87171,color:#fff
    style Rollback fill:#fbbf24,color:#000,stroke-dasharray: 5 5
    style Done fill:#4ade80,color:#000
```

## See Also

- [{Related Spec}]({path}) — {One-line description.}
- [{Related Guide}]({path}) — {One-line description.}
- [{Related Reference}]({path}) — {One-line description.}
