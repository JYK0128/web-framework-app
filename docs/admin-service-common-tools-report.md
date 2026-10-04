# Admin / Service 기능 현황 비교

비교 대상은 Admin과 Service다. 각 앱의 현재 인증·접근 흐름, 공통 기반 기능, 앱별 구성을 정리한다.

## API 컨트롤러 경로 비교

아래 경로는 컨트롤러 기준이며 공통 전역 prefix인 `/api/v1`은 표에서 생략했다. `:id`처럼 매개변수 이름이 다른 경우에도 경로 형태가 같으면 공통 경로로 표시했다. Admin API는 일부 관리 요청을 Service API의 `/internal/*` 경로로 중계한다.

| 영역 | Admin API | Service API | 비교 |
|---|---|---|---|
| 인증 공통 | `GET /auth/policy`, `/auth/me`; `POST /auth/login`, `/auth/login/2fa`, `/auth/logout`, `/auth/refresh`, `/auth/register`, `/auth/unregister`, `/auth/account/find`, `/auth/phone/verify`, `/auth/email/challenge`, `/auth/email/verify`, `/auth/password/reset/challenge`, `/auth/password/reset`, `/auth/password/change`, `/auth/2fa/setup`, `/auth/2fa/enable`, `/auth/2fa/disable` | 동일한 경로·메서드 | 경로를 공통으로 제공한다. 요청·응답과 정책이 다른 항목은 아래 설명 참고 |
| OAuth | `GET /auth/oauth/providers`, `/auth/oauth/:providerId`, `/auth/oauth/:providerId/callback` | 동일 | OAuth 경로 동일 |
| Health | `GET /health/live`, `/health/ready` | 동일 | `live`는 프로세스 상태, `ready`는 DB·Redis 연결 확인 |
| 고객지원 공통 | `GET /support/rooms`, `/support/rooms/:roomId`, `/support/rooms/:roomId/messages`; `POST /support/rooms/:roomId/messages`; `PATCH /support/rooms/:roomId` | 동일 | Service의 내부 상담 API를 Admin이 중계 |
| 고객지원 전용 | `GET /support/rooms/pii`, `/support/rooms/:roomId/messages/pii` | `POST /support/rooms`, `SSE /support/rooms/:roomId/events` | 원문 열람은 Admin, 방 생성·실시간 이벤트는 Service |
| FAQ | `GET /faqs`, `POST /faqs`, `PATCH /faqs/:id`, `DELETE /faqs/:id` | `GET /faqs`, `GET /faqs/:faqId` | Admin은 관리, Service는 공개 조회. Admin 관리 요청은 `/internal/faqs`로 중계 |
| Q&A | `GET /qna`, `/qna/:id`; `PATCH /qna/:id`; `DELETE /qna/:id` | 동일 및 `POST /qna` | Service 고객이 질문을 작성하고 Admin이 답변·관리 |
| 서비스 약관 | `/service-terms`: 목록·생성·수정·게시·삭제 및 그룹 조회·생성·수정·삭제 | `/service-terms`: 목록·상세 조회 및 동의 조회·등록 | Admin은 관리, Service는 공개 약관·동의. Admin 관리 요청은 `/internal/service-terms`로 중계 |
| 운영자 약관 | `/operator-terms`: 약관·그룹 조회와 생성·수정·삭제, 게시, 동의·동의 이력 조회 및 동의 등록 | 해당 컨트롤러 없음 | Admin 전용 |
| 고객·멤버십 | `/customers`의 목록·상세·PII·차단·삭제·역할·메모·세션 관리; `/memberships`의 목록·권한·생성·수정·삭제 | 공개 고객 프로필 경로 없음; 머신 인증 내부 경로 `/internal/customers/*`로 관리 기능 제공 | Admin 공개 경로가 Service 내부 API를 호출 |
| 운영자·RBAC | `/operators`, `/roles`, `/permissions`의 목록·상세·생성·수정·삭제 및 운영자 차단·복구·역할·2FA 관리 | 해당 컨트롤러 없음 | Admin 전용 |
| 로그 | `GET /logs`, `/logs/stats` | 해당 컨트롤러 없음 | Admin 전용 |
| 시스템·서비스 설정 | `GET/PATCH /system-config`; `/system-config/test-email`; `/service-config`, `/service-config/holidays` 및 테스트·동기화 경로 | 공개 설정 `GET /service-configs`; 머신 인증 `/internal/system-configs`의 조회·수정·동기화·아이콘 경로 | Service가 설정 원장을 소유하고 Admin이 관리 요청을 중계 |
| OAuth 아이콘 | 공개 업로드·조회 `PUT/GET /uploads/oauth-icons/:filename`; 설정용 presigned URL 요청 | 내부 머신 API `/internal/system-configs/oauth-icons/*` | 실제 아이콘 파일 저장·조회는 Service가 담당 |

