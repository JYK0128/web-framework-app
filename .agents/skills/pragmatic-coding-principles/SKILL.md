---
name: pragmatic-coding-principles
description: Review, design, or refactor code using pragmatic principles such as KISS, YAGNI, nuanced DRY, meaningful abstraction, high cohesion, low coupling, and minimal indirection.
---

# Pragmatic Coding Principles

Use this skill when reviewing, refactoring, or designing code where existing values are being wrapped, renamed, re-exported, or transformed without adding meaningful behavior or domain meaning.

## Core principle

Prefer the simplest representation that communicates the actual concept. An abstraction earns its place when it provides a stable concept, enforces an invariant, isolates a meaningful policy, or makes a likely change local. Do not create one merely to avoid repetition, satisfy an imagined future use case, or make code look more architected.

This is the practical rule behind “duplication is cheaper than the wrong abstraction”: temporary, obvious repetition is often easier to change than a shared abstraction that forces unrelated cases into one shape.

## Review for these smells

- Thin wrappers that only forward arguments or return an existing value.
- Variables whose only purpose is renaming, re-exporting, or copying another variable without improving domain meaning.
- Derived variables that encode no new invariant and are used only once.
- Layers, adapters, or helper functions with no policy, validation, ownership, or translation responsibility.
- Generic abstractions introduced after seeing one example, especially when their name is vague (`data`, `result`, `common`, `base`, `normalizedX`).
- Abstractions that accumulate flags, options, or conditionals to serve callers that are only superficially similar.
- Indirection that makes a reader jump across files to discover behavior that could be directly visible at the call site.

## Decision test

For each proposed wrapper, derived value, or abstraction, ask:

1. What distinct concept does this name introduce?
2. What invariant, policy, validation, side effect, or change boundary does it own?
3. Is it used more than once in a genuinely cohesive way, or merely because two things look alike today?
4. Does the indirection make the caller clearer than direct use would?
5. If a second use case appears, will this abstraction still describe both cases without flags or special cases?

If the answers are weak, recommend deleting the layer, inlining the value, or keeping the code temporarily duplicated. Make the smallest change that improves clarity; do not perform a broad cleanup unrelated to the request.

## Important nuance

Do not treat all wrappers or derived values as bad. Keep a wrapper when it marks a real boundary (for example, authorization, persistence, external API translation, or a domain type), protects an invariant, provides a stable public interface, or removes non-trivial repeated behavior. Prefer a precise name that describes that responsibility.

When an existing abstraction is wrong, do not preserve it because of sunk cost. Inline or split it at its callers, remove caller-specific branches, and only extract a new abstraction after the common behavior and its boundaries are clear. Explain the tradeoff briefly in the review or implementation summary.

## Coding guide: complementary principles

Apply these principles as heuristics, not laws. State the tradeoff when two principles point in different directions.

- **KISS (Keep It Simple):** choose the smallest design that is correct and readable. Avoid cleverness, speculative configuration, and infrastructure that the current requirement does not need.
- **YAGNI (You Aren’t Gonna Need It):** do not implement a future extension, generalized API, or extra variation until there is a concrete requirement. Leave a clear seam only when doing so costs little and protects a real boundary.
- **DRY (Don’t Repeat Yourself):** eliminate duplicated knowledge, not every repeated line. Two similar snippets may represent different policies and should remain separate until their reason to change is demonstrably the same.
- **Rule of Three:** after the first example, keep the code concrete; after the second, observe the shape; after the third, extract only the cohesive behavior that has become clear. This is a heuristic, not a required count.
- **Single Responsibility Principle:** define responsibility as a reason to change, not as “one function per line” or “one class per noun.” Split code when separate policies or change drivers are entangled.
- **High cohesion, low coupling:** keep behavior and data that change together close; avoid shared abstractions that couple unrelated callers merely because their current inputs or outputs look alike.
- **Principle of Least Surprise:** names, return values, side effects, and boundaries should behave as a reader reasonably expects. A short abstraction that hides surprising behavior is worse than a longer direct implementation.
- **Locality of behavior:** a reader should be able to understand important behavior near its use. Introduce indirection when it clarifies a boundary or isolates complexity, not merely to shorten a call site.

## Review output

When reviewing code, distinguish clearly between:

1. correctness or security issues;
2. harmful indirection or a likely wrong abstraction;
3. optional style preferences.

For each finding, name the concrete cost (extra navigation, hidden policy, forced coupling, special-case growth, or misleading naming) and suggest the smallest direct alternative. If no meaningful cost exists, do not manufacture a finding just to enforce a principle.

## Vocabulary

Use precise terms when communicating the issue:

- premature abstraction — abstraction introduced before the shared shape is understood
- wrong abstraction — an abstraction whose callers are forced into unrelated behavior
- accidental indirection — an extra hop that adds no meaningful responsibility
- meaningless/thin wrapper — a pass-through function, object, or variable
- derived-variable proliferation — many low-value names created from existing values
- unnecessary abstraction — the broad category covering these problems

Useful references: Sandi Metz, [The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction); Martin Fowler, [YAGNI](https://martinfowler.com/bliki/Yagni.html); Kent C. Dodds, [AHA Programming](https://kentcdodds.com/blog/aha-programming).
