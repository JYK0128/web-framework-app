---
name: fullstack-integration
description: >-
  Use when changing NestJS controllers, CQRS handlers, DTOs, entities,
  persistence, infrastructure, or the generated API connection to React.
  Do not apply to frontend-only UI work or isolated TypeScript changes.
---

# 풀스택 연동

## 관련 문서

- Controller, Command/Query, Handler, DTO, DB, Guard, Event Broker → [Backend](references/backend.md)
- OpenAPI 생성, React API 연동, 라우팅, 계층 경계 → [Client and boundaries](references/client-and-boundaries.md)

## 규칙

1. 같은 도메인의 실제 구현과 공통 추상화를 먼저 확인한다. 문서보다 현재 소스를 우선한다.
2. 기존 CQRS·DTO·Entity·EventBroker·EntityManager 추상화를 재사용한다. 작업에 필요하지 않은 새 계층이나 리팩터링을 추가하지 않는다.
3. Handler는 `identify → verify → process` 표준 흐름으로 구현한다.
4. API 변경은 서버 계약을 먼저 확정한 뒤 OpenAPI 기반 생성 코드를 갱신하고 React에서 생성된 타입과 훅을 사용한다.
5. 동작이 바뀌면 관련 참고 문서도 갱신한다.