공통 메서드·경로 형태는 총 33개다. `POST /auth/account/find`는 두 앱 모두 `{ name, phoneNumber }`를 받고 `{ items: [{ maskedEmail, provider }] }`를 반환한다. 가입은 두 앱에 같은 입력·응답 계약을 제공하지만 허용 여부와 기본 역할이 다르다. 탈퇴는 로그인한 사용자 본인 요청이며 양쪽 모두 기본 허용이다.

인증 경로가 같아도 정책 응답과 가입 정책은 앱별로 다르다. `/auth/policy`는 Admin에서만 `emailVerificationRequired`를 반환한다. Service도 이메일 인증 정책을 사용하지만 해당 값은 정책 응답에 포함하지 않는다. 비밀번호 재설정 요청은 두 앱 모두 `{ email, phoneNumber }`를 받고 `{ accepted: true }`를 반환하며, 완료 요청은 `{ challengeId, token, newPassword }`를 받고 `{ ok: true }`를 반환한다. 이메일 인증 메일 요청은 두 앱 모두 `{ email }`을 받고 `{ accepted: true }`를 반환한다. 계정이 없거나 대상이 아니면 challenge를 만들지 않으며, 메일 설정·발송 실패는 오류로 반환한다. 내부 Service 경로는 머신 인증용이며 일반 Service 사용자 API와 구분된다.

계정 찾기, 이메일 인증, 비밀번호 경로는 `/auth/account`, `/auth/email`, `/auth/password` 아래에서 기능별로 구분한다. `POST /auth/email/challenge`는 인증 메일 요청, `POST /auth/email/verify`는 이메일 인증 완료다. `POST /auth/password/reset/challenge`는 비밀번호 재설정 메일 요청, `POST /auth/password/reset`는 토큰과 새 비밀번호 제출, `POST /auth/password/change`는 로그인 사용자의 비밀번호 변경이다. Admin과 Service 모두 별도 토큰 확인 경로 없이 재설정 제출 시 토큰을 검증한다. 가입은 `allowRegistration`과 `allowCredentialRegistration`으로 제어하고, 탈퇴는 `allowUnregistration`으로 제어한다. 현재 두 앱 모두 탈퇴를 허용한다.

## 이메일 인증·비밀번호 재설정 흐름

| 기능 | Admin | Service |
|---|---|---|
| 이메일 인증 요청 | 정책 확인 → 메일 설정 확인 → 미인증·미삭제 계정 조회 → challenge 저장 → 발송 | 정책 확인 → 메일 설정 확인 → 미인증·미삭제 계정 조회 → challenge 저장 → 발송 |
| 비밀번호 재설정 요청 | 메일 설정 확인 → 이메일·전화번호와 비밀번호 계정 검사 → challenge 저장 → 발송 | 메일 설정 확인 → 이메일·전화번호와 비밀번호 계정 검사 → challenge 저장 → 발송 |
| challenge 저장 | `userId`, `emailHash`, `token`, 유효기간 15분 | `userId`, `emailHash`, `token`, 유효기간 15분 |
| 메일 발송 실패 | challenge 삭제 후 오류 반환 | challenge 삭제 후 오류 반환 |
| 이메일 인증 완료 | token·계정·이메일 검사 → challenge 원자적 소비 → 인증 상태 DB 반영 | token·계정·이메일 검사 → challenge 원자적 소비 → 인증 상태 DB 반영 |
| 비밀번호 재설정 완료 | token·계정·이메일·비밀번호 정책 검사 → challenge 원자적 소비 → 비밀번호·잠금 상태 DB 반영 | token·계정·이메일·비밀번호 정책 검사 → challenge 원자적 소비 → 비밀번호·잠금 상태 DB 반영 |
| 검증 실패·만료·재사용 | 완료 처리 거절 | 완료 처리 거절 |

## 인증 코드 구현 차이

아래는 경로 이름만 대조한 결과가 아니라 현재 API·웹 소스의 요청 처리와 상태 반영을 비교한 결과다.

