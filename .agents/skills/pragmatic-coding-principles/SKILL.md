---
name: pragmatic-coding-principles
description: Review, design, or refactor code with simple, cohesive abstractions and minimal indirection.
---

# Pragmatic Coding Principles

Use the smallest clear abstraction that owns real behavior, policy, validation, or a stable boundary.

- KISS/YAGNI: implement only the required behavior.
- DRY: remove duplicated knowledge, not every repeated line.
- Do not add pass-through wrappers, one-use derived variables, vague helpers, or speculative abstractions.
- Extract only for a real invariant, policy, validation, side effect, boundary, or meaningful repeated complexity.
- Prefer high cohesion, low coupling, local behavior, and unsurprising interfaces.
- When an abstraction is wrong, inline or split it at its callers.
- Review findings as correctness/security, harmful indirection, or optional style; state the concrete cost and smallest alternative.
