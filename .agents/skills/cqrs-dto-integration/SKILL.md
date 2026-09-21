---
name: cqrs-dto-integration
description: >-
  Use when changing NestJS Commands, Queries, Handlers, request or response
  DTOs, or their controller boundary. Do not apply to frontend-only TypeScript.
---

# CQRS and DTO integration

- Preserve `Controller → Command/Query → Handler → Response DTO`.
- Match Command/Query generics and Handler return types.
- Use domain-specific path identifiers in payloads; do not use generic `id` payload properties.
- Keep empty Request DTOs for endpoints with no input and named Response DTOs even for `ok` responses.
- Handlers consume `command.input` or `query.input` and preserve `identify → verify → process` when present.
- Use `EntityDto(Entity)` only when it provides a real external contract; explicitly expose and validate external fields.
- Keep list/page/cursor metadata separate from nested item DTOs.
- Separate admin/public operations when authority, filtering, mutation, or response visibility differs.
- Direct integrations such as redirects, health checks, uploads, or session reads may omit CQRS when the exception is intentional.

## DTO conventions

- Request: `{Action}RequestDto`; response: `{Action}ResponseDto`.
- List/page/cursor item: `{Resource}ItemDto`; nested object: `{Parent}{Child}Dto`.
- Put derived fields on the relevant item DTO.
- Return DTOs with `fromPlain()` in handlers.
- Use `@Transform` for flattened relations, `@Type` for collections, and convert MikroORM collections to arrays.
