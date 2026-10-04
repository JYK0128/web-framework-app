---
name: api-codegen-integration
description: >-
  Use when changing public NestJS HTTP, Swagger/OpenAPI contracts, generated
  React API clients, or the server-to-frontend API integration workflow.
  Do not apply to internal handler changes with no public contract change.
---

# API and codegen integration

- Change public contracts in this order: Entity/DTO → Command/Query/Handler → Controller/Swagger → codegen → UI.
- Treat server DTOs and Swagger/OpenAPI as the API source of truth.
- Update the server contract before regenerating clients.
- Use generated types, hooks, and schemas directly in React.
- Never edit generated files manually.
- Replace legacy models and references when the contract changes; do not keep duplicate local models or compatibility wrappers.
- Regenerate clients only when the public HTTP/Swagger contract changes.
- Run server, client, and shared-package typechecks plus `git diff --check` after a contract change.
