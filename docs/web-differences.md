# Admin / Service 웹 차이 목록

2026-10-09 현재 작업 트리 기준. Git 추적 파일과 ignore되지 않은 신규 파일을 포함하고 삭제된 파일은 제외했습니다. 생성 코드는 별도로 집계합니다. 같은 상대 경로를 비교하며, 정책·API 이름·앱 식별값·코드 형식 차이도 포함됩니다. 파일 차이가 곧 동작 차이를 의미하지 않습니다.

## 통일된 부분

- 로그인: CardHeader 제목, 입력만 스크롤, OAuth 고정, 아이콘 제거, 문구·버튼 스타일·홈 링크 통일. URL 오류 표시 effect 제거.
- 이메일 인증: 인증 값 누락 시 404, 메일 요청 폼 제거, 안내·레이아웃 통일.
- 회원가입·비밀번호 재설정·계정 찾기: 레이아웃과 공통 문구 통일.
- 프로필 비밀번호 변경: 생성 스키마 및 서버 필드 오류 처리 사용.
- 약관 이력: 그룹별 서버 조회, 전체 로딩된 이력 기준 빈 결과 판단, 옵션 라벨 코드 통일.
- 약관 상세: 해당 버전 ID로 API 조회.
- 프로필·온보딩: 공통 안내 문구 통일.
- PORT: 두 웹 모두 필수 검사. Vite 설정 파일 동일.

## 남은 차이 해석

- 공개 인증·온보딩·프로필의 대부분은 정책, 폼 ID, Admin/Service 인증 앱 이름, 기본 이동 경로, 생성 API·모델 이름 차이입니다.
- 세션: appName만 다릅니다.
- 앱 레이아웃: Admin 관리 메뉴와 Service 사용자 메뉴가 다릅니다. Service 앱 라우트에는 점검 화면 처리가 있습니다.
- Q&A·고객지원: 운영자 관리/답변과 사용자 작성/조회 역할이 다릅니다.
- 설정·번역·E2E: 앱별 환경, 의존성, 테스트 대상과 번역 항목 차이가 남습니다.

## 집계

| 구분 | 파일 수 |
|---|---|
| 같은 경로 · 내용 다름 | 39 |
| Admin에만 존재 | 66 |
| Service에만 존재 | 24 |
| 생성 코드 · 내용 다름 | 164 |
| 생성 코드 · Admin에만 존재 | 348 |
| 생성 코드 · Service에만 존재 | 69 |

## 같은 경로 · 내용 다름 (39)

```text
.env.example
e2e/apps-behavior.spec.ts
e2e/auth.spec.ts
e2e/rendering.spec.ts
e2e/ssr-auth-isolation.spec.ts
e2e/support.spec.ts
package.json
playwright.config.ts
src/components/app/brand-logo.tsx
src/components/layout/app-layout.tsx
src/configs/app.config.ts
src/core/locales/en/errors.json
src/core/locales/en/index.ts
src/core/locales/ko/errors.json
src/core/locales/ko/index.ts
src/lib/session.ts
src/routes/__root.tsx
src/routes/_protected/_app/profile.tsx
src/routes/_protected/_app/profile/-components/agreement-history-modal.tsx
src/routes/_protected/_app/profile/-components/change-password-modal.tsx
src/routes/_protected/_app/profile/-components/term-detail-modal.tsx
src/routes/_protected/_app/profile/-components/term-revision-history-modal.tsx
src/routes/_protected/_app/profile/-components/terms-tab.tsx
src/routes/_protected/_app/profile/-components/two-factor-setup-modal.tsx
src/routes/_protected/_app/qna/index.tsx
src/routes/_protected/_app/route.tsx
src/routes/_protected/_app/support/index.tsx
src/routes/_protected/_global/onboarding/-components/term-detail-modal.tsx
src/routes/_protected/_global/onboarding/agree-terms.tsx
src/routes/_protected/_global/onboarding/change-password.tsx
src/routes/_protected/_global/onboarding/route.tsx
src/routes/_protected/_global/onboarding/setup-2fa.tsx
src/routes/_protected/route.tsx
src/routes/_public/_global/login.2fa.tsx
src/routes/_public/_global/login.index.tsx
src/routes/_public/_global/register.tsx
src/routes/_public/_global/reset-password.tsx
src/routes/_public/route.tsx
tsconfig.node.json
```

## Admin에만 존재 (66)