| 기능 | Admin | Service | 실제 차이 |
|---|---|---|---|
| 가입 | 공개 가입 API는 있지만 `allowRegistration`과 `allowCredentialRegistration`이 모두 `false`. 가입 처리 역할은 `admin` | 공개 가입 화면/API가 있고 두 정책이 `true`. 기본 가입 역할은 `member` | Admin은 셀프 가입을 거절하고 운영자가 운영자 관리 기능으로 계정을 만든다. Service는 회원가입 화면에서 가입한다. |
| 이메일 인증 정책 | `requireEmailVerification: false`; `/auth/policy`에 `emailVerificationRequired`를 반환 | `requireEmailVerification: true`; 로그인에서 미인증 계정을 거절하지만 `/auth/policy`에는 해당 값을 반환하지 않음 | 정책 값과 웹이 이를 읽는 위치가 다르다. |
| 비밀번호 만료 로그인 | 로그인 성공 뒤 `/me.passwordExpired`를 반환하고 보호 라우트가 `/onboarding/change-password`로 이동 | 로그인 성공 뒤 `/me.passwordExpired`를 반환하고 보호 라우트가 `/onboarding/change-password`로 이동 | Service 흐름으로 맞췄다. |
| 계정 찾기 처리 | `AuthController`가 `AccountRecoveryService.findIds()` 직접 호출 | `FindIdCommand` → `FindIdHandler` | 입력 `{ name, phoneNumber }`과 응답 `{ items: [{ maskedEmail, provider }] }`은 같고 실행 계층이 다르다. |
| 이메일·비밀번호 챌린지 처리 | 요청·저장·메일 URL·검증을 `AccountRecoveryService`가 맡고 컨트롤러가 직접 호출 | CQRS 핸들러가 처리하며 주입형 인증 서비스 없이 helper 함수로 이메일 챌린지를 저장·발송 | Service는 템플릿처럼 별도 인증 서비스 객체 없이 핸들러 흐름으로 실행한다. |
| 가입 이메일 발송 실패 | 계정 생성 뒤 메일 실패를 잡아 `verificationEmailSent: false`로 응답 | 계정 생성 뒤 메일 실패를 잡아 `verificationEmailSent: false`로 응답 | 양쪽 등록 처리 모두 메일 발송 실패만으로 가입 트랜잭션을 되돌리지는 않는다. 별도 challenge 요청의 메일 오류 처리는 위 흐름 표 참고. |
| `/me` 응답 | `emailVerified`, `roleLabel`, `hasPassword`, `passwordUpdatedAt` 포함. 전화번호는 required nullable | Admin과 같은 필드·required 조건 | Service의 응답 DTO를 Admin 기준으로 맞췄다. Service에도 이미 `roleCode`와 `permissions`가 있었고, 이번에 `roleLabel`을 추가했다. |
| 비밀번호 정책 코드 | 규칙 위반별 한국어 오류 메시지를 직접 지정. 만료 계산은 `/me`·보호 라우트 흐름에서 사용 | 같은 길이·숫자·대문자·특수문자 규칙을 검사하지만 메시지 생략. 만료 계산은 `/me`·보호 라우트 흐름에서 사용 | 만료 처리 시점은 같고, 비밀번호 정책 오류 메시지 구현은 다르다. |
| 2FA 생성·활성화·해제 HTTP 상태 | 세 POST 모두 `@HttpCode(200)` | 세 POST 모두 `@HttpCode(200)` | 실제 상태 코드와 OpenAPI 문서를 Admin과 같이 맞췄다. |
| 2FA 사용 정책 검사 | setup·enable 핸들러에서 설정 조건을 각각 검사 | 두 핸들러가 `assertTwoFactorEnabled()`를 공유 | 결과는 같고 내부 함수 구성이 다르다. 두 설정은 현재 `enabled: true`, `required: false`. |
| 2FA 화면 | 온보딩 전체 화면, 프로필 설정 모달 | Admin과 같은 온보딩 화면·프로필 모달 흐름 | Service의 온보딩과 프로필을 Admin 화면 흐름으로 맞췄다. |
| 2FA 로그인 화면 | 전체 화면 폼·안내 UI를 직접 구성 | Admin과 같은 전체 화면 폼·안내 UI | 화면 구성을 Admin 기준으로 맞췄다. |
| 이메일 인증 화면 | 토큰 완료와 인증 메일 재요청 폼 제공 | Admin과 같이 토큰 완료와 인증 메일 재요청 폼 제공 | Service 공개 화면에도 재요청 폼을 제공한다. |
| 전역 세션 복원 | `__root.tsx`에서 `/`, `/login/2fa`, `/find-account`, `/reset-password`, `/verify-email`은 `/me` 복원을 건너뜀 | 같은 공개 경로 제외 목록 없이 모든 경로에서 refresh 후 `/me` 조회 | 공개 페이지 진입 때 Service는 복원 요청을 더 수행한다. |
| 로그인·OAuth callback 기본값 | 로그인 후 보호 경로 기본값 `/profile`; OAuth 콜백도 `/profile` | 기본값 `/`; OAuth 콜백도 `/` | 기본 도착 화면이 다르다. |
| 전화번호 중복 검사 | 현재 사용자를 제외하고 중복 번호 조회 | Admin과 같은 제외 조건으로 중복 번호 조회 | Service 조회 조건을 Admin 기준으로 맞췄다. |
| 영구 차단 판정 | `banned === true`이고 만료일이 없으면 영구 차단으로 판정 | Admin과 같은 `banned`·만료일 판정 | 영구 차단 계정 판정을 Admin 기준으로 맞췄다. |
| 비밀번호 이력 ORM 매핑 | `Account.passwordHistory`를 `json`으로 선언 | 같은 필드를 `array`로 선언 | 필드 선언이 다르다. 양쪽 비밀번호 변경 로직은 실제 이력을 `metadata.passwordHistory`에서 다룬다. |

