# service-api core 공통화 조사 보고

조사일: 2026-10-13. 기준은 커밋된 코드만이 아니라 현재 작업 트리다. 기존 변경이 광범위하게 진행 중이므로 아래 내용은 현재 상태에 대한 설계 제안이며, 구현 변경이나 확정된 아키텍처 결정은 아니다.

**결론**

남은 `core` 전체를 패키지로 옮기기보다, 공통 동작은 `server-core`, 앱의 설정·등록은 앱 조립 지점, 도메인 모델에 의존하는 코드는 앱에 두는 방식을 권장한다. 완료 기준은 `core` 디렉터리를 비우는 것이 아니라, 같은 정책을 두 번 수정하지 않으면서 앱별 변화가 공통 패키지의 조건문으로 번지지 않는 상태다.

현재 TypeScript 파일은 67개이며 database 54개, oauth 5개, auth 5개, http 2개, core.module.ts 1개다. database에는 엔티티뿐 아니라 index, migration, seeder도 포함한다. 잔여 파일 대부분이 DB 소유권에 속하므로 파일 수를 공통화 진행률로 사용하기 어렵다.

**불만족이 반복될 수 있는 구조적 원인**

1. `core`가 재사용 가능한 동작, 앱 구성, 도메인 저장 모델을 동시에 뜻한다. 이동 목적지가 하나이면 서로 다른 책임이 다시 섞인다.
2. 파일 내용이 같아도 의존 대상이 다르다. 양쪽 `OrmAuthReader`는 바이트 단위로 같지만 각각 자기 앱의 User와 Account를 읽는다. `InternalClient`는 이름과 용도는 같지만 앱마다 upstream 오류 정책이 다르므로 별도 구현으로 둔다.
3. 공통 모듈의 확장 지점이 실제 사용보다 넓다. `UserAuthModuleAdapters`는 Redis 사용 시에도 DB token/session 저장소 클래스를 필수로 받는다. `MachineAuthModuleAdapters`는 `internalClient: Type<unknown>`을 받아 등록·export하며, 인증 모듈이 HTTP 클라이언트 조립까지 담당한다.
4. 패키지 경계는 생겼지만 공개 API 경계는 약하다. `package.json`의 `./core/*` export로 구현 파일 대부분에 직접 접근한다. 이후 폴더 정리가 두 앱의 import 변경으로 이어진다.
5. 설계 지침과 실제 구조가 다르다. `.agents/skills/layer-boundaries/SKILL.md`는 `core/services/<capability>` 및 `infra/infra.module.ts`를 안내하지만 실제 조립은 `core/core.module.ts`, 공유 구현은 `packages/server-core/src/core/*`다. notification/message, phone-identity/identity 명칭도 일치하지 않는다. 이 불일치는 확인된 사실이며, 반복적인 방향 변경을 유발한다는 것은 설계상 추론이다.

**전체 정리 방향 비교**

| 방안 | 구체적 범위 | 이점 | 비용·한계 | 적합성 |
| --- | --- | --- | --- | --- |
| A. 작은 공통화로 마감 | 요청 로깅과 OAuth 프로토콜을 추출. 앱별 InternalClient, DB 계층, 조립은 앱에 유지 | 변경 범위가 작고 빠르게 안정화 가능 | DB 중복과 큰 CoreModule이 남음 | 단기 안정화에 적합 |
| B. 공통 동작 + 앱 조립 + 로컬 DB 어댑터 | A에 공통 ORM 기반과 인증 등록 API 정리를 추가. 업무 엔티티는 앱 소유 | 중복 정책과 앱 결합을 함께 줄임 | DI 및 ORM 등록 검증 필요 | 현재 권장 |
| C. 기능별 플러그인 체계 | 모든 기능을 포트·어댑터·동적 모듈로 구성하고 ORM 어댑터까지 별도 패키지화 | 여러 앱·여러 ORM의 조합 지원 | 토큰, factory, 옵션, 테스트 조합이 늘고 추적이 어려움 | 실제 세 번째 소비자나 다른 ORM 요구가 생길 때 재검토 |
| D. 공통 플랫폼/도메인 패키지 | User·Role·Account 및 업무 흐름까지 공유 | 수정 지점이 가장 적어 보임 | 관리자·사용자 정책과 스키마 변경이 결합됨. 서비스별 DB 소유권은 별도로 유지해야 함 | 현재 비권장 |

