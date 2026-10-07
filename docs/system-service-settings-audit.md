# 시스템·서비스 설정 적용 현황

조사일: 2026-09-29
범위: 관리자 설정 화면, Admin API, Service API와 설정을 읽는 실제 기능 코드. **적용**은 저장 성공만 뜻하지 않고, 저장한 값이 기능 실행 경로에서 읽혀 효과를 내는지 기준으로 판단했다. 배포 환경 DB/Redis의 실제 값과 외부 연동 성공은 확인하지 않았다.

Admin 인증은 `admin-api`, 고객 인증은 `service-api`가 각각 담당한다. 별도 중앙 `auth-service` 앱은 이 구조에서 사용되지 않아 제거했으며, 운영 설정 적용 대상에도 포함하지 않는다.

## 시스템 설정

전역 요청 제한은 Admin·Service API 모두 API별 `app.config.ts`의 `rateLimit.maxRequests`에 따라 IP·엔드포인트별 분당 40회 적용한다. 인증·계정 복구 경로도 별도 `@Throttle` 설정 없이 같은 전역 제한을 사용한다. 두 API 모두 `NODE_ENV=development`에서는 전역 `ThrottlerGuard`를 등록하지 않아 요청 제한을 적용하지 않는다. 그 외 환경에서는 제한을 적용한다. 요청 창과 공통 차단 시간은 각각 `windowMs`·`blockDurationMilliseconds`로 설정한다. Express `trustProxy` 설정에 따라 클라이언트 IP를 기준으로 제한한다. 전역 Throttler 저장소는 KvStore를 사용하고 Redis 환경에서는 sliding window 요청 시각을 sorted set으로 관리하는 원자적 Lua 스크립트로 API 프로세스 간 제한을 공유한다. 차단 후 잠금시간이 지나면 새 카운트 구간을 시작한다. Admin/Service는 키 prefix를 분리해 서로의 횟수를 합산하지 않는다.

