---
name: error-handling-conventions
description: >-
  Use when adding, changing, or reviewing error propagation, exception mapping,
  validation failures, cleanup, or recovery behavior in this repository.
---

# Error handling

Use this skill when changing how failures are detected, propagated, mapped, logged, recovered from, or returned to a caller. Trace the failure from its source to the boundary that decides the outcome before editing.

## Propagate failures from their source

- When an operation fails, throw an exception at the closest layer that can identify the cause and assign the right meaning. Translate low-level or external failures at the boundary that understands them; do not return a failure-shaped value for the next layer to turn into an exception.
- If failure should stop the operation, let the exception propagate to the layer that can report or recover from it.
- If the caller should continue after failure, catch it at the caller that owns that policy. Record the failure, apply any fallback, and continue there. Lower layers should not suppress errors based on assumptions about how callers will use them.
- Return a result for expected outcomes that are part of the operation's normal contract, such as an optional lookup or a partial outcome. Do not use a result object to disguise an exceptional failure.

## Use the repository error types

- Use `ApplicationError` from `@pkg/shared/common` for expected application failures that need a stable error code, HTTP status, translated message, or structured details.
- Use NestJS `HttpException` subclasses where a Nest boundary or existing framework contract calls for them. Do not use a generic `Error` or framework exception merely to translate a lower-level failure; map it where its meaning is understood.
- Assign an appropriate status to application failures: invalid client input `400`, missing resources `404`, authentication/authorization failures `401`/`403`, conflicts `409`, unavailable dependencies `503`, failed upstream calls `502`, and unexpected programming errors `500`.
- Add new public error codes to both `ko.json` and `en.json` for the affected API. Prefer a stable localized message; do not expose credentials, request headers, raw payloads, or untrusted downstream messages in the response.
- Preserve diagnostic causes for logs. When translating an unknown lower-level exception at a boundary, use `ApplicationError.from(error, { code, status, message })` where appropriate. Avoid replacing an existing `ApplicationError` with a less specific one.

## Catch only to apply a policy

- Use `catch` for cleanup, recovery, retry, logging at a boundary that can act, or translation from a lower-level error to an application-level error.
- After cleanup, rethrow the original `ApplicationError` when it already expresses the failure. If an unknown error must be translated, preserve it as the cause.
- Do not catch an error only to return a failure-shaped value, return `null`, or throw a generic `Error`. Do not swallow an error after logging unless the current layer explicitly owns the recovery or continuation policy.
- In `finally`, release resources without replacing the original failure with a cleanup error unless that cleanup failure is itself the governing failure.

## Keep HTTP serialization at the framework boundary

- Let the global error filters serialize `ApplicationError` and NestJS exceptions into the standard API error envelope. Do not construct ad hoc error response bodies in controllers or services.
- Keep normal successful handler values in the standard response transformation path. Streaming, redirects, and binary responses may use their transport-specific response path.
- Do not catch an exception at an HTTP boundary just to reformat it; let the global filters handle it unless that layer has a concrete recovery or translation policy.

## Handle non-HTTP work explicitly

- HTTP filters do not decide retry, acknowledgement, or continuation for scheduled jobs, event handlers, and broker consumers. At those boundaries, log with useful operation identifiers and apply the job's retry/acknowledgement policy.
- For best-effort side effects, catch the exception at the caller that owns the continuation decision. Ensure failure is observable through structured logs or telemetry, then continue the primary operation.

## Verify error behavior

- Test that failures map to the expected application error code and status, and that successful operations retain their expected result.
- Test caller behavior separately when it owns cleanup, retry, recovery, or continuation.
- Verify that API errors still pass through the global filters and match the documented response envelope. Include a regression test when changing an established error code or status.
