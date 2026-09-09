# Layout and feedback

## 소스

- 페이지 레이아웃: `template/react-starter-kit/src/components/layout/page-section.tsx`
- 인증·독립 화면: `template/react-starter-kit/src/components/layout/screen-layout.tsx`
- 전역 레이아웃 CSS: `template/react-starter-kit/src/styles.css`
- 복합 Dialog: `template/react-starter-kit/src/components/dialog/`
- 확인 Dialog와 전역 마운트: `template/react-starter-kit/src/components/app/system-dialog.tsx`, `routes/__root.tsx`
- 전역 API Toast: `template/react-starter-kit/src/router.tsx`

## 컴포넌트와 Layout

- 관리자·업무 화면의 제목, 액션, 본문 슬롯은 `PageSection`의 `Actions`, `Content`, `Loading`을 사용한다.
- 로그인·2FA·온보딩처럼 독립된 화면은 `ScreenLayout`의 `Content`, `Addon` 슬롯을 확인한다. `ScreenSection`이라는 컴포넌트는 사용하지 않는다.
- 확인이 필요한 삭제·차단은 `confirm`을 사용하고, 컴포넌트형 Dialog는 `openDialog`를 사용한다.
- API 성공·실패 Toast는 `router.tsx`의 `MutationCache`·`QueryCache`와 무음 설정을 확인한다. API 콜백에서 같은 메시지를 중복 표시하지 않는다.
- 복사 완료, 로컬 필터 초기화처럼 API와 무관한 동작은 수동 Toast를 사용할 수 있다.
- `flex`는 가로 배치에 사용한다. 기본 패턴은 `flex items-center`, 좌우 분할은 `flex items-center justify-between`이다.
- `grid`는 세로 방향 영역을 나눌 때 사용한다. 고정 헤더·툴바는 `auto`, 가변 본문은 `1fr`로 두며, 기본 패턴은 `grid grid-rows-[auto_minmax(0,1fr)]`이다.

## 전역 스크롤 규칙

- `styles.css`의 전역 `* { min-h-0 min-w-0 }`를 전제로 레이아웃을 구성한다. 자식마다 습관적으로 `min-h-0`·`min-w-0`를 반복하지 않는다.
- `html`, `body`, `#root`는 `fixed inset-0 overflow-hidden` 구조이므로 body에 페이지 스크롤을 만들지 않는다. 앱 본문 같은 실제 컨테이너에 스크롤을 둔다.
- 세로 스크롤은 `scroll-y`, 가로는 `scroll-x`, 양방향은 `scroll`을 사용한다. 이 유틸리티들은 overflow뿐 아니라 `relative`, overscroll, touch, 여백 보정도 포함한다.
- `scroll-y`는 `overflow-y-auto`, `scroll-x`는 `overflow-x-auto`를 적용하며, 둘 다 가장 가까운 스크롤 컨테이너가 된다. `sticky`·`absolute`의 기준도 함께 바뀌는지 확인한다.

## Position

- `relative` 래퍼 + `absolute` 자식은 부모를 위치 기준으로 만들고 자식을 흐름에서 뺀다. 부모가 스크롤되면 자식도 콘텐츠와 함께 움직인다.
- `sticky`는 스크롤 컨테이너 상단에 붙고 흐름에 남는다. 가까운 스크롤 컨테이너, `top-0`, 높이·`overflow`를 함께 확인한다.
- `fixed`는 viewport 기준으로 고정되고 흐름에서 빠진다. `inset-*` 또는 방향값과 필요한 여백·`z-index`를 지정한다.

### 선택 기준

```text
콘텐츠 위에 겹침              → relative + absolute
스크롤 영역 상단에 고정       → sticky + top-0
브라우저 화면에 항상 고정     → fixed
```
