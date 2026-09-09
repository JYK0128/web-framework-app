# Backend integration

## CQRS

- 기본 흐름은 `Controller → Command/Query → Handler → Response DTO`다.
- Command/Query의 generic 반환 타입과 Handler 반환 타입을 맞추고, 여러 입력값은 `input` payload로 전달한다.
- Handler는 `identify → verify → process` 표준 흐름으로 구현한다.
- Entity DTO는 `EntityDto(Entity)`로 Entity 필드 타입을 재사용하고, 외부 계약 필드와 검증 decorator는 DTO에 명시한다.

## Persistence와 컨텍스트

- 페이징은 `AppEntityManager`의 `findByPage`·`findByCursor` 계약을 확인한다.
- HTTP 요청의 Unit of Work와 soft-delete 필터는 공통 모듈 설정을 따른다.
- HTTP 생명주기 밖의 Scheduler·Event Handler에서 MikroORM을 사용할 때는 기존 `RequestContext.create(...)` 패턴을 확인한다.

관련 소스: `template/nest-starter-kit/src/infra/database/`, `src/common/interceptors/`, `src/common/core.module.ts`

## Guard

인증·권한·약관·검증 가드는 `template/nest-starter-kit/src/common/core.module.ts`와 해당 Guard 구현의 등록 순서를 기준으로 확인한다. 모든 엔드포인트에 동일한 Guard를 새로 선언하지 않는다.

## Event Broker

- 이벤트 발행은 `EventBroker`의 `publish`·`publishAll` 계약과 현재 호출 위치를 따른다.
- 설정은 `template/nest-starter-kit/src/infra/infra.module.ts`의 `EventBrokerModule.forRoot(...)`를 기준으로 한다.
- 현재 adapter 이름은 `in-memory`, 선택 항목은 `redisPubSub`, `redisStreams`, `kafka`, `rabbitmq`다. `inMemory: true`나 `adapters/redis/`를 새 계약으로 만들지 않는다.
- 새 adapter를 추가할 때는 `event-broker.interface.ts`와 `event-broker.module.ts`를 함께 확인하고, 별도 이벤트 발행 진입점을 만들지 않는다.
