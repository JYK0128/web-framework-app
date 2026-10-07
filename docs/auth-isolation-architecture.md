# 인증 격리 아키텍처 및 통신 명세서 (Direct SPA & M2M Token)

본 문서는 **1) 도메인별 분산 독립 인증**, **2) Control Plane 경유 방식의 서비스 데이터 열람(/api/v1/internal/*)**, **3) 초단기 M2M 서명 토큰 기반 S2S 통신**, 그리고 **4) Access JWT + Refresh Token 클라이언트 인증 흐름**을 시각화하여 기술합니다.

---

## 1. 전체 시스템 아키텍처 다이어그램 (4개 체제)

중앙 `auth-service` 없이 관리자 시스템과 대고객 서비스 시스템이 물리적으로 완전 분리되어 동작합니다.

```mermaid
flowchart TB
    subgraph AdminSystem["[관리자 시스템 (Admin Plane)]"]
        AdminBrowser["관리자 브라우저 (Direct SPA)\n• accessToken: 10분 메모리 (iss/aud: admin-api)\n• Refresh Token 쿠키: admin_refresh_token (HttpOnly)"]
        AdminAPI["admin-api (Control Plane)\n• 🔐 사내 관리자 자체 인증 (사내 DB)\n• 관리자 권한(RBAC) / 정책 / 구조화 감사로그\n• Refresh Token 저장: Redis (admin:auth_token:refresh:<sha256>)\n• S2S 호출자 (초단기 M2M JWT 발급 및 서명)"]
        AdminDB[(Admin DB\n사내 관리자 원장)]

        AdminBrowser -- "1. Authorization: Bearer <Admin JWT>" --> AdminAPI
        AdminAPI <--> AdminDB
    end

    subgraph ServiceSystem["[대고객 서비스 시스템 (Service & Resource Plane)]"]
        UserClients["고객 브라우저 (SPA) & 모바일 앱\n• 웹/앱 100% 동일한 단일 API 공유\n• accessToken: 10분 메모리/Keychain (iss/aud: service-api)\n• Refresh Token 쿠키: service_refresh_token (HttpOnly)"]
        ServiceAPI["service-api (Resource & Data Plane)\n• 🔐 고객 회원 자체 인증 (고객 DB)\n• 고객 멤버십(Role = Membership Tier, SUPER_USER 탑재)\n• Refresh Token 저장: Redis (service:auth_token:refresh:<sha256>)\n• /api/v1/internal/* 내부 엔드포인트 제공\n• M2M 토큰 서명 및 aud 검증"]
        ServiceDB[(Service DB\n고객 회원원장 + 비즈니스 데이터)]

        UserClients -- "1. Authorization: Bearer <Customer JWT>" --> ServiceAPI
        ServiceAPI <--> ServiceDB
    end

    %% 내부 S2S 연결선
    AdminAPI ==> |"2. S2S M2M 초단기 JWT (30초~1분)\nGET /api/v1/internal/orders/123\nAuthorization: Bearer <M2M_JWT>\n(iss: admin-api, aud: service-api, sub: admin-api)"| ServiceAPI

    classDef admin fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef user fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    class AdminBrowser,AdminAPI,AdminDB admin;
    class UserClients,ServiceAPI,ServiceDB user;
```

---

## 2. 관리자의 서비스 리소스 접근 흐름 (Control Plane 경유 S2S M2M)

관리자 화면은 `service-api`의 내부 주소를 전혀 알 필요가 없으며, 모든 요청은 **`admin-api`를 단일 진입점**으로 통과합니다.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 관리자 (Direct SPA)
    participant AdminAPI as admin-api (Control Plane)
    participant ServiceAPI as service-api (Resource Plane)

    %% 1. 관리자 요청
    Note over Admin, AdminAPI: [1. 관리자 화면에서 고객 주문 123번 조회]
    Admin->>AdminAPI: GET /api/v1/orders/123<br/>Authorization: Bearer <Admin JWT>

    %% 2. Control Plane 감사 및 인가
    rect rgb(240, 248, 255)
    Note over AdminAPI: [2. Control Plane 감사 및 통제]<br/>1. Admin JWT 서명 및 관리자 권한(@Permission) 검증<br/>2. RequestLoggingMiddleware로 구조화 감사 로그 출력<br/>3. 초단기(30초~1분) M2M JWT 서명 생성
    end

    %% 3. S2S 내부 위임 호출
    rect rgb(255, 245, 240)
    Note over AdminAPI: [3. 사설망 내부 M2M 호출]<br/>위·변조 불가능한 서명 토큰 페이로드 주입
    AdminAPI->>ServiceAPI: GET /api/v1/internal/orders/123<br/>• Authorization: Bearer <M2M JWT><br/>  (iss: admin-api, aud: service-api, sub: admin-api, exp: 60s)
    end

    %% 4. Data Plane 처리
    rect rgb(245, 255, 245)
    Note over ServiceAPI: [4. Resource Plane 내부 처리]<br/>1. M2M JWT 서명 및 aud 검증 (M2mAuthGuard)<br/>2. 허용된 호출 머신 sub(admin-api) 확인 후 소유권 필터 해제<br/>3. 주문 123번 DB 조회
    ServiceAPI-->>AdminAPI: 200 OK (주문 원본 데이터)
    end

    %% 5. 마스킹 및 반환
    Note over AdminAPI: 5. 필요 시 개인정보 마스킹 처리 후 최종 응답 반환
    AdminAPI-->>Admin: 200 OK { success: true, data: { orderId: 123, ... } }
```

---

## 3. Access JWT + Refresh Token 인증 라이프사이클

클라이언트는 10분 수명의 AccessToken(JWT)으로 API를 호출하며, 만료 시 Redis에 저장된 Refresh Token을 기반으로 토큰을 갱신합니다. 쿠키명이 분리되어 있어 동일 브라우저에서 Admin과 Service를 동시 접속해도 토큰 충돌이 발생하지 않습니다.

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자 (React SPA / Mobile)
    participant Client as API 클라이언트 (Axios / Fetch)
    participant API as 백엔드 API (admin-api / service-api)
    participant Redis as Refresh Token 저장소 (Redis)

    %% 1. 로그인
    Note over User, Redis: [1. 로그인 시점]
    User->>API: POST /api/v1/auth/login (ID/PW 또는 사내SSO/소셜)
    API->>Redis: SET refresh:<sha256> { sub, rememberMe, familyId, expiresAt } (TTL: 30분 또는 30일)
    API->>Redis: SET refresh_family:<familyId> <current-hash> (같은 TTL)
    API-->>User: 200 OK<br/>• Body: { accessToken: "eyJ..." }<br/>• Set-Cookie: {admin|service}_refresh_token="<token>"; HttpOnly; Secure; Path=/api/v1/auth
    Note over Client: accessToken을 메모리 변수에 보관 (웹: 메모리, 모바일: 메모리/Keychain)

    %% 2. 무상태 API 호출
    Note over User, API: [2. 일상적인 API 호출 (10분 무상태)]
    Client->>API: GET /api/v1/auth/me (Authorization: Bearer <accessToken>)
    Note over API: JWT 서명·iss·aud·exp 검증 (Redis 조회 없음)
    API-->>Client: 200 OK

    %% 3. 토큰 만료 시 세션 기반 갱신
    Note over User, Redis: [3. 토큰 만료 시 Refresh Token 기반 갱신]
    Client->>API: GET /api/v1/auth/me (만료된 토큰)
    API-->>Client: 401 Unauthorized
    Note over Client: 401 수신 시 갱신 대기열 락(Lock) 활성화 후 1회 갱신 요청
    Client->>API: POST /api/v1/auth/token ({admin|service}_refresh_token 쿠키 자동 전송)
    API->>Redis: GETDEL refresh:<sha256> (기존 토큰 1회 consume)
    API->>Redis: SETNX refresh_used:<sha256> <familyId> (재사용 탐지용)
    Redis-->>API: Refresh Token 유효 (Active)
    API->>Redis: SET 새 refresh 키 + family 포인터 갱신 (rotation)
    API-->>Client: 200 OK { accessToken: "new_token" }
    Note over Client: 새 토큰으로 대기 중인 원본 요청 재시도

    %% 4. 원격 강제 로그아웃
    Note over User, Redis: [4. 즉시 차단 및 원격 로그아웃 (Instant Revocation)]
    User->>API: POST /api/v1/auth/logout (또는 관리자의 계정 정지)
    API->>Redis: DEL 현재 refresh 키 + family 포인터
    Note over Redis: Refresh Token 즉시 폐기. 기존 Access JWT는 최대 10분 후 만료
```

---

## 4. 최종 결정 아키텍처 요약표

| 구분 | 최종 결정 내용 |
| :--- | :--- |
| **인증 원장 구조** | **도메인별 분산**: `auth-service` 제거 ➔ `admin-api` & `service-api` 각자 독립 인증 원장 및 물리 DB 분리 |
| **토큰 & 쿠키 격리** | • **Admin**: JWT `iss/aud: admin-api`, 쿠키 `admin_refresh_token`, Redis `admin:auth_token:refresh:*` / `refresh_used:*` / `refresh_family:*`<br>• **Service**: JWT `iss/aud: service-api`, 쿠키 `service_refresh_token`, Redis `service:auth_token:refresh:*` / `refresh_used:*` / `refresh_family:*` |
| **사용자 역할 모델** | • **Admin**: 사내 관리자 권한 통제 (RBAC: `role`, `resource`, `user_role`, `SUPER_ADMIN`)<br>• **Service**: 고객 **멤버십(Membership Tier)** 관점의 `role` (`SUPER_USER` 기본 탑재, 향후 등급 확장 대응) |
| **서비스 데이터 열람** | **Control Plane 경유**: `admin-api` 감사로그 영구 기록 ➔ `service-api`의 `/api/v1/internal/*` 라우팅 |
| **S2S 통신 인증** | **초단기 M2M 서명 토큰 (JWT)**: `admin-api`가 서명 발급 (`iss: admin-api`, `aud: service-api`, TTL 30초~1분), 위·변조 방지 |
| **클라이언트 인증** | **Stateless Access JWT + Stateful Refresh Token**: 10분 JWT는 로컬 검증, Refresh Token만 Redis에서 관리 (웹: HttpOnly, 모바일: 안전한 저장소) |
| **동시성 및 안정성** | Access JWT는 stateless로 검증하고 Refresh Token은 `GETDEL` 후 rotation한다. 사용된 토큰 재사용이 탐지되면 해당 family의 현재 토큰도 폐기한다. |
| **JWT 검증 경계** | Admin은 `iss/aud=admin-api`, Service는 `iss/aud=service-api`를 각각 검증하며 HS256만 허용한다. |
| **모바일 앱 연동** | **동일 REST 규격 공유**: 웹과 모바일 앱(Capacitor/Native)이 100% 동일한 REST 엔드포인트 공유 |
