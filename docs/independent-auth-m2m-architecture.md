# 독립 인증(Decentralized Auth) & 리소스 서비스 M2M 아키텍처 명세서

본 문서는 중앙 집중식 `auth-service`를 완전히 제거하고, **관리자 인증은 `admin-api`에, 고객 인증은 `service-api`에 독립 구축**하며, 두 서비스 간의 데이터 교환을 **비대칭키 기반 S2S M2M(Private Key JWT)**으로 처리하는 아키텍처를 상세히 정의합니다.

---

## 1. 프로젝트 재구성 (5개 ➔ 4개 체제)

중앙 인증 서버(`auth-service`)가 제거되고, 관리자망(Admin Plane)과 대고객 서비스망(Service Plane)이 완전히 분리된 4개 프로젝트로 운영됩니다.

| 프로젝트 | 계층 | 인증 및 주요 책임 |
| :--- | :--- | :--- |
| **`admin-web`** | 화면 + BFF | 관리자 React UI + Express BFF (세션 쿠키: `admin_session`) |
| **`admin-api`** | Control Plane | **🔐 사내 관리자 인증 전담 (사내 계정 / 2FA / SSO)**<br>운영 정책, 감사 로그(Audit), M2M 호출자 (Private Key 보유) |
| **`service-web`**| 화면 + BFF | 대고객 React UI + Express BFF (세션 쿠키: `service_session`) |
| **`service-api`**| Resource & Data | **🔐 대고객 회원 인증 전담 (소셜로그인 / 일반가입 / 본인인증)**<br>주문/상품/결제 등 비즈니스 도메인 데이터, M2M 수신자 (Public Key 보유) |

---

## 2. 전체 시스템 아키텍처 다이어그램

중앙 허브 없이 두 비즈니스 도메인이 완벽하게 독립되어 동작합니다.

```mermaid
flowchart TB
    subgraph AdminSystem["[관리자 시스템 (Admin Plane)]"]
        AdminBrowser["관리자 브라우저\n(admin.example.com)"]
        AdminBFF["admin-web (BFF)\n• 세션: admin_session\n• Redis: Admin 전용 Redis"]
        AdminAPI["admin-api (Control Plane)\n• 🔐 관리자 자체 인증 (사내 DB)\n• 관리자 권한 / 정책 / 감사로그\n• S2S M2M 서명기 (Private Key)"]
        AdminDB[(Admin DB\n사내 관리자 원장)]

        AdminBrowser -- "1. admin_session 쿠키" --> AdminBFF
        AdminBFF -- "2. Admin Bearer 토큰" --> AdminAPI
        AdminAPI <--> AdminDB
    end

    subgraph ServiceSystem["[대고객 서비스 시스템 (Service & Resource Plane)]"]
        UserBrowser["고객 브라우저 / 앱\n(service.example.com)"]
        UserBFF["service-web (BFF)\n• 세션: service_session\n• Redis: User 전용 Redis"]
        ServiceAPI["service-api (Resource Plane)\n• 🔐 고객 자체 인증 (고객 DB)\n• 쇼핑몰/주문/상품 비즈니스 도메인\n• S2S M2M 검증기 (Public Key)"]
        ServiceDB[(Service DB\n고객 회원원장 + 주문/상품)]

        UserBrowser -- "1. service_session 쿠키" --> UserBFF
        UserBFF -- "2. Customer Bearer 토큰" --> ServiceAPI
        ServiceAPI <--> ServiceDB
    end

    %% 내부 M2M 통신 연결선
    AdminAPI ==> |"3. S2S M2M 내부 통신\n(Private Key JWT 서명)\nGET /api/internal/orders/123\nx-actor-user-id: admin-1"| ServiceAPI

    classDef admin fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef user fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    class AdminBrowser,AdminBFF,AdminAPI,AdminDB admin;
    class UserBrowser,UserBFF,ServiceAPI,ServiceDB user;
```

---

## 3. 인증 처리의 독립 분리 (비교)

각 API는 대상 고객의 특성에 맞게 완전히 다른 인증 방식을 최적화하여 탑재합니다.

```mermaid
flowchart LR
    subgraph AdminAuth["admin-api 내부 인증 모듈"]
        A1["사내 임직원 계정 DB"]
        A2["Google Workspace SAML / 사내 SSO"]
        A3["관리자 2FA (OTP / 하드웨어 키)"]
        A4["사내 허용 IP 대역 필터링"]
    end

    subgraph ServiceAuth["service-api 내부 인증 모듈"]
        S1["대고객 회원 DB (수백만 단위)"]
        S2["카카오 / 네이버 / 애플 간편 로그인"]
        S3["휴대폰 본인인증 (PASS / SMS)"]
        S4["약관 동의 & 휴면 계정 처리"]
    end
```