## 소스 파일 짝 비교

파일 상태는 `apps/*-api/src/modules`, 웹 `src/routes`, 엔티티와 인증 기반 디렉터리의 실제 소스를 기준으로 비교한다. 경로가 다르지만 DTO 이름이 대응하는 경우에는 기능상 짝을 별도로 표시한다.

| 비교 위치 | Admin에만 있는 파일·폴더 | Service에만 있는 파일·폴더 | 대응 상태 |
|---|---|---|---|
| 인증 애플리케이션 파일 | `auth/account-recovery.service.ts`; `auth/oauth-provider.config.ts`; `auth/oauth-provider-validation.ts` | `auth/email-verification.helper.ts`; `commands/find-id.command.ts`; `handlers/find-id.handler.ts`; `commands/password-recovery.command.ts`; `handlers/password-recovery.handler.ts`; `commands/verify-email.command.ts` | Admin은 AccountRecoveryService를 사용한다. Service는 CQRS 핸들러가 흐름을 처리하고 이메일 기능은 주입형 서비스 없이 helper 함수로 실행한다. Service의 OAuth 검증 코드는 `modules/system-configs/oauth-provider-validation.ts`에 있다. |
| 인증 DTO | `auth/interfaces/*` | `auth/dto/*` | 로그인·me·정책·OAuth·2FA·전화번호 인증의 대응 DTO가 있다. 폴더 이름만 다르다고 누락된 기능은 아니다. 실제 필드 차이는 위 `/me` 행 참고. |
| 인증 공통 기반 | 대응 경로 27개 중 `user/user-auth.guard.ts`만 내용이 다름 | 동일 | Guard의 차이는 현재 검증 기준 변수명(`identityVerified` / `phoneNumberVerified`)이다. 나머지 JWT·세션·머신 인증 파일은 동일하다. |
| API 공통 코드 | `common` 아래 60개 파일 | `common` 아래 동일한 60개 파일 | 파일 내용이 모두 동일하다. `common/guards` 3개와 `common/decorators` 12개도 동일하다. |
| API 기능 모듈 | `memberships`, `operators`, `permissions`, `roles`, `logs`, `terms` | `internal` | Admin 쪽은 관리 API, Service 쪽은 고객·FAQ·약관 등의 내부 API를 소유한다. Admin 컨트롤러가 관리 요청을 내부 API로 중계하는 기능은 API 경로 표에 적었다. |
| API 비즈니스 엔티티 | 별도 Admin FAQ·Q&A·Support·Upload 엔티티 없음 | `faqs/faq.entity.ts`, `qna/qna.entity.ts`, `support/*`, `uploads/upload.entity.ts` | Service가 해당 데이터의 저장 엔티티를 갖고 Admin은 업무 화면/중계 API를 제공한다. |
| 공개 웹 라우트 | `_public/_global/index.tsx` | `_public/_global/register.tsx`; `_public/_app/faq/*`; `_public/_app/service-terms/*`; 공개 locale 홈 파일 | Service에 가입·공개 FAQ·서비스 약관 화면이 있고 Admin에는 공개 가입 화면이 없다. |
| 보호 웹 라우트 | 운영자·역할·멤버십·로그·시스템·약관·고객 관리 화면 다수 | 대응 관리자 화면 없음. `profile`, `qna`, `support`는 양쪽에 있음 | Admin 전용 관리 화면 파일과 Service 사용자 화면 파일이 구분된다. Service는 유지보수·운영 공지 컴포넌트를 둔다. |
| 약관 UI 파일 | 약관 상세 모달, 프로필 동의 이력·상세·약관 탭 | 대응 파일 없음 | Admin 프로필은 이력·상세 관리를 포함한다. 온보딩 공용 레이아웃과 필수 동의 가드는 양쪽에 있다. |
| 앱 엔티티 파일 | Admin 운영자·운영자 약관 엔티티와 앱별 시스템 설정 | Service FAQ·Q&A·지원·업로드 엔티티와 서비스 약관 | 업무 데이터 소유에 따른 앱별 파일이다. 공통 User·Account·Role·SystemConfig의 일부 선언 차이는 위 표 참고. |
| DB 마이그레이션·시더 | Admin OAuth/운영자 초기 데이터와 Admin 개인정보 이동 마이그레이션 | Service 사용자/FAQ/서비스 약관 시더와 Profile 개인정보 초기화 마이그레이션 | 앱마다 스키마와 초기 데이터가 달라 파일이 서로 대응하지 않는 부분이다. |

