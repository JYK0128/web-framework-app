# CSS 표준화 구조

이 문서는 `react-starter-kit`의 전역 스타일 진입점인
[`src/styles.css`](../src/styles.css)의 구조와 사용 규칙을 정의한다.

## 1. 표준화 대상과 원칙

여러 프로젝트에서 반복된 다음 항목만 starter kit의 공통 계층으로 통합한다.

- Tailwind v4, `tw-animate-css`, shadcn CSS 연동
- shadcn semantic color token과 light/dark theme
- 공통 dimension, spacing, radius, typography token
- 브라우저/문서 전역 reset
- 모바일 viewport와 safe-area 처리
- 가상 키보드와 연결된 app shell 계약
- `scroll`, `scroll-y`, `scroll-x` 및 경계(boundary) 유틸리티

페이지의 콘텐츠 모양, 특정 서비스의 색상, 외부 에디터/그래프 라이브러리의 스타일은 전역 표준에 넣지 않는다. 이런 스타일은 해당 기능이나 vendor import 가까이에 둔다.

## 2. 프로젝트별 루트 스타일 출처

모노레포는 앱 CSS가 공용 UI CSS를 import하는 구조이므로, 실제 표준 정의가 있는 `packages/ui`를 함께 표시한다.

| 프로젝트 | 루트/공용 스타일 | 반영 기준 |
| --- | --- | --- |
| `ai-base-app` | `packages/ui/src/index.css` | theme, token, reset, scroll |
| `auth-app` | `src/app/globals.css` | 기본 background/foreground, font |
| `chatbot-service` | `packages/ui/lib/styles/index.css` | shadcn theme, dark mode, reset |
| `internetional-app` | `app/globals.css` | 전역 reset, font, responsive 예시 |
| `mini-saas-repo` | `packages/ui/src/index.css` | theme, font, token, reset |
| `my-amore-app` | `src/styles/index.css` | font, theme, scroll, boundary, animation |
| `my-workspace` | `packages/ui/lib/index.css` | theme, scroll, boundary, viewport reset |
| `tanstack-app` | `src/styles.css` | shadcn theme, scroll, document reset |
| `test/vite-app` | `src/index.css` | Geist font, shadcn theme, dark mode |
| `web-framework-app` | `template/react-starter-kit/src/styles.css` | 본 문서의 최종 표준 |

## 3. 파일 내부 계층

`styles.css`는 아래 순서를 유지한다.

1. **Framework integration**: Tailwind, animation, shadcn import
2. **Design tokens**: primitive token, semantic color, theme mapping
3. **Base reset**: `box-sizing`, document viewport, typography, form selection
4. **App-shell contracts**: safe-area, header/content/footer, keyboard state
5. **Utilities**: scrolling, boundary, sizing helpers

새 전역 규칙을 추가할 때는 먼저 기존 계층에 들어갈 수 있는지 확인한다. 컴포넌트 하나에서만 쓰이는 규칙은 이 파일이 아니라 컴포넌트의 class 조합 또는 로컬 CSS에 둔다.

## 4. Token 규칙

### Primitive token

`--dimension-*`, `--spacing-*`, `--border-radius-*`는 디자인 값 자체를 표현한다.

| 그룹 | 표준 값 |
| --- | --- |
| dimension | `2px`, `4px`, `8px`, `16px`, `32px`, `64px` |
| spacing | `2xs`, `xs`, `sm`, `md`, `lg`, `xl` |
| radius | `4px`, `8px`, `16px` |

Tailwind에서 사용할 때는 `@theme inline`의 `--spacing-*`를 사용한다. 컴포넌트가 의미를 가져야 하는 색상은 원시 색상 대신 semantic token을 사용한다.

### Semantic color token

`--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`을 기본 색상 계약으로 사용한다. 카드, 팝오버, 사이드바, 차트는 같은 이름의 확장 token을 사용한다.

새 색상 추가 기준:

- 여러 화면에서 반복되는 의미가 있으면 `:root`와 dark theme에 token을 추가한다.
- 한 화면의 장식 색상이면 `styles.css`에 추가하지 않고 해당 화면의 Tailwind class로 처리한다.
- dark mode에서 읽기 대비가 달라지는 token은 반드시 `.dark` 값을 함께 정의한다.

