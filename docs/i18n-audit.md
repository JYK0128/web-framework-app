# 웹 다국어 조사

기준: 현재 작업 트리의 Admin / Service 웹 TypeScript·TSX 정적 분석. 주석, 생성 코드, 번역 리소스는 한국어 문구 집계에서 제외했습니다. 문자열·템플릿 문자열·JSX 텍스트의 한국어 포함 여부를 집계했으며, 고유 문구 수나 번역 누락 확정 건수가 아닌 후보 위치 수입니다. 런타임에서 언어를 전환한 검증은 수행하지 않았습니다.

## 결과

| 앱 | 한국어 후보가 있는 파일 | 한국어 후보 위치 | 직접 t() 호출이 있는 파일 |
|---|---:|---:|---:|
| admin-web | 93 | 1400 | 1 |
| service-web | 49 | 463 | 3 |

## 확인 사항

- 두 웹 모두 ko/en 리소스, 언어 감지, useI18n 훅이 있습니다. 기본 언어는 en입니다.
- 직접 t() 호출은 Admin의 언어 선택기, Service의 언어 선택기·앱 레이아웃·홈에 집중되어 있습니다. 오류의 translate() 경로는 이 호출 집계와 별개입니다.
- 로그인·회원가입·계정 찾기·비밀번호 재설정·온보딩·프로필에서 제목, 입력 라벨, 검증 오류, 버튼 등이 한국어로 직접 작성되어 있습니다.
- 공통 DataGrid·폼·모달·테마·오류 화면도 한국어가 남아 있어 여러 화면에 반복 노출됩니다.
- app/core 번역 리소스가 존재하더라도 대응 컴포넌트가 번역 호출을 하지 않는 사례가 있습니다. 키의 존재만으로 화면 번역을 보장하지 않습니다.
- DateUtil의 locale이 ko-KR로 고정되고, 일부 화면은 toLocaleString(ko-KR)을 직접 호출합니다. 날짜 표기도 언어 선택과 분리되어 있습니다.
- 웹과 API의 ko/en JSON을 파일별 키로 비교했을 때 한국어에만 존재하는 영어 누락 키는 없고, 영어 값에 한국어가 들어간 항목도 없었습니다. 이는 문구 품질이나 런타임 연결을 검증한 결과는 아닙니다.
- API는 요청 언어로 오류 메시지를 번역하며 웹은 accept-language를 전달합니다. 서버 원문을 우선 표시하므로 API의 검증 상세·직접 작성 메시지는 별도 연결 확인이 필요합니다.

## 우선순위

| 순서 | 범위 | 작업 |
|---|---|---|
| 1 | 공통 UI | DataGrid·폼·모달·테마·오류 화면의 기존 번역 리소스 연결 |
| 2 | 인증·온보딩 | 제목·설명·라벨·버튼·검증 오류를 번역 키로 이동 |
| 3 | 프로필·FAQ·Q&A·고객지원 | 사용자 화면 및 날짜/숫자 표시 연결 |
| 4 | Admin 관리 화면 | 메뉴·컬럼·필터·확인창·설정 설명 연결 |
| 5 | API 메시지·검증 | 선택 언어에 따른 실제 응답과 프론트 표시 검증 |

## 파일별 후보 목록

각 파일의 후보 개수와 첫 두 위치를 제공합니다. 문자열에는 화면에 노출되지 않는 설정값도 포함될 수 있습니다. 동일 기능이 두 앱에 복제된 경우 각각 집계합니다.

### admin-web