동일 상대 경로를 기준으로는 API 모듈 파일이 Admin 256개, Service 172개이며, 58개 경로가 겹친다. 겹친 경로 중 53개는 파일 내용이 다르고 5개는 동일하다. 웹 라우트는 Admin 79개, Service 32개이며, 상대 경로가 겹치는 21개 중 15개 내용이 다르고 6개가 동일하다. 이 개수는 이름이 바뀐 파일이나 다른 폴더의 대체 구현을 자동으로 같은 파일로 세지 않는다. 따라서 한쪽 경로에 파일이 없다는 사실과 기능 자체가 없다는 결론은 구분하고 위 표에서 대체 구현 위치를 함께 적었다.

## 인증 및 접근 흐름

| 기능 | Admin | Service |
|---|---|---|
| 로그인 경로 | `/_public/_global/login` | `/_public/_global/login` |
| 계정 복구 화면 | `/find-account`에서 아이디 찾기·비밀번호 재설정 요청 | `/find-account`에서 아이디 찾기·비밀번호 재설정 요청 |
| 인증 화면 파일 배치 | `_public/_global` 아래 단일 파일. 로그인은 `login.tsx`, `login.index.tsx`, `login.2fa.tsx` | `_public/_global` 아래 단일 파일. 로그인은 `login.tsx`, `login.index.tsx`, `login.2fa.tsx` |
| 본인인증 온보딩 경로 | `/onboarding/phone-number-verification` | `/onboarding/phone-number-verification` |
| 2FA 온보딩 경로 | `/onboarding/2fa` | `/onboarding/2fa` |
| 2FA 로그인 | 등록된 2FA challenge를 `/login/2fa`에서 검증 | 등록된 2FA challenge를 `/login/2fa`에서 검증 |
| 보호 라우트 | `/_protected`에서 사용자 인증 및 필수 절차 판정 | `/_protected`에서 사용자 인증 및 필수 절차 판정 |
| 앱 화면 / 공용 화면 | 앱 화면은 `/_protected/_app`, 온보딩은 `/_protected/_global/onboarding/*` | 앱 화면은 `/_protected/_app`, 온보딩은 `/_protected/_global/onboarding/*` |
| 필수 접근 순서 | 필수 약관 → 정책상 필요한 본인인증 → 정책상 필요한 2FA → 만료 비밀번호 변경 | 필수 약관 → 정책상 필요한 본인인증 → 정책상 필요한 2FA → 만료 비밀번호 변경 |
| 약관 기준 | 운영자 약관 동의 여부 | 서비스 약관 동의 여부 |
| 약관 미동의 시 현재 단계 | 약관 온보딩에 머물고 다음 조건을 검사하지 않음 | 약관 온보딩에 머물고 다음 조건을 검사하지 않음 |
| 보호 가드의 약관 조회 캐시 | QueryClient 기본 `staleTime: 0` 사용 | QueryClient 기본 `staleTime: 0` 사용 |
| 보호 가드의 약관·정책 조회 실패 | 라우트 오류 화면 표시 | 라우트 오류 화면 표시 |
| 본인인증 요구 조건 | `/auth/policy`의 `phoneNumberVerificationRequired`와 `/me`의 `phoneNumberVerified` | `/auth/policy`의 `phoneNumberVerificationRequired`와 `/me`의 `phoneNumberVerified` |
| 2FA 기준 | `/auth/policy`의 `twoFactorRequired`와 `/me`의 `twoFactorEnabled` | `/auth/policy`의 `twoFactorRequired`와 `/me`의 `twoFactorEnabled` |
| 로그인·온보딩 완료 후 목적지 | 요청 callback, 기본 `/profile` | 요청 callback, 기본 `/` |
| 접근 판정 코드 | `apps/admin-web/src/routes/_protected/route.tsx` | `apps/service-web/src/routes/_protected/route.tsx` |
| 본인인증 온보딩 진입 검사 | 상위 보호 가드가 진입 여부와 이미 완료된 온보딩의 이탈을 판정 | 상위 보호 가드가 진입 여부와 이미 완료된 온보딩의 이탈을 판정 |
| PortOne 복귀 결과 처리 | 온보딩·프로필의 `useEffect`에서 서버 검증. 오류 코드가 있으면 검증하지 않음 | 온보딩·프로필의 `useEffect`에서 서버 검증. 오류 코드가 있으면 검증하지 않음 |
| 본인인증 서버 API 경로 | `/auth/phone/verify` | `/auth/phone/verify` |
| 웹 클라이언트의 본인인증 요청 경로 | `POST /api/v1/auth/phone/verify` | `POST /api/v1/auth/phone/verify` |
| 본인인증 컨트롤러 메서드 | `AuthController.verifyPhoneNumber` | `AuthController.verifyPhoneNumber` |
| 웹 클라이언트의 본인인증 훅 | `useAuthControllerVerifyPhoneNumberV1` | `useAuthControllerVerifyPhoneNumberV1` |
| 전화번호 인증 DTO | `VerifyPhoneNumberRequestDto`, `VerifyPhoneNumberResponseDto` | `VerifyPhoneNumberRequestDto`, `VerifyPhoneNumberResponseDto` |
| PortOne 요청 ID | SDK 규격 `identityVerificationId` | SDK 규격 `identityVerificationId` |
| 정책 API 생성 타입 | `phoneNumberVerificationRequired`, `twoFactorRequired` | `phoneNumberVerificationRequired`, `twoFactorRequired` |
| 본인인증 온보딩 완료 후 상태 반영 | `phoneNumberVerified`를 Query cache에 반영하고 `/me` 재조회 | `phoneNumberVerified`를 Query cache에 반영하고 `/me` 재조회 |
| 본인인증 완료 후 다음 경로 결정 | `router.invalidate()`로 보호 가드를 다시 실행해 남은 필수 단계 또는 callback을 결정 | `router.invalidate()`로 보호 가드를 다시 실행해 남은 필수 단계 또는 callback을 결정 |
| `/me` 본인인증 상태 필드 | `phoneNumberVerified` | `phoneNumberVerified` |
| 프로필 본인인증 | PortOne 본인인증·전화번호 변경, 인증 결과 검색 파라미터 처리 | PortOne 본인인증·전화번호 변경, 인증 결과 검색 파라미터 처리 |
| 프로필 본인인증 완료 후 상태 반영 | `/me` 재조회 후 사용자 정보·보호 가드 갱신 | `/me` 재조회 후 사용자 정보·보호 가드 갱신 |
| PortOne 오류·취소 처리 | 오류 코드가 있으면 검증하지 않음. 취소는 오류 표시 없이 종료, 실패는 안내 표시. 결과 파라미터는 URL에 유지 | 오류 코드가 있으면 검증하지 않음. 취소는 오류 표시 없이 종료, 실패는 안내 표시. 결과 파라미터는 URL에 유지 |
| 로그인 오류 검색 파라미터 | URL의 `error`를 직접 읽어 안내 표시. `callback` 유지 | URL의 `error`를 직접 읽어 안내 표시. `callback` 유지 |
| 프로필 이동용 `callback` | 없음 | 없음 |
| 인증 검색 파라미터 | 로그인 `callback`, `error`; 온보딩 `callback`; PortOne `identityVerificationId`, `code`, `message`; 인증 링크 `challengeId`, `token` | 로그인 `callback`, `error`; 온보딩 `callback`; PortOne `identityVerificationId`, `code`, `message`; 인증 링크 `challengeId`, `token` |
| PortOne 결과 URL 정리용 이동 | 없음. 결과 검색 파라미터 유지 | 없음. 결과 검색 파라미터 유지 |
| 웹 OAuth 전용 콜백 라우트 | 없음 | 없음 |
| OAuth 공급자 설정 저장·조회 | 자체 DB의 `SystemConfig(code: oauth)`에서 공급자 설정 조회 | 자체 DB의 `SystemConfig(code: oauth)`에서 공급자 설정 조회 |
| OAuth 공급자 활성 조건 | `enabled: true`이고 공급자 설정 검증을 통과한 경우 로그인 제공 | `enabled: true`이고 공급자 설정 검증을 통과한 경우 로그인 제공 |
| OAuth 초기 공급자 설정 | 빈 객체 `{}`. 등록된 공급자 없음 | Google·Kakao·Naver 설정. 모두 비활성 |
| OAuth 설정 시딩 | 기존 설정을 그대로 유지하고, 없으면 초기 설정 생성 | 기존 설정을 유지하면서 누락된 기본값을 병합하고, 없으면 초기 설정 생성 |
| 외부 공개 웹 주소 설정 | `APP_BASE_URL` | `APP_BASE_URL` |
| 웹 서버의 API 연결 주소 설정 | `API_BASE_URL` | `API_BASE_URL` |
| API의 공개 주소 필수 여부 | `APP_BASE_URL` 필수. 누락·잘못된 URL이면 시작 실패 | `APP_BASE_URL` 필수. 누락·잘못된 URL이면 시작 실패 |
| 운영 배포의 공개 주소 입력 | `ADMIN_WEB_URL`을 API 컨테이너의 `APP_BASE_URL`로 전달 | `SERVICE_WEB_URL`을 API 컨테이너의 `APP_BASE_URL`로 전달 |
| 자체 E2E의 Playwright `baseURL` | `APP_BASE_URL` (Playwright 프로세스; 미설정 시 `http://localhost:13000`) | `APP_BASE_URL` (Playwright 프로세스; 미설정 시 `http://localhost:3000`) |
| 앱 간 E2E 주소 | `ADMIN_WEB_URL` + `SERVICE_WEB_URL`. 테스트 스위트는 `admin-web`에서 실행 | 동일한 앱 간 테스트에서 `ADMIN_WEB_URL` + `SERVICE_WEB_URL`로 service 화면/API에 접근 |
| OAuth 계정 연결·가입 | 검증된 이메일로 기존 계정 연결. 가입 정책에 따라 신규 계정 생성 | 검증된 이메일로 기존 계정 연결. 가입 정책에 따라 신규 계정 생성 |
| OAuth 신규 가입 정책 | `allowRegistration: false`. 신규 가입 비활성 | `allowRegistration: true`. 신규 가입 활성 |
| OAuth 신규 계정 역할 | `oauthDefaultRoleCode` 미지정. 가입 허용 시 역할 지정 필요 | `oauthDefaultRoleCode: member` |
| OAuth의 기존 2FA 사용자 | 2FA가 적용된 계정은 이메일·비밀번호 로그인으로 안내 | 2FA가 적용된 계정은 이메일·비밀번호 로그인으로 안내 |
| 서버 OAuth 콜백 | `/auth/oauth/:providerId/callback`에서 인증 후 웹으로 이동 | `/auth/oauth/:providerId/callback`에서 인증 후 웹으로 이동 |
| 전역 세션 복원 | 일부 공개 경로 제외, 전역 `beforeLoad`에서 복원하고 `context.user` 제공 | 공개 경로 포함, 전역 `beforeLoad`에서 복원하고 `context.user` 제공 |
| `/me` 사번·부서 필드 | 없음 | 없음 |