## 5. Base reset 규칙

- 전역 `box-sizing: border-box`, margin/padding 초기화, `min-width/min-height: 0`을 적용한다.
- 앱이 고정 viewport를 사용하므로 `html`, `body`, `#root`의 브라우저 스크롤을 막는다.
- 전역 선택 방지 정책을 유지하되 `input`, `textarea`, `contenteditable`은 `select-text`로 되돌린다.
- `tabular-nums`는 데이터 화면의 숫자 정렬을 위해 기본값으로 유지한다.
- 폼 요소는 부모 폰트를 상속하고, autofill은 semantic input token을 사용한다.

본문을 스크롤해야 할 때는 `body`에 스크롤을 추가하지 말고, 화면의 콘텐츠 영역에 `scroll-y`를 지정한다.

## 6. App shell과 모바일 키보드

`src/lib/virtual-keyboard.ts`가 아래 CSS 계약을 사용한다.

| 계약 | 역할 |
| --- | --- |
| `--spacing-app-height` | visual viewport 높이. JS가 px 값으로 갱신 |
| `.app-header` | top safe-area와 좌우 safe-area 적용 |
| `.app-content` | 좌우 safe-area 적용 |
| `.app-footer` | bottom 및 좌우 safe-area 적용 |
| `html[data-keyboard-state="open"]` | 키보드가 열린 상태 |
| `html[data-content-input="focused"]` | 콘텐츠 입력창이 focus된 상태 |

권장 화면 골격:

```tsx
<div className="app flex h-full min-h-0 flex-col">
  <header className="app-header shrink-0">...</header>
  <main className="app-content scroll-y min-h-0 flex-1">...</main>
  <footer className="app-footer shrink-0">...</footer>
</div>
```

## 7. Scroll utility 규칙

| 클래스 | 사용 목적 | 허용 축 |
| --- | --- | --- |
| `.scroll` | 양방향 콘텐츠, data grid | x + y |
| `.scroll-y` | 페이지 본문, 목록, 채팅 history | y |
| `.scroll-x` | markdown/editor, 넓은 표 | x |

스크롤 유틸리티는 overflow와 touch/overscroll만 담당한다. 높이, 너비, `flex-1`, `min-h-0`은 호출부가 지정한다.

```tsx
<main className="scroll-y min-h-0 flex-1" />
<div className="scroll size-full" />
<div className="scroll-x max-w-full" />
```

스크롤바는 기본적으로 투명하고 hover 시 `--muted-foreground`의 15%로 표시된다. 따라서 각 화면에서 브라우저별 scrollbar CSS를 반복해서 작성하지 않는다.

## 8. 무엇을 어디에 작성하는가

| 스타일 종류 | 위치 |
| --- | --- |
| 앱 전체 token/reset/viewport | `src/styles.css` |
| 재사용 가능한 Tailwind utility | `src/styles.css`의 utilities 계층 |
| shadcn 컴포넌트 상태/variant | 생성된 컴포넌트 또는 component class |
| 특정 화면의 layout | route/component의 Tailwind class |
| 특정 기능의 반복 스타일 | 해당 feature 폴더의 로컬 CSS 또는 component class |
| Toast UI, React Flow 등 vendor 스타일 | 사용하는 컴포넌트에서 직접 import |
| 프로젝트 브랜드 색상/폰트 | 해당 앱의 별도 theme 파일 |

전역 CSS에 `.page`, `.card`, `.panel`처럼 특정 페이지에만 필요한 이름을 추가하지 않는다. 그런 규칙은 공통 표준이 아니라 해당 프로젝트의 화면 스타일이다.

## 9. 변경 체크리스트

- [ ] 새 token이 primitive인지 semantic인지 구분했는가?
- [ ] dark mode 값을 함께 정의했는가?
- [ ] `body` 스크롤을 다시 활성화하지 않았는가?
- [ ] 입력창의 text selection을 막지 않았는가?
- [ ] `.app-header/.app-content/.app-footer` 계약을 유지했는가?
- [ ] `scroll-x`가 `overflow-x: auto`인지 확인했는가?
- [ ] 페이지 전용 스타일을 전역 CSS에 넣지 않았는가?
- [ ] `pnpm --filter react-starter-kit build` 또는 최소 `typecheck`를 실행했는가?
