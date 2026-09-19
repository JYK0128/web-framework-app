import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { getTermsControllerGetAdminTermsV1QueryKey, useTermsControllerCreateTermV1, useTermsControllerDeleteTermV1, useTermsControllerGetAdminTermGroupsV1, useTermsControllerGetAdminTermsV1, useTermsControllerPublishTermV1, useTermsControllerUpdateTermV1 } from '#/.generated/api/endpoints/terms/terms';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea } from '#/.generated/shadcn/components/ui';
import { AppIcon } from '#/components/app/app-icon';
import { PageSection } from '#/components/layout';

export const Route = createFileRoute('/_protected/terms')({
  component: TermsManagementPage,
});

function TermsManagementPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');
  const [newGroupId, setNewGroupId] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [newContent, setNewContent] = useState('');
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
        setNewVersion('');
        setNewContent('');
      },
    },
  });
  const updateMutation = useTermsControllerUpdateTermV1({ mutation: { onSuccess: invalidate } });
  const publishMutation = useTermsControllerPublishTermV1({ mutation: { onSuccess: invalidate } });
  const deleteMutation = useTermsControllerDeleteTermV1({ mutation: { onSuccess: invalidate } });

  const startEditing = (term: typeof terms[number]) => {
    setEditingId(term.id);
    setVersion(term.version);
    setContent(term.content);
  };

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
            <CardContent className="grid gap-3">
              <select
                className="
                  h-9 rounded-md border border-input bg-background px-3 text-sm
                "
                value={newGroupId}
                onChange={(event) => setNewGroupId(event.target.value)}
              >
                <option value="">약관 그룹 선택</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                    {' '}
                    (
                    {group.code}
                    )
                  </option>
                ))}
              </select>
              <Input value={newVersion} onChange={(event) => setNewVersion(event.target.value)} placeholder="버전 (예: 1.1)" />
              <Textarea value={newContent} onChange={(event) => setNewContent(event.target.value)} rows={4} placeholder="약관 내용" />
              <div className="flex justify-end">
                <Button
                  disabled={createMutation.isPending || !newGroupId || !newVersion.trim() || !newContent.trim()}
                  onClick={() => createMutation.mutate({ data: { termGroupId: newGroupId, version: newVersion.trim(), content: newContent.trim() } })}
                >
                  초안 저장
                </Button>
              </div>
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
                      <div className="grid gap-3">
                        <Input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="버전" />
                        <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} placeholder="약관 내용" />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                          <Button
                            disabled={updateMutation.isPending || !version.trim() || !content.trim()}
                            onClick={() => updateMutation.mutate({ id: term.id, data: { version: version.trim(), content: content.trim() } }, { onSuccess: () => setEditingId(null) })}
                          >
                            저장
                          </Button>
                        </div>
                      </div>
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
                      {!term.isPublished && <Button variant="outline" size="sm" onClick={() => startEditing(term)}>수정</Button>}
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
