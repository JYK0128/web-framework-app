# admin / service 공통 도구 동일화 보고서

현재 워킹 트리 기준. 공통 코드 **226쌍이 바이트 단위로 동일**하며, 명시한 앱별 예외 밖의 누락·차이는 **0건**이다. 남은 앱별 차이는 내용 차이 7쌍, 한쪽에만 있는 경로 2개다.

비교 범위는 API common·infra·locales·types·로그 엔티티, 웹 components·hooks·core·lib·configs다. 시더, DB 변경 이력과 스냅샷은 이 문서의 목록·집계에서 제외했다. 업무별 modules/routes/entities, 생성 API 클라이언트, 빌드 산출물은 전체 동일화 대상이 아니다. 약관 관리 도구는 Admin의 `terms`와 `service-terms` 각 라우트 아래에 별도로 둔다. Service의 운영 안내는 보호된 Q&A·고객지원이 공유하고, 점검 게이트는 Service 보호 라우트에서만 적용한다.

권한 목록은 공유 패키지의 `auth/admin-permissions.ts`와 `auth/service-permissions.ts`에서 각각 관리한다. 두 목록의 항목은 서로 독립적으로 유지한다.

## 사용자 JWT 권한 처리

Admin과 Service 모두 같은 JWT 발급기와 Guard 코드를 사용한다. JWT에 `roles`와 `permissions`를 담고, Guard는 서명·issuer·audience와 claim 스키마를 검증한 뒤 claim 값으로 principal을 구성한다. 권한 판단을 위해 `User.role`을 조회하지 않는다. issuer·audience 값은 각 앱 `app.config.ts`의 `SERVICE_ID` (`admin-api` / `service-api`)에서 공급한다. KV 키도 같은 helper에서 `SERVICE_ID`를 네임스페이스로 사용한다.

JWT 경로에서 계정 존재·삭제·차단·잠금 상태와 본인인증·2단계 인증·비밀번호 만료 상태를 확인하는 조회는 아직 남아 있다. 이를 로그인·토큰 갱신 시점 검사로 옮기는 작업은 후속 대응 대상으로 둔다. Session 인증은 기존처럼 별도 경로에서 DB role을 읽는다.

## 이번에 양쪽에 맞춘 기반 기능

| 기능 | 기존 차이 | 현재 양쪽 구현 및 연결 |
|---|---|---|
| 웹 i18n | admin에만 번역 컨텍스트·언어 선택 제공 | 동일한 요청별 SSR 컨텍스트, useI18n, 언어 선택 UI, 쿠키 저장, html lang 반영. service 공개 메뉴·홈 화면에도 연결 |
| API i18n | admin만 요청 언어에 따라 응답 번역 | 동일한 언어 감지 미들웨어·한/영 리소스·응답 처리. 번역 키가 없는 업무 오류는 원래 메시지 유지 |
| 언어 전달 | service API 호출에 언어 연결 부족 | 웹 요청에 현재 언어 헤더 적용. 서버 간 요청에도 수신 언어 전달 |
| HTTP 요청 로그 | admin만 LogEntry DB 기록 | 동일한 엔티티·미들웨어. service 엔티티 등록 및 로그 테이블 생성 코드 추가 |
| 머신 인증 | admin은 JWT/API key 선택, service는 JWT 전용 구조 | 동일한 선택형 모듈·가드·검증기. API key 사용 시 허용된 호출자 명시. 현재 두 앱의 등록 방식은 JWT |
| 서버 간 HTTP 클라이언트 | admin에만 service 대상 구현 | 동일한 fetch/upload/download 제공. 대상 서비스와 URL은 앱 등록부에서 주입 |
| 머신 토큰 계약 | 앱별 계약 파일 | payload 스키마·TTL을 shared로 이동하고 양쪽에서 재사용 |
| 파일 저장·정적 제공 | service에서만 실제 등록·서빙 연결 | 동일한 StorageModule 및 정적 제공 도구를 양쪽 앱에 등록 |
| 전송 어댑터 | service 공통 전송 모듈 등록 누락 | 동일한 범용 전송 모듈 등록. 업무별 전송 설정은 유지 |
| 공통 import 경로 | 응답 DTO·응답 클래스의 기존 경로 차이 | 같은 구현을 가리키는 호환 export 경로도 양쪽 제공 |

기존 작업에서 맞춘 폼·날짜 입력, DataGrid, 모달, 대화상자, 범용 레이아웃, 토큰 저장소, KV 저장소, SSE 등의 공통 구현도 비교에 포함한다.

**동일성의 범위:** 공통 구현 파일은 동일하다. 각 앱의 main/AppModule/router/root/axios는 그 앱의 URL·모듈·화면을 연결하므로 파일 전체를 덮어쓰지 않았다. 기존 업무 화면의 모든 문자열을 번역한 것은 아니다.

## 앱별 값·정책 때문에 남긴 차이

서비스 ID, JWT issuer/audience, 상대 API URL, KV prefix, 권한, 메뉴, 업무 문구는 앱별 값을 유지한다. 아래 표는 비교 대상 안에서 실제로 남아 있는 차이 전부다.

