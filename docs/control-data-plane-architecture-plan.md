# Control Plane / Data Plane 분리 계획

## 목표

중앙 인증 서비스, 운영·정책 기능을 담당하는 Control API, 실제 업무 데이터를 처리하는 Data Plane을 각각 분리한다. 관리자웹과 서비스웹을 별도 React 애플리케이션으로 운영하고, 각 웹 애플리케이션은 Express + Rsbuild 기반 BFF를 포함한다. 백엔드 API는 NestJS로 구성하며, 브라우저가 서비스 토큰을 직접 보관하거나 Data Plane에 직접 인증하지 않도록 한다.

## 최종 구성

### 실행 프로젝트

초기에는 다음 5개 프로젝트로 구성한다.

| 프로젝트 | 구성과 책임 |
| --- | --- |
| `admin-web` | 관리자 React 화면 + Express BFF + Rsbuild |
| `service-web` | 서비스 React 화면 + Express BFF + Rsbuild |
| `auth-service` | 중앙 인증, 로그인·로그아웃, access/refresh 발급·갱신 |
| `admin-api` | 사용자·조직·권한·약관·시스템 설정 등 운영 API |
| `service-api` | 실제 서비스 업무 데이터와 도메인 처리 |

`admin-web`과 `service-web`은 각각 화면 서버와 BFF를 같은 프로젝트·프로세스 경계 안에서 운영한다. `admin-bff`와 `service-bff`를 별도 프로젝트로 만들지 않는다. 필요할 때만 나중에 BFF를 독립 배포 단위로 분리한다.

```text
Browser
  ├─ session 쿠키 ─▶ Admin Web + BFF (Express + Rsbuild)
  │                   ├──────────────▶ Central Auth Service
  │                   ├──────────────▶ Control API
  │                   └──────────────▶ Data Plane API
  │
  └─ session 쿠키 ─▶ Service Web + BFF (Express + Rsbuild)
                      ├──────────────▶ Central Auth Service
                      │                 access/refresh 발급·회전
                      ├──────────────▶ Control API
                      │                 사용자·조직·정책·운영 데이터
                      └──────────────▶ Data Plane API
                                        JWT 검증·업무 처리
```

### Central Auth Service

- 로그인·로그아웃·토큰 갱신
- access/refresh token 발급과 회전
- JWT issuer, audience, `sub` 및 권한 claim의 발행 정책
- 사용자 인증 상태와 refresh token 폐기 정책

### Control API

- 사용자, 조직, 역할, 권한, 약관, 시스템 설정 등 운영 데이터
- 관리 화면과 운영 자동화용 API
- 중앙 인증 서버가 발급한 JWT를 검증하지만 토큰을 발급하지 않음
- Data Plane 호출에 필요한 정책·권한 정보를 제공

### Data Plane

- 도메인 업무 API와 실제 데이터 처리
- 브라우저 세션을 해석하지 않음
- BFF 또는 호출 주체가 전달한 짧은 수명의 service JWT를 검증
- JWT의 `sub`를 사용자 주체 식별자로 사용
- Data Plane 전용 Redis는 캐시·큐·락 등 업무 용도로 별도 운영

## 인증 및 토큰 흐름

1. 브라우저가 BFF에 로그인 요청을 보낸다.
2. BFF가 독립된 중앙 인증 서비스에 인증을 위임한다.
3. 중앙 인증 서비스가 access token과 refresh token을 반환한다.
4. BFF는 토큰을 Redis 기반 서버 세션에 저장하고, 브라우저에는 세션 쿠키만 발급한다.
5. BFF가 Data Plane을 호출할 때 세션의 access token을 `Authorization: Bearer`로 전달한다.
6. Data Plane은 JWT 서명, issuer, audience, 만료 시간, `sub`와 권한을 검증한다.
7. 브라우저에는 access/refresh/service JWT를 노출하지 않는다.

## 세션과 JWT의 책임