```text
e2e-integration/cross-app-responses.spec.ts
e2e-integration/service-maintenance.spec.ts
e2e/favicon-auth.spec.ts
e2e/list-sorting.spec.ts
e2e/machine-customers.spec.ts
e2e/membership-management.spec.ts
e2e/onboarding-terms.spec.ts
e2e/operator-role-management.spec.ts
e2e/operator-term-options.spec.ts
e2e/role-management.spec.ts
playwright.service-settings.config.ts
src/lib/cache-patcher.ts
src/routes/_protected/_app/customers/-components/customer-detail-modal.tsx
src/routes/_protected/_app/customers/-components/customer-memo-modal.tsx
src/routes/_protected/_app/customers/-components/customer-role-modal.tsx
src/routes/_protected/_app/customers/-components/customer-row-actions.tsx
src/routes/_protected/_app/customers/-components/customer-sessions-modal.tsx
src/routes/_protected/_app/customers/index.tsx
src/routes/_protected/_app/faqs/-components/faq-editor-modal.tsx
src/routes/_protected/_app/faqs/index.tsx
src/routes/_protected/_app/logs/index.tsx
src/routes/_protected/_app/memberships/-components/membership-editor-modal.tsx
src/routes/_protected/_app/memberships/index.tsx
src/routes/_protected/_app/operator-terms/-components/modals.tsx
src/routes/_protected/_app/operator-terms/-components/publish-schedule.ts
src/routes/_protected/_app/operator-terms/-components/term-group-list.tsx
src/routes/_protected/_app/operator-terms/index.tsx
src/routes/_protected/_app/operators/-components/change-operator-role-modal.tsx
src/routes/_protected/_app/operators/-components/create-operator-modal.tsx
src/routes/_protected/_app/operators/-components/operator-detail-modal.tsx
src/routes/_protected/_app/operators/-components/operator-row-actions.tsx
src/routes/_protected/_app/operators/index.tsx
src/routes/_protected/_app/qna/-components/qna-editor-modal.tsx
src/routes/_protected/_app/roles/-components/role-editor-modal.tsx
src/routes/_protected/_app/roles/index.tsx
src/routes/_protected/_app/service-settings/-components/delivery-tab.tsx
src/routes/_protected/_app/service-settings/-components/holiday-detail-modal.tsx
src/routes/_protected/_app/service-settings/-components/inquiry-tab.tsx
src/routes/_protected/_app/service-settings/-components/maintenance-tab.tsx
src/routes/_protected/_app/service-settings/-components/oauth-provider-add-dialog.tsx
src/routes/_protected/_app/service-settings/-components/oauth-provider-detail.tsx
src/routes/_protected/_app/service-settings/-components/oauth-provider.types.ts
src/routes/_protected/_app/service-settings/-components/oauth-tab.tsx
src/routes/_protected/_app/service-settings/-components/operations-tab.tsx
src/routes/_protected/_app/service-settings/-components/service-config-api.ts
src/routes/_protected/_app/service-settings/-components/system-config-tabs.tsx
src/routes/_protected/_app/service-settings/-components/webhook-tab.tsx
src/routes/_protected/_app/service-settings/-configs/operations-columns.config.tsx
src/routes/_protected/_app/service-settings/-constants/operations.ts
src/routes/_protected/_app/service-settings/index.tsx
src/routes/_protected/_app/service-terms/-components/publish-schedule.ts
src/routes/_protected/_app/service-terms/-components/service-term-editor-modal.tsx
src/routes/_protected/_app/service-terms/-components/service-term-group-editor-modal.tsx
src/routes/_protected/_app/service-terms/-components/service-term-view-modal.tsx
src/routes/_protected/_app/service-terms/-components/term-group-list.tsx
src/routes/_protected/_app/service-terms/index.tsx
src/routes/_protected/_app/support/-components/support-room-modal.tsx
src/routes/_protected/_app/system-settings/-components/admin-email-settings-tab.tsx
src/routes/_protected/_app/system-settings/-components/admin-email-test-card.tsx
src/routes/_protected/_app/system-settings/-components/portone-identity-tool.tsx
src/routes/_protected/_app/system-settings/-components/system-config-api.ts
src/routes/_protected/_app/system-settings/-components/system-setting-tabs.tsx
src/routes/_protected/_app/system-settings/index.tsx
src/routes/_public/_app/.gitkeep
src/routes/_public/_global/{-$locale}/index.tsx
src/routes/_public/_global/{-$locale}/route.tsx
```

## Service에만 존재 (24)

```text
e2e/customer-content.spec.ts
e2e/faq-grid-width.spec.ts
e2e/faq-qna-auth.spec.ts
e2e/qna-grid.spec.ts
e2e/terms-options.spec.ts
public/oauth-icons/facebook.png
public/oauth-icons/google.png
public/oauth-icons/instagram.png
public/oauth-icons/kakao.png
public/oauth-icons/naver.png
public/oauth-icons/x.png
src/core/locales/en/service.json
src/core/locales/ko/service.json
src/lib/entity-query-cache.ts
src/routes/_protected/-components/maintenance.tsx
src/routes/_protected/-components/operation-notice.tsx
src/routes/_protected/_app/qna/-components/qna-create-modal.tsx
src/routes/_protected/_app/qna/-components/qna-detail-modal.tsx
src/routes/_protected/_app/support/-components/support-room-detail-modal.tsx
src/routes/_public/_app/faq/index.tsx
src/routes/_public/_app/route.tsx
src/routes/_public/_app/service-terms/index.tsx
src/routes/_public/_app/{-$locale}/index.tsx
src/routes/_public/_app/{-$locale}/route.tsx
```
