# 시스템 설정 DB 저장 현황

조회 기준: 2026-09-28. Admin API와 Service API의 `.env`에 지정된 DB를 각각 읽기 전용 트랜잭션으로 조회했다. 비밀번호, 토큰, 웹훅 URL 등 비밀값은 출력하지 않았다. 설정 값은 `system_config` 테이블의 `value` JSONB 열에 저장된다.

## 저장 위치와 실제 현황

| 영역 | DB / 테이블 | 실제 저장된 설정 코드 | 저장 형태 및 상태 |
| --- | --- | --- | --- |
| 관리자 이메일 | Admin DB / `system_config` | `email` | SMTP 발신자 및 접속 설정을 JSONB에 저장. 현재 host/user/from/pass는 비어 있고 port는 587, secure는 false. 코드상 SMTP 비밀번호는 `APP_SECRET` 기반 암호화 후 저장한다. |
| 관리자 웹훅 | Admin DB / `system_config` | 없음 | 현재 저장 행 없음. DB의 코드 CHECK 제약은 `email`만 허용한다. `Migration20260928120000_add_admin_webhook_config`가 DB 마이그레이션 이력에 없고 제약도 갱신되지 않았다. |
| 운영시간·휴무일 | Service DB / `system_config` | `operation` | 평일 월~금 09:00–18:00, 점심 설정 비활성, 휴무일 목록 비어 있음. 안내 문구 3종 저장. |
| 점검 정책 | Service DB / `system_config` | `maintenance` | 임시·정기 점검 모두 비활성. 정기 요일은 목요일(4), 시간 02:00–04:00. 시작/종료 시각은 임시 점검 값 없음. |
| 보안 정책 | Service/Admin API `app.config.ts` | DB 저장 중단 예정 | 보안 관련 고정 정책은 각 API 설정 객체에서 관리한다. 기존 Service DB `security` 행은 제거 마이그레이션 대기 상태다. |
| 문의 정책 | Service DB / `system_config` | `inquiry` | 첫 안내 문구, 미응답 기준 10분, 자동 종료 72시간 저장. 현재 DB 행에는 `offlineReplyMessage`가 없다. |
| 웹훅 | Service DB / `system_config` | `webhook` | `enabled=false`, `type=SLACK`, `cooldownMinutes=10`, URL 비어 있음. Admin DB로 이전되지 않은 기존 설정 행. |
| 이메일·메신저·SMS·푸시 발송 | Service DB / `system_config` | `delivery` | 각 발송 채널 비활성. SMTP, FCM 등 접속값은 현재 비어 있음. SMTP 비밀번호, 공급자 키·토큰, FCM 개인키 등 자격증명은 `APP_SECRET`으로 암호화 저장하고 Service 설정 응답에서는 빈 값으로 마스킹한다. |
| OAuth | Service DB / `system_config` | `oauth` | Google, Kakao, Naver 로그인 모두 비활성. client ID/secret은 비어 있음. OAuth client secret은 `APP_SECRET`으로 암호화 저장하고 응답에서는 빈 값으로 마스킹한다. |

## 보안 설정 및 인증 드라이버

위 표의 보안 행은 DB를 직접 조회한 시점의 값이다. 현재는 서비스와 관리자 API의 보안 정책 모두 각 API `app.config.ts`를 기준으로 하며, 관리자 화면/API에서 편집하지 않는다.

