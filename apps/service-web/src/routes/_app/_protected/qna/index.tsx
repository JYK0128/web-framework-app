import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';

import { getQnaControllerListV1QueryKey, useQnaControllerCreateV1, useQnaControllerListV1, useQnaControllerRemoveV1 } from '#/.generated/api/endpoints/qna/qna';
import type { QnaItem } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { FormLayout, useAppForm } from '#/components/form';
import { PageSection, SectionCard } from '#/components/layout';

export const Route = createFileRoute('/_app/_protected/qna/')({ component: QnaPage });

const statusLabels = { open: '접수', in_progress: '처리 중', answered: '답변 완료', closed: '종료' } as const;

function answerText(answer: QnaItem['answer']) {
  return typeof answer === 'string' ? answer : JSON.stringify(answer);
}

function QnaCreateForm() {
  const queryClient = useQueryClient();
  const create = useQnaControllerCreateV1();
  const form = useAppForm({
    defaultValues: { category: '', title: '', content: '' },
    validators: { onSubmit: z.object({ category: z.string().trim().min(1, '분류를 입력해 주세요.'), title: z.string().trim().min(1, '제목을 입력해 주세요.'), content: z.string().trim().min(1, '문의 내용을 입력해 주세요.') }) },
    onSubmit: async ({ value }) => {
      await create.mutateAsync({ data: { category: value.category.trim(), title: value.title.trim(), content: value.content.trim() } });
      await queryClient.invalidateQueries({ queryKey: getQnaControllerListV1QueryKey() });
      form.reset();
    },
  });
  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="grid gap-4"
      >
        <form.AppField name="category">{(field) => <field.Input label="분류" placeholder="예: 계정, 결제, 이용 문의" required />}</form.AppField>
        <form.AppField name="title">{(field) => <field.Input label="제목" placeholder="문의 제목을 입력해 주세요." required />}</form.AppField>
        <form.AppField name="content">{(field) => <field.Textarea label="문의 내용" rows={7} placeholder="문의 내용을 자세히 입력해 주세요." required />}</form.AppField>
        <div className="flex justify-end"><form.Submit disabled={create.isPending}>{create.isPending ? '등록 중...' : '문의 등록'}</form.Submit></div>
      </FormLayout>
    </form.AppForm>
  );
}

function QnaItemCard({ item, onDelete }: { item: QnaItem, onDelete: (item: QnaItem) => void }) {
  return (
    <article className="grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="
          flex flex-wrap items-center gap-2 text-xs text-muted-foreground
        "
        >
          <span>{item.category}</span>
          <span>·</span>
          <span>{statusLabels[item.status]}</span>
          <span>·</span>
          <span>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>
        {item.status === 'open' && <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(item)}>삭제</Button>}
      </div>
      <h3 className="font-semibold">{item.title}</h3>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.content}</p>
      {item.answer && (
        <div className="rounded-md bg-primary/5 p-3 text-sm">
          <p className="mb-1 font-semibold text-primary">답변</p>
          <p className="whitespace-pre-wrap">
            {answerText(item.answer)}
          </p>
        </div>
      )}
    </article>
  );
}

function QnaPage() {
  const queryClient = useQueryClient();
  const query = useQnaControllerListV1({ page: 1, limit: 50 });
  const remove = useQnaControllerRemoveV1();
  const items = useMemo(() => query.data?.data.items ?? [], [query.data]);
  const handleDelete = async (item: QnaItem) => {
    if (!await confirm({ title: '문의 삭제', description: `“${item.title}” 문의를 삭제하시겠습니까?`, tone: 'danger' })) return;
    await remove.mutateAsync({ id: item.id });
    await queryClient.invalidateQueries({ queryKey: getQnaControllerListV1QueryKey() });
  };
  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="message-circle-question" title="Q&A" description="문의 내용을 등록하고 답변을 확인할 수 있습니다.">
        <PageSection.Content className="
          mx-auto grid w-full max-w-5xl gap-6 pt-2
          md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]
        "
        >
          <SectionCard textSize="sm" title="문의 등록" description="궁금한 점이나 도움이 필요한 내용을 남겨 주세요.">
            <SectionCard.Content className="p-4">
              <QnaCreateForm />
            </SectionCard.Content>
          </SectionCard>
          <SectionCard textSize="sm" title="내 문의" description="등록한 문의의 처리 상태와 답변을 확인합니다.">
            <SectionCard.Content className="grid gap-3 p-4">
              {query.isLoading && <Skeleton className="h-32 w-full" />}
              {query.isError && (
                <p className="text-sm text-destructive">
                  문의 목록을 불러오지 못했습니다.
                </p>
              )}
              {!query.isLoading && !query.isError && items.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  등록한 문의가 없습니다.
                </p>
              )}
              {items.map((item) => <QnaItemCard key={item.id} item={item} onDelete={(value) => void handleDelete(value)} />)}
            </SectionCard.Content>
          </SectionCard>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