| 옵션 | 적용되어야 할 곳과 방식 | 현재 적용 여부 | 확인 사항 |
|---|---|---|---|
| 회원가입·credential 인증 | Service API 가입 진입점에서 `allowRegistration`과 `credentialAvailable`, 이메일 인증 요구를 검사하고 로그인·비밀번호 기능 전반에서 `credentialAvailable`을 적용. 본인인증 필수값은 보호 요청 경로에 적용 | 적용 | `RegisterHandler`, `LoginHandler`, 비밀번호 복구·변경 핸들러와 `UserAuthGuard`가 설정을 읽음. 본인인증이 필요한 보호 요청은 `IDENTITY_VERIFICATION_REQUIRED`(403)를 반환하고 Service Web 인증 초기화가 인증 화면으로 안내. 본인인증 공급자 요청 제한시간·재시도 횟수·최초/최대 대기시간·backoff 배수·jitter는 양쪽 `app.config.ts`의 동일한 `identityVerification` 경로에서 관리. 관리자 계정 등록 정책은 별도 Admin API 흐름 적용 |
| 사용자 인증 유지 방식 | Admin/Service API의 JWT 또는 서버 세션 인증 유지 방식에 적용 | 적용 (기본 JWT, 세션 선택 가능) | `UserAuthModule`의 `driver` 설정은 현재 두 API 모두 `jwt`다. `session`을 선택하면 Express-session 쿠키와 DB/Redis 세션 저장소를 사용하며, 쿠키 이름은 `SECURITY_CONFIG.session.cookieName`, Secure·SameSite는 `SECURITY_CONFIG.cookie`에서 읽는다. 세션 유휴 만료와 remember-me 기간은 `token.refreshIdleTimeoutMinutes` 및 `token.rememberMeDays`를 사용한다. JWT 전용 `token.revokeOnLogin`은 세션 드라이버에 적용되지 않는다. JWT 모드의 access token 만료는 `token.accessTokenTtlMinutes`이며, refresh-token family의 idle 만료와 별도로 검사한다. |
| 로그인 실패 잠금 | Admin/Service 로그인 실패 처리에서 허용 횟수, 누적 기간, 잠금 시간을 적용 | 적용 | 비밀번호·잘못된 2FA 코드 모두 `lockout.maxFailureAttempts`, `failureWindowMinutes`, `lockoutDurationMinutes`를 읽음. 고정 구간은 첫 실패 시각부터 시작하고, 구간 종료나 잠금 만료 뒤에는 새 주기로 계산한다. `failureWindowMinutes`가 0 이하면 시간 구간 제한 없이 성공 로그인 또는 잠금 만료까지 실패를 누적한다. 성공 로그인·비밀번호 재설정·OAuth 로그인 시 실패 상태를 초기화 |
| 비밀번호 정책 | 가입·변경·초기화에서 길이·문자 조합·이력·만료 및 유예 정책을 적용 | 적용 | 두 API의 `password-policy` 및 auth handlers/guards가 해당 `app.config.ts` 값을 사용 |
| 2단계 인증 정책 | Admin/Service 로그인에서 기존 사용자 2FA를 검증하고, 필수 설정은 보호 요청에서 등록을 요구 | 적용 | 양쪽 config의 `enabled`, `required`, `codeLength`, `periodSeconds`, `windowSteps`가 로그인·설정 UI 정책·guard·인증 앱 QR에 연결됨. 코드 주기와 시계 오차 허용 범위는 config에서 변경 가능. 등록 확인 코드 실패도 `lockout.maxFailureAttempts`와 `lockoutDurationMinutes`에 따라 잠기며 저장·만료 후 재설정됨 |
| 요청·목록 크기·외부 연동 제한 | Admin/Service 요청 본문·목록 크기와 외부 연동 대기시간을 설정값으로 제한 | 적용 | JSON·폼·raw 요청 본문 parser 상한은 양쪽 `app.config.ts`의 `SECURITY_CONFIG.request.bodyMaxSizeBytes`에서 바이트 단위로 설정. OAuth 아이콘 업로드는 별도로 `integrations.oauthIconMaxSizeBytes`를 DTO·컨트롤러·서비스 검증에서 적용하므로 일반 raw parser 제한과 분리. 목록 기본값·상한·DataGrid 페이지 크기는 `packages/shared/src/config/pagination.config.ts`에서 함께 관리하며 양 API config가 이를 재수출해 Page/List/Cursor·고객지원·Q&A·로그 조회의 DTO 검증·Swagger·실행과 Admin/Service Web 선택 목록이 같은 값을 사용. Admin API는 SMTP·공휴일 조회·내부 Service API·Admin 테스트 발송 요청의 제한시간과 푸시 메시지 보관 시간을 해당 `SECURITY_CONFIG.integrations` 값에서 읽는다. Service API는 SMTP·Webhook·OAuth 공급자·OAuth 아이콘 업로드 제한값을 소비한다. 설정 경로를 맞추려고 양쪽 `app.config.ts`에 같은 구조를 유지하지만, 각 프로세스에서 미사용인 값은 동작에 영향을 주지 않는다. 예를 들어 내부 Service API·공휴일·테스트 발송·푸시 제한은 Admin API에서, OAuth 공급자·OAuth 아이콘 업로드 제한은 Service API에서 소비한다. 본인인증 공급자는 양쪽 `identityVerification.requestTimeoutSeconds`, `maxRetries`, `retryDelayMilliseconds`, `retryMaxDelayMilliseconds`, `retryBackoffFactor`, `retryJitterEnabled` 값으로 요청시간과 전체 재시도 간격 정책을 제어 |
| 발송 채널(이메일/SMS/푸시/메신저) | 이메일은 인증·복구 메일에 사용. SMS·푸시·메신저는 이벤트 기능 구현 후 업무 발송에 연결 | 이메일 적용 / SMS·푸시·메신저 이벤트 연결 보류 | 서비스 이메일 SMTP는 인증 메일·비밀번호 복구에서 사용. 인증·복구 링크는 `APP_BASE_URL`이 없으면 localhost로 잘못 발송하지 않고 요청을 실패시킴. Admin API에는 SMS·푸시·메신저 adapter와 설정 화면 테스트 발송이 구현돼 있지만 현재 서비스 업무 이벤트에서는 호출하지 않으며, 이벤트 기능을 구현할 때 연결하기로 함. 활성화된 SMS·Push·지원 메신저는 선택 provider 자격증명이 없으면 Service API가 저장을 거절하며, 비활성 채널은 설정을 단계적으로 입력할 수 있음. 테스트는 수신 전화번호·기기 토큰·메신저 사용자 ID를 별도로 입력하며, Admin은 테스트 시 Service 내부 API에서 마스킹된 저장 자격증명을 복원해 사용함. 앱의 기기 Push 토큰 등록 기능은 없으며 Kakao 알림톡은 템플릿 코드 설정 경로가 없어 테스트 발송을 지원하지 않음 |
| 소셜 로그인(OAuth) | Service 로그인 화면에서 활성화된 모든 설정 공급자를 노출하고 각 공급자의 endpoint·scope·client 인증·사용자 정보 경로로 인증 | 적용(설정 공급자 전체 지원, 외부 공급자 실연동 미검증) | 내장 공급자와 사용자 정의 공급자를 동일한 Authorization Code + PKCE 흐름으로 처리. 활성 저장 시 Client ID/Secret과 필수 endpoint·HTTPS를 검증해 불완전한 공급자가 조용히 숨겨지지 않게 함. OAuth2 UserInfo 응답 경로 매핑과 OIDC ID Token(JWKS/issuer/audience/nonce 검증)을 지원. Service API callback URL은 `APP_BASE_URL`을 기준으로 생성. 검증된 이메일만 신규 계정 생성·기존 계정 연결에 사용. 2FA가 등록된 계정은 소셜 흐름에서 차단하고 자격 증명 로그인을 안내 |
| 문의 Webhook | Admin 시스템 설정에서 원본을 관리하고 Q&A·1:1 문의 알림에서 활성화·공급자·주소를 사용. 미응답 알림에는 쿨다운도 적용 | 적용(원본 Admin DB) | Admin DB의 `system_config` (`code=webhook`)가 원본. 기존 값을 최초 조회 때 Service API DB에서 한 번 이관. 저장·수동 동기화 때 Service API DB 미러와 Redis를 갱신하며, 발송은 Service API가 담당. 새 Q&A 등록과 1:1 상담 생성 알림은 같은 Webhook 설정을 사용하고, `cooldownMinutes`는 1:1 미응답 알림 반복 간격에만 적용 |
| 관리자 SMTP | Admin 계정 인증·복구 메일에서 Admin DB 설정을 읽어 전송하고, 시스템 설정 화면에서 수정·테스트 | 적용 | 비밀번호 초기화·이메일 인증에 사용. SMTP 편집 폼, 저장, 비밀번호 마스킹, 테스트 발송이 연결됨 |

