# Admin / Service 프론트 페어 전수 검토

검토일: 2026-10-07. 기준은 현재 작업 트리이며 서비스 credential OFF 및 직전 로그인 카드 수정이 포함된다.

## 범위와 검증

- admin-web / service-web의 수작업 TS, TSX, CSS, JSON 파일을 모두 목록화하고 같은 상대 경로의 파일을 비교했다. 생성된 routeTree는 목록에 포함하되 구현 차이 판단에서는 제외했다.
- 공통 컴포넌트, 폼, DataGrid, 인증·온보딩·프로필·약관, Q&A·상담, 스타일, 브라우저 API 연결, SSR 프록시, 설정, 테스트의 차이를 검토했다.
- 생성 API는 서로 다른 도메인 계약이므로 전체 동일성을 요구하지 않는다. 사용처 확인에 필요한 DTO·클라이언트와 admin 약관 이력 API를 추적했다. 생성 shadcn 컴포넌트는 별도로 전부 비교했다.
- template/react-starter-kit의 ScreenLayout과 로그인 화면은 참고했다. 템플릿에는 앱의 size 프리셋이 없고 ScreenSectionCard를 쓰므로 현재 앱의 최신 공통 규칙으로 간주하지 않았다.
- 공개 화면 6개(`/login`, `/find-account`, `/register`, `/reset-password`, `/verify-email`, `/`) × 두 앱 × 두 뷰포트(1280×800, 375×400)를 브라우저에서 확인했다. 작은 화면의 스크롤 영역과 헤더 경계를 추가 확인했다.
- 두 앱 `pnpm typecheck` 통과. 보호 화면과 외부 인증·메일·계정 변경 흐름은 정적 검토이며 실제 계정 변경은 수행하지 않았다. API/DB 전체 전수 검토나 모든 보호 화면의 시각 검증 완료를 의미하지 않는다.
- 검토 중 제품 코드 변경 없음. 직전 로그인 카드 수정과 credential OFF를 유지했다.

## 우선 수정할 동작 문제

### F01 — P1: 양쪽 계정 찾기 폼이 작은 화면에서 높이 0으로 축소됨 (브라우저 재현)

위치: 양쪽 `src/routes/_public/_global/find-account.tsx`.
375×400에서 카드 자체는 343×272이지만 입력 영역 `.scroll-y`의 clientHeight가 0이고 scrollHeight는 195이다. 상단 제목·탭·하단 버튼이 고정 공간을 모두 차지해 폼을 볼 수 없다. 스크롤 클래스가 있다는 사실만으로 사용성을 보장하지 않는다.
수정: 카드 내부에서 제목·탭·본문을 포함하는 스크롤 영역의 소유권을 다시 정하고, 짧은 화면에서도 입력과 제출에 접근 가능하게 한다. 양쪽 파일은 동일하므로 함께 수정한다.

### F02 — P1: 양쪽 이메일 인증·비밀번호 재설정 카드가 화면 제한을 넘음 (브라우저 재현)

위치: 양쪽 `src/routes/_public/_global/{verify-email,reset-password}.tsx`.
375×400에서 Content 제한 높이는 272px이지만 재설정 카드는 424.5px(하단 488.5px), 이메일 인증 카드는 381.25px(하단 445.25px)이다. 내부 스크롤 컨테이너가 없어 하단 입력/버튼/로그인 복귀 링크가 화면 밖으로 나간다. `ScreenLayout.Content`에 높이가 있어도 자식 Card가 `w-full`만 쓰면 카드 높이를 제한하지 못한다.
수정: 공통 크기를 채우는 Card와 제한된 내부 스크롤을 양쪽에 적용한다.

### F03 — P1: 서비스 모바일 헤더에서 로그인 링크가 화면 밖으로 나감 (브라우저 재현)

위치: service `src/components/layout/app-layout.tsx`.
375px 너비의 `/`에서 header의 로그인 링크 오른쪽 경계가 viewport 밖에 있다. 로고·4개 메뉴·언어·테마·로그인이 한 줄이며 모바일 메뉴 전환이 없다. admin은 모바일 메뉴 버튼과 드로어가 있다.
수정: 서비스 헤더에 모바일 메뉴/접힘 규칙을 추가한다. 관리자 사이드바를 복제할 필요는 없다.