B를 한 번에 적용하기보다 A의 항목부터 완결하고 ORM 기반과 조립 정리를 이어가는 편이 낫다. 새 패키지를 여러 개 만들 필요는 없으며 우선 기존 `server-core`의 하위 공개 경로로 충분하다.

**항목별 처리 제안**

| 남은 항목 | 권장 위치·처리 | 다른 선택지와 판단 |
| --- | --- | --- |
| RequestLoggingMiddleware | **완료:** 공통 HTTP 패키지로 이동하고 앱별 PII 해시 키를 DI로 공급 | 기존 완료/중단/error 및 SSE 처리 유지. 별도 logging module은 추가하지 않음 |
| InternalClient | 공통화 대상에서 제외하고 두 앱의 `core/http` 아래 로컬 구현으로 유지 | 두 앱의 upstream 오류 전달 계약이 다르다. 같은 이름·기능이라는 이유로 추출하면 앱별 정책 분기와 옵션이 공통 코드에 들어가므로 공유하지 않음 |
| OAuthProviderService 및 설정 검증 | **완료:** 공통 OAuth 모듈로 이동. state·PKCE·token/userinfo·JWKS 처리와 설정 검증을 묶음 | 앱별 설정, namespace, encryption key, timeout, HTTP 전송기를 옵션으로 공급 |
| OAuthKvStoreKey | **완료:** 공통 구현에서 앱 namespace를 받아 키 구성 | 기존 `{SERVICE_ID}:auth_oauth_state:` 형식 유지 |
| AppEntityManager | **완료:** 공통 persistence 하위 경로로 이동 | 양쪽 구현이 같고 도메인 import가 없음. 범용 Repository 계층을 추가할 이유가 없음 |
| BaseEntity + AuditSubscriber | **완료:** 공통 persistence 하위 경로로 함께 이동 | 분리해서 이동하면 instanceof 대상과 감사 정책이 갈릴 수 있음. 업무 엔티티까지 공유할 근거는 되지 않음 |
| UnitOfWorkInterceptor | 우선 앱에서 명시적으로 등록. 현행 auto-flush 정책 공유가 합의되면 구현만 공통화 | 이름에 비해 실제 동작은 성공 응답마다 flush. 요청 전체 transaction을 보장하는 코드로 해석하면 안 됨 |
| OrmAuthReader | 로컬 유지 | 현재는 User/Account/Role 구조에 강하게 결합. 공통 generic reader에 엔티티·필드 매핑을 넘기는 것은 단순성을 해침 |
| DatabaseTokenStore / DatabaseSessionStore | 우선 로컬 유지, 사용하지 않는 드라이버의 필수 등록 요구 제거 | DB 드라이버가 실제 지원 대상이면 이후 동일 계약 테스트를 만든 뒤 추출. 현재 미사용이라는 이유만으로 삭제하지 않음 |
| user-auth.adapters.ts | **완료:** reader와 Redis namespace만 제공. DB 저장소 class는 선택된 DB 드라이버에서만 요구 | 기존 JWT+Redis 조합이 미사용 DB adapter를 더 이상 import하지 않음 |
| machine-auth.adapters.ts | 현재 유지. 별도 HTTP 클라이언트 패키지로 이동하지 않음 | 앱별 InternalClient를 MachineAuthModule에 등록하는 기존 composition 연결 지점 |
| 업무 entities / migrations / seeders | 앱 소유 유지 | 파일이 같아도 정책과 DB 변경 주기가 다름. 폴더를 도메인별로 이동하는 작업은 별도 범위 |
| mikro-orm.config.ts / DatabaseModule | 앱 설정·등록 유지 | 설정 파일 텍스트가 같더라도 env, entities.generated, migration 경로가 앱별임. 옵션 덮어쓰기용 범용 factory는 필요가 생길 때만 도입 |
| core.module.ts | 앱 composition root로 유지. 독립적인 기반 리소스 조립이 커질 때만 infra.module.ts 분리를 검토 | 공통 CoreModule에 앱 설정 전체를 넣는 방식은 옵션 덩어리만 옮김 |

