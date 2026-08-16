import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';

import { getFaqsControllerGetAdminFaqsQueryKey, getFaqsControllerGetFaqsQueryKey, useFaqsControllerCreateFaq, useFaqsControllerUpdateFaq } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';

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

  const isEditing = Boolean(faq);
  const createMutation = useFaqsControllerCreateFaq();
  const updateMutation = useFaqsControllerUpdateFaq();

  const faqForm = useAppForm({
    defaultValues: {
      category: faq?.category ?? '서비스 이용',
      question: faq?.question ?? '',
      answer: faq?.answer ?? '',
      order: faq?.order ?? 0,
      isPublished: faq?.isPublished ?? true,
    },
    onSubmit: async ({ value }) => {
      const payload = {
        category: value.category.trim(),
        question: value.question.trim(),
        answer: value.answer.trim(),
        order: Number(value.order) || 0,
        isPublished: value.isPublished,
      };

      if (isEditing && faq) {
        await updateMutation.mutateAsync({ id: faq.id, data: payload });
      }
      else {
        await createMutation.mutateAsync({ data: payload });
      }

      await queryClient.invalidateQueries({ queryKey: getFaqsControllerGetAdminFaqsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getFaqsControllerGetFaqsQueryKey() });
      onClose();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <faqForm.AppForm>
      <FormLayout
        onSubmit={() => void faqForm.handleSubmit()}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-3">
          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <faqForm.AppField name="category">
              {(field) => (
                <field.Input
                  label={t('faq.category')}
                  placeholder={t('faq.categoryPlaceholder')}
                  required
                />
              )}
            </faqForm.AppField>
            <div className="flex flex-wrap items-center gap-1">
              {COMMON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => faqForm.setFieldValue('category', cat)}
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
          <faqForm.AppField name="question">
            {(field) => (
              <field.Input
                label={t('faq.question')}
                placeholder={t('faq.questionPlaceholder')}
                required
              />
            )}
          </faqForm.AppField>

          {/* Answer */}
          <faqForm.AppField name="answer">
            {(field) => (
              <field.Textarea
                label={t('faq.answer')}
                placeholder={t('faq.answerPlaceholder')}
                rows={5}
                required
              />
            )}
          </faqForm.AppField>

          {/* Order & Publish switch */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <faqForm.AppField name="order">
              {(field) => (
                <field.Input
                  type="number"
                  label={t('faq.order')}
                  description={t('faq.orderDescription')}
                />
              )}
            </faqForm.AppField>

            <faqForm.AppField name="isPublished">
              {(field) => (
                <field.Switch
                  label={t('faq.isPublished')}
                  className="mt-2"
                />
              )}
            </faqForm.AppField>
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
      </FormLayout>
    </faqForm.AppForm>
  );
}