### F04 — P2: 서비스 온보딩 2개 화면이 공통 OnboardingLayout을 우회함 (정적 확인)

위치: service `src/routes/_protected/_global/onboarding/{change-password,verify-phone}.tsx`.
admin은 OnboardingLayout으로 md 카드·제목·하단 액션·로그아웃 복귀를 제공한다. service의 두 화면은 내용 높이 Card를 직접 구성해 크기 규칙과 복귀 버튼을 놓친다. 약관·2FA 온보딩은 이미 양쪽 동일한 OnboardingLayout을 사용한다.
수정: 두 화면도 기존 OnboardingLayout을 사용하며 서비스 문구와 API를 유지한다.

### F05 — P2: admin 약관 동의 이력은 전체 최신 100건에서 현재 약관만 필터링함 (정적 확인)

위치: admin `src/routes/_protected/_app/profile/-components/agreement-history-modal.tsx:17` 및 `apps/admin-api/src/modules/terms/handlers/get-agreement-history.handler.ts`.
API는 현재 사용자 전체 이력을 cursor로 제공한다. UI는 첫 100건만 조회해 groupId로 필터링하며 다음 페이지를 읽지 않는다. 다른 약관 이력이 많으면 해당 약관의 과거 이력을 누락하거나 이력이 없다고 표시한다. service는 서버 groupId 필터와 cursor 더 보기를 사용한다.
수정: admin도 cursor를 끝까지 조회할 수 있게 하고, 필요한 경우 API에 groupId 필터를 추가한다. service 구현을 그대로 복사하면 현재 admin 계약과 맞지 않는다.

### F06 — P3: admin 약관 변경 후 동의 이력 invalidate 패턴이 다름 (계약 정렬 항목)

위치: admin `src/routes/_protected/_app/profile/-components/terms-tab.tsx:29`.
admin은 agreements만 invalidate하고 service는 agreements와 history 둘 다 invalidate한다. 다만 현재 router.tsx의 staleTime은 0이고 모달은 다시 마운트되므로 재오픈 시 refetch가 이루어진다. 따라서 이력의 영구 stale 장애로 분류하지 않는다. 캐시 갱신 계약을 맞출 항목이다.
수정: admin 성공 처리에도 해당 history query key invalidate를 추가한다.

### F07 — P2: admin Q&A·상담의 정렬 UI가 서버 정렬에 연결되지 않음 (정적 확인)

위치: admin `src/routes/_protected/_app/{qna,support}/index.tsx`, 양쪽 `src/components/data-grid/use-data-grid.ts`.
client:false이므로 manualSorting이 true인데, 두 admin 화면은 정렬을 끄지 않고 onSortingChange 및 sort/direction 요청도 없다. 헤더의 정렬 상태가 변해도 목록 순서는 바뀌지 않는다. service Q&A는 sorting을 요청에 연결하고, service 상담은 정렬을 명시적으로 비활성화한다.
수정: 지원하는 열을 서버 sort/direction에 연결하거나 지원하지 않는 정렬을 비활성화한다.

### F08 — P2: admin 본인인증 시작 단계에서 중복 실행을 막지 않음 (정적 확인)

위치: admin `src/routes/_protected/_global/onboarding/verify-phone.tsx`, `src/routes/_protected/_app/profile.tsx`.
PortOne 요청이 진행되는 동안에는 API 검증 mutation이 아직 pending이 아니다. 버튼은 검증 mutation만 보고 비활성화하므로 시작 요청을 반복 실행할 수 있다. service는 온보딩의 startVerification.isPending, 프로필의 isStarting을 함께 사용한다.
수정: 시작 단계부터 busy를 추적하고 검증 완료까지 액션을 잠근다. 실제 PortOne 요청은 실행하지 않았다.

### F09 — P2: admin 약관 온보딩의 로딩·실패 상태가 비어 있는 목록으로 표시됨 (정적 확인)

