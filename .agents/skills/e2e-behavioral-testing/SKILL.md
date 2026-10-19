---
name: e2e-behavioral-testing
description: Write and run end-to-end tests that verify real user workflows and resulting state changes, not merely rendered UI or element presence. Use for Playwright or equivalent tests of mutations, permissions, authentication, and business flows.
---

# Behavioral E2E testing

E2E tests must prove that a user action produces the correct observable outcome. A test that only checks that a page, button, modal, or text is rendered is not sufficient for a functional flow.

## Test objective

Start with the business result, not the UI structure:

- What state should change after the action?
- Which persisted data or API response proves that it changed?
- What must remain unchanged or be rejected?
- What authorization or validation rule is being exercised?

Use UI actions when the behavior is a user workflow. Use API or service-level tests when the behavior does not depend on the UI. Do not add DOM assertions just to make a test appear comprehensive.

## Required shape for mutation flows

For create, update, delete, assignment, or permission flows, cover this sequence as appropriate:

1. Arrange a known authenticated actor and isolated test data.
2. Perform the same interaction a real user performs.
3. Assert the operation succeeds with the expected result.
4. Re-read the state through the application boundary (API, refreshed page, or a subsequent user action).
5. Assert the persisted business result, not only a toast or modal close.
6. Assert the relevant negative or authorization behavior when the flow changes access control.
7. Remove temporary data in `finally` or an equivalent teardown, even when an assertion fails.

For example, a role-permission test should select a real permission, save the role, reload or query the role, and verify that the saved permission is present. Checking that the checkbox was visible or checked before saving is only an interaction precondition, not the test result.

## Assertions

Prefer assertions that demonstrate state transitions:

- Before/after API payloads or resource records.
- A refreshed list containing the created or updated entity.
- A detail view showing the persisted value after navigation or reload.
- A protected request succeeding or returning `401/403` according to the assigned permissions.
- A deleted entity no longer being returned or usable.

Avoid relying on:

- `toBeVisible()` as the main assertion for a mutation.
- A button click followed only by checking that a dialog closed.
- A success toast as proof of persistence.
- Implementation-specific class names, generated markup, or checkbox state as the final result.

## Authentication and authorization

Use the real login/session/token path unless the test specifically targets a lower layer. Verify the resulting principal's effective permissions through an authorized operation. Do not bypass guards, inject wildcard permissions, or use an admin actor when the scenario is testing restricted access.

When a test changes permissions, verify both sides when practical:

- The permitted operation succeeds.
- An operation outside the assigned permissions is rejected.

## Test data and cleanup

Use unique, clearly identifiable test data. Prefer a test-only entity that can be deleted safely after the test. Cleanup must run even after a failed assertion and should use the authenticated application boundary where possible. Do not leave roles, users, permissions, or sessions in the shared development database.

If cleanup fails, report it explicitly; do not silently ignore the leaked data.

## Failure diagnosis

Separate these outcomes:

- Application failure: the request reached the app and returned an unexpected result.
- Assertion failure: the observable state differs from the expected business result.
- Environment failure: browser launch, network access, missing service, database, or seed data prevented the test from exercising the flow.

Do not change assertions to accommodate an environment failure. Record the blocked prerequisite and rerun when the test environment is available.

## Completion standard

Before reporting completion, run the relevant E2E suite and state exactly which workflows and resulting state changes were verified. A passing suite with only render/visibility checks must be described as smoke coverage, not functional coverage.
