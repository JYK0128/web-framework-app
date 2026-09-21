import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { getTermsControllerGetAdminTermsV1QueryKey, useTermsControllerCreateTermV1, useTermsControllerDeleteTermV1, useTermsControllerGetAdminTermGroupsV1, useTermsControllerGetAdminTermsV1, useTermsControllerPublishTermV1, useTermsControllerUpdateTermV1 } from '#/.generated/api/endpoints/terms/terms';
import type { AdminTermGroupItemDto, AdminTermItemDto, CreateTermRequestDto, UpdateTermRequestDto } from '#/.generated/api/model';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { AppIcon } from '#/components/app/app-icon';
import { FormLayout, useAppForm } from '#/components/form';
import { PageSection } from '#/components/layout';

export const Route = createFileRoute('/_protected/_app/terms')({
  component: TermsManagementPage,
});

function TermsManagementPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data, isLoading } = useTermsControllerGetAdminTermsV1(
    { page: 1, limit: 100 },
    { query: { staleTime: 30_000 } },
  );
  const groupsQuery = useTermsControllerGetAdminTermGroupsV1({ query: { staleTime: 30_000 } });

  const terms = data?.data.items ?? [];
  const groups = groupsQuery.data?.data.items ?? [];

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsV1QueryKey() });
  };
  const createMutation = useTermsControllerCreateTermV1({
    mutation: {
      onSuccess: async () => {
        await invalidate();
      },
    },
  });
  const updateMutation = useTermsControllerUpdateTermV1({ mutation: { onSuccess: invalidate } });
  const publishMutation = useTermsControllerPublishTermV1({ mutation: { onSuccess: invalidate } });
  const deleteMutation = useTermsControllerDeleteTermV1({ mutation: { onSuccess: invalidate } });

  return (
    <div className="size-full scroll-y p-6">
      <PageSection
        icon="file-text"
        title="약관 관리"
        description="관리자 온보딩에 적용되는 약관 버전과 게시 상태를 관리합니다."
      >
        <PageSection.Content className="grid gap-4 pt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">새 약관 버전 추가</CardTitle>
              <CardDescription>그룹을 선택해 초안 버전을 등록합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTermForm
                groups={groups}
                pending={createMutation.isPending}
                onSubmit={async (value) => {
                  await createMutation.mutateAsync({ data: value });
                }}
              />
            </CardContent>
          </Card>
          {isLoading && <p className="text-sm text-muted-foreground">약관을 불러오는 중...</p>}
          {!isLoading && terms.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">등록된 약관이 없습니다.</CardContent></Card>
          )}
          {terms.map((term) => {
            const isEditing = editingId === term.id;
            return (
              <Card key={term.id}>
                <CardHeader className="
                  flex flex-row items-start justify-between gap-4
                "
                >
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AppIcon
                        name="file-check-2"
                        className="size-4 text-primary"
                      />
                      {term.title}
                    </CardTitle>
                    <CardDescription>
                      {term.code}
                      {' '}
                      · v
                      {term.version}
                      {' '}
                      ·
                      {term.isRequired ? '필수' : '선택'}
                    </CardDescription>
                  </div>
                  <span className={term.isPublished
                    ? 'text-xs text-emerald-600'
                    : `text-xs text-muted-foreground`}
                  >
                    {term.isPublished ? '게시됨' : '초안'}
                  </span>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {isEditing
                    ? (
                      <EditTermForm
                        term={term}
                        pending={updateMutation.isPending}
                        onCancel={() => setEditingId(null)}
                        onSubmit={async (value) => {
                          await updateMutation.mutateAsync({ id: term.id, data: value });
                          setEditingId(null);
                        }}
                      />
                    )
                    : (
                      <p className="
                        whitespace-pre-wrap text-sm text-muted-foreground
                      "
                      >
                        {term.content}
                      </p>
                    )}
                  {!isEditing && (
                    <div className="flex justify-end gap-2">
                      {!term.isPublished && <Button variant="outline" size="sm" onClick={() => setEditingId(term.id)}>수정</Button>}
                      {!term.isPublished && <Button size="sm" onClick={() => publishMutation.mutate({ id: term.id })}>게시</Button>}
                      {!term.isPublished && <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: term.id })}>삭제</Button>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </PageSection.Content>
      </PageSection>
    </div>
  );
}

function CreateTermForm({ groups, pending, onSubmit }: { groups: AdminTermGroupItemDto[], pending: boolean, onSubmit: (value: CreateTermRequestDto) => Promise<void> }) {
  const form = useAppForm({
    defaultValues: { termGroupId: '', version: '', content: '' },
    validators: {
      onSubmit: z.object({
        termGroupId: z.string().min(1, '약관 그룹을 선택해 주세요.'),
        version: z.string().trim().min(1, '버전을 입력해 주세요.'),
        content: z.string().trim().min(1, '약관 내용을 입력해 주세요.'),
      }),
    },
    onSubmit: async ({ value }) => {
      await onSubmit({ termGroupId: value.termGroupId, version: value.version.trim(), content: value.content.trim() });
      form.reset();
    },
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="grid gap-3"
      >
        <form.AppField name="termGroupId">
          {(field) => (
            <field.Select
              label="약관 그룹"
              placeholder="약관 그룹 선택"
              options={groups.map((group) => ({ label: `${group.title} (${group.code})`, value: group.id }))}
              disabled={pending || groups.length === 0}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="version">
          {(field) => <field.Input label="버전" placeholder="예: 1.1" disabled={pending} required />}
        </form.AppField>
        <form.AppField name="content">
          {(field) => <field.Textarea label="약관 내용" rows={4} disabled={pending} required />}
        </form.AppField>
        <div className="flex justify-end">
          <form.Submit disabled={pending || groups.length === 0}>초안 저장</form.Submit>
        </div>
      </FormLayout>
    </form.AppForm>
  );
}

function EditTermForm({ term, pending, onCancel, onSubmit }: { term: AdminTermItemDto, pending: boolean, onCancel: () => void, onSubmit: (value: UpdateTermRequestDto) => Promise<void> }) {
  const form = useAppForm({
    defaultValues: { version: term.version, content: term.content },
    validators: {
      onSubmit: z.object({
        version: z.string().trim().min(1, '버전을 입력해 주세요.'),
        content: z.string().trim().min(1, '약관 내용을 입력해 주세요.'),
      }),
    },
    onSubmit: async ({ value }) => {
      await onSubmit({ version: value.version.trim(), content: value.content.trim() });
    },
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="grid gap-3"
      >
        <form.AppField name="version">
          {(field) => <field.Input label="버전" disabled={pending} required />}
        </form.AppField>
        <form.AppField name="content">
          {(field) => <field.Textarea label="약관 내용" rows={5} disabled={pending} required />}
        </form.AppField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>취소</Button>
          <form.Submit disabled={pending}>저장</form.Submit>
        </div>
      </FormLayout>
    </form.AppForm>
  );
}
