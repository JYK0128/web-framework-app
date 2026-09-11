# CQRS and DTOs

- Flow: `Controller → Command/Query → Handler → Response DTO`.
- Match the Command/Query generic and Handler return type.
- Pass the Controller's Request DTO as the Command/Query `input`.
- Keep an empty Request DTO when an endpoint has no input body or parameters.
- Always define a named Response DTO, even when the response only contains `ok` or no meaningful data. Do not return `void` or an anonymous object.
- Handlers consume `command.input` or `query.input` and follow `identify → verify → process`.
- Use `EntityDto(Entity)` only when it provides a real request or response contract; declare externally exposed fields and validation in the DTO.
- Follow [dto-conventions](dto-conventions.md) for naming and mapping.
