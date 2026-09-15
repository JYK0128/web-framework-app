# CQRS and DTOs

- Flow: `Controller → Command/Query → Handler → Response DTO`.
- Match the Command/Query generic and Handler return type.
- Use the smallest input shape that preserves the boundary: body-only actions may pass the Request DTO directly; path-only actions use a named Payload with a domain-specific identifier such as `{ alertId }`; query actions use `{ query }`; path plus body uses a domain-specific identifier plus `{ input }`, such as `{ ticketId, input }`. Do not use a generic `id` property in a Payload.
- A path-only primitive does not require a synthetic Request DTO. If the path value has a format contract, validate it at the HTTP boundary with the repository's existing pipe or DTO convention before placing it in the Payload.
- Keep an empty Request DTO when an endpoint has no input body or parameters.
- Always define a named Response DTO, even when the response only contains `ok` or no meaningful data. Do not return `void` or an anonymous object.
- Handlers consume `command.input` or `query.input` and follow `identify → verify → process`.
- Use `EntityDto(Entity)` only when it provides a real request or response contract; declare externally exposed fields and validation in the DTO.
- Keep external Response DTOs distinct from internal domain results when the internal result contains sensitive data, provider-specific fields, or cross-module information.
- Keep `List`, `Page`, and `Cursor` response metadata distinct from their nested `ItemDto`; the same pagination mechanism does not imply the same resource contract.
- Separate admin/public operations when authority, filtering, mutation, or response visibility differs. Do not hide the distinction behind an `isAdmin` Payload flag.
- Controller methods that are intentionally direct integrations (for example redirects, health checks, uploads, or session context reads) do not need an artificial Command/Query pair; document the exception when it is useful.
- Follow [dto-conventions](dto-conventions.md) for naming and mapping.
