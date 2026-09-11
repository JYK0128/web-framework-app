# DTO conventions

## Naming

- Request: `{Action}RequestDto`
- Response: `{Action}ResponseDto`
- List/Page/Cursor item: `{Resource}ItemDto`
- Nested object: `{Parent}{Child}Dto`
- Put derived fields on the relevant `ItemDto`.

## Mapping

- Return DTOs with `fromPlain()` in handlers.
- Flatten relations with `@Transform` in item DTOs.
- Use `@Type(() => ChildItemDto)` for collections.
- Convert MikroORM `Collection` values to arrays in item DTOs.
- Combine external lookups and aggregates in the handler before passing them to `fromPlain()`.