위치: admin `src/routes/_protected/_global/onboarding/agree-terms.tsx`.
terms.length===0만 검사해 로딩/실패 중에도 '확인할 약관이 없습니다'를 보여줄 수 있고, 진행 버튼은 query pending/error를 검사하지 않는다. service는 Skeleton·재시도·pending/error 시 제출 비활성화를 적용했다. API가 필수 약관을 보호하더라도 UI의 상태 표현과 재시도 경로는 맞춰야 한다.
수정: 성공한 빈 목록과 로딩/실패를 구분하고 FormSubmit을 사용한다.

## 공통 규칙·컴포넌트 차이

### F10 — P2: 회원가입·오류 화면 등에도 카드 크기 적용 누락이 남음

양쪽 `register.tsx`, `components/app/{router-error,router-not-found}.tsx`, admin 공개 홈, service maintenance는 Content가 md 영역을 만들지만 Card가 영역을 채우지 않는다. 오류/안내 화면에 동일 높이를 요구할지는 화면 정책으로 정할 수 있으나, 현재는 size API와 실제 카드 크기의 관계가 불일치한다.
브라우저에서 가입 불가 상태의 카드 높이는 admin 136px, service 162px였다. 로그인은 직전 수정 후 양쪽 448×500px으로 일치한다.

### F11 — P3: 공통 Modal의 onOpen 계약이 서로 다름

admin `src/components/modal/modal.tsx:31`은 onOpen을 지원하고 StrictMode effect 재실행 후 호출한다. service에는 prop 자체가 없고 프로필 2FA 모달이 useEffect로 직접 키를 생성한다. 현재 호출 경로가 둘 다 키를 생성하므로 현재 장애로 단정하지 않는다. 다만 동일 Modal API로 이식할 수 없는 실제 계약 차이다.
수정: 공통 계약을 정해 양쪽을 맞추고 2FA 호출처의 open 시점도 함께 검증한다.

### F12 — P3: 생성 shadcn Tabs와 Dialog의 기능/스타일 차이

동일 경로 생성 파일 22개 중 19개는 바이트 단위로 동일하고 dialog.tsx, tabs.tsx, index.ts가 다르다. admin에만 badge/calendar/popover/switch 4개가 있다(사용 화면 차이이므로 단순 누락으로 보지 않음).
- service Dialog는 DialogTrigger/ DialogClose를 export하지 않는다. 현재 공통 Modal은 해당 export를 사용하지 않는다.
- admin TabsTrigger에는 service에 있는 aria-disabled 스타일, vertical line 표시, dark active 스타일, inline icon 여백 일부가 없다. 단순 포맷 차이만 있는 파일은 아니다.
수정: 같은 생성 기준·로컬 수정 기준을 확인해 UI 원본을 정렬한다.

### F13 — P3: 서비스 CSS에 문서화된 anchor 유틸리티 2개가 없음

admin styles.css에는 anchor-name-* / anchor-position-* / anchor-name-field가 있고 service에는 anchor-name-field만 있다. 현재 service 폼은 anchor-name-field를 사용하므로 현재 폼 전체가 망가졌다고 볼 근거는 없다. 하지만 docs/frontend-css-utilities.md는 양쪽에서 wildcard 유틸리티를 제공한다고 설명해 다음 이식 시 동작이 달라진다.
수정: 공통 CSS 계약을 양쪽에 맞춘다.

### F14 — P3: 비밀번호 변경 모달의 필드 오류 처리 차이

service는 생성 AuthControllerChangePasswordV1Body 기반 검증과 ApplicationError.details의 필드 매핑을 한다. admin은 수작업 z.object 검증과 전역 오류 처리만 사용한다. 현재 비밀번호 오류 등의 필드 표시 경험이 다르다.
수정: API 계약은 앱별로 유지하고 생성 validator·필드 오류 처리 패턴을 맞춘다.

### F15 — P3: 로그인 카드의 크기 외 구조는 아직 다름