| 항목 | 관리 위치 | 목적 |
| --- | --- | --- |
| session 쿠키 | Browser | BFF 세션 식별자만 전달 |
| BFF Redis session | BFF 전용 Redis | access·refresh token, 만료 시각, 사용자 세션 상태 저장 |
| service JWT | BFF에서 Data Plane으로 전달 | 내부 서비스 간 무상태 인증 |
| Data Plane Redis | Data Plane 전용 Redis | 캐시·큐·분산 락 등 업무 처리 |

세션과 JWT는 같은 값을 묶어 관리하지 않는다. 세션이 보유한 토큰을 BFF가 내부 호출에 사용하는 관계이며, JWT의 `sub`가 사용자 식별자다.

## 만료 및 갱신 정책

- BFF가 요청을 시작할 때 Redis session의 access token 만료 시각을 확인한다.
- 만료됐거나 Control API/Data Plane이 `401`을 반환하면 BFF가 중앙 인증 서비스의 refresh endpoint를 호출한다.
- refresh token은 BFF Redis session에서만 읽고, 회전된 access/refresh token과 `expiresAt`을 같은 세션에 원자적으로 갱신한다.
- 갱신 후 원래 Data Plane 요청은 1회만 재시도한다.
- 갱신 실패·refresh token 재사용·세션 만료 시 세션을 폐기하고 브라우저에 `401`을 반환한다.

## 요청 추적

- 최초 외부 요청에서 `x-request-id`를 생성한다.
- BFF, 중앙 인증 서비스, Control API, Data Plane 호출 전체에 같은 값을 전달한다.
- `requestId`는 추적용 메타데이터이며 JWT claim이나 세션 식별자를 대체하지 않는다.
- 각 서비스의 로그와 응답 envelope에 동일한 request ID를 기록한다.

## Web/BFF 구현 방식

- 관리자웹과 서비스웹은 각각 독립된 TanStack Start + Rsbuild React 프로젝트이며 TanStack Router/Query 같은 클라이언트 도구를 사용한다.
- TanStack Start의 prerender 설정으로 공개 라우트를 SSG하고, Rsbuild가 `dist/client` 정적 자산과 `dist/server` fetch 엔트리를 생성한다.
- Express BFF는 별도 Rsbuild 엔트리(`dist/main.js`)로 생성하며 `dist/client`의 SSG 결과를 정적으로 제공한다.
- 각 Express BFF가 React 정적 파일과 `/api/v1/auth/*`, 화면별 `/api/v1/*` 라우트를 담당한다. 서버 렌더링이 필요해지면 같은 Express 진입점에 SSR을 추가한다.
- Express middleware에서 request ID, 보안 헤더, Redis session, 인증·갱신 처리를 공통 적용한다.
- 서버 번들은 Node.js에서 실행하고, 브라우저 번들은 Express가 정적 자산으로 제공한다.
- 브라우저 코드는 Central Auth, Control API, Data Plane의 내부 주소를 알지 못한다.

관리자웹과 서비스웹은 세션 쿠키 이름과 도메인 정책을 분리한다. 공통 인증 계약과 UI·타입은 `packages/shared`에서 공유하되, BFF 세션과 권한 정책은 각 웹 애플리케이션의 보안 경계로 관리한다.

### BFF 라우트와 내부 API의 구분

브라우저용 BFF 경로는 `/api/v1/*` 하나의 계약으로 유지한다. 현재 최소 골격은 `/api/v1/auth/*`와 `/api/v1/me`를 제공하며, Control/Data 기능은 화면에 필요한 리소스별 경로를 추가하고 내부 host로 매핑한다. 외부에 `/api/v1/control/*`와 `/api/v1/data/*`를 강제하지 않는다.

```text
Browser ── /api/v1/auth/* or /api/v1/me ──▶ BFF ──▶ https://auth.internal/api/v1/*
Browser ── 화면별 /api/v1/*              ──▶ BFF ──▶ https://control.internal/api/v1/* or https://data.internal/api/v1/*
```

