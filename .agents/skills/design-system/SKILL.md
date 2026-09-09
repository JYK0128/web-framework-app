---
name: design-system
description: >-
  Use when adding or changing React UI that uses this repository's shared
  DataGrid, form, dialog/feedback, or layout components. Do not apply to
  generic React, CSS, or generated-code work that does not touch these primitives.
---

# UI 표준 컴포넌트

공통 UI 컴포넌트를 재사용하고, 실제 export와 타입에 맞는 코드를 작성한다.

## 적용 범위

현재 작업에 해당하는 참고 문서만 읽는다.

- DataGrid, 컬럼, 검색, 정렬, 페이징 → [DataGrid](references/data-grid.md)
- `useAppForm`, `AppField`, `StepForm`, 필드 → [Forms](references/forms.md)
- `PageSection`, `ScreenLayout`, Dialog, Toast, 스크롤 레이아웃 → [Layout and feedback](references/layout-feedback.md)

## 규칙

1. 컴포넌트 사용 전 실제 소스의 export와 props 타입을 확인한다. 동작이 바뀌면 참고 문서도 갱신한다.
2. 이미 제공되는 공통 컴포넌트가 있으면 새 래퍼나 임의의 UI 패턴을 만들지 않는다.
3. API Query/Mutation의 성공·실패 Toast는 전역 처리 규칙을 확인하고, 컴포넌트에서 중복 호출하지 않는다. 순수 클라이언트 동작의 Toast는 수동으로 호출할 수 있다.
4. 레이아웃은 `flex = 가로 배치`, `grid = 세로 영역 분할(auto 1fr)`을 기본으로 한다. 전역 `* { min-h-0 min-w-0 }`와 `scroll-y`·`scroll-x`·`scroll` 유틸리티를 우선 활용하고, 실제 스크롤 컨테이너를 확인한다.
