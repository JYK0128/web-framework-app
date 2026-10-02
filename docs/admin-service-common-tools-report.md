# Admin / Service 기능 현황 비교

비교 대상은 Admin과 Service다. 각 앱의 현재 인증·접근 흐름, 공통 기반 기능, 앱별 구성을 정리한다.

## 인증 및 접근 흐름

| 기능 | Admin | Service |
|---|---|---|
| 로그인 경로 | `/_public/_global/login` | `/_public/_global/login` |
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
| 본인인증 서버 API 경로 | `/auth/phone-number/verify` | `/auth/phone-number/verify` |
| 웹 클라이언트의 본인인증 요청 경로 | `POST /api/v1/auth/phone-number/verify` | `POST /api/v1/auth/phone-number/verify` |
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
| E2E 웹 주소 입력 | `ADMIN_WEB_URL`. 앱 간 테스트는 `SERVICE_WEB_URL`도 사용 | `SERVICE_WEB_URL` |
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
| 2FA API | `/auth/2fa/generate`, `/auth/2fa/enable`, `/auth/2fa/disable`, `/auth/login/2fa` | `/auth/2fa/generate`, `/auth/2fa/enable`, `/auth/2fa/disable`, `/auth/login/2fa` |
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