* **`admin-api`**: 대규모 트래픽 처리가 필요 없으며, **보안성과 사내 인증(SSO/2FA)**에 집중.
* **`service-api`**: 보안성과 더불어 **초당 수만 건의 로그인/가입 트래픽과 소셜 로그인 확장성**에 집중.

---

## 4. 관리자의 서비스 리소스 접근 흐름 (S2S M2M 시퀀스)

관리자가 특정 고객의 주문 정보를 조회하거나 환불 처리할 때의 흐름입니다.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 관리자 (Browser)
    participant BFF as admin-web (BFF)
    participant AdminAPI as admin-api (Control Plane)
    participant ServiceAPI as service-api (Resource Plane)

    %% 1. 관리자 내부 로그인
    Note over Admin, AdminAPI: [1. 관리자 자체 로그인]
    Admin->>BFF: POST /api/v1/auth/login (사내 계정)
    BFF->>AdminAPI: POST /api/v1/auth/login
    Note over AdminAPI: admin-api 전용 DB에서 사내 권한 검증
    AdminAPI-->>BFF: Admin JWT 발급 (aud: admin-api)
    BFF-->>Admin: admin_session 쿠키 발급

    %% 2. 서비스 데이터 조회
    Note over Admin, BFF: [2. 고객 주문 123번 상세 조회 요청]
    Admin->>BFF: GET /api/v1/orders/123 (admin_session 쿠키)
    BFF->>AdminAPI: GET /api/v1/orders/123 (Authorization: Bearer <Admin JWT>)

    %% 3. Control Plane 감사 및 토큰 발행
    rect rgb(240, 248, 255)
    Note over AdminAPI: [3. Control Plane 통제]<br/>1. 관리자 토큰 검증<br/>2. 관리자 권한(@Permission) 확인<br/>3. [감사로그] "admin-1이 주문 123 조회 시작" 기록<br/>4. 자신의 Private Key로 60초짜리 M2M JWT 서명
    end

    %% 4. S2S 통신
    rect rgb(255, 245, 240)
    AdminAPI->>ServiceAPI: GET /api/internal/orders/123<br/>• Authorization: Bearer <M2M Token><br/>• x-actor-user-id: admin-1<br/>• x-request-id: req-abc
    end

    %% 5. Data Plane 처리
    rect rgb(245, 255, 245)
    Note over ServiceAPI: [4. Resource Plane 검증]<br/>1. admin-api의 Public Key로 서명 검증<br/>2. 내부망 M2M 호출 확인 (일반 브라우저는 차단)<br/>3. 고객 소유권 필터 없이 주문 123 DB 조회
    ServiceAPI-->>AdminAPI: 200 OK (주문 원본 데이터)
    end

    %% 6. 응답
    Note over AdminAPI: 5. 개인정보 마스킹 처리 후 최종 응답 반환
    AdminAPI-->>BFF: 200 OK
    BFF-->>Admin: 200 OK
```

---

## 5. 이 아키텍처가 제공하는 4가지 결정적 장점

1. **완벽한 물리적 격리 (No Mixed DB)**:
   * 관리자 계정 DB와 일반 고객 회원 DB가 테이블 수준이 아니라 **완전히 물리적으로 다른 서버/DB**로 분리됩니다.
   * 고객 서비스 DB가 침해당해도 관리자 계정 정보는 1%도 유출되지 않습니다.
2. **단일 장애점(SPOF) 제거**:
   * 중앙의 `auth-service`가 없으므로, 프로모션/이벤트로 일반 고객 서비스에 트래픽이 폭증해 장애가 발생해도, **사내 관리자 시스템은 100% 독립적으로 정상 가동**됩니다.
3. **아키텍처의 단순화 (4개 프로젝트)**:
   * 모노레포에서 애매한 위치였던 `auth-service`가 제거되어 서버 및 배포 파이프라인 관리가 간결해집니다.
4. **Zero Trust 기반 M2M 보안**:
   * `service-api`는 외부에 노출되는 엔드포인트와 내부 전용 엔드포인트(`/api/internal/*`)를 철저히 분리하며, 내부 통신은 `admin-api`의 비대칭 공개키 서명으로만 인가합니다.