## 공통 기반 기능

| 기능 | Admin 현황 | Service 현황 |
|---|---|---|
| JWT 인증·권한 | 서명, issuer, audience, claim 검증 후 JWT의 roles·permissions로 권한 판정. issuer·audience는 `admin-api` | 서명, issuer, audience, claim 검증 후 JWT의 roles·permissions로 권한 판정. issuer·audience는 `service-api` |
| Session 인증 | 별도 Session 경로에서 DB role 조회 | 별도 Session 경로에서 DB role 조회 |
| 계정 상태 확인 | 계정 상태와 본인인증·2FA·비밀번호 만료 상태 확인 | 계정 상태와 본인인증·2FA·비밀번호 만료 상태 확인 |
| 2FA API | `/auth/2fa/setup`, `/auth/2fa/enable`, `/auth/2fa/disable`, `/auth/login/2fa` | `/auth/2fa/setup`, `/auth/2fa/enable`, `/auth/2fa/disable`, `/auth/login/2fa` |
| 개인정보 저장 | 이름·이메일·이미지·전화번호·CI/DI 해시는 `Profile` | 이름·이메일·이미지·전화번호·CI/DI 해시는 `Profile` |
| CI/DI 해시 필드 | `Profile.ciHash`, `Profile.diHash` | `Profile.ciHash`, `Profile.diHash` |
| 프로필 필드 | 이름·이메일·이미지·전화번호·전화번호 해시·CI/DI 해시 | 이름·이메일·이미지·전화번호·전화번호 해시·CI/DI 해시 |
| 웹 다국어 | 요청별 SSR 언어 컨텍스트, 언어 선택, 쿠키 저장, `html lang` 반영 | 요청별 SSR 언어 컨텍스트, 언어 선택, 쿠키 저장, `html lang` 반영 및 공개 화면 적용 |
| API 다국어 | 요청 언어 감지와 한·영 응답 리소스 | 요청 언어 감지와 한·영 응답 리소스 |
| HTTP 요청 로그 | LogEntry 엔티티와 요청 로깅 | LogEntry 엔티티와 요청 로깅 |
| 머신 인증 | JWT·API key 방식 지원. 앱 등록 방식은 JWT | JWT·API key 방식 지원. 앱 등록 방식은 JWT |
| 서버 간 HTTP | fetch·upload·download 클라이언트 사용 | fetch·upload·download 클라이언트 사용 |
| 머신 토큰 | shared payload 스키마와 TTL 사용 | shared payload 스키마와 TTL 사용 |
| 파일 저장·정적 제공 | StorageModule 및 정적 제공 등록 | StorageModule 및 정적 제공 등록 |
| 전송 어댑터 | 공통 전송 모듈 등록 | 공통 전송 모듈 등록 |
| 웹 공통 UI·상태 도구 | 폼, 날짜 입력, DataGrid, 대화상자, 레이아웃, 토큰·KV 저장소, SSE 사용 | 폼, 날짜 입력, DataGrid, 대화상자, 레이아웃, 토큰·KV 저장소, SSE 사용 |