### 보안 정책을 나눠야 하는 이유

보안 정책은 사용자 경계에 맞춰 각 프로젝트의 `app.config.ts`에서 고정 관리한다. 각 API의 로그인·세션·비밀번호·2FA guard가 해당 API의 설정을 직접 읽는다. Admin DB에는 보안 정책을 중복 저장하지 않는다.

설정 객체의 경로를 통일한 것이 모든 API에서 모든 옵션이 쓰인다는 뜻은 아니다. Service API만 공개 회원 가입과 소셜 로그인을 제공하므로 가입 및 OAuth 설정은 Service 기능에서 소비하며, Admin API에는 해당 공개 진입점이 없다. Admin 운영자 생성은 인증된 운영자 관리 기능이며 공개 가입 옵션과 별도다. `identityVerification.requestTimeoutSeconds`는 Admin과 Service의 PortOne 검증 요청에 각각 적용된다. 쿠키 SameSite·Secure 정책은 `SECURITY_CONFIG.cookie`에서 양쪽 API가 함께 관리하고 로그인·OAuth·세션 쿠키 발급 및 삭제에 적용한다. HttpOnly는 유지한다.

2단계 인증은 `twoFactor.codeLength`와 `periodSeconds`에 더해 `twoFactor.windowSteps`로 TOTP의 허용 시계 오차 구간을 제어한다. 기본값 1은 현재 구간과 앞뒤 각 1구간을 허용하며, Admin/Service 모두 같은 설정 경로를 사용한다.