**InternalClient는 앱별 경계에 남긴다**

`service-api`는 SYSTEM_CONFIG_RUNTIME_SYNC_FAILED와 OAUTH_PROVIDER_CONFIG_INVALID 두 코드만 fetch에서 별도 보존한다. upload/download는 동일한 보존 로직이 없고, 바이너리 오류 본문도 JSON으로 해석하지 않는다.

`admin-api`는 fetch/upload/download에서 공통 오류 변환을 사용하고, upstream errorCode·details·meta.params를 보존하며 Buffer/ArrayBuffer 본문도 처리한다. 관련 회귀 테스트가 `apps/admin-api/tests/service-terms.regression.ts`에 있다. 이 테스트는 읽어 확인했으며 이번 조사에서 실행하지 않았다.

두 동작은 각 앱이 호출하는 상대 서비스와 필요한 응답 의미를 반영하므로 각각 로컬에서 관리한다. 필요하다면 저수준 전송 유틸리티만 나중에 공유할 수 있지만, 현재 중복은 앱별 오류 정책을 분리하는 비용보다 크지 않다. 두 구현의 차이를 없애는 작업이나 MachineAuthModule의 provider 조립 변경은 이번 공통화 범위에 포함하지 않는다.

**OAuth는 기술 동작과 계정 정책의 경계를 지킨다**

공통화 대상은 provider 설정 검증, state의 일회성 소비, PKCE, token 교환, userinfo/JWKS 처리다. 앱이 공급할 값은 namespace, state TTL, 요청 timeout, 사용 가능한 provider 설정과 복호화된 credential이다. 현재처럼 검증 완료 후 설정을 읽는 순서가 중요하면 단일 설정 조회 provider를 유지할 수 있으며, 계정 workflow 전체를 callback으로 추상화할 필요는 없다.

`modules/auth/oauth/oauth.service.ts`의 계정 연결·자동 가입·기본 Role·2FA·이메일 확인·로그인 허용 판단은 앱에 남긴다. 특히 provider 응답 정규화에 섞여 있는 “검증된 이메일 필수” 판단은 OAuth 통신 자체의 요구가 아니라 현재 애플리케이션의 로그인 요구다. 공통 프로토콜은 identity 검증 동작을 공유하고 계정 연결과 로그인 허용 판단은 호출 앱에서 유지한다.

admin은 Axios wrapper/customFetch, service는 fetch/AbortSignal을 사용한다. 공통 모듈은 전송 함수를 주입받고, 두 앱은 기존 timeout·오류·JWKS redirect 동작을 각각 유지한다. HTTP 라이브러리를 통일하는 것 자체를 별도 목표로 삼지 않는다.

**DB 공통화는 기반 정책까지만 우선 진행한다**

`User` 파일이 동일하더라도 `Role` 코드가 admin에서는 SUPER_ADMIN/ADMIN, service에서는 SUPER_USER/MEMBER로 다르다. User는 Role과 Profile을 참조하므로 단일 파일 공유로 끝나지 않는다. 공유 User에 역할 타입·관계 대상·설정 callback을 계속 추가하기보다 현재 로컬 모델을 유지하는 비용이 작다.

AppEntityManager, BaseEntity, AuditSubscriber는 공통화 가치가 있지만 엔티티 discovery도 함께 검증해야 한다. 현재 CLI는 앱의 `src/core/database/entities/**/*.entity.ts`를 대상으로 생성하고 generated 파일은 로컬 BaseEntity를 직접 import한다. 패키지 이동 후 생성 결과, 동일 클래스 참조, ORM metadata 및 schema diff를 확인해야 하며 경로 이동만으로 migration이 생기면 원인을 먼저 해결한다.

