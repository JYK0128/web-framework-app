# Admin / Service 웹 차이 목록

Git 추적 파일의 현재 작업 트리를 같은 상대 경로로 비교했습니다. `.env`, 의존성, 빌드 산출물 등 추적하지 않는 파일은 제외했습니다. 생성 코드는 아래 집계로 구분했습니다. 다른 경로에서 같은 기능을 구현한 경우까지 자동으로 대응시키지는 않았습니다.

## 주요 구현 차이

| 파일 | 차이 |
|---|---|
| `src/components/modal/modal.tsx` | Admin만 `onOpen` 콜백을 effect에서 실행하며 StrictMode 재실행을 고려함 |
| `src/components/app/action.tsx` | Admin은 `/_protected`, Service는 `__root__`에서 사용자 컨텍스트 조회 |
| `src/components/app/brand-logo.tsx` | Admin만 collapsed 지원, 브랜드 문구 다름 |
| `src/lib/session.ts` | 세션·refresh 쿠키 이름만 다름 |
| `src/configs/app.config.ts` | 권한 타입과 갱신 주기 상수 다름 |
| `src/styles/styles.css` | Admin만 범용 anchor-position/anchor-name 유틸 보유, field 유틸 위치 다름 |
| `vite.config.ts` | Admin은 PORT 필수 검사, Service는 3000 기본값 사용 |
| 캐시 helper | Admin `cache-patcher.ts`, Service `entity-query-cache.ts`로 경로와 이름 다름 |

## 집계

| 구분 | 파일 수 |
|---|---|
| 같은 경로 · 내용 다름 | 45 |
| Admin에만 존재 | 66 |
| Service에만 존재 | 25 |
| 같은 내용 · 동일 경로 | 168 |
| 생성 코드 · 내용 다름 | 158 |
| 생성 코드 · Admin에만 존재 | 347 |
| 생성 코드 · Service에만 존재 | 71 |

## 같은 경로 · 내용 다름 (45)

```text
.env.example
e2e/apps-behavior.spec.ts
e2e/auth.spec.ts
e2e/rendering.spec.ts
e2e/ssr-auth-isolation.spec.ts
e2e/support.spec.ts
package.json
playwright.config.ts
src/components/app/action.tsx
src/components/app/brand-logo.tsx
src/components/layout/app-layout.tsx
src/components/modal/modal.tsx
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
src/routes/_protected/_global/onboarding/verify-phone.tsx
src/routes/_protected/route.tsx
src/routes/_public/_global/find-account.tsx
src/routes/_public/_global/login.2fa.tsx
src/routes/_public/_global/login.index.tsx
src/routes/_public/_global/register.tsx
src/routes/_public/_global/reset-password.tsx
src/routes/_public/_global/verify-email.tsx
src/routes/_public/route.tsx
src/styles/styles.css
tsconfig.node.json
vite.config.ts
```

## Admin에만 존재 (66)

```text
e2e-integration/cross-app-responses.spec.ts
e2e-integration/service-maintenance.spec.ts
e2e/favicon-auth.spec.ts
e2e/list-sorting.spec.ts
e2e/machine-customers.spec.ts
e2e/membership-management.spec.ts
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
src/routes/_protected/_app/profile/-components/term-detail-modal.tsx
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

## Service에만 존재 (25)

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
src/components/terms/reception-options.ts
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
