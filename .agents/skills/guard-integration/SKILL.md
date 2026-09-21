---
name: guard-integration
description: >-
  Use when changing authentication, authorization, terms, verification, or
  other NestJS guards and their registration. Do not apply to ordinary services
  that do not affect request guards.
---

# Guard integration

- Follow the registration order and application style in `src/common/core.module.ts` and the relevant guard implementation.
- Do not redundantly declare globally registered guards on individual endpoints.
- Verify the full request path from authentication principal through authorization decision.
- Fail closed for missing or invalid security input; never invent an identity or silently continue after a required security failure.