| 관리자 정책 | 코드 설정 | 적용 위치 |
| --- | --- | --- |
| 로그인 유지 기간 | `SECURITY_CONFIG.token.refreshIdleTimeoutMinutes`, `rememberMeDays` | JWT refresh-token family 또는 선택된 세션 드라이버의 유휴·remember-me 만료 |
| Access token 만료 | `SECURITY_CONFIG.token.accessTokenTtlMinutes` | JWT 드라이버의 access token 발급 |
| 로그인 실패 잠금 | `SECURITY_CONFIG.lockout.maxFailureAttempts`, `lockoutDurationMinutes` | Admin 로그인 처리 |
| 비밀번호 길이·복잡도 | `SECURITY_CONFIG.password.minLength`, `maxLength`, `maxBytes`, `requireNumbers`, `requireSpecialChar`, `requireUppercase` | 운영자 생성, 비밀번호 변경·재설정. 최대 바이트 제한은 UTF-8 기준 |
| 관리자 2FA 의무 적용 | `SECURITY_CONFIG.twoFactor.requireForOperators` (현재 `false`) | Admin 로그인 시 전체 운영자에게 2FA 설정을 요구할지 결정. 계정에서 2FA를 켠 경우 로그인 때 인증 코드를 확인 |

JWT가 현재 Admin/Service API의 기본 인증 드라이버다. `UserAuthModule`에서 `session` 드라이버를 선택할 수도 있으며, 이 경우 Express-session은 Admin/Service DB의 `session` 테이블 또는 Redis 세션 저장소를 사용한다. 세션 쿠키 이름은 `SECURITY_CONFIG.session.cookieName`, Secure·SameSite는 `SECURITY_CONFIG.cookie`에서 관리한다. `token.revokeOnLogin`은 JWT refresh-token family 동작이며 세션 드라이버에서는 사용하지 않는다.

기존 Service DB `security` 행 전체를 삭제하는 `Migration20260929130000_remove_security_config`가 추가됐다. 적용 전까지 DB에 과거 보안 JSON이 남아 있을 수 있지만, API 응답·수정 경로와 관리자 보안 화면에서는 더 이상 노출하지 않는다. 삭제된 DB 정책의 대응 설정은 `apps/service-api/src/app.config.ts`의 `SECURITY_CONFIG`에 있다.

## Admin 웹훅 이전 상태

코드에는 웹훅을 Admin DB에 저장하고 기존 Service DB 값을 최초 조회 때 옮기는 로직이 있다. 그러나 현재 Admin DB의 실제 CHECK 제약은 `code = 'email'`만 허용하며 신규 웹훅 마이그레이션이 실행되지 않았다. 따라서 현재 DB 상태로는 Admin DB에 `webhook` 행을 생성할 수 없다. 현재 웹훅 설정값은 Service DB에 남아 있으며, Admin 웹훅 조회/수정 흐름은 마이그레이션 적용 전까지 실패할 수 있다.

## 보안·패스워드 설정 분산 현황

코드와 DB 설정을 검색해 각 값을 실제로 소비하는 런타임까지 확인했다.

