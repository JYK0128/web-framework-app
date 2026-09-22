import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { getTermsControllerGetAdminTermGroupsV1QueryKey, getTermsControllerGetAdminTermsV1QueryKey, useTermsControllerCreateTermGroupV1, useTermsControllerCreateTermV1, useTermsControllerUpdateTermGroupV1, useTermsControllerUpdateTermV1 } from '#/.generated/api/endpoints/terms/terms';
import type { AdminTermGroupItemDto, AdminTermItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

type TermGroupEditorProps = ModalComponentProps<string> & {
  group?: AdminTermGroupItemDto
};

export function TermGroupEditorModal({ group, open, onOpenChange, close }: TermGroupEditorProps) {
  const queryClient = useQueryClient();
  const create = useTermsControllerCreateTermGroupV1();
  const update = useTermsControllerUpdateTermGroupV1();
  const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: {
      code: group?.code ?? '',
      title: group?.title ?? '',
      isRequired: group?.isRequired ?? true,
      sortOrder: group?.sortOrder ?? 0,
    },
    validators: {
      onSubmit: z.object({
        code: z.string().trim().min(1, '약관 그룹 코드를 입력해 주세요.'),
        title: z.string().trim().min(1, '약관 그룹 이름을 입력해 주세요.'),
        isRequired: z.boolean(),
        sortOrder: z.number().int().min(0),
      }),
    },
    onSubmit: async ({ value }) => {
      const data = {
        code: value.code.trim().toLowerCase(),
        title: value.title.trim(),
        isRequired: value.isRequired,
        sortOrder: value.sortOrder,
      };
      const id = group
        ? (await update.mutateAsync({ id: group.id, data })).data.id
        : (await create.mutateAsync({ data })).data.id;
      await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermGroupsV1QueryKey() });
      close?.(id);
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !pending) close?.();
      }}
    >
      <Modal.Content size="lg">
        <Modal.Header>
          <Modal.Title>{group ? '약관 그룹 수정' : '약관 그룹 생성'}</Modal.Title>
          <Modal.Description>약관의 공통 코드와 필수 여부를 설정합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-4"
          >
            <form.AppField name="title">
              {(field) => <field.Input label="그룹 이름" placeholder="예: 개인정보 처리방침" required />}
            </form.AppField>
            <form.AppField name="code">
              {(field) => <field.Input label="그룹 코드" placeholder="예: privacy-policy" disabled={Boolean(group)} required />}
            </form.AppField>
            <div className="
              grid grid-cols-1 gap-4
              sm:grid-cols-2
            "
            >
              <form.AppField name="sortOrder">
                {(field) => <field.Input type="number" label="정렬 순서" />}
              </form.AppField>
              <form.AppField name="isRequired">
                {(field) => <field.Checkbox label="필수 약관" showError={false} />}
              </form.AppField>
            </div>
            <Modal.Footer>
              <Button type="button" variant="outline" disabled={pending} onClick={() => close?.()}>취소</Button>
              <form.Submit disabled={pending}>{pending ? '저장 중...' : '저장'}</form.Submit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}

type TermEditorProps = ModalComponentProps<boolean> & {
  term?: AdminTermItemDto
  termGroupId: string
};

export function TermEditorModal({ term, termGroupId, open, onOpenChange, close }: TermEditorProps) {
  const queryClient = useQueryClient();
  const create = useTermsControllerCreateTermV1();
  const update = useTermsControllerUpdateTermV1();
  const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: {
      version: term?.version ?? '',
      content: term?.content ?? '',
    },
    validators: {
      onSubmit: z.object({
        version: z.string().trim().min(1, '버전을 입력해 주세요.'),
        content: z.string().trim().min(1, '약관 내용을 입력해 주세요.'),
      }),
    },
    onSubmit: async ({ value }) => {
      if (term) {
        await update.mutateAsync({
          id: term.id,
          data: { version: value.version.trim(), content: value.content.trim() },
        });
      }
      else {
        await create.mutateAsync({
          data: { termGroupId, version: value.version.trim(), content: value.content.trim() },
        });
      }
      await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsV1QueryKey() });
      close?.(true);
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !pending) close?.(false);
      }}
    >
      <Modal.Content
        size="xl"
        className="
          max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]
          sm:max-w-3xl
        "
      >
        <Modal.Header>
          <Modal.Title>{term ? '약관 버전 수정' : '약관 버전 추가'}</Modal.Title>
          <Modal.Description>게시 전 약관 내용을 작성하고 저장합니다.</Modal.Description>
        </Modal.Header>
        <Modal.ScrollBody>
          <form.AppForm>
            <FormLayout
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-4 py-2 pr-1"
            >
              <form.AppField name="version">
                {(field) => <field.Input label="버전" placeholder="예: 1.1" required />}
              </form.AppField>
              <form.AppField name="content">
                {(field) => <field.Textarea label="약관 내용" rows={12} placeholder="약관 내용을 입력해 주세요." required />}
              </form.AppField>
              <Modal.Footer>
                <Button type="button" variant="outline" disabled={pending} onClick={() => close?.(false)}>취소</Button>
                <form.Submit disabled={pending}>{pending ? '저장 중...' : '저장'}</form.Submit>
              </Modal.Footer>
            </FormLayout>
          </form.AppForm>
        </Modal.ScrollBody>
      </Modal.Content>
    </Modal>
  );
}

export function TermViewModal({ term, open, onOpenChange }: ModalComponentProps & { term: AdminTermItemDto }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content
        size="xl"
        className="
          max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]
          sm:max-w-3xl
        "
      >
        <Modal.Header>
          <Modal.Title>약관 상세</Modal.Title>
          <Modal.Description>
            {term.title}
            {' '}
            · v
            {term.version}
          </Modal.Description>
        </Modal.Header>
        <Modal.ScrollBody>
          <div className="grid gap-4 py-2">
            <div className="
              flex flex-wrap items-center gap-2 text-sm text-muted-foreground
            "
            >
              <span>{term.isPublished ? '게시됨' : '초안'}</span>
              <span>·</span>
              <span>{term.publishedAt ? '게시일 설정됨' : '게시되지 않음'}</span>
            </div>
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold">약관 내용</h3>
              <div className="
                scroll-y max-h-[50vh] whitespace-pre-wrap rounded-md border
                bg-muted/20 p-4 text-sm/6
              "
              >
                {term.content}
              </div>
            </div>
          </div>
        </Modal.ScrollBody>
        <Modal.Footer>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>닫기</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