`/api/internal`은 브라우저용 공통 경로로 사용하지 않는다. 서버 간 콜백, 내부 헬스체크, 운영용 webhook처럼 외부 브라우저에 노출할 필요가 없는 엔드포인트가 있을 때만 별도로 사용하고, 일반적인 인증·Control·Data 요청은 위 세 BFF 네임스페이스로 통일한다.

외부 Web 경계는 path가 아니라 host로 나눈다. 예를 들어 `admin.example.com`은 `admin-web` BFF로, `service.example.com`은 `service-web` BFF로 연결한다. 각 BFF는 브라우저에 `/api/v1/*` 계약만 제공하고, 내부 host를 기준으로 `auth.internal`, `control.internal`, `data.internal`에 라우팅한다.

각 upstream 서비스의 자기 사용자 컨텍스트는 서비스별 host에서 동일하게 `/api/v1/me`로 제공한다. 예를 들어 `auth.internal/api/v1/me`, `control.internal/api/v1/me`, `data.internal/api/v1/me`는 서로 다른 서버이므로 경로 충돌이 없다. Web/BFF는 화면에 필요한 리소스만 해당 내부 host로 호출하며, Control/Data를 외부 path namespace로 노출하지 않는다.

## 경계 및 보안 원칙

- 브라우저는 BFF만 호출한다.
- 중앙 인증 서비스, Control API, Data Plane은 각각 독립 배포·네트워크 경계를 갖는다.
- BFF, 중앙 인증 서비스, Control API, Data Plane은 Redis를 공유하지 않는다.
- Data Plane은 세션 저장소나 refresh token을 읽지 않는다.
- JWT에는 최소한의 식별·권한 claim만 넣고 비밀 정보는 넣지 않는다.
- 내부 호출은 HTTPS 또는 신뢰된 사설 네트워크를 사용하고 issuer/audience를 엄격히 검증한다.

## 단계별 구현 순서

1. 중앙 인증 서비스의 로그인·refresh·logout 계약과 JWT issuer/audience를 확정한다.
2. Vite + React/TanStack 브라우저 엔트리와 Express Web/BFF 실행 구조를 만든다.
3. BFF의 Redis session 스키마와 access/refresh 회전 로직을 구현한다.
4. BFF 공통 프록시에서 request ID 전달, 토큰 주입, 만료 시 1회 재시도를 구현한다.
5. Data Plane 공통 JWT guard와 `sub` 기반 사용자 컨텍스트를 구현한다.
6. 중앙 인증 서비스, Control API, Data Plane 업무 API를 라우팅·배포 단위로 분리한다.
7. 만료, 동시 refresh, 로그아웃, 세션 폐기, 권한 변경 시나리오를 통합 테스트한다.

## 완료 기준

- 브라우저에는 session 쿠키만 존재한다.
- access/refresh token은 BFF Redis session에만 저장된다.
- Data Plane은 유효한 service JWT 없이는 요청을 처리하지 않는다.
- access 만료 시 BFF가 자동 갱신 후 원 요청을 한 번 재시도한다.
- request ID가 Browser 진입부터 Data Plane 응답까지 유지된다.
- BFF Redis, 중앙 인증 서비스 저장소, Control API 저장소, Data Plane Redis가 분리되어 운영된다.

## Auth Service 저장소 기준

Auth Service의 인증 원장은 Better Auth core schema를 기준으로 한다.

```text
auth.user
auth.session
auth.account
auth.verification
```

이 테이블들은 Auth Service 전용 PostgreSQL에만 둔다. Web/BFF의 `admin_session`과 `service_session`은 Better Auth의 `session` 테이블과 다른 개념이며, BFF 전용 Redis에 저장한다. Control API와 Service API는 Auth Service 테이블을 직접 조회하지 않고 JWT의 `sub`, `aud`, `scope`만 검증한다.
