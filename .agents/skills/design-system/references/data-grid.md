# DataGrid

## 소스

- 구현: `template/react-starter-kit/src/components/data-grid/`
- 상태 훅: `use-data-grid.ts`
- 컬럼 도구: `data-grid-tool-header.tsx`, `data-grid-tool-column.tsx`

## 사용 규칙

- 컬럼은 `@tanstack/react-table`의 `createColumnHelper<T>()`와 생성된 API 모델 타입을 사용한다.
- 테이블 상태는 `useDataGrid`로 구성하고, 검색·정렬·페이징 콜백은 해당 화면의 API 요청과 연결한다.
- 표준 조합은 `DataGridToolbar`, `DataGrid`, `DataTablePagination`이다.
- 현재 `DataGrid` props는 `table`, `hideHeader`, `hasMore`, `onScrollEnd`, `onRowClick`이다.
- `loading`은 외부 prop이 아니다. 무한 스크롤의 추가 로딩 상태는 `DataGrid` 내부가 관리하고, 최초 API 로딩은 화면의 `PageSection.Loading` 등 화면 레벨에서 처리한다.
- `totalCount`는 API 응답 메타데이터다. 필요하면 TanStack Table의 `rowCount` 옵션이나 `DataTablePagination`의 `rowCount`에 전달하며 `DataGrid`에는 전달하지 않는다.
- `recordName`은 지원된 API가 아니며, 과거 휴무일 화면에만 잘못 전달되었다가 제거된 잔재다. 새 사용처에서 추가하지 않는다.
- 무한 스크롤은 `hasMore`와 `onScrollEnd`를 사용한다. 로딩 표시와 행 렌더링 방식은 구현 소스를 확인한다.
- 컬럼의 정렬·필터 가능 여부와 도구 컬럼은 실제 컬럼 정의 및 `data-grid-tool-header.tsx`의 계약을 따른다.