admin은 중앙 아이콘/제목, 스크롤 본문, 하단 제출·회원가입 액션과 Addon 복귀 링크를 쓴다. service는 CardHeader 제목과 한 스크롤 본문에 모든 내용을 넣고 Addon이 없다. 직전 수정은 카드 크기와 overflow만 맞췄다. OAuth 중심 로그인에서 하단 영역을 어떻게 구성할지는 별도 화면 기준으로 정해야 하며, 무조건 admin을 복제할 이유는 없다.

## 정상 차이와 일치 확인

- AppLayout 사이드바/서비스 공개 헤더, 브랜드 문구, 관리자 권한 필터, 공개 FAQ/서비스 약관, 점검·운영 안내, 문의 관리와 내 문의 기능은 역할 차이다. 모바일 사용성 문제(F03)는 별도다.
- 인증 정책의 registration/credential/oauth/email verification 값, /profile 대 / 기본 callback, API 도메인·DTO 이름·약관 ID 이름(id/termId), TOTP issuer는 역할 차이다. 현재 service credential OFF는 사용자 요청으로 적용된 값이다.
- Action의 admin protected context와 service root context는 service 공개 영역에서도 사용할 수 있는 차이다.
- 브라우저 Axios, token storage, password policy helper, hash tab, query config, 폼/그리드 대부분, ScreenLayout과 OnboardingLayout, SSR 프록시 두 파일은 일치한다.
- 로그인 2FA 화면의 차이는 policy·form ID·issuer/callback·queryClient 취득 방식이다. 기본 레이아웃은 같다.
- reset-password의 두 구현은 policy import를 제외하면 같다. verify-email의 엔드포인트 이름 차이는 각 API 계약과 대응한다.
- 프로필의 보안 점수 배지·문구·함수 추출 여부는 표시/구현 차이로 분류했다. 서비스에 없는 agreements query 선행 인증 조건은 보호 라우트의 온보딩 선검사가 있어 현재 장애로 단정하지 않았다.
- Q&A/상담의 페이지와 cursor 방식, 관리자 PII 조회/담당자 기능, 서비스 신규 문의/상담 액션은 API/역할 차이다. 정렬 연결 누락(F07)은 별도다.
- 테스트 파일의 계정/포트/경로/관리자 mutation 및 고객 workflow 차이는 목적에 따른 차이다. credential OFF에서는 기존 credential UI 로그인 기반 service E2E를 그대로 실행할 수 없다.
- vite의 admin 필수 PORT 대 service 3000 fallback은 환경 동작 차이로 기록하되 현재 기동 장애는 확인되지 않았다.
- docs/front-auth-implementation-comparison.md에는 현재 없는 core/isomorphic/auth.ts 및 core/server/auth.ts 경로와 이전 인증 흐름이 남아 있다. 현재 __root.tsx의 실제 흐름을 기준으로 문서를 갱신해야 한다.

## 검증 제한과 수정 순서

F01~F03은 실제 브라우저에서 재현했다. F04/F05/F07/F08/F09는 사용처·공통 hook·필요한 API 구현을 추적한 정적 문제다. F06/F10~F15는 규칙/계약 차이 또는 통일 여부를 결정할 항목이다. 정상 차이를 제거하는 일괄 복사는 권장하지 않는다.

먼저 작은 화면 접근성(F01~F03)과 공통 인증 카드·온보딩(F02/F04/F10)을 처리하고, 이력/정렬/인증 busy/로딩(F05/F07~F09)를 보완한 뒤 Modal·생성 UI·CSS·필드 오류 패턴(F11~F14)을 정렬한다.

## 전체 비교 목록

아래 목록은 파일 목록화 시점의 비교 결과다. 동일 파일은 바이트 단위 비교로 확인했으며, 차이 파일은 위의 역할 차이/동작 문제/계약 차이에 대응한다.

Admin 236개, Service 190개. 같은 상대 경로 172쌍: 동일 129쌍, 차이 43쌍. Admin 전용 64개, Service 전용 18개.

### 차이가 있는 대응 파일