## 앱별 구성

| 항목 | Admin | Service |
|---|---|---|
| 서비스 식별자 | `admin-api` | `service-api` |
| 권한 | 운영자 권한 목록 및 권한별 운영 메뉴 | 서비스 사용자 권한 목록 및 공개·사용자 메뉴 |
| 약관 기능 | 운영자 약관과 서비스 약관 관리 화면 | 서비스 약관 동의 화면 |
| 주요 관리 화면 경로 | `/operators`, `/roles`, `/memberships`, `/operator-terms` | 해당 관리 화면 없음 |
| 업무 화면 | 사용자·운영·시스템 관리 | 프로필·고객지원·서비스 이용 |
| 앱 레이아웃 | 권한에 따른 관리자 메뉴와 사이드바 | 공개 메뉴와 로그인 상태 기반 메뉴 |
| 다국어 업무 리소스 | 공통 리소스와 관리자 화면 문구 | 공통 리소스와 서비스 화면 문구 |
| 앱 설정 | Admin API 경로, 권한 타입, 쿼리 캐시 정책 | Service API 경로, 권한 타입, 쿼리 캐시 정책 |

## 앱별 운영 정책

| 정책 | Admin | Service |
|---|---|---|
| JWT issuer·audience | `admin-api` | `service-api` |
| KV 네임스페이스 | `SERVICE_ID` 기준 | `SERVICE_ID` 기준 |
| 데이터·업무 문구 | 관리자 업무 모델 및 문구 | 서비스 업무 모델 및 문구 |
