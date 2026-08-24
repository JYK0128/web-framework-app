---
name: design-system
description: >-
  Standard UI component usage guide and code recipes for the repository,
  covering TanStack Table DataGrid, TanStack Form components (FormInput, StepForm, useAppForm),
  Dialog layouts, standard Flex/Grid layout rules, and system feedback dialogs.
---

# UI 표준 컴포넌트 사용 가이드

본 문서는 프로젝트에서 제공하는 **공통 UI 표준 컴포넌트들의 실전 사용법 및 코드 레시피**를 정리한 가이드임.

---

## 1. 데이터 그리드 (`DataGrid`) 사용법

`src/components/data-grid/`의 컴포넌트와 `createColumnHelper`를 사용해 서버/클라이언트 페이징 테이블을 구성함.

### 1.1. 컬럼 정의 (`createColumnHelper`)

```tsx
import { createColumnHelper } from '@tanstack/react-table';
import type { UserItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';

const columnHelper = createColumnHelper<UserItemDto>();

const columns = [
  columnHelper.accessor('name', {
    header: '이름',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  }),
  columnHelper.accessor('role', {
    header: '역할',
    cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
  }),
  columnHelper.display({
    id: 'actions',
    header: '관리',
    enableSorting: false,
    cell: ({ row }) => (
      <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
        수정
      </Button>
    ),
  }),
];
```

### 1.2. 테이블 렌더링 (`DataGrid` + `DataGridToolbar` + `DataTablePagination`)

```tsx
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';

function UserListPage() {
  const table = useDataGrid({
    data: data?.items ?? [],
    columns,
    pageCount: data?.totalPages ?? 1,
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
  });

  return (
    <div className="flex flex-col gap-4">
      <DataGridToolbar
        table={table}
        searchPlaceholder="이름 또는 이메일 검색..."
        onGlobalFilterChange={handleSearchChange}
      />
      <DataGrid
        table={table}
        loading={isFetching}
        totalCount={data?.totalCount ?? 0}
        recordName="사용자"
      />
      <DataTablePagination table={table} />
    </div>
  );
}
```

---

## 2. 폼 시스템 (`src/components/form/`) 사용법

`useAppForm`과 `FormLayout`, 그리고 16종 전용 필드 컴포넌트를 사용해 폼을 구성함.

### 2.1. 기본 폼 작성 (`useAppForm` + `FormLayout` + `AppField`)

```tsx
import { FormLayout, useAppForm } from '#/components/form';
import { Button } from '#/.generated/shadcn/components/ui';

function ExampleFormDialog({ open, onClose, onSave }: Props) {
  const form = useAppForm({
    defaultValues: {
      title: '',
      content: '',
      category: 'general',
      isPublished: true,
      expiresAt: null as string | null,
    },
    onSubmit: async ({ value }) => {
      await onSave(value);
      onClose();
    },
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="grid gap-4"
      >
        <form.AppField name="title">
          {(field) => <field.Input label="제목" required placeholder="공지 제목 입력" />}
        </form.AppField>

        <form.AppField name="content">
          {(field) => <field.Textarea label="내용" required rows={4} />}
        </form.AppField>

        <form.AppField name="category">
          {(field) => (
            <field.Select
              label="카테고리"
              options={[
                { label: '일반', value: 'general' },
                { label: '공지', value: 'notice' },
              ]}
            />
          )}
        </form.AppField>

        <form.AppField name="expiresAt">
          {(field) => <field.DateTimePicker label="만료일시" placeholder="만료일 선택" />}
        </form.AppField>

        <form.AppField name="isPublished">
          {(field) => <field.Switch label="즉시 공개" />}
        </form.AppField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>취소</Button>
          <Button type="submit">저장</Button>
        </div>
      </FormLayout>
    </form.AppForm>
  );
}
```

### 2.2. 제공 폼 필드 컴포넌트 목록

| 분류 | 컴포넌트 호출 방식 | 주요 Props |
| :--- | :--- | :--- |
| **텍스트/숫자** | `<field.Input />` | `label`, `required`, `type`, `leftSide`, `rightSide`, `description` |
| **장문 텍스트** | `<field.Textarea />` | `label`, `required`, `rows`, `placeholder` |
| **셀렉트 드롭다운** | `<field.Select />` | `label`, `options: { label, value }[]`, `placeholder` |
| **검색형 콤보박스** | `<field.Combobox />` | `label`, `options: { label, value }[]`, `searchPlaceholder` |
| **단일/다중 체크** | `<field.Checkbox />`, `<field.CheckGroup />` | `label`, `options: { label, value }[]`, `orientation: 'vertical' \| 'horizontal'` |
| **라디오 그룹** | `<field.RadioGroup />` | `label`, `options: { label, value }[]` |
| **스위치 토글** | `<field.Switch />` | `label`, `description` |
| **날짜/시간 선택** | `<field.DatePicker />`, `<field.DateTimePicker />`, `<field.TimePicker />` | `label`, `placeholder` |
| **기간 선택** | `<field.DateRangePicker />` | `label`, `placeholder` |
| **OTP 인증번호** | `<field.OtpInput />` | `label`, `maxLength: 6` |
| **파일 업로드** | `<field.FileInput />` | `label`, `accept`, `maxSize` |

---

## 3. 다단계 폼 (`StepForm`) 사용법