- `e2e/apps-behavior.spec.ts`
- `e2e/auth.spec.ts`
- `e2e/rendering.spec.ts`
- `e2e/ssr-auth-isolation.spec.ts`
- `e2e/support.spec.ts`
- `package.json`
- `playwright.config.ts`
- `src/components/app/action.tsx`
- `src/components/app/brand-logo.tsx`
- `src/components/layout/app-layout.tsx`
- `src/components/modal/modal.tsx`
- `src/configs/app.config.ts`
- `src/core/locales/en/errors.json`
- `src/core/locales/en/index.ts`
- `src/core/locales/ko/errors.json`
- `src/core/locales/ko/index.ts`
- `src/routeTree.gen.ts`
- `src/routes/__root.tsx`
- `src/routes/_protected/_app/profile.tsx`
- `src/routes/_protected/_app/profile/-components/agreement-history-modal.tsx`
- `src/routes/_protected/_app/profile/-components/change-password-modal.tsx`
- `src/routes/_protected/_app/profile/-components/term-revision-history-modal.tsx`
- `src/routes/_protected/_app/profile/-components/terms-tab.tsx`
- `src/routes/_protected/_app/profile/-components/two-factor-setup-modal.tsx`
- `src/routes/_protected/_app/qna/index.tsx`
- `src/routes/_protected/_app/route.tsx`
- `src/routes/_protected/_app/support/index.tsx`
- `src/routes/_protected/_global/onboarding/-components/term-detail-modal.tsx`
- `src/routes/_protected/_global/onboarding/agree-terms.tsx`
- `src/routes/_protected/_global/onboarding/change-password.tsx`
- `src/routes/_protected/_global/onboarding/route.tsx`
- `src/routes/_protected/_global/onboarding/setup-2fa.tsx`
- `src/routes/_protected/_global/onboarding/verify-phone.tsx`
- `src/routes/_protected/route.tsx`
- `src/routes/_public/_global/login.2fa.tsx`
- `src/routes/_public/_global/login.index.tsx`
- `src/routes/_public/_global/register.tsx`
- `src/routes/_public/_global/reset-password.tsx`
- `src/routes/_public/_global/verify-email.tsx`
- `src/routes/_public/route.tsx`
- `src/styles/styles.css`
- `tsconfig.node.json`
- `vite.config.ts`

### Admin 전용 파일

