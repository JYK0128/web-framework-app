# Admin / Service 프론트 인증 구현 비교

작성일: 2026-10-06

이 문서는 `apps/admin-web`과 `apps/service-web`의 현재 인증 구현을 비교한다. 공통 인증 정책은 `packages/shared`의 파일 설정으로 공유하며, Admin과 Service는 별도 설정을 사용한다.

## 구현 비교

| 항목 | Admin | Service |
| --- | --- | --- |
| Access token 저장 | Jotai 메모리 store | Jotai 메모리 store |
| Refresh token 저장 | API가 관리하는 HttpOnly 쿠키 | API가 관리하는 HttpOnly 쿠키 |
| 초기 사용자 확인 | 루트 `beforeLoad`에서 `/auth/me` 조회 | 루트 `beforeLoad`에서 `/auth/me` 조회 |
| `me` 캐시 stale time | 30초 | 30초 |
| 로그인·2FA 응답 토큰 처리 | Axios가 access token을 Jotai에 기록 | Axios가 access token을 Jotai에 기록 |
| 로그아웃 처리 | Axios가 Jotai 토큰을 비움 | Axios가 Jotai 토큰을 비움 |
| 브라우저 401 처리 | refresh 후 원 요청 1회 재시도 | refresh 후 원 요청 1회 재시도 |
| 동시 refresh 처리 | 탭 내 `browserRefresh.refreshPromise` 공유 | 탭 내 `browserRefresh.refreshPromise` 공유 |
| SSR 인증 순서 | refresh → me → 약관 | refresh → me → 약관 |
| SSR 토큰 전달 | access token은 서버 내부에서만 사용, Set-Cookie 전달 | access token은 서버 내부에서만 사용, Set-Cookie 전달 |
| 보호 라우트 | `_protected` `beforeLoad` | `_protected` `beforeLoad` |
| 정책 설정 소스 | `ADMIN_AUTH_POLICY_CONFIG` in `@pkg/shared/auth` | `SERVICE_AUTH_POLICY_CONFIG` in `@pkg/shared/auth` |
| Credential 인증 | `credentialAvailable: true` | `credentialAvailable: true` |
| OAuth 인증 | `oauthAvailable: false` | `oauthAvailable: true` |
| 프론트 인증 정책 조회 | API 호출 없이 shared 파일 설정 사용 | API 호출 없이 shared 파일 설정 사용 |
| API 인증 정책 | Admin API도 Admin shared 설정 사용 | Service API도 Service shared 설정 사용 |
| 프로필 약관 동의 목록 | 필수 인증 조건 충족 후 조회 | 필수 인증 조건 충족 후 조회 |
| 이메일 인증 필수 여부 | `false` | `true` |
| 필수 약관 API | `/operator-terms/agreements` | `/service-terms/agreements` |
| callback 기본 목적지 | `/profile` | `/` |

표에서 값이 같은 행은 두 앱에 동일하게 구현되어 있다. 인증 정책 값은 앱별로 다르며, 프론트와 대응 API가 같은 shared 설정 파일을 직접 참조한다.

## 공통 브라우저 인증 흐름

루트 라우트의 `beforeLoad`가 `getAuthContext(queryClient)`를 호출한다. 브라우저에서는 React Query로 `/api/v1/auth/me`를 조회하고, 성공한 사용자 정보를 라우터 context와 Query Cache에 둔다. `me` 조회의 stale time은 30초다. 401이면 메모리 access token을 비우고 비로그인 context를 반환한다.

로그인 화면은 생성된 로그인 mutation을 호출한다. Axios 응답 인터셉터는 로그인, 2FA 로그인, refresh 응답에서 `data.accessToken`을 찾아 Jotai store에 기록한다. 로그아웃 응답에서는 store를 비운다. 토큰은 메모리에만 저장되며 서버에서는 읽거나 쓰지 않는다.

Axios 요청 인터셉터는 현재 access token을 `Authorization: Bearer ...`로 추가한다. 로그인·2FA 로그인·refresh·logout 요청은 자동 refresh에서 제외된다. 나머지 요청이 401을 받으면 `/auth/refresh`를 호출하고 원 요청을 한 번 재시도한다. 동시에 발생한 401은 같은 브라우저 탭 안에서 `browserRefresh.refreshPromise`를 공유한다. refresh가 401이면 메모리 토큰을 비운다.

## 공통 SSR 인증 흐름