UnitOfWorkInterceptor의 `next.handle().pipe(mergeMap(...flush))`는 성공 emission 후 flush하는 구현이다. HTTP 외 스케줄러·이벤트에는 이 interceptor가 적용되지 않는다. 이를 옮기면서 자동 transaction, 예외 rollback, 이벤트 발행 원자성까지 해결됐다고 간주해서는 안 된다. MikroORM은 요청별 identity map을 분리하도록 설명하며, transaction은 별도 계약으로 다룬다. [Request Context](https://mikro-orm.io/docs/identity-map), [Transactions](https://mikro-orm.io/docs/transactions).

**공통 모듈 API는 지원하는 조합만 표현한다**

현재 양쪽 CoreModule은 jwt + redis tokenStore다. 그런데 UserAuthModuleAdapters에는 reader, databaseTokenStore, databaseSessionStore, redisNamespace가 모두 필수다. 1차로 선택하지 않은 저장소 등록을 요구하지 않게 하고, DB 선택 시에만 해당 provider가 필수인 타입 또는 시작 시 검증을 둔다.

앱의 adapter가 앱 provider에 의존하므로 DynamicModule이 imports/useExisting를 받을 수 있는 경계도 검토한다. 글로벌 DatabaseModule 덕분에 우연히 해결되는 의존성만 남기면 독립 module 테스트가 어렵다. Nest는 dynamic module의 imports와 custom provider의 useClass/useExisting/useFactory를 제공한다. 새 DI 추상화를 만드는 대신 필요한 조합에 이를 사용한다. [Dynamic modules](https://docs.nestjs.com/fundamentals/dynamic-modules), [Custom providers](https://docs.nestjs.com/fundamentals/custom-providers).

**경로와 지침은 하나의 결정으로 고정한다**

권장 책임 배치는 공통 패키지의 HTTP/인증/OAuth/persistence 기능, 앱의 CoreModule 조립, 앱의 로컬 DB adapter, 앱의 업무 modules다. 공개 경로는 현재 `@pkg/server-core/...`를 사용한다. 내부 디렉터리 이름보다 소비자가 의존하는 공개 진입점을 고정하는 것이 우선이다.

기존 deep import를 당장 전부 변경하지 않고 새 공개 진입점을 만든 다음 기능 단위로 전환한다. 직접 adapter import가 필요한 조립 지점은 별도 명시적 export로 허용한다. 모든 것을 단일 index에서 export하는 방식도 피한다.

저장소 스킬의 경로와 책임 안내는 실제 구조에 맞춰 갱신했다. capability 이름을 바꾸는 작업은 이번 공통화 범위에서 제외한다.

**진행 순서와 완료 조건**

1. **완료:** 현재 동작 차이와 소유권을 고정했다. InternalClient는 앱별 구현으로 유지하며, OAuth 계정 정책은 앱에 남겼다.
2. **완료:** RequestLoggingMiddleware를 추출했다. 기존 finish/close/error, SSE 제외, 이메일 해시 동작을 유지했다.
3. **완료:** OAuth 프로토콜과 설정 검증을 공통 패키지로 이동했다. 회원 연결·가입·2FA 정책은 각 앱에 남겼다.
4. **완료:** 인증 등록 API에서 현재 미사용 DB adapter 요구를 제거했다. DB token/session 저장소는 선택 시 타입과 시작 시 모두 필수로 확인한다. Redis namespace provider도 선택된 저장소에만 등록한다.
5. **구현 완료, schema 검증 보류:** AppEntityManager, BaseEntity, AuditSubscriber를 공통 persistence 하위 경로로 옮기고 앱별 엔티티의 BaseEntity 참조 및 generated entity 목록을 전환했다. discovery 재생성 및 DB schema diff 확인은 CLI 실행 환경의 decorator metadata 오류로 끝내지 못했다. 이 검증을 마친 뒤 이 단계를 닫는다. DB 저장소 일반화는 이 단계의 필수가 아니다.
6. 조립·공개 export·import 제한을 정리한다. 공통 패키지의 앱 역참조 금지, 새 deep import 제한, 선택한 드라이버만 요구하는 module 구성 검증을 자동화한다.

각 단계는 양쪽 앱 적용과 필요한 검증까지 마친 상태로 끝낸다. “파일 이동만 끝났고 동작 차이는 다음에 정리”하는 상태를 완료로 취급하지 않는다. 전체 폴더 rename, Repository 도입, 모든 entity 공유, 여러 작은 npm 패키지 분리는 이 계획의 선행 조건이 아니다. 각 앱의 `InternalClient`는 별도 구현으로 유지한다.

**진행 상태 및 확인**

- `RequestLoggingMiddleware`를 `packages/server-core`로 이동하고 양쪽 앱의 로컬 파일을 제거했다. CoreModule이 각 앱의 `env.PII_HASH_KEY`를 provider로 넘기며 AppModule은 공통 구현을 등록한다.
- `layer-boundaries` 지침을 실제 `server-core`/앱 조립 구조에 맞춰 갱신했다. `InternalClient`는 앱별 upstream 오류 계약이 다르므로 앱 로컬로 유지하도록 명시했다.
- OAuth provider 서비스, 타입, 설정 검증과 dynamic module을 `packages/server-core`로 이동했다. 두 앱은 앱별 state namespace, TTL, timeout, encryption key, HTTP transport 설정을 전달한다. admin의 Axios adapter와 JWKS redirect 차이를 유지했다.
- 양쪽 로그인 서비스의 계정 연결·가입·2FA 정책은 앱에 남겼다. service system-config 검증은 공통 설정 검증 함수를 사용한다.
- `AppEntityManager`, `BaseEntity`, `AuditSubscriber`를 `@pkg/server-core/persistence/*`로 이동했다. 두 앱의 업무 엔티티와 generated entity 목록이 같은 공통 `BaseEntity` 클래스를 참조하도록 바꾸고, entity/migration/seeder 및 MikroORM 설정은 앱 소유로 유지했다. server-core에 PostgreSQL driver, MikroORM decorators, lodash-es 의존성을 선언했다.
- `admin-api`의 ORM 공통화 뒤 남은 빈 `entities/common` barrel과 미사용 `core/database` barrel을 제거했다. 비어 있던 `subscribers`, `http/middlewares` 디렉터리도 정리했다. Admin 전용 client·설정 context·HTTP transport adapter·DB 엔티티와 저장소 adapter는 실제 소비처가 있어 유지한다.
- `UserAuthModuleAdapters`를 선택한 드라이버에 따라 조건부 타입으로 바꿨다. JWT+Redis 앱 조립에서 DB token/session store import를 제거하고 Redis namespace도 JWT/session 저장소 선택에 맞춰 등록한다. database 선택에 필요한 adapter가 없으면 모듈 조립 중 명확한 오류를 던진다.
- core 잔여 파일 분류 및 admin-api 대응 파일 비교, 주요 소비자와 회귀 테스트 소스 확인.
- `pnpm --filter @pkg/server-core typecheck`: 통과.
- `pnpm --filter service-api typecheck`: 공통 persistence 이동 후 통과.
- `pnpm --filter admin-api typecheck`: 공통 persistence와 OAuth 변경 관련 오류는 없었고, 기존 `src/modules/support/realtime/support.gateway.ts:33`의 PermissionDefinition → string TS2345 오류 하나로 전체 명령은 실패했다.
- MikroORM `discovery:export`는 현재 CLI 경로가 `dist` 설정을 불러오며 앱 필수 환경 설정에 의존하고, 환경을 제공한 실행에서는 공통 BaseEntity를 로드할 때 decorator metadata 오류가 발생해 재생성되지 않았다. generated 목록의 BaseEntity import 경로는 수동 전환 후 앱 타입 검사로 확인했다. DB 접속 기반 schema diff는 검증하지 못했으므로 단계 5의 완료 조건으로 남긴다.
- 실제 로그인, DB migration, 외부 OAuth/Redis 통합 실행은 수행하지 않았다. 타입 검사 통과는 런타임 DI·보안 동작·DB 일관성 검증을 대신하지 않는다.

요청 로깅 런타임 동작은 별도 통합 테스트로 검증하지 않았다.
