---
name: cqrs-dto-integration
description: >-
  Use when changing NestJS Commands, Queries, Handlers, request or response
  DTOs, or their controller boundary. Do not apply to frontend-only TypeScript.
---

# CQRS and DTO integration

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

## Entity mapping with from()

- Use `fromPlain()` to construct DTOs from plain values. When converting actual entity instances, implement `static override from(...)` on the concrete DTO and call that mapper from handlers.
- Keep entity-to-DTO field mapping in the DTO and reuse it across list, detail, and mutation responses. Keep database access, authorization, and business policy decisions in handlers; pass mapping context explicitly.
- Entity association alone does not require a mapper. HTTP request DTOs and DTOs forwarding a response already mapped by another service may use entity-based parents only for editor hints, without implementing or calling `from()`.
- The inherited `from()` throws when called without a concrete implementation. This is a runtime guard, not a TypeScript requirement to implement a static method.
- `EntityDto(A, B)` and `EntityResponseDto(A, B)` share the contract `from(a: A, b: B, ...args)`, where `A` and `B` here mean instances of the supplied entity classes. Preserve every entity argument's type and order before additional mapping arguments.
- Declare additional arguments' concrete types and required/optional status in the DTO's override. They are not additional entity classes and do not change the entity field hints. For example:

```ts
class ExampleItemDto extends EntityDto(User, Account) {
  @ApiProperty() override id!: string;
  @ApiProperty() override providerId!: string;
  @ApiProperty() userCount!: number;
  @ApiPropertyOptional() label?: string;

  static override from(
    user: User,
    account: Account,
    userCount: number,
    label?: string,
  ): ExampleItemDto {
    return this.fromPlain({
      id: user.id,
      providerId: account.providerId,
      userCount,
      label,
    });
  }
}
```

- Keep all entity parameters in the concrete override, in the same order as the parent factory. Calls are type-checked against the mapper's declared entity and additional arguments; do not weaken these types with casts or an untyped rest parameter.
