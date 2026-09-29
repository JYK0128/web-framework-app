import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { getOperatorTermsControllerGetOperatorTermGroupsV1QueryKey, getOperatorTermsControllerGetOperatorTermsV1QueryKey, useOperatorTermsControllerCreateOperatorTermGroupV1, useOperatorTermsControllerCreateOperatorTermV1, useOperatorTermsControllerUpdateOperatorTermGroupV1, useOperatorTermsControllerUpdateOperatorTermV1 } from '#/.generated/api/endpoints/operator-terms/operator-terms';
import type { OperatorTermGroupItemDto, OperatorTermItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';
import { publishScheduleSchema, toPublishedAt } from '#/components/terms/publish-schedule';

type TermGroupEditorProps = ModalComponentProps<string> & {
  group?: OperatorTermGroupItemDto
};

export function TermGroupEditorModal({ group, open, onOpenChange, close }: TermGroupEditorProps) {
  const queryClient = useQueryClient();
  const create = useOperatorTermsControllerCreateOperatorTermGroupV1();
  const update = useOperatorTermsControllerUpdateOperatorTermGroupV1();
  const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: {
      title: group?.title ?? '',
      isRequired: group?.isRequired ?? true,
      sortOrder: group?.sortOrder ?? 0,
    },
    validators: {
      onSubmit: z.object({
        title: z.string().trim().min(1, '약관 그룹 이름을 입력해 주세요.'),
        isRequired: z.boolean(),
        sortOrder: z.number().int().min(0),
      }),
    },
    onSubmit: async ({ value }) => {
      const data = {
        title: value.title.trim(),
        isRequired: value.isRequired,
        sortOrder: value.sortOrder,
      };
      const id = group
        ? (await update.mutateAsync({ id: group.id, data })).data.id
        : (await create.mutateAsync({ data })).data.id;
      await queryClient.invalidateQueries({ queryKey: getOperatorTermsControllerGetOperatorTermGroupsV1QueryKey() });
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
      <Modal.Content
        size="lg"
        className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]"
      >
        <Modal.Header>
          <Modal.Title>{group ? '약관 그룹 수정' : '약관 그룹 생성'}</Modal.Title>
          <Modal.Description>약관 그룹 이름과 필수 동의 여부를 설정합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <FormLayout
              id="operator-term-group-form"
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-5 py-2 pr-1"
            >
              <div className="
                grid grid-cols-1 gap-4
                sm:grid-cols-[minmax(0,1fr)_8rem]
              "
              >
                <form.AppField name="title">
                  {(field) => <field.Input label="그룹 이름" placeholder="예: 개인정보 처리방침" required />}
                </form.AppField>
                <form.AppField name="sortOrder">
                  {(field) => <field.Input type="number" label="정렬 순서" placeholder="정렬 순서를 입력해 주세요." />}
                </form.AppField>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <form.AppField name="isRequired">
                  {(field) => <field.Checkbox label="필수 동의 약관" description="운영자가 이용 전 반드시 동의해야 하는 약관입니다." showError={false} />}
                </form.AppField>
              </div>
            </FormLayout>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" disabled={pending} onClick={() => close?.()}>취소</Button>
            <form.Submit form="operator-term-group-form" disabled={pending}>{pending ? '저장 중...' : '저장'}</form.Submit>
          </Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}

type TermEditorProps = ModalComponentProps<boolean> & {
  term?: OperatorTermItemDto
  termGroupId: string
  termGroupTitle: string
};

export function TermEditorModal({ term, termGroupId, termGroupTitle, open, onOpenChange, close }: TermEditorProps) {
  const queryClient = useQueryClient();
  const create = useOperatorTermsControllerCreateOperatorTermV1();
  const update = useOperatorTermsControllerUpdateOperatorTermV1();
  const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: {
      version: term?.version ?? '',
      publishedAt: term?.publishedAt ?? '',
      reason: term?.reason ?? '',
      summary: term?.summary ?? '',
      isNoticeRequired: term?.isNoticeRequired ?? false,
      content: term?.content ?? '',
    },
    validators: {
      onSubmit: z.object({
        version: z.string().trim().min(1, '버전을 입력해 주세요.'),
        publishedAt: publishScheduleSchema,
        reason: z.string().trim().min(1, '등록 사유를 입력해 주세요.'),
        summary: z.string().trim().min(1, '변경 요약을 입력해 주세요.'),
        isNoticeRequired: z.boolean(),
        content: z.string().trim().min(1, '약관 내용을 입력해 주세요.'),
      }),
    },
    onSubmit: async ({ value }) => {
      if (term) {
        await update.mutateAsync({
          id: term.id,
          data: { version: value.version.trim(), publishedAt: toPublishedAt(value.publishedAt), reason: value.reason.trim(), summary: value.summary.trim(), isNoticeRequired: value.isNoticeRequired, content: value.content.trim() },
        });
      }
      else {
        await create.mutateAsync({
          data: { termGroupId, version: value.version.trim(), publishedAt: toPublishedAt(value.publishedAt) ?? undefined, reason: value.reason.trim(), summary: value.summary.trim(), isNoticeRequired: value.isNoticeRequired, content: value.content.trim() },
        });
      }
      await queryClient.invalidateQueries({ queryKey: getOperatorTermsControllerGetOperatorTermsV1QueryKey() });
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
          <Modal.Description>
            {termGroupTitle}
            {' '}
            그룹의 약관 버전을 작성합니다.
          </Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <Modal.Body className="scroll-y">
            <FormLayout
              id="operator-term-editor-form"
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-4 py-2 pr-1"
            >
              <div className="
                grid gap-4
                sm:grid-cols-2
              "
              >
                <form.AppField name="version">
                  {(field) => <field.Input label="버전" placeholder="예: 1.1" required />}
                </form.AppField>
                <form.AppField name="publishedAt">
                  {(field) => <field.DatetimePicker label="게시 예정일" placeholder="게시 예정일을 선택해 주세요" emptyValue="" />}
                </form.AppField>
              </div>
              <section className="grid gap-4 border-t pt-4">
                <h3 className="text-sm font-semibold">변경 내용</h3>
                <form.AppField name="reason">
                  {(field) => <field.Input label="등록 사유" placeholder="등록 사유를 입력해 주세요." required />}
                </form.AppField>
                <form.AppField name="summary">
                  {(field) => <field.Textarea label="변경 요약" placeholder="변경 내용을 요약해 주세요." rows={3} required />}
                </form.AppField>
                <form.AppField name="content">
                  {(field) => <field.Textarea label="본문" rows={12} placeholder="약관 내용을 입력해 주세요." required />}
                </form.AppField>
              </section>
              <div className="rounded-lg border bg-muted/20 p-4">
                <form.AppField name="isNoticeRequired">
                  {(field) => <field.Checkbox label="약관 고지" description="이 버전을 고지 대상으로 표시합니다." showError={false} />}
                </form.AppField>
              </div>
            </FormLayout>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="outline" disabled={pending} onClick={() => close?.(false)}>취소</Button>
            <form.Submit form="operator-term-editor-form" disabled={pending}>{pending ? '저장 중...' : '저장'}</form.Submit>
          </Modal.Footer>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}

export function TermViewModal({ term, open, onOpenChange }: ModalComponentProps & { term: OperatorTermItemDto }) {
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
          <Modal.Description>약관 제목과 내용을 확인합니다.</Modal.Description>
        </Modal.Header>
        <Modal.Body className="scroll-y">
          <div className="grid gap-4 py-2">
            <section className="grid gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-2 border-b pb-4">
                <span className="text-xs font-medium text-muted-foreground">약관 제목</span>
                <h3 className="
                  text-base font-semibold wrap-break-word text-foreground
                "
                >
                  {term.title}
                </h3>
                <div className="
                  flex flex-wrap items-center gap-2 text-xs
                  text-muted-foreground
                "
                >
                  <span>
                    v
                    {term.version}
                  </span>
                  <span>·</span>
                  <span>{term.isPublished ? '게시됨' : '초안'}</span>
                  <span>·</span>
                  <span>{term.isRequired ? '필수 동의' : '선택 동의'}</span>
                </div>
              </div>
              <div className="grid gap-2 border-b pb-4">
                <h4 className="text-xs font-medium text-muted-foreground">게시일</h4>
                <p className="text-sm">{term.publishedAt ? new Date(term.publishedAt).toLocaleString('ko-KR') : '미정'}</p>
                <h4 className="text-xs font-medium text-muted-foreground">고지 여부</h4>
                <p className="text-sm">{term.isNoticeRequired ? '고지' : '고지 안 함'}</p>
                <h4 className="text-xs font-medium text-muted-foreground">사유</h4>
                <p className="text-sm wrap-break-word">{term.reason || '—'}</p>
                <h4 className="text-xs font-medium text-muted-foreground">요약</h4>
                <p className="text-sm whitespace-pre-wrap wrap-break-word">{term.summary || '—'}</p>
              </div>
              <div className="grid gap-2">
                <h4 className="text-xs font-medium text-muted-foreground">약관 내용</h4>
                <p className="
                  text-sm/6 whitespace-pre-wrap wrap-break-word text-foreground
                "
                >
                  {term.content}
                </p>
              </div>
            </section>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>닫기</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
