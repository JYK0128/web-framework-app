---
name: cqrs-dto-integration
description: >-
  Use when changing NestJS Commands, Queries, Handlers, request or response
  DTOs, or their controller boundary. Do not apply to frontend-only TypeScript.
---

# CQRS and DTO integration

## Module layout

- Organize backend modules as `modules/<domain>/<subdomain>/<file>`. Group files by a real business responsibility, such as authentication sessions or service delivery settings; do not create a folder per action.
- Keep each subdomain flat: commands, queries, handlers, DTOs, events, and helpers live together. Distinguish roles with file suffixes, not `commands/`, `queries/`, `handlers/`, `dto/`, or `events/` directories.
- Keep domain-level Nest module wiring and files composing multiple subdomains at the domain root. When subdomains own Nest modules, put their focused controllers in those subdomains and register them in the owning child module. Subdomains owning providers or runtime dependencies may define their own `<subdomain>.module.ts`, registering their handlers directly and importing their dependencies. The parent imports these modules; export only providers consumed outside the child (for example a service used by another module). Do not add Nest modules for DTO-only folders. A small domain with one responsibility may remain entirely flat without artificial subdomains.
- Prefer direct DTO imports in focused subdomain controllers and internal files. Keep a domain DTO barrel only where a controller composing multiple responsibilities benefits from it; do not create one for auth now that its controllers are split by subdomain. Import commands, queries, events, and individual handlers directly from their implementation files; do not add re-export barrels for them. Keep handler registration arrays in `<domain>.handlers.ts` when needed, exporting only the registration arrays. Do not re-export handlers or runtime providers through the DTO barrel.
- Apply the same responsibility names to corresponding admin/service features where their responsibilities match. Keep implementation ownership and existing public API contracts unchanged when moving files.
- Classify auth subdomains by what they manage: `account` (registration, withdrawal, ID lookup), `credential` (password changes and resets), `email-verification`, `two-factor` (setup and two-factor login), `session` (login, logout, refresh), `profile` (current user), `phone-verification` (phone identity verification), and `oauth`. Do not mix lifecycle folders such as `registration`/`recovery` with purpose folders such as `security`. Split multi-responsibility handler files so implementations live with their owning subdomain; keep genuinely shared auth helpers at the auth root.

## CQRS boundaries

- Preserve `Controller → Command/Query → Handler → Response DTO`.
- Match Command/Query generics and Handler return types.
- Use domain-specific path identifiers in payloads; do not use generic `id` payload properties.
- Keep empty Request DTOs for endpoints with no input and named Response DTOs even for `ok` responses.
- Handlers consume `command.input` or `query.input` and preserve `identify → verify → process` when present.
- When changing corresponding admin/service features, check both sides, especially authentication. Preserve intentional differences in authority, filtering, mutation, response visibility, and pagination.
- Direct integrations such as redirects, health checks, uploads, or session reads may omit CQRS when the exception is intentional.

## DTO roles and names

- Request: `{Action}RequestDto`; response: `{Action}ResponseDto`.
- Collection item: `{Resource}ItemDto`; nested object: `{Parent}{Child}Dto`.
- Use `EntityDto(Entity)` for entity-based request and item DTOs. An item represents an entity even when it appears inside a response's `items` array; do not use `EntityResponseDto` for item DTOs.
- Use `EntityResponseDto(Entity)` for entity-based response DTOs. It is assigned directly to `EntityDto`, so behavior and type contracts are identical; the names distinguish usage only. Do not split their implementations or contracts.
- Both names provide entity-based editor hints and field types, without automatically exposing fields or mapping entities. Explicitly declare API fields and apply Swagger, validation, and transformation decorators. Override inherited fields when needed.
- Use `BaseDto` for general structures that do not need entity-based types. An entity-related request or aggregate response is not, by itself, a reason to replace an entity DTO parent with `BaseDto`.

## Collection responses

- Non-paginated collection: `{Resource}ListResponseDto extends ListResponseDto<ItemDto>`.
- Page-based collection: `{Resource}PageResponseDto extends PageResponseDto<ItemDto>`.
- Cursor-based collection: `{Resource}CursorResponseDto extends CursorResponseDto<ItemDto>`.
- Match the class name, file name, parent, and actual pagination metadata. A paginated result must not be named `ListResponseDto`, and a non-paginated result must not be named `PageResponseDto`.
- Keep list/page/cursor metadata on the collection response, separate from nested item DTOs. Put item-derived fields on the relevant item DTO.
- Use `@Type` for collection items, `@Transform` for flattened relations, and convert MikroORM collections to arrays.

## Entity mapping with parseEntity()

- Use `parse()` to construct DTOs from plain values. When converting actual entity instances, implement `static override parseEntity(...)` on the concrete DTO and call that mapper from handlers.
- Keep entity-to-DTO field mapping in the DTO and reuse it across list, detail, and mutation responses. Keep database access, authorization, and business policy decisions in handlers; pass mapping context explicitly.
- Entity association alone does not require a mapper. HTTP request DTOs and DTOs forwarding a response already mapped by another service may use entity-based parents only for editor hints, without implementing or calling `parseEntity()`.
- The inherited `parseEntity()` throws when called without a concrete implementation. This is a runtime guard, not a TypeScript requirement to implement a static method.
- `EntityDto(A, B)` and `EntityResponseDto(A, B)` share the contract `parseEntity(a: A, b: B, ...args)`, where `A` and `B` here mean instances of the supplied entity classes. Preserve every entity argument's type and order before additional mapping arguments.
- Declare additional arguments' concrete types and required/optional status in the DTO's override. They are not additional entity classes and do not change the entity field hints. For example:

```ts
class ExampleItemDto extends EntityDto(User, Account) {
  @ApiProperty() override id!: string;
  @ApiProperty() override providerId!: string;
  @ApiProperty() userCount!: number;
  @ApiPropertyOptional() label?: string;

  static override parseEntity(
    user: User,
    account: Account,
    userCount: number,
    label?: string,
  ): ExampleItemDto {
    return this.parse({
      id: user.id,
      providerId: account.providerId,
      userCount,
      label,
    });
  }
}
```

- Keep all entity parameters in the concrete override, in the same order as the parent factory. Calls are type-checked against the mapper's declared entity and additional arguments; do not weaken these types with casts or an untyped rest parameter.

- `parse(value)` constructs a single DTO from plain values; `parseArray(values)` constructs a DTO array with a `T[]` return type. Neither method automatically validates. Keep validation explicit with `validate()` where required.
- Use the inherited `parse(...)` for normalized error objects; do not add a separate `parseError(...)` factory. Normalize raw errors at the logging boundary before DTO construction. Reserve `parseEntity(...)` for entity mapping.

- `BaseDto.validate()` validates the DTO with class-validator and returns the same instance. The protected static `validationError` defines the error code/status and defaults to `VALIDATION_ERROR` / HTTP 400. Request DTOs use the default; response/internal DTOs override this class property when needed. Do not pass error code/status at validation call sites. Use separate request and response DTOs when their error policies differ.