| 설정 | 정의·저장 위치 | 실제 적용 상태 | 발견한 분산/불일치 |
| --- | --- | --- | --- |
| Admin 패스워드 최소 길이 | Admin API `app.config.ts`의 `SECURITY_CONFIG.password.minLength=8` | 운영자 생성, 비밀번호 변경, 재설정 DTO에서 적용 | 관리자 웹의 재설정·프로필 변경 폼에도 `8`이 별도 하드코딩되어 있다. 서버 값만 바꾸면 브라우저 검증과 달라진다. |
| 패스워드 최대 길이 | 양쪽 API `SECURITY_CONFIG.password.maxLength=256`, `maxBytes=256` | 가입·비밀번호 변경·초기화·운영자 생성 및 로그인에서 검사 | 문자 수와 UTF-8 바이트 수를 각각 제한한다. 로그인에서는 바이트 제한을 초과하면 scrypt 검증을 실행하지 않고 일반 인증 실패로 처리한다. |
| Service 패스워드 정책 | Service API `SECURITY_CONFIG.password` | 설정값은 고정 선언. 현재 최소 길이·복잡도·만료·이력 적용 소비자는 확인되지 않음 | 선언된 정책 전체가 자동으로 적용되는 것은 아니다. |
| Service 계정 잠금 | Service API `SECURITY_CONFIG.lockout` | 로그인 핸들러에서 최대 실패 횟수와 잠금 기간 사용 | 고정 설정값이 로그인 잠금 동작에 연결돼 있다. |
| Admin 계정 잠금 | Admin API `SECURITY_CONFIG.lockout`의 5회·15분 | Admin API 로그인 핸들러에서 설정을 사용 | 두 API의 설정 이름과 구조는 같고 값은 각 API가 독립적으로 관리한다. |
| Service JWT 로그인 유지 | Service API `SECURITY_CONFIG.token` | refresh idle timeout, remember-me 만료, access token 기간 사용 | `revokeOnLogin`이 활성화되면 새 로그인 시 이전 토큰 family를 폐기한다. |
| Admin JWT 로그인 유지 | Admin API `SECURITY_CONFIG.token` | refresh idle timeout, remember-me 만료, access token 기간 사용 | 토큰 family의 idle timeout으로 refresh와 access 요청을 제한한다. |
| 가입 정책·서비스 2FA 허용 | Service API `SECURITY_CONFIG.registration`, `twoFactor` | 설정값 선언만 확인 | 회원가입 및 서비스 계정 2FA의 런타임 소비자는 현재 구현에서 확인되지 않았다. |
| 입력 제한과 요청 제한 | Admin/Service 로그인 DTO, API별 `app.config.ts` | 로그인은 DTO 길이 제한과 설정된 UTF-8 최대 바이트를 적용한다. 각 API의 전역 요청 제한은 별도 적용 | 로그인 시도 제한(요청 빈도)과 계정 잠금(실패 누적)은 서로 다른 정책이다. |

### 패스워드 정책 판단

- **Admin 계정:** 최소·최대 길이, UTF-8 최대 바이트, 문자 조합, 만료, 변경 유예, 이전 비밀번호 재사용 제한을 Admin 런타임 정책에서 적용한다.
- **Service 회원:** 최소·최대 길이, UTF-8 최대 바이트, 문자 조합, 만료, 변경 유예, 이전 비밀번호 재사용 제한을 Service 런타임 정책에서 적용한다.
- **중복의 성격:** Admin과 Service는 계정 저장소와 로그인 핸들러가 별개라 같은 기본값 8자·5회·15분이 있어도 시스템 간 중복이다. 반면 Admin 웹 폼의 `8`과 Admin API의 `passwordMinLength`는 같은 정책을 두 번 정의한 실제 중복이다.

## 확인한 저장 규칙

- 두 API는 각각 별도 PostgreSQL DB를 사용하며, 테이블 이름은 둘 다 `system_config`다.
- 각 행은 설정 코드(`code`)와 전체 설정 객체(`value` JSONB), 설명(`description`), 수정 시각(`updatedAt`)을 갖는다.
- Service API는 시작 시 운영시간·점검·문의·웹훅 일부를 Redis로 동기화한다. DB가 원본 저장소이고 Redis는 런타임 반영용 캐시다.
- Admin 이메일 SMTP 비밀번호는 Admin API 코드에서 암호화한다. Service OAuth client secret과 delivery의 SMTP 비밀번호, 공급자 키·토큰, FCM 개인키는 Service API에서 `APP_SECRET` 기반 암호화 후 JSONB에 저장하며 공개 설정 응답에서는 값을 비운다. 저장돼 있던 기존 평문 자격증명은 해당 설정을 다음에 저장할 때 암호문으로 전환된다. 빈 값으로 수정 요청을 보내면 기존 자격증명을 보존한다.
- Service DB의 `inquiry`에는 현재 `offlineReplyMessage`가 없다. 저장 행 설명도 부재중 응답 문구를 포함하지 않는 이전 문구다.

## 실제 조회 데이터 요약

| DB | 행 수 | 설정 코드 |
| --- | ---: | --- |
| Admin DB | 1 | `email` |
| Service DB | 기존 스냅샷 7행 | `delivery`, `inquiry`, `maintenance`, `oauth`, `operation`, `security`, `webhook` |
