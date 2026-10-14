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
import { DatePicker, DatetimePicker, TimePicker } from '@pkg/web-core/date-picker';
import { Editor, EditorViewer } from '@pkg/web-core/editor';
import { I18nContext, useI18n } from '@pkg/web-core/i18n';
import { Modal, ModalContainer, openModal } from '@pkg/web-core/modal';
import { Button, Card, Dialog, DropdownMenu, Skeleton, Spinner, Tabs, Toaster } from '@pkg/web-core/ui';
```

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
앱에서 관리합니다. 브랜드와 화면 배치 조합은 앱에 유지하고, 의미 있는 화면 영역은 공통 `ScreenLayout`으로 제공합니다. 공통 전역 로딩과 확인 다이얼로그는 `feedback`, 링크 버튼과 좌우 레이아웃은 `layout`에서 제공합니다.

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

## ScreenLayout

`ScreenLayout.Header`, `Logo`, `Tools`, `Content`, `Footer`는 JSX 순서대로
렌더링합니다. 자식을 추출하거나 위치를 재배치하지 않습니다. `Addon`은
`Footer`의 호환 이름입니다. 각 영역은 네이티브 HTML props와 ref를 전달하며
`className`은 기본 스타일 뒤에 병합합니다.

Root는 전체 크기·여백·간격, Header는 가로 정렬, Tools는 도구 간격,
Content는 크기별 높이·최대 너비, Footer는 보조 글자 스타일을 제공합니다.
grid/flex 구성, 영역 순서와 위치, 브랜드·언어 도구는 앱에서 결정합니다.
`Content`는 `main`이므로 같은 화면에 중복 main을 만들지 않습니다.

```tsx
<ScreenLayout className="grid grid-rows-[auto_1fr_auto]">
  <ScreenLayout.Header>
    <ScreenLayout.Logo><BrandLogo /></ScreenLayout.Logo>
    <ScreenLayout.Tools><LocaleSwitcher /></ScreenLayout.Tools>
  </ScreenLayout.Header>
  <ScreenLayout.Content size="md" className="mx-auto h-auto scroll-y">
    <LoginForm />
  </ScreenLayout.Content>
  <ScreenLayout.Footer className="text-center">서비스 안내</ScreenLayout.Footer>
</ScreenLayout>
```

## BrandLogo

`ui`의 `BrandLogo`, `BrandLogo.Icon`, `BrandLogo.Label`은 기존 로고의
아이콘 박스(size-8), 아이콘(size-4), 글자 굵기와 간격을 제공합니다.
`collapsed`이면 Label을 숨기고 아이콘을 유지합니다. 링크와 접근성 이름은
앱에서 제공합니다. 화면 너비에 따른 숨김은 Label의 `className`으로
앱에서 결정합니다. Service 헤더는 `hidden sm:inline`을 사용하므로 기본
Tailwind sm(640px) 미만에서 아이콘만 표시합니다. standalone 화면은
텍스트를 유지하고, Admin 사이드바는 기존 접기 상태로 제어합니다.

```tsx
<Link to="/" aria-label="Service Web">
  <BrandLogo collapsed={collapsed}>
    <BrandLogo.Icon><Layers3 aria-hidden="true" /></BrandLogo.Icon>
    <BrandLogo.Label className="hidden sm:inline">Service Web</BrandLogo.Label>
  </BrandLogo>
</Link>
```

`ScreenLayout.Logo`도 같은 공통 로고 구현입니다.
`ScreenLayout.Logo.Icon`과 `ScreenLayout.Logo.Label`로 아이콘과 텍스트를
직접 구성하거나 앱의 BrandLogo를 사용할 수 있습니다.

## Navi

`Navi` reuses one app-owned `items` array for side and bar presentations.
Responsive variants follow the mobile-first Tailwind rule; a breakpoint changes
the presentation at that width and above. Supported keys are `base`, `sm`,
`md`, `lg`, `xl`, and `2xl`. The side panel's placement/open state stays with
the app, while the package supplies vertical/horizontal link styling, active
state, and accessible icon-only labels when collapsed. Route targets remain
TanStack Router targets so app route types are preserved.

```tsx
<Navi
  items={[
    { id: 'home', label: '홈', to: '/', icon: <Home />, active: pathname === '/' },
    { id: 'support', label: '고객지원', to: '/support', icon: <MessagesSquare />, active: pathname.startsWith('/support') },
  ]}
  variant={{ base: 'side', lg: 'bar' }}
  sideOpen={mobileMenuOpen}
  sideClassName="absolute inset-x-0 top-full lg:hidden"
  onNavigate={() => setMobileMenuOpen(false)}
/>
```