- `e2e-integration/cross-app-responses.spec.ts`
- `e2e-integration/service-maintenance.spec.ts`
- `e2e/favicon-auth.spec.ts`
- `e2e/list-sorting.spec.ts`
- `e2e/machine-customers.spec.ts`
- `e2e/membership-management.spec.ts`
- `e2e/operator-role-management.spec.ts`
- `e2e/operator-term-options.spec.ts`
- `e2e/role-management.spec.ts`
- `playwright.service-settings.config.ts`
- `src/routes/_protected/_app/customers/-components/customer-detail-modal.tsx`
- `src/routes/_protected/_app/customers/-components/customer-memo-modal.tsx`
- `src/routes/_protected/_app/customers/-components/customer-role-modal.tsx`
- `src/routes/_protected/_app/customers/-components/customer-row-actions.tsx`
- `src/routes/_protected/_app/customers/-components/customer-sessions-modal.tsx`
- `src/routes/_protected/_app/customers/index.tsx`
- `src/routes/_protected/_app/faqs/-components/faq-editor-modal.tsx`
- `src/routes/_protected/_app/faqs/index.tsx`
- `src/routes/_protected/_app/logs/index.tsx`
- `src/routes/_protected/_app/memberships/-components/membership-editor-modal.tsx`
- `src/routes/_protected/_app/memberships/index.tsx`
- `src/routes/_protected/_app/operator-terms/-components/modals.tsx`
- `src/routes/_protected/_app/operator-terms/-components/publish-schedule.ts`
- `src/routes/_protected/_app/operator-terms/-components/term-group-list.tsx`
- `src/routes/_protected/_app/operator-terms/index.tsx`
- `src/routes/_protected/_app/operators/-components/change-operator-role-modal.tsx`
- `src/routes/_protected/_app/operators/-components/create-operator-modal.tsx`
- `src/routes/_protected/_app/operators/-components/operator-detail-modal.tsx`
- `src/routes/_protected/_app/operators/-components/operator-row-actions.tsx`
- `src/routes/_protected/_app/operators/index.tsx`
- `src/routes/_protected/_app/profile/-components/term-detail-modal.tsx`
- `src/routes/_protected/_app/qna/-components/qna-editor-modal.tsx`
- `src/routes/_protected/_app/roles/-components/role-editor-modal.tsx`
- `src/routes/_protected/_app/roles/index.tsx`
- `src/routes/_protected/_app/service-settings/-components/delivery-tab.tsx`
- `src/routes/_protected/_app/service-settings/-components/holiday-detail-modal.tsx`
- `src/routes/_protected/_app/service-settings/-components/inquiry-tab.tsx`
- `src/routes/_protected/_app/service-settings/-components/maintenance-tab.tsx`
- `src/routes/_protected/_app/service-settings/-components/oauth-provider-add-dialog.tsx`
- `src/routes/_protected/_app/service-settings/-components/oauth-provider-detail.tsx`
- `src/routes/_protected/_app/service-settings/-components/oauth-provider.types.ts`
- `src/routes/_protected/_app/service-settings/-components/oauth-tab.tsx`
- `src/routes/_protected/_app/service-settings/-components/operations-tab.tsx`
- `src/routes/_protected/_app/service-settings/-components/service-config-api.ts`
- `src/routes/_protected/_app/service-settings/-components/system-config-tabs.tsx`
- `src/routes/_protected/_app/service-settings/-components/webhook-tab.tsx`
- `src/routes/_protected/_app/service-settings/-configs/operations-columns.config.tsx`
- `src/routes/_protected/_app/service-settings/-constants/operations.ts`
- `src/routes/_protected/_app/service-settings/index.tsx`
- `src/routes/_protected/_app/service-terms/-components/publish-schedule.ts`
- `src/routes/_protected/_app/service-terms/-components/service-term-editor-modal.tsx`
- `src/routes/_protected/_app/service-terms/-components/service-term-group-editor-modal.tsx`
- `src/routes/_protected/_app/service-terms/-components/service-term-view-modal.tsx`
- `src/routes/_protected/_app/service-terms/-components/term-group-list.tsx`
- `src/routes/_protected/_app/service-terms/index.tsx`
- `src/routes/_protected/_app/support/-components/support-room-modal.tsx`
- `src/routes/_protected/_app/system-settings/-components/admin-email-settings-tab.tsx`
- `src/routes/_protected/_app/system-settings/-components/admin-email-test-card.tsx`
- `src/routes/_protected/_app/system-settings/-components/portone-identity-tool.tsx`
- `src/routes/_protected/_app/system-settings/-components/system-config-api.ts`
- `src/routes/_protected/_app/system-settings/-components/system-setting-tabs.tsx`
- `src/routes/_protected/_app/system-settings/index.tsx`
- `src/routes/_public/_global/{-$locale}/index.tsx`
- `src/routes/_public/_global/{-$locale}/route.tsx`

### Service 전용 파일

- `e2e/customer-content.spec.ts`
- `e2e/faq-grid-width.spec.ts`
- `e2e/faq-qna-auth.spec.ts`
- `e2e/qna-grid.spec.ts`
- `e2e/terms-options.spec.ts`
- `src/components/terms/reception-options.ts`
- `src/core/locales/en/service.json`
- `src/core/locales/ko/service.json`
- `src/routes/_protected/-components/maintenance.tsx`
- `src/routes/_protected/-components/operation-notice.tsx`
- `src/routes/_protected/_app/qna/-components/qna-create-modal.tsx`
- `src/routes/_protected/_app/qna/-components/qna-detail-modal.tsx`
- `src/routes/_protected/_app/support/-components/support-room-detail-modal.tsx`
- `src/routes/_public/_app/faq/index.tsx`
- `src/routes/_public/_app/route.tsx`
- `src/routes/_public/_app/service-terms/index.tsx`
- `src/routes/_public/_app/{-$locale}/index.tsx`
- `src/routes/_public/_app/{-$locale}/route.tsx`