`useAppForm` 인스턴스와 `StepFormStep[]` 배열을 정의하여 단계별 유효성 검증 및 진행 폼을 구성함.

```tsx
import { StepForm, StepFormContent, StepFormFooter, StepFormHeader, type StepFormStep, useAppForm } from '#/components/form';

export function ExampleWizardForm() {
  const form = useAppForm({
    defaultValues: { name: '', email: '', role: 'user' },
    onSubmit: async ({ value }) => {
      await api.save(value);
    },
  });

  const steps: StepFormStep[] = [
    {
      title: '기본 정보',
      content: (
        <form.AppField name="name">
          {(field) => <field.Input label="이름" required />}
        </form.AppField>
      ),
    },
    {
      title: '계정 설정',
      content: (
        <form.AppField name="email">
          {(field) => <field.Input label="이메일" type="email" required />}
        </form.AppField>
      ),
    },
  ];

  return (
    <StepForm form={form} steps={steps}>
      <StepFormHeader />
      <StepFormContent />
      <StepFormFooter />
    </StepForm>
  );
}
```

---

## 4. 시스템 피드백 (`SystemDialog` & `Toast`) 사용법

### 4.1. 확인/경고 다이얼로그 (`confirm`)

삭제, 차단 등 파괴적 액션 전 사용자 동의를 요청할 때 사용함.

```tsx
import { confirm } from '#/components/app/system-dialog';

async function handleDelete(id: string) {
  const ok = await confirm({
    title: '항목 삭제',
    description: '정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    confirmText: '삭제',
    cancelText: '취소',
    variant: 'destructive',
  });

  if (ok) {
    await deleteMutation.mutateAsync({ id });
  }
}
```

### 4.2. 토스트 알림 (`sonner`)

작업 완료 또는 실패 메시지 노출 시 사용함.

```tsx
import { toast } from 'sonner';

toast.success('저장되었습니다.');
toast.error('오류가 발생했습니다.');
```

---

## 5. 레이아웃 표준 규칙 (`Flex` & `Grid`)

프로젝트 내 페이지, 카드, 모달 등 일관된 레이아웃 구성 규칙.

### 5.1. 세로 배치 컨테이너 (`Grid` + `grid-rows-[..._1fr]`)

페이지 전체 뷰, 모달 다이얼로그, 고정 높이 카드 등 **세로 방향 레이아웃**은 `Grid`를 기본으로 사용함.

- **원칙**: 고정 크기를 갖는 헤더/툴바/푸터 영역은 `auto`, 가변 크기를 가지며 스크롤되어야 하는 메인 콘텐츠 영역은 `1fr`로 지정.
- **스크롤바 가장자리 정렬 원칙**: 최상위 Grid 컨테이너에는 `pt-6 pl-6 pr-0 pb-0`을 적용하여 스크롤바가 우측 가장자리에 딱 붙도록 하고, 상단 고정 영역(헤더/탭) 및 내부 스크롤 본문(`<main className="scroll-y pr-6 pb-6">`)에 `pr-6`을 적용하여 정렬 기준선을 맞춤.
- **주요 패턴**:
  - `mx-auto grid size-full max-w-7xl grid-rows-[auto_auto_1fr] gap-6 overflow-hidden pt-6 pl-6 pr-0 pb-0` (헤더 + 탭 + 내부 스크롤 본문)
  - `mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] gap-6 overflow-hidden pt-6 pl-6 pr-0 pb-0` (헤더 + 내부 스크롤 본문)

```tsx
// 페이지 루트 표준 레이아웃 예시 (헤더 + 탭 + 본문 스크롤)
<div className="mx-auto grid size-full max-w-7xl grid-rows-[auto_auto_1fr] gap-6 overflow-hidden pt-6 pl-6 pr-0 pb-0">
  {/* Row 1 (auto): 페이지 헤더 (pr-6 적용) */}
  <div className="flex items-center justify-between pr-6">
    <h1 className="text-2xl font-bold">페이지 제목</h1>
  </div>

  {/* Row 2 (auto): 탭 / 툴바 (pr-6 적용) */}
  <div className="pr-6">
    <Tabs ... />
  </div>

  {/* Row 3 (1fr): 메인 가변 데이터 영역 (scroll-y + pr-6 pb-6) */}
  <main className="scroll-y pr-6 pb-6">
    ...
  </main>
</div>
```


### 5.2. 가로 배치 컨텐츠 (`Flex`)

헤더의 제목/버튼 그룹, 툴바 필터 항목, 버튼 내 아이콘/텍스트 등 **가로 방향 인라인 배치**는 `Flex`를 사용함.

- **원칙**:
  - 수직 중앙 정렬: `flex items-center`
  - 좌우 분할 배치: `flex items-center justify-between`
  - 아이콘 축소 방지: `shrink-0`
  - 텍스트 넘침 방지: `truncate` / `min-w-0`

```tsx
// 가로 배치 헤더 / 툴바 예시
<div className="flex items-center justify-between gap-4">
  <div className="flex items-center gap-2 min-w-0">
    <Icon className="size-5 shrink-0 text-primary" />
    <span className="font-semibold truncate">타이틀</span>
  </div>
  <div className="flex items-center gap-2 shrink-0">
    <Button size="sm">추가</Button>
  </div>
</div>
```
