# @pkg/web-core

`admin-web`과 `service-web`에서 공유하는 React UI 구현입니다.

TypeScript는 `@pkg/config/typescript/react`, ESLint는
`@pkg/config/eslint/react` 설정을 상속합니다. `server-core`처럼 폴더 간
import는 `@pkg/web-core/...`로 자기 패키지를 참조합니다. 공개 경로는 기존
패키지와 같은 `types`/`default` export를 사용합니다. 같은 폴더의 상대
import는 공통 lint 규칙에 따라 허용합니다.

## 공개 진입점

```tsx
import { FormLayout, FormSubmit, useAppForm } from '@pkg/web-core/form';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '@pkg/web-core/data-grid';
import { DatePicker, DatetimePicker, TimePicker } from '@pkg/web-core/date-time';
import { Editor, EditorViewer } from '@pkg/web-core/editor';
import { I18nContext, useI18n } from '@pkg/web-core/context/i18n';
import { Modal, ModalContainer, openModal } from '@pkg/web-core/modal';
import { Button, Card, Dialog, DropdownMenu, Skeleton, Spinner, Tabs, Toaster } from '@pkg/web-core/ui';
```

## Storybook

스토리북은 공통 컴포넌트를 영역별로 살펴보고, 조합 예제와 앱 적용 시 필요한 제공자 및 연결 지점을 확인하는 문서입니다.

```sh
pnpm --filter @pkg/web-core storybook
pnpm --filter @pkg/web-core build-storybook
```

`웹코어/시작하기`와 `웹코어/컴포넌트 카탈로그` 문서에서 전체 진입점과 앱 통합 방법을 확인할 수 있습니다.

앱의 루트에서 앱별 i18next 인스턴스를 `I18nContext.Provider`에 전달합니다.
에디터는 기존 앱의 ThemeProvider를 사용하고, 즉시 파일 업로드 필드는
기존 QueryClientProvider를 사용합니다. 앱별 설정이나 전역 singleton을
패키지에서 생성하지 않습니다.

Tailwind를 사용하는 앱의 스타일 진입점에 공통 소스 경로를 등록합니다.
현재 두 앱의 `src/styles/styles.css` 기준 경로입니다.

```css
@source "../../../../packages/web-core/src";
```

React와 React DOM은 앱에서 공급합니다. 라우트, 생성 API 클라이언트,
폼 제출과 업로드 API, 화면별 컬럼, 인증·권한 정책, 브랜드와 스타일 토큰은
앱에서 관리합니다. 앱 아이콘이나 브랜드 헤더에 결합된 화면 레이아웃은 앱에 유지합니다. 공통 전역 로딩과 확인 다이얼로그는 `feedback`, 링크 버튼과 좌우 레이아웃은 `layout`에서 제공합니다.

`ui`에는 폼과 DataGrid의 공통 기반 primitive 및 두 앱이 공유하는 shadcn
컴포넌트를 둡니다. Card, Dialog, DropdownMenu, Skeleton, Tabs, Toaster, Spinner는
shadcn CLI 최신 `base-nova` Base UI 소스를 기준으로
관리하고, 앱의 기존 shadcn barrel은 이 export를 재노출합니다. 공통 primitive를
수정할 때는 이 패키지의 소스를 수정합니다.

## 검증

```sh
pnpm --filter @pkg/web-core typecheck
pnpm --filter @pkg/web-core lint
pnpm --filter admin-web typecheck
pnpm --filter service-web typecheck
```
