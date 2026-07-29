# Virtual Keyboard Flow

## 목적

- 앱 루트 높이를 Visual Viewport에 맞춘다.
- 헤더와 푸터는 콘텐츠 스크롤과 분리한다.
- 콘텐츠 입력창은 화면 상단 기준 1/3 지점에 맞춘다.
- 푸터 입력창의 포커스 전후 콘텐츠 하단 여백을 복원한다.
- 키보드가 닫히면 필요한 경우 콘텐츠를 최종 위치로 이동한다.

## 처리 구조

```text
브라우저 이벤트
  ↓
event-flow 큐
  ↓
reconcile(events)
  ├─ 기준값 측정
  ├─ 이벤트로 pending 상태 변경
  ├─ 현재 focus와 viewport 측정
  ├─ phase 전이
  ├─ 타이머·프레임 예약
  ├─ CSS 상태 반영
  └─ 콘텐츠 스크롤 반영
```

`reconcile()`만 상태 전이와 화면 반영의 순서를 결정한다.

## 측정값

- `baseline.viewport`: 키보드가 닫힌 상태를 기준으로 삼는 viewport
- `baseline.content.height`: 키보드 전 콘텐츠 표시 높이
- `applied.appHeight`: 마지막으로 CSS에 적용한 앱 높이
- `delta`: 기준 viewport와 현재 viewport 하단의 차이

`baseline`은 비교 기준이고 `applied`는 DOM에 마지막으로 반영한 값이다.

## 상태

```ts
type State = {
  phase: 'closed' | 'open';
  pending: {
    inputAlign: boolean;
    footerReveal: boolean;
    scrollEnd: boolean;
  };
  content: {
    bottomOffset: number | null;
    restoreBottom: boolean;
  };
  baseline: {
    viewport: Viewport;
    content: {
      height: number | null;
    };
  };
  applied: {
    appHeight: string | null;
  };
};
```

- `phase`: viewport 전환 상태
- `pending`: 아직 실행하지 않은 화면 작업
- `content`: 콘텐츠 하단 위치 복원 정보
- `baseline`: 판정에 사용할 기준 측정값
- `applied`: DOM에 마지막으로 반영한 값

## 이벤트 큐

공용 큐는 다음 API만 외부에 노출한다.

```ts
eventFlow.dispatch(event, once?);
eventFlow.dispose();
```

`viewport-change`는 `once`를 사용해 한 프레임 내 중복을 제거한다. 나머지 이벤트는 큐에 순서대로 추가한다.

## reconcile 순서

1. 닫힌 레이아웃이면 콘텐츠 기준 높이를 갱신한다.
2. 큐에 들어온 포커스 이벤트를 상태에 반영한다.
3. `document.activeElement`와 현재 viewport를 측정한다.
4. `delta`를 계산한다.
5. 열림·닫힘 `phase`를 갱신한다.
6. 닫힘 확인 또는 푸터 노출을 예약한다.
7. 앱 높이와 dataset을 DOM에 반영한다.
8. 콘텐츠 입력창 정렬, 하단 복원, 최종 위치 이동을 순서대로 처리한다.

## 열림·닫힘 판정

열림:

```text
phase === 'closed'
focus.editable === true
delta >= OPEN_THRESHOLD
```

닫힘:

```text
check-close 이벤트
phase === 'open'
focus.editable === false
delta < CLOSE_THRESHOLD
```

닫힘은 `CLOSE_DELAY`만큼 지연 확인한다. 전환 중 viewport가 다시 열리거나 입력 포커스가 생기면 타이머를 취소한다.

## 콘텐츠 스크롤

스크롤은 콘텐츠 요소에만 적용한다.

1. 콘텐츠 입력창 포커스 시 1/3 지점 정렬
2. 푸터 포커스 해제 시 저장한 하단 여백 복원
3. `pending.scrollEnd`가 있으면 콘텐츠 최종 위치로 이동

모든 스크롤 값은 `measureContent()`의 `max`를 기준으로 범위를 제한한다.

## 정리

초기화 해제 시 이벤트 리스너, 이벤트 큐, 닫힘 타이머, 지연 프레임, CSS 상태를 모두 제거한다.