패스워드는 문자 수(`password.minLength`, `maxLength`)와 UTF-8 바이트 수(`password.maxBytes`)를 함께 제한한다. 바이트 상한은 양쪽 API의 가입·변경·초기화·운영자 생성 정책에서 확인하며, 로그인은 상한 초과 입력에 대해 비밀번호 해시 검증을 생략한다. 정책 API의 길이·바이트 상한·조합 요구 값을 사용해 웹 가입·변경·초기화·운영자 생성 폼의 안내, 입력 제한과 제출 검증도 서버 정책에 맞춘다. 정책을 조회할 수 없으면 임의의 기본값을 적용하지 않고 폼 제출을 막는다.

Admin 로그 통계의 평균 응답시간은 `apps/admin-api/src/app.config.ts`의 `ADMIN_RUNTIME_CONFIG.logs.averageDurationSampleSize` 개수만큼 최근 로그를 표본으로 계산한다. OAuth 아이콘 응답의 브라우저 캐시 기간은 `ADMIN_RUNTIME_CONFIG.oauthIconCacheMaxAgeSeconds`를 사용한다. 약관 동의 이력, 공개 서비스 약관, Service Web의 상담 목록 요청은 공통 `PAGINATION_MAX_LIMIT`을 사용해 API 상한 변경과 화면 조회량이 어긋나지 않게 한다.

Admin/Service API의 `SECURITY_CONFIG.request.trustProxy`와 Admin/Service Web의 `WEB_RUNTIME_CONFIG.request.trustProxy`는 각 Express 서버의 `trust proxy`에 연결되어 있다. HSTS는 외부 HTTPS 프록시에서 설정하므로 API와 Web의 Helmet에서는 비활성화해 중복 헤더를 막는다. 프록시의 실제 헤더 설정은 저장소 밖 배포 설정에서 확인해야 한다. API Express-session도 자체 `proxy` override를 두지 않아 이 설정을 따르며, Secure 쿠키 발급 시 프록시 신뢰 범위가 일치한다. API prefix/version은 shared `API_PREFIX`·`API_VERSION`에서 양 API가 함께 가져오며 `API_BASE_PATH`를 CSRF 경로 검사, 인증 쿠키, 업로드, 점검 예외, 헬스체크, S2S 내부 호출 등 수동 경로 조합에서 사용한다. OpenAPI로 생성된 Web 클라이언트 경로는 API 계약이 바뀌면 재생성해야 한다. 배포 프록시의 신뢰 범위를 설정 파일에서 조정할 수 있으며, 현재 네 앱 모두 기존 동작을 유지하도록 `true`로 둔다. Admin/Service Web의 다른 서버 실행 옵션도 각 `apps/{admin,service}-web/server/config/runtime.app.config.ts`에서 관리한다. JSON 요청 본문 상한(1 MiB), graceful shutdown 대기시간(10초), readiness 헬스체크의 API 제한시간(2초), API 프록시 응답 헤더 대기시간(30초)이 적용된다. 프록시 제한시간은 응답 헤더를 받으면 해제하므로 Service SSE 스트림을 이 제한으로 끊지 않는다. Permissions-Policy와 CSP 출처 지시문은 `WEB_RUNTIME_CONFIG.security`에서 관리하며 CSP의 nonce 기반 script 허용은 유지된다. SMS·푸시·메신저의 업무 이벤트 연결은 이벤트 기능 구현 시 진행하기로 해 현재 보류 항목으로 둔다.