| 파일 | 후보 위치 수 | 예시 |
|---|---:|---|
| [components/app/brand-logo.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/app/brand-logo.tsx:9) | 2 | L9: 운영자 웹<br>L18: 운영자 웹 |
| [components/app/global-loading.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/app/global-loading.tsx:82) | 1 | L82: 처리 중... |
| [components/app/loading-router.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/app/loading-router.tsx:17) | 1 | L17: 불러오는 중... |
| [components/app/router-error.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/app/router-error.tsx:16) | 9 | L16: 오류 내용이 복사되었습니다.<br>L19: 오류 내용을 복사하지 못했습니다. |
| [components/app/router-not-found.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/app/router-not-found.tsx:18) | 3 | L18: 페이지를 찾을 수 없습니다<br>L21: 뒤로 |
| [components/app/system-dialog.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/app/system-dialog.tsx:148) | 4 | L148: 확인<br>L148: 알림 |
| [components/app/theme-toggle.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/app/theme-toggle.tsx:9) | 2 | L9: 라이트 모드로 전환<br>L9: 다크 모드로 전환 |
| [components/data-grid/data-grid-pagination.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/data-grid/data-grid-pagination.tsx:38) | 7 | L38: '선택 ${table.getFilteredSelectedRowModel().rows.length} / 전체 ${rowCount ?? table.getFilteredRowModel(<br>L43: 첫 페이지 |
| [components/data-grid/data-grid-tool-column.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/data-grid/data-grid-tool-column.tsx:25) | 5 | L25: 전체 선택<br>L33: 행 선택 |
| [components/data-grid/data-grid-tool-header.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/data-grid/data-grid-tool-header.tsx:38) | 16 | L38: '${column.id} 정렬'<br>L43: '${column.id} 검색' |
| [components/data-grid/data-grid-toolbar.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/data-grid/data-grid-toolbar.tsx:23) | 6 | L23: 전체 검색<br>L83: 보기 |
| [components/data-grid/data-grid.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/data-grid/data-grid.tsx:160) | 4 | L160: '${header.column.id} 열 크기 조절'<br>L273: 추가 결과를 불러오는 중입니다 |
| [components/date-picker/date-picker.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/date-picker/date-picker.tsx:11) | 1 | L11: 날짜 선택 |
| [components/date-picker/datetime-picker.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/date-picker/datetime-picker.tsx:14) | 1 | L14: 일시 선택 |
| [components/date-picker/time-picker.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/date-picker/time-picker.tsx:12) | 1 | L12: 시간 선택 |
| [components/form/fields/form-file-input.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/form/fields/form-file-input.tsx:35) | 1 | L35: 파일 업로드 중... |
| [components/form/fields/form-input.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/form/fields/form-input.tsx:78) | 2 | L78: 비밀번호 숨기기<br>L78: 비밀번호 보기 |
| [components/form/fields/form-select.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/form/fields/form-select.tsx:18) | 1 | L18: 선택하세요 |
| [components/layout/app-layout.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/layout/app-layout.tsx:32) | 28 | L32: 서비스 관리<br>L34: 고객 관리 |
| [components/notice-banner.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/components/notice-banner.tsx:24) | 1 | L24: 안내 닫기 |
| [configs/i18n.config.ts](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/configs/i18n.config.ts:7) | 1 | L7: 한국어 |
| [lib/password-policy.ts](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/lib/password-policy.ts:4) | 13 | L4: 지금은 비밀번호를 설정할 수 없습니다. 잠시 후 다시 시도해 주세요.<br>L6: 숫자 |
| [routes/__root.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/__root.tsx:40) | 2 | L40: 운영자 웹<br>L41: 운영자 웹 application |
| [routes/_protected/_app/customers/-components/customer-detail-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/customers/-components/customer-detail-modal.tsx:18) | 23 | L18: 개인정보 숨기기<br>L18: 개인정보 보기 |
| [routes/_protected/_app/customers/-components/customer-memo-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/customers/-components/customer-memo-modal.tsx:37) | 7 | L37: 운영 메모<br>L38: 고객에게 공개되지 않는 내부 메모를 관리합니다. |
| [routes/_protected/_app/customers/-components/customer-role-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/customers/-components/customer-role-modal.tsx:22) | 9 | L22: 멤버십 역할을 입력해 주세요.<br>L48: 멤버십 변경 |
| [routes/_protected/_app/customers/-components/customer-row-actions.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/customers/-components/customer-row-actions.tsx:34) | 19 | L34: 고객 정지 해제<br>L34: 고객 이용 정지 |
| [routes/_protected/_app/customers/-components/customer-sessions-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/customers/-components/customer-sessions-modal.tsx:20) | 18 | L20: 전체 세션 해제<br>L20: 세션 해제 |
| [routes/_protected/_app/customers/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/customers/index.tsx:47) | 26 | L47: 고객 목록 조회 실패<br>L48: 고객 목록을 불러오지 못했습니다. |
| [routes/_protected/_app/faqs/-components/faq-editor-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/faqs/-components/faq-editor-modal.tsx:12) | 30 | L12: 계정<br>L12: 계정 |
| [routes/_protected/_app/faqs/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/faqs/index.tsx:42) | 23 | L42: FAQ 삭제<br>L42: '“${faq.question}” FAQ를 삭제하시겠습니까?' |
| [routes/_protected/_app/logs/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/logs/index.tsx:33) | 17 | L33: 시간<br>L41: 등급 |
| [routes/_protected/_app/memberships/-components/membership-editor-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/memberships/-components/membership-editor-modal.tsx:24) | 20 | L24: 서비스 권한<br>L26: 선택 |
| [routes/_protected/_app/memberships/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/memberships/index.tsx:31) | 22 | L31: 멤버십 삭제<br>L31: '${membership.label \|\| membership.code} 멤버십을 삭제하시겠습니까?' |
| [routes/_protected/_app/operator-terms/-components/modals.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/operator-terms/-components/modals.tsx:30) | 61 | L30: 약관 그룹 이름을 입력해 주세요.<br>L61: 약관 그룹 수정 |
| [routes/_protected/_app/operator-terms/-components/publish-schedule.ts](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/operator-terms/-components/publish-schedule.ts:5) | 1 | L5: 현재 이후의 게시 예정일을 선택해 주세요. |
| [routes/_protected/_app/operator-terms/-components/term-group-list.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/operator-terms/-components/term-group-list.tsx:17) | 3 | L17: 등록된 약관 그룹이 없습니다.<br>L45: '${group.title} 그룹 수정' |
| [routes/_protected/_app/operator-terms/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/operator-terms/index.tsx:70) | 45 | L70: 약관 그룹 삭제<br>L70: '${group.title} 그룹을 삭제하시겠습니까? 게시된 버전이 있으면 삭제할 수 없습니다.' |
| [routes/_protected/_app/operators/-components/change-operator-role-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/operators/-components/change-operator-role-modal.tsx:23) | 9 | L23: 역할을 선택해 주세요.<br>L42: 역할 변경 |
| [routes/_protected/_app/operators/-components/create-operator-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/operators/-components/create-operator-modal.tsx:27) | 14 | L27: 이름을 입력해 주세요.<br>L29: 역할을 선택해 주세요. |
| [routes/_protected/_app/operators/-components/operator-detail-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/operators/-components/operator-detail-modal.tsx:35) | 30 | L35: 운영자 상세 정보<br>L36: 선택한 운영자 계정의 보안 및 계정 정보입니다. |
| [routes/_protected/_app/operators/-components/operator-row-actions.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/operators/-components/operator-row-actions.tsx:54) | 23 | L54: 도구<br>L67: 상세 |
| [routes/_protected/_app/operators/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/operators/index.tsx:51) | 29 | L51: 운영자 목록 조회 실패<br>L52: 운영자 목록을 불러오지 못했습니다. |
| [routes/_protected/_app/profile.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/profile.tsx:48) | 45 | L48: 보안 강화 권장<br>L56: 비밀번호가 설정되지 않았습니다. |
| [routes/_protected/_app/profile/-components/agreement-history-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/profile/-components/agreement-history-modal.tsx:26) | 18 | L26: 동의 이력<br>L28: 동의 여부와 수신 옵션의 변경 기록입니다. |
| [routes/_protected/_app/profile/-components/change-password-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/profile/-components/change-password-modal.tsx:21) | 11 | L21: 비밀번호가 일치하지 않습니다.<br>L35: 비밀번호 변경 |
| [routes/_protected/_app/profile/-components/term-detail-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/profile/-components/term-detail-modal.tsx:26) | 2 | L26: 개정 이력<br>L27: 닫기 |
| [routes/_protected/_app/profile/-components/term-revision-history-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/profile/-components/term-revision-history-modal.tsx:29) | 12 | L29: 개정 이력<br>L31: 게시된 약관의 버전과 변경 내용을 확인합니다. |
| [routes/_protected/_app/profile/-components/terms-tab.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/profile/-components/terms-tab.tsx:48) | 15 | L48: 약관 동의 현황<br>L48: 약관 내용을 확인하고 선택 항목의 동의를 변경할 수 있습니다. |
| [routes/_protected/_app/profile/-components/two-factor-setup-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/profile/-components/two-factor-setup-modal.tsx:19) | 18 | L19: '인증 코드는 ${digits}자리여야 합니다.'<br>L39: 2단계 인증 비밀키를 복사했습니다. |
| [routes/_protected/_app/qna/-components/qna-editor-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/qna/-components/qna-editor-modal.tsx:60) | 23 | L60: Q&A 상세<br>L60: Q&A 답변 |
| [routes/_protected/_app/qna/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/qna/index.tsx:21) | 40 | L21: 접수<br>L21: 처리 중 |
| [routes/_protected/_app/roles/-components/role-editor-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/roles/-components/role-editor-modal.tsx:33) | 14 | L33: 역할 코드를 입력해 주세요.<br>L34: 역할 이름을 입력해 주세요. |
| [routes/_protected/_app/roles/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/roles/index.tsx:38) | 31 | L38: 리소스별 권한<br>L40: 저장 버튼을 누를 때 선택한 권한이 한 번에 반영됩니다. |
| [routes/_protected/_app/service-settings/-components/delivery-tab.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/delivery-tab.tsx:20) | 75 | L20: 솔라피<br>L21: 알리고 |
| [routes/_protected/_app/service-settings/-components/holiday-detail-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/holiday-detail-modal.tsx:14) | 9 | L14: 휴무일 상세<br>L15: 등록된 휴무일 정보를 확인합니다. |
| [routes/_protected/_app/service-settings/-components/inquiry-tab.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/inquiry-tab.tsx:47) | 14 | L47: 알림 기준<br>L48: 문의 미응답 감지와 답변 완료 후 자동 종료 시간을 설정합니다. |
| [routes/_protected/_app/service-settings/-components/maintenance-tab.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/maintenance-tab.tsx:106) | 19 | L106: 임시 점검<br>L107: 특정 기간 동안 또는 즉시 진행되는 점검을 설정합니다. |
| [routes/_protected/_app/service-settings/-components/oauth-provider-add-dialog.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/oauth-provider-add-dialog.tsx:15) | 19 | L15: 색상을 선택해 주세요.<br>L32: 서비스 식별자를 입력해 주세요. |
| [routes/_protected/_app/service-settings/-components/oauth-provider-detail.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/oauth-provider-detail.tsx:46) | 74 | L46: 복사됨<br>L57: 복사됨 |
| [routes/_protected/_app/service-settings/-components/oauth-tab.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/oauth-tab.tsx:214) | 15 | L214: '${meta.name} ${'추가'}'<br>L214: 추가 |
| [routes/_protected/_app/service-settings/-components/operations-tab.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/operations-tab.tsx:61) | 36 | L61: 휴무일 날짜 또는 명칭 검색...<br>L170: 특별지정휴일 |
| [routes/_protected/_app/service-settings/-components/system-config-tabs.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/system-config-tabs.tsx:28) | 3 | L28: 운영 정책<br>L36: 점검 정책 |
| [routes/_protected/_app/service-settings/-components/webhook-tab.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-components/webhook-tab.tsx:70) | 11 | L70: 문의 알림<br>L71: 새 문의와 미응답 문의에 대해 운영자가 받을 알림 채널을 설정합니다. |
| [routes/_protected/_app/service-settings/-configs/operations-columns.config.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-configs/operations-columns.config.tsx:16) | 12 | L16: 날짜<br>L22: 휴무일 명칭 |
| [routes/_protected/_app/service-settings/-constants/operations.ts](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/-constants/operations.ts:2) | 14 | L2: 월<br>L3: 화 |
| [routes/_protected/_app/service-settings/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-settings/index.tsx:88) | 5 | L88: 서비스 설정<br>L89: 운영자가 관리하는 서비스 운영시간, 점검 및 문의 처리 정책을 설정합니다. |
| [routes/_protected/_app/service-terms/-components/publish-schedule.ts](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-terms/-components/publish-schedule.ts:5) | 1 | L5: 현재 이후의 게시 예정일을 선택해 주세요. |
| [routes/_protected/_app/service-terms/-components/service-term-editor-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-terms/-components/service-term-editor-modal.tsx:21) | 28 | L21: 버전을 입력해 주세요.<br>L21: 등록 사유를 입력해 주세요. |
| [routes/_protected/_app/service-terms/-components/service-term-group-editor-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-terms/-components/service-term-group-editor-modal.tsx:19) | 13 | L19: 약관 그룹 이름을 입력해 주세요.<br>L40: 서비스 약관 그룹 수정 |
| [routes/_protected/_app/service-terms/-components/service-term-view-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-terms/-components/service-term-view-modal.tsx:16) | 16 | L16: 약관 상세<br>L17: 약관 제목과 내용을 확인합니다. |
| [routes/_protected/_app/service-terms/-components/term-group-list.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-terms/-components/term-group-list.tsx:17) | 3 | L17: 등록된 약관 그룹이 없습니다.<br>L45: '${group.title} 그룹 수정' |
| [routes/_protected/_app/service-terms/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/service-terms/index.tsx:65) | 45 | L65: 서비스 약관 그룹 삭제<br>L66: '${group.title} 그룹을 삭제하시겠습니까? 게시된 버전이 있으면 삭제할 수 없습니다.' |
| [routes/_protected/_app/support/-components/support-room-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/support/-components/support-room-modal.tsx:16) | 12 | L16: 조회 중...<br>L17: 마스킹 보기 |
| [routes/_protected/_app/support/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/support/index.tsx:19) | 20 | L19: 대기<br>L19: 상담 중 |
| [routes/_protected/_app/system-settings/-components/admin-email-settings-tab.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/system-settings/-components/admin-email-settings-tab.tsx:43) | 16 | L43: SMTP 서버 주소를 입력해 주세요.<br>L46: SMTP 계정을 입력해 주세요. |
| [routes/_protected/_app/system-settings/-components/admin-email-test-card.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/system-settings/-components/admin-email-test-card.tsx:23) | 6 | L23: 올바른 수신 이메일 주소를 입력해 주세요.<br>L34: 관리자 이메일 발송 테스트 |
| [routes/_protected/_app/system-settings/-components/portone-identity-tool.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/system-settings/-components/portone-identity-tool.tsx:8) | 8 | L8: 스토어 ID<br>L9: 본인인증 채널 키 |
| [routes/_protected/_app/system-settings/-components/system-setting-tabs.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/system-settings/-components/system-setting-tabs.tsx:23) | 3 | L23: 발송 채널<br>L30: 소셜 로그인 |
| [routes/_protected/_app/system-settings/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_app/system-settings/index.tsx:85) | 5 | L85: 시스템 설정<br>L85: 발송 채널, 소셜 로그인 키와 시스템 알림 설정을 관리합니다. |
| [routes/_protected/_global/onboarding/-components/onboarding-layout.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_global/onboarding/-components/onboarding-layout.tsx:71) | 1 | L71: 로그인으로 돌아가기 |
| [routes/_protected/_global/onboarding/-components/term-detail-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_global/onboarding/-components/term-detail-modal.tsx:25) | 1 | L25: 닫기 |
| [routes/_protected/_global/onboarding/agree-terms.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_global/onboarding/agree-terms.tsx:66) | 13 | L66: 약관 동의<br>L67: 이용약관을 확인하고 동의해 주세요. |
| [routes/_protected/_global/onboarding/change-password.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_global/onboarding/change-password.tsx:29) | 8 | L29: 새 비밀번호가 일치하지 않습니다.<br>L47: 비밀번호 변경 |
| [routes/_protected/_global/onboarding/setup-2fa.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_global/onboarding/setup-2fa.tsx:59) | 15 | L59: 2단계 인증 비밀키를 복사했습니다.<br>L62: 비밀키를 복사하지 못했습니다. |
| [routes/_protected/_global/onboarding/verify-phone.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_protected/_global/onboarding/verify-phone.tsx:65) | 8 | L65: 지금은 본인인증을 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.<br>L95: 본인인증 |
| [routes/_public/_global/find-account.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_public/_global/find-account.tsx:32) | 30 | L32: 이름을 입력해주세요.<br>L33: 전화번호를 입력해주세요. |
| [routes/_public/_global/login.2fa.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_public/_global/login.2fa.tsx:33) | 8 | L33: '인증 코드는 ${digits}자리여야 합니다.'<br>L72: 2단계 인증 |
| [routes/_public/_global/login.index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_public/_global/login.index.tsx:81) | 20 | L81: 로그인<br>L103: 이메일 |
| [routes/_public/_global/register.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_public/_global/register.tsx:27) | 16 | L27: 비밀번호가 일치하지 않습니다.<br>L67: 보내는 중... |
| [routes/_public/_global/reset-password.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_public/_global/reset-password.tsx:29) | 10 | L29: 비밀번호가 일치하지 않습니다.<br>L57: 새 비밀번호 설정 |
| [routes/_public/_global/verify-email.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_public/_global/verify-email.tsx:26) | 12 | L26: 올바른 이메일 주소를 입력해 주세요.<br>L41: 로그인하여 계속 진행해 주세요. |
| [routes/_public/_global/{-$locale}/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/admin-web/src/routes/_public/_global/{-$locale}/index.tsx:13) | 6 | L13: 운영자 웹<br>L14: 운영자 프론트엔드 기본 골자가 준비되었습니다. |

