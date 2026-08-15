import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { getFaqsControllerGetAdminFaqsQueryKey, getFaqsControllerGetFaqsQueryKey, useFaqsControllerCreateFaq, useFaqsControllerUpdateFaq } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Switch, Textarea } from '#/.generated/shadcn/components/ui';

interface FaqEditorDialogProps {
  open: boolean
  faq: FaqItemDto | null
  onOpenChange: (open: boolean) => void
}

const COMMON_CATEGORIES = ['계정/인증', '서비스 이용', '보안/권한', '결제/구독', '기타'];

export function FaqEditorDialog({ open, faq, onOpenChange }: FaqEditorDialogProps) {
  const { t } = useI18n();
  const isEditing = Boolean(faq);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('faq.editFaq') : t('faq.createFaq')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'FAQ 정보를 수정합니다.'
              : '새로운 자주 묻는 질문과 답변을 등록합니다.'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <FaqEditorForm
            key={faq?.id ?? 'new'}
            faq={faq}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FaqEditorForm({
  faq,
  onClose,
}: {
  faq: FaqItemDto | null
  onClose: () => void
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState(faq?.category ?? '서비스 이용');
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer] = useState(faq?.answer ?? '');
  const [order, setOrder] = useState(faq?.order ?? 0);
  const [isPublished, setIsPublished] = useState(faq?.isPublished ?? true);
  const [error, setError] = useState('');

  const isEditing = Boolean(faq);
  const createMutation = useFaqsControllerCreateFaq();
  const updateMutation = useFaqsControllerUpdateFaq();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!category.trim() || !question.trim() || !answer.trim()) {
      setError(t('validation.isNotEmpty'));
      return;
    }

    try {
      if (isEditing && faq) {
        await updateMutation.mutateAsync({
          id: faq.id,
          data: {
            category: category.trim(),
            question: question.trim(),
            answer: answer.trim(),
            order,
            isPublished,
          },
        });
      }
      else {
        await createMutation.mutateAsync({
          data: {
            category: category.trim(),
            question: question.trim(),
            answer: answer.trim(),
            order,
            isPublished,
          },
        });
      }

      await queryClient.invalidateQueries({ queryKey: getFaqsControllerGetAdminFaqsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getFaqsControllerGetFaqsQueryKey() });
      onClose();
    }
    catch (err: unknown) {
      setError((err as Error).message || '저장에 실패했습니다.');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      {error && (
        <div className="
          rounded-md bg-destructive/15 p-3 text-xs font-medium text-destructive
        "
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="faq-category">{t('faq.category')}</Label>
          <Input
            id="faq-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t('faq.categoryPlaceholder')}
            required
          />
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {COMMON_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className="
                  rounded-md bg-muted px-2 py-0.5 text-[11px]
                  text-muted-foreground
                  hover:bg-accent hover:text-accent-foreground
                "
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="faq-question">{t('faq.question')}</Label>
          <Input
            id="faq-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('faq.questionPlaceholder')}
            required
          />
        </div>

        {/* Answer */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="faq-answer">{t('faq.answer')}</Label>
          <Textarea
            id="faq-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('faq.answerPlaceholder')}
            rows={5}
            required
          />
        </div>

        {/* Order & Publish switch */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faq-order">{t('faq.order')}</Label>
            <Input
              id="faq-order"
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
            <span className="text-[11px] text-muted-foreground">
              {t('faq.orderDescription')}
            </span>
          </div>

          <div className="flex flex-col justify-center gap-2">
            <Label htmlFor="faq-published">{t('faq.isPublished')}</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="faq-published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <span className="text-xs font-semibold">
                {isPublished ? t('faq.published') : t('faq.unpublished')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t('common.processing') : t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
