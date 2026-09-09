# Client integration and boundaries

## Schema-driven API flow

엔드포인트 변경 시 필요한 범위에서 다음 흐름을 따른다.

1. Entity와 Request/Response DTO
2. Command/Query와 Handler
3. Controller 및 Swagger 응답 계약
4. `pnpm --filter react-starter-kit codegen:api`
5. 생성된 React Query 훅·모델을 사용한 UI 연결

현재 생성 설정과 script는 `template/react-starter-kit/orval.config.ts` 및 `package.json`을 확인한다. 생성 파일을 수동으로 편집하지 않는다.

## TanStack Router

- 검색 파라미터는 실제 라우트의 `validateSearch: z.object({...})` 패턴을 따른다.
- URL로 연 Dialog를 닫을 때는 현재 검색값을 보존하면서 대상 키를 제거하고, 기존 화면이 사용하는 경우 `replace: true`를 사용한다.
- 라우트 경로와 검색 타입은 `template/react-starter-kit/src/routes/`의 같은 도메인 라우트를 기준으로 작성한다.

## 계층 경계

- 공유 계약과 유틸리티는 `packages/shared`에 둔다.
- 공통 Guard·Interceptor·Context는 특정 도메인 모듈의 내부 구현을 직접 참조하지 않도록 한다.
- Infra는 외부 시스템·DB·브로커 구현을 제공하고, 도메인 모듈 간 상호작용은 가능하면 공유 계약이나 Domain Event를 사용한다.
- 기존 코드에 교차 모듈 참조가 있더라도 이번 작업이 요구하지 않으면 전체 결합도 리팩터링으로 확장하지 않는다.
관련 소스: `template/nest-starter-kit/src/modules/domain.module.ts`, `src/infra/`, `src/common/`, `packages/shared/src/`
