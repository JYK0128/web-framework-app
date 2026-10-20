---
name: pragmatic-coding-principles
description: Review, design, or refactor code with simple, cohesive abstractions and minimal indirection.
---

# Pragmatic Coding Principles

Use the smallest clear abstraction that owns real behavior, policy, validation, or a stable boundary.

- KISS/YAGNI: implement only the required behavior.
- Minimal diff: keep changes focused on the requirement; avoid unrelated edits and preserve existing behavior.
- Reuse before build: look for a suitable existing abstraction, utility, or dependency before creating a new one; extend it only when that remains clear and cohesive.
- Rule of Three: tolerate a second similar instance; extract a shared abstraction when a third confirms the same behavior or policy.
- Complexity budget: every abstraction, branch, state value, dependency, and configuration option must pay for itself in reduced complexity or a real requirement.
- DRY: remove duplicated knowledge, not every repeated line.
- Single source of truth (SSOT): define each piece of information, rule, or value in one authoritative place. Have consumers reference that definition instead of copying or aliasing it. Keep separate representations only when a real boundary requires them, and make any translation explicit.
- Derived state: compute values from their authoritative source where they are consumed instead of storing a second copy. Store derived state only when a concrete requirement needs an independent lifecycle; document and maintain how it stays synchronized with its source.
- Justify abstractions: add an abstraction only when its concrete benefit outweighs the indirection and maintenance cost.
- Do not add pass-through wrappers, one-use derived variables, vague helpers, or speculative abstractions.
- Extract only for a real invariant, policy, validation, side effect, boundary, or meaningful repeated complexity.
- High cohesion, low coupling: keep related responsibilities together and minimize dependencies between modules.
- Preserve invariants: identify the existing rules and state conditions the system relies on, and keep them true through the change.
- User-facing language: write messages in plain language users understand; do not expose internal implementation details, infrastructure, or technical names users do not need.
- Fail closed by default: under any condition, proceed only when required inputs, state, configuration, and checks are positively established; missing, invalid, ambiguous, or failed prerequisites must stop the operation or deny access rather than silently permit it.
- When an abstraction is wrong, inline or split it at its callers.
- Simplification pass: after implementing or reviewing a change, remove unnecessary layers, branches, state, and configuration while preserving required behavior.
- Review findings as correctness/security, harmful indirection, or optional style; state the concrete cost and smallest alternative.