서버 렌더링에서는 `getServerAuth()`가 현재 요청의 쿠키와 요청 정보를 전달해 API를 호출한다. 순서는 `refresh` → `me` → 필수 약관 조회다. 정책은 API에서 조회하지 않고 해당 앱의 shared 파일 설정을 사용한다. refresh 응답의 access token은 서버 함수 안에서만 사용하고, `Set-Cookie`는 Start 응답에 전달한다. 인증 요청 중 401이면 `{ user: null }`을 반환하며, 그 밖의 실패는 요청 오류로 전파한다.

SSR access token은 브라우저 Jotai store로 전달되지 않는다. hydration 뒤 브라우저가 `me`를 조회하고, 필요한 경우 브라우저 Axios가 refresh를 수행해 메모리 토큰을 설정한다.

## 공통 보호 라우트와 온보딩

`_protected` 라우트는 root context에 `user`가 없으면 로그인으로 보낸다. 사용자가 있으면 필수 약관을 조회하고 해당 앱의 shared 인증 정책으로 온보딩 목적지를 계산한다. 검사 중 브라우저 API가 401을 반환하면 메모리 토큰과 `me` Query Cache를 비우고 로그인으로 보낸다. 온보딩을 완료하면 원래 callback으로 돌아간다.

공통 온보딩 조건은 약관 동의, 비밀번호 정책, 2FA 및 전화번호 인증 상태다. callback이 외부 주소이거나 로그인·onboarding 경로라면 표에 적힌 앱별 기본 목적지로 보낸다.

프로필에서 약관 목록을 조회할 때도 shared 인증 정책의 필수 2FA·전화번호 인증 조건을 적용한다. 필수 조건을 만족하지 못하면 목록 요청을 보류한다. 두 프론트 모두 정책 API를 호출하지.

정책 전달용 `GET /auth/policy` 경로는 제거했다. 인증 정책은 `packages/shared/src/auth/admin-policy.ts`와 `service-policy.ts`로 나뉘어 있으며, 각 프론트와 대응 API가 해당 객체를 직접 import한다. Admin은 이메일 인증을 필수로 하지 않고 Service는 필수로 한다. 런타임 DB 설정이 아니라 빌드 시 공유되는 코드 설정이다.

프론트에서 시스템 설정도 별도 API로 읽는다. Admin 웹의 시스템 설정 화면은 권한이 필요한 `GET /api/v1/system-config`로 이메일·웹훅·OAuth 및 서비스 전달 설정을 조회한다. Admin 웹의 서비스 설정 화면은 추가로 `GET /api/v1/service-config`를 사용한다. Service 웹은 운영 안내와 점검 화면에서 공개 `GET /api/v1/service-configs`를 읽고 60초마다 갱신한다. 이 설정 API들은 런타임 서비스 설정용이고, shared 파일의 인증 정책과는 별개다.

## 구조상 유의할 점

- 새 탭이나 새로고침 뒤에는 메모리 토큰이 없으므로 `me`를 다시 조회하고 필요하면 refresh한다.
- 브라우저 refresh 단일화는 탭별로 동작한다. 탭 간 refresh 요청은 함께 묶이지 않는다.
- SSR refresh와 브라우저 refresh는 서로 다른 요청이다. SSR이 회전시킨 쿠키가 브라우저에 전달되는 시점과 브라우저 인증 요청이 겹칠 수 있으므로, 쿠키 회전과 동시 요청 동작을 운영 환경에서 확인해야 한다.
- 두 앱은 Axios와 SSR 인증 코드를 각각 복제해 두고 있다. 공통 인증 동작을 바꾸면 양쪽 구현을 같이 수정해야 한다.
- `beforeLoad`는 프론트 라우팅을 제어한다. 실제 접근 권한은 API가 요청마다 검사한다.

## 코드 위치

Admin 경로를 대표 위치로 적었다. Service에는 같은 상대 경로에 대응 구현이 있다.

- 루트 인증 context: [core/isomorphic/auth.ts](../apps/admin-web/src/core/isomorphic/auth.ts)
- SSR refresh와 사용자 조회: [core/server/auth.ts](../apps/admin-web/src/core/server/auth.ts)
- 보호 라우트와 온보딩: [routes/_protected/route.tsx](../apps/admin-web/src/routes/_protected/route.tsx)
- 브라우저 refresh와 401 재시도: [lib/axios.ts](../apps/admin-web/src/lib/axios.ts)
- 메모리 토큰 저장소: [store/token.ts](../apps/admin-web/src/store/token.ts)
