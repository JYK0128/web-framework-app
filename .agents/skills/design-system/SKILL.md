---
name: design-system
description: >-
  Standard UI component usage guide and code recipes for the repository,
  covering TanStack Table DataGrid, TanStack Form components (FormInput, StepForm, useAppForm),
  Dialog layouts, and system feedback dialogs.
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
| **단일/다중 체크** | `<field.Checkbox />`, `<field.CheckGroup />` | `label`, `orientation: 'vertical' \| 'horizontal'` |
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