### service-web

| 파일 | 후보 위치 수 | 예시 |
|---|---:|---|
| [components/app/global-loading.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/app/global-loading.tsx:82) | 1 | L82: 처리 중... |
| [components/app/loading-router.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/app/loading-router.tsx:17) | 1 | L17: 불러오는 중... |
| [components/app/router-error.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/app/router-error.tsx:16) | 9 | L16: 오류 내용이 복사되었습니다.<br>L19: 오류 내용을 복사하지 못했습니다. |
| [components/app/router-not-found.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/app/router-not-found.tsx:18) | 3 | L18: 페이지를 찾을 수 없습니다<br>L21: 뒤로 |
| [components/app/system-dialog.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/app/system-dialog.tsx:148) | 4 | L148: 확인<br>L148: 알림 |
| [components/app/theme-toggle.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/app/theme-toggle.tsx:9) | 2 | L9: 라이트 모드로 전환<br>L9: 다크 모드로 전환 |
| [components/data-grid/data-grid-pagination.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/data-grid/data-grid-pagination.tsx:38) | 7 | L38: '선택 ${table.getFilteredSelectedRowModel().rows.length} / 전체 ${rowCount ?? table.getFilteredRowModel(<br>L43: 첫 페이지 |
| [components/data-grid/data-grid-tool-column.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/data-grid/data-grid-tool-column.tsx:25) | 5 | L25: 전체 선택<br>L33: 행 선택 |
| [components/data-grid/data-grid-tool-header.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/data-grid/data-grid-tool-header.tsx:38) | 16 | L38: '${column.id} 정렬'<br>L43: '${column.id} 검색' |
| [components/data-grid/data-grid-toolbar.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/data-grid/data-grid-toolbar.tsx:23) | 6 | L23: 전체 검색<br>L83: 보기 |
| [components/data-grid/data-grid.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/data-grid/data-grid.tsx:160) | 4 | L160: '${header.column.id} 열 크기 조절'<br>L273: 추가 결과를 불러오는 중입니다 |
| [components/date-picker/date-picker.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/date-picker/date-picker.tsx:11) | 1 | L11: 날짜 선택 |
| [components/date-picker/datetime-picker.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/date-picker/datetime-picker.tsx:14) | 1 | L14: 일시 선택 |
| [components/date-picker/time-picker.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/date-picker/time-picker.tsx:12) | 1 | L12: 시간 선택 |
| [components/form/fields/form-file-input.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/form/fields/form-file-input.tsx:35) | 1 | L35: 파일 업로드 중... |
| [components/form/fields/form-input.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/form/fields/form-input.tsx:78) | 2 | L78: 비밀번호 숨기기<br>L78: 비밀번호 보기 |
| [components/form/fields/form-select.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/form/fields/form-select.tsx:18) | 1 | L18: 선택하세요 |
| [components/layout/app-layout.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/layout/app-layout.tsx:49) | 1 | L49: 서비스 메뉴 |
| [components/notice-banner.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/components/notice-banner.tsx:24) | 1 | L24: 안내 닫기 |
| [configs/i18n.config.ts](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/configs/i18n.config.ts:7) | 1 | L7: 한국어 |
| [lib/password-policy.ts](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/lib/password-policy.ts:4) | 13 | L4: 지금은 비밀번호를 설정할 수 없습니다. 잠시 후 다시 시도해 주세요.<br>L6: 숫자 |
| [routes/_protected/-components/maintenance.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/-components/maintenance.tsx:29) | 6 | L29: 서비스 상태를 확인할 수 없습니다<br>L30: 점검 정보를 불러오지 못해 화면을 표시할 수 없습니다. |
| [routes/_protected/-components/operation-notice.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/-components/operation-notice.tsx:23) | 3 | L23: 운영시간 안내<br>L23: 고객센터 안내 |
| [routes/_protected/_app/profile.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/profile.tsx:48) | 45 | L48: 보안 강화 권장<br>L56: 비밀번호가 설정되지 않았습니다. |
| [routes/_protected/_app/profile/-components/agreement-history-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/profile/-components/agreement-history-modal.tsx:25) | 18 | L25: 동의 이력<br>L27: 동의 여부와 수신 옵션의 변경 기록입니다. |
| [routes/_protected/_app/profile/-components/change-password-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/profile/-components/change-password-modal.tsx:22) | 11 | L22: 비밀번호가 일치하지 않습니다.<br>L44: 비밀번호 변경 |
| [routes/_protected/_app/profile/-components/term-detail-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/profile/-components/term-detail-modal.tsx:26) | 3 | L26: 약관 다시 불러오기<br>L30: 개정 이력 |
| [routes/_protected/_app/profile/-components/term-revision-history-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/profile/-components/term-revision-history-modal.tsx:29) | 12 | L29: 개정 이력<br>L31: 게시된 약관의 버전과 변경 내용을 확인합니다. |
| [routes/_protected/_app/profile/-components/terms-tab.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/profile/-components/terms-tab.tsx:48) | 15 | L48: 약관 동의 현황<br>L48: 약관 내용을 확인하고 선택 항목의 동의를 변경할 수 있습니다. |
| [routes/_protected/_app/profile/-components/two-factor-setup-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/profile/-components/two-factor-setup-modal.tsx:19) | 18 | L19: '인증 코드는 ${digits}자리여야 합니다.'<br>L39: 2단계 인증 비밀키를 복사했습니다. |
| [routes/_protected/_app/qna/-components/qna-create-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/qna/-components/qna-create-modal.tsx:10) | 22 | L10: 계정<br>L10: 계정 |
| [routes/_protected/_app/qna/-components/qna-detail-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/qna/-components/qna-detail-modal.tsx:26) | 7 | L26: 문의 내역<br>L27: 등록한 문의와 답변을 확인합니다. |
| [routes/_protected/_app/qna/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/qna/index.tsx:21) | 35 | L21: 접수<br>L21: 처리 중 |
| [routes/_protected/_app/support/-components/support-room-detail-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/support/-components/support-room-detail-modal.tsx:26) | 15 | L26: 메시지를 입력해 주세요.<br>L75: 새 상담 |
| [routes/_protected/_app/support/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_app/support/index.tsx:19) | 16 | L19: 대기<br>L19: 상담 중 |
| [routes/_protected/_global/onboarding/-components/onboarding-layout.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_global/onboarding/-components/onboarding-layout.tsx:71) | 1 | L71: 로그인으로 돌아가기 |
| [routes/_protected/_global/onboarding/-components/term-detail-modal.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_global/onboarding/-components/term-detail-modal.tsx:25) | 1 | L25: 닫기 |
| [routes/_protected/_global/onboarding/agree-terms.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_global/onboarding/agree-terms.tsx:66) | 13 | L66: 약관 동의<br>L67: 이용약관을 확인하고 동의해 주세요. |
| [routes/_protected/_global/onboarding/change-password.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_global/onboarding/change-password.tsx:30) | 8 | L30: 새 비밀번호가 일치하지 않습니다.<br>L51: 비밀번호 변경 |
| [routes/_protected/_global/onboarding/setup-2fa.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_global/onboarding/setup-2fa.tsx:59) | 15 | L59: 2단계 인증 비밀키를 복사했습니다.<br>L62: 비밀키를 복사하지 못했습니다. |
| [routes/_protected/_global/onboarding/verify-phone.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_protected/_global/onboarding/verify-phone.tsx:65) | 8 | L65: 지금은 본인인증을 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.<br>L95: 본인인증 |
| [routes/_public/_app/faq/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_public/_app/faq/index.tsx:43) | 9 | L43: 카테고리<br>L45: 질문 |
| [routes/_public/_app/service-terms/index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_public/_app/service-terms/index.tsx:19) | 5 | L19: 서비스 약관<br>L19: 현재 게시된 고객용 서비스 약관입니다. |
| [routes/_public/_global/find-account.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_public/_global/find-account.tsx:32) | 30 | L32: 이름을 입력해주세요.<br>L33: 전화번호를 입력해주세요. |
| [routes/_public/_global/login.2fa.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_public/_global/login.2fa.tsx:34) | 8 | L34: '인증 코드는 ${digits}자리여야 합니다.'<br>L73: 2단계 인증 |
| [routes/_public/_global/login.index.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_public/_global/login.index.tsx:82) | 20 | L82: 로그인<br>L105: 이메일 |
| [routes/_public/_global/register.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_public/_global/register.tsx:27) | 16 | L27: 비밀번호가 일치하지 않습니다.<br>L59: 인증 메일 다시 보내기 |
| [routes/_public/_global/reset-password.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_public/_global/reset-password.tsx:29) | 10 | L29: 비밀번호가 일치하지 않습니다.<br>L53: 새 비밀번호 설정 |
| [routes/_public/_global/verify-email.tsx](/Users/server/Documents/GitHub/web-framework-app/apps/service-web/src/routes/_public/_global/verify-email.tsx:26) | 12 | L26: 올바른 이메일 주소를 입력해 주세요.<br>L41: 로그인하여 계속 진행해 주세요. |