### Webhook 저장과 실행 경계

Webhook은 Admin이 소유하고 관리한다. 원본은 Admin DB에 저장하고, Service API DB에 남는 동일 설정은 Service API 시작 시 Redis 스냅샷을 채우는 런타임 미러다. 관리자 저장과 수동 동기화에서 원본으로 미러를 갱신한다. 기존 Webhook 값은 Admin DB 행이 처음 만들어질 때 Service API의 기존 값에서 한 번 가져온다.

## 서비스 설정

운영·점검·문의·Webhook 설정 저장은 DB flush 후 Redis 런타임 스냅샷을 갱신한다. 저장을 수행한 API 인스턴스는 스냅샷 기록 직후 로컬 캐시를 비우며, 다른 인스턴스는 `apps/service-api/src/app.config.ts`의 `SERVICE_RUNTIME_CONFIG.systemConfigCacheTtlMilliseconds`(기본 5초) 이후 새 값을 읽는다. Service API 정적 파일과 OAuth 아이콘의 브라우저 캐시 유효시간은 `SERVICE_RUNTIME_CONFIG.staticAssetsCacheMaxAgeSeconds`(기본 1일)에서 조정한다. 로컬 저장소 디렉터리는 storage adapter와 정적 파일 mount에서 공유하며, 공개 URL prefix는 실제 정적 파일 mount에도 적용한다. 업로드 URL prefix도 `SERVICE_RUNTIME_CONFIG.storage`를 storage adapter에 전달한다. 발송 채널·OAuth는 DB에서 직접 읽으므로 Redis 동기화 대상이 아니다. Redis 쓰기가 실패하면 DB 변경은 남고 `SYSTEM_CONFIG_RUNTIME_SYNC_FAILED`를 반환한다. Admin 화면은 “DB 저장 완료, 런타임 반영 실패” 메시지를 보여주며 기존 동기화 버튼으로 재시도할 수 있다.