| 범위 | 상대 경로 | 상태 | 다른 내용·이유 |
|---|---|---|---|
| web/components | `app/app-bootstrap.tsx` | 내용 다름 | 양쪽 모두 로그인 상태 복구·사용자 조회. 공개 경로와 보호 경로에서 실행하는 방식이 다름 |
| web/components | `app/app-guard.tsx` | 내용 다름 | Admin은 보안 설정·필수 운영자 약관, Service는 본인인증·2단계 인증·비밀번호 만료를 경로로 제한 |
| web/components | `app/brand-logo.tsx` | 내용 다름 | 앱 이름과 접힌 로고 표시 |
| web/components | `app/action.tsx` | 동일 | 두 앱에서 권한 타입은 각자 `configs/app.config.ts`가 공급하고, 구현 코드는 바이트 단위로 동일 |
| web/components | `layout/app-layout.tsx` | 내용 다름 | Admin은 권한별 운영 메뉴·사이드바, Service는 공개 메뉴·로그인 상태 연결 |
| web/core | `locales/en/index.ts` | 내용 다름 | 서비스 화면 번역 리소스 등록 |
| web/core | `locales/en/service.json` | service에만 있음 | 서비스 전용 화면 문구 |
| web/core | `locales/ko/index.ts` | 내용 다름 | 서비스 화면 번역 리소스 등록 |
| web/core | `locales/ko/service.json` | service에만 있음 | 서비스 전용 화면 문구 |
| web/configs | `app.config.ts` | 내용 다름 | 앱별 `PermissionCode` 타입 별칭과 쿼리 경로·캐시·갱신 주기 |

## 검증 기록

### 최신 타입·문서 상태 검사

```sh
pnpm --filter admin-api --filter service-api --filter admin-web --filter service-web --filter @pkg/shared --parallel typecheck
```

```text
packages/shared typecheck: Done
apps/admin-api typecheck: Done
apps/service-api typecheck: Done
apps/admin-web typecheck: Done
apps/service-web typecheck: Done
```

### Service API 오류 응답 타입 생성 (2026-09-29)

Docker 개발 환경의 Service API 스펙을 사용해 오류 DTO를 생성하고 axios에서 사용하도록 연결했다. Swagger 설정은 Admin과 동일하게 `ApiErrorResponseDto`를 `extraModels`에 등록하며, 작업별 `default` 오류 응답은 임의로 주입하지 않는다.

```sh
docker compose -f apps/deployment/docker-compose.dev.yml up -d --build service-api
API_SPEC_URL=http://localhost:4000/api/docs-json pnpm --filter service-web codegen:api
```

```text
Service API Swagger: HTTP 200, 20 paths, ApiErrorResponseDto schema present
Orval api: success
Orval zod: success
service-api typecheck: pass
service-web typecheck: pass
```

전체 Orval 재생성 결과 현재 Service API 스펙에서 기존 Service Web이 사용하는 인증·비밀번호 재설정 API 일부가 빠져 있는 계약 불일치가 확인됐다. 전체 생성물을 교체하면 기존 화면이 타입 오류를 내므로, 이번 변경에는 생성된 `ApiErrorResponseDto` 모델만 반영했다. 전체 클라이언트 동기화는 해당 API 계약을 먼저 정리해야 한다.

```sh
git diff --check
```

두 명령 모두 종료 코드 0, 오류 출력 없음. 이번에 수정한 Service UI 파일과 Admin 오류 화면의 ESLint도 종료 코드 0이다. 전체 ESLint는 실행하지 않았다.

### 브라우저에서 확인한 i18n 동작

service-web 디렉터리에서 개발 서버를 실행하고, `node` heredoc의 Playwright Chromium으로 확인했다.

```sh
pnpm exec vite --host 127.0.0.1 --port 15301 --strictPort
```

```text
PASS: EN → KO via UI, URL/html language/content update, cookie persistence, reload, API Accept-Language=ko
PASS: concurrent EN/KO SSR requests retain their own locale
```

언어 선택 UI를 직접 클릭하여 경로·본문·html lang 변경, 쿠키 저장, 새로고침 후 유지, API 요청 언어 헤더를 확인했다. API 응답은 401 mock을 사용했으므로 실제 로그인이나 실 API 응답 번역에 대한 E2E 결과는 아니다.

### 의존성

```sh
pnpm install --offline --ignore-scripts
```

성공. 잠금 파일 갱신. 기존 template/react-starter-kit의 React 17 peer 요구와 React 19 사이 경고가 남아 있다.

## 적용·검증 한계

- service의 HTTP 로그 저장에는 추가된 로그 테이블 생성 코드를 DB에 적용해야 한다. 이 작업에서 실제 DB에는 적용하지 않았다.
- 실제 DB 로그 저장, 서버 간 JWT/API key 인증 통신, 파일 업로드·다운로드 통합 동작은 이번 실행 검증에 포함하지 않았다.
- 앱별 업무 문자열과 고유 설정은 동일화 대상에서 제외했다. 공통 i18n 기반이 같아졌다는 의미이며, 모든 업무 화면의 번역 완료를 의미하지 않는다.
