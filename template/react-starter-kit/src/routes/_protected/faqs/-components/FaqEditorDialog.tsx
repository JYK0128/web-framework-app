import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getFaqsControllerGetAdminFaqsQueryKey, getFaqsControllerGetFaqsQueryKey, useFaqsControllerCreateFaq, useFaqsControllerUpdateFaq } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';

interface FaqEditorDialogProps {
  open: boolean
  faq: FaqItemDto | null
  onOpenChange: (open: boolean) => void
}

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
              ? t('faq.editDescription')
              : t('faq.createDescription')}
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

  const commonCategories = useMemo(() => [
    t('faq.categories.service'),
    t('faq.categories.account'),
    t('faq.categories.security'),
    t('faq.categories.billing'),
    t('faq.categories.etc'),
  ], [t]);

  const faqForm = useAppForm({
    defaultValues: {
      category: faq?.category ?? t('faq.categories.service'),
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

  let submitText = t('common.confirm');
  if (isPending) {
    submitText = t('common.loading');
  }
  else if (isEditing) {
    submitText = t('common.save');
  }

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
              {commonCategories.map((cat) => (
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
                rows={4}
                required
              />
            )}
          </faqForm.AppField>

          {/* Order & Status */}
          <div className="grid grid-cols-2 gap-3">
            <faqForm.AppField name="order">
              {(field) => (
                <field.Input
                  label={t('faq.order')}
                  type="number"
                  description={t('faq.orderDescription')}
                />
              )}
            </faqForm.AppField>

            <faqForm.AppField name="isPublished">
              {(field) => (
                <div className="flex flex-col justify-center gap-2 pt-2">
                  <span className="text-xs font-medium text-foreground">
                    {t('faq.isPublished')}
                  </span>
                  <div className="flex items-center gap-2">
                    <field.Switch />
                    <span className="text-xs text-muted-foreground">
                      {field.state.value ? t('faq.published') : t('faq.unpublished')}
                    </span>
                  </div>
                </div>
              )}
            </faqForm.AppField>
          </div>
        </div>

        <DialogFooter className="
          gap-2 pt-2
          sm:gap-0
        "
        >
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {submitText}
          </Button>
        </DialogFooter>
      </FormLayout>
    </faqForm.AppForm>
  );
}