| 옵션 | 적용되어야 할 곳과 방식 | 현재 적용 여부 | 확인 사항 |
|---|---|---|---|
| 운영 시간·휴무일·안내 문구 | Service Web에 운영 상태와 안내를 표시하고, 고객지원 채팅의 부재중 응답은 문의 정책에서 별도로 관리 | 적용 | 화면 표시와 문의 처리 모두 공유 `DEFAULT_TIMEZONE`을 사용. 휴게시간 문구는 운영시간 내에서만 표시. Q&A·1:1 문의 화면은 운영시간 안내를 표시. 고객지원 채팅은 운영시간 외 메시지마다 문의 정책의 `inquiry.offlineReplyMessage`를 시스템 메시지로 남김. 미응답 Webhook 작업도 운영시간을 기준으로 실행. Service Web의 설정 재조회와 시간 기반 안내 재계산 주기는 `configs/app.config.ts`의 `SYSTEM_CONFIG_REFRESH_INTERVAL_MS`에서 조정 |
| 점검 정책 | Service API 전역 요청 가드에서 임시/정기 점검 시간 동안 요청 차단, 헬스체크·필수 내부 설정 경로는 예외 | 적용 | 점검 가드가 Service API에 등록되어 설정 메시지와 함께 요청을 차단. Service Web 전역 점검 배너도 같은 스케줄과 안내 문구를 공개 설정에서 읽어 표시. 정기 점검 요일은 시작 요일 기준이며, 자정을 넘는 점검은 다음 날 종료 시각까지 이어짐. Admin API/관리자 화면은 차단 범위 밖 |
| 문의 첫 안내 문구 | 1:1 상담방 생성 시 시스템 첫 메시지로 표시 | 적용 | Support 상담방 생성 코드에서 설정 문구를 사용. Q&A에는 적용되지 않음 |
| 미응답 감지 시간 | 1:1 상담 미응답 스케줄러가 설정된 분 단위 경과 기준으로 알림 실행 | 적용 | `inquiry.unansweredThresholdMinutes`는 마지막 고객/상담원 메시지 이후의 실제 경과 시간을 기준으로 한다. 마지막 사람 메시지가 고객이며 방이 미종료이고 운영시간 중이고 Webhook이 활성화된 경우 알림 후보가 된다. 영업 외 자동응답은 사람 메시지로 보지 않으므로 영업 재개 후에도 마지막 사람이 고객이면 대상이다. 스케줄러 확인 주기는 `apps/service-api/src/app.config.ts`의 `SERVICE_RUNTIME_CONFIG.support.unansweredCheckIntervalMinutes`(1분), 관리자 상담창 메시지 재조회 주기는 `apps/admin-web/src/configs/app.config.ts`의 `SUPPORT_ROOM_MESSAGE_REFRESH_INTERVAL_MS`(5초)에서 조정 |
| 자동 종료 시간 | 답변이 완료된 1:1 상담을 자동 종료하는 스케줄러에서 기준 시간으로 사용 | 적용 | `inquiry.autoCloseHours` 경과 후 상태가 `IN_PROGRESS`이고 마지막 사람이 상담원인 방만 종료한다. 확인 주기는 `SERVICE_RUNTIME_CONFIG.support.autoCloseCheckIntervalMinutes`(기본 10분)이며 `apps/service-api/src/app.config.ts`에서 조정 가능. Q&A 글과 미응답 고객 상담은 자동 종료하지 않음 |

## 우선 적용 권고

| 우선순위 | 작업 |
|---|---|
| 보류(이벤트 구현 시) | 해당 업무 이벤트의 수신 대상과 발송 정책을 정하고, Admin API의 SMS·푸시·메신저 adapter를 Service API 업무 발송 경로에 연결 |
| P2 | OAuth 공급자별 실연동 설정 검증과 2FA 계정의 사용자 경험을 보강. 현재 2FA가 등록된 계정은 소셜 로그인을 거절해 인증 정책을 우회하지 않음 |
| P3 | 운영시간 기준 자동 배정·예약이 별도로 필요해지면 그 동작을 추가. 현재는 운영 안내와 알림 시간 기준을 제공하고 운영자가 응대 |

## 조사 근거

- 설정 저장/Redis 대상: `apps/service-api/src/modules/system-configs/system-config.service.ts`
- 서비스 설정 읽기·점검: `apps/service-api/src/modules/system-configs/system.context.ts`, `system-maintenance.guard.ts`
- 공통 운영시간·휴무일·점검 계산: `packages/shared/src/common/system-schedule.ts`
- 운영 안내: `apps/service-web/src/routes/_app/_protected/-components/operation-notice.tsx`, `apps/service-web/src/components/app/maintenance.tsx`
- 문의 Webhook: `apps/service-api/src/modules/support/inquiry-alert.service.ts`, `support-inquiry.scheduler.ts`, `apps/service-api/src/modules/qna/qna-created.handler.ts`
- 인증 설정과 사용처: `apps/admin-api/src/app.config.ts`, `apps/service-api/src/app.config.ts`, 각 API의 `modules/auth`와 `infra/auth/user`
- 관리자 메일: `apps/admin-api/src/modules/system-configs/system-config.service.ts`, `apps/admin-api/src/modules/auth/account-recovery.service.ts`, `apps/admin-web/src/routes/_protected/_app/system-settings/-components/admin-email-settings-tab.tsx`
