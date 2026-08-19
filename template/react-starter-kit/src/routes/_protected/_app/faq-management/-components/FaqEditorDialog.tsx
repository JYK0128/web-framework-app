import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { getFaqsControllerGetAdminFaqsQueryKey, getFaqsControllerGetFaqsQueryKey, useFaqsControllerCreateFaq, useFaqsControllerUpdateFaq } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Switch } from '#/.generated/shadcn/components/ui';
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

  const categoryOptions = useMemo(() => [
    { label: t('faq.categories.account'), value: t('faq.categories.account') },
    { label: t('faq.categories.service'), value: t('faq.categories.service') },
    { label: t('faq.categories.billing'), value: t('faq.categories.billing') },
    { label: t('faq.categories.security'), value: t('faq.categories.security') },
    { label: t('faq.categories.etc'), value: t('faq.categories.etc') },
  ], [t]);

  const faqForm = useAppForm({
    defaultValues: {
      category: faq?.category ?? t('faq.categories.account'),
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
      toast.success(t('faq.saveSuccess'));
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
        <div className="flex flex-col gap-4">
          {/* 1. Category */}
          <faqForm.AppField name="category">
            {(field) => (
              <field.Select
                label={t('faq.category')}
                placeholder={t('faq.categoryPlaceholder')}
                options={categoryOptions}
                required
              />
            )}
          </faqForm.AppField>

          {/* 2. Question */}
          <faqForm.AppField name="question">
            {(field) => (
              <field.Input
                label={t('faq.question')}
                placeholder={t('faq.questionPlaceholder')}
                required
              />
            )}
          </faqForm.AppField>

          {/* 3. Answer */}
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

          {/* 4. Bottom Settings: Compact Order (Left) & Publish switch (Right) */}
          <div className="flex items-center justify-between border-t pt-3">
            <faqForm.AppField name="order">
              {(field) => (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="faq-order"
                    className="
                      cursor-pointer select-none text-xs text-muted-foreground
                      whitespace-nowrap
                    "
                  >
                    {t('faq.order')}
                  </label>
                  <Input
                    id="faq-order"
                    type="number"
                    min={0}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.valueAsNumber || 0)}
                    className="h-8 w-20 text-center font-mono text-xs"
                  />
                </div>
              )}
            </faqForm.AppField>

            <faqForm.AppField name="isPublished">
              {(field) => (
                <div className="flex items-center gap-2.5">
                  <label
                    htmlFor="faq-is-published"
                    className="
                      cursor-pointer select-none text-sm font-medium
                      text-foreground
                    "
                  >
                    {t('faq.isPublished')}
                  </label>
                  <Switch
                    id="faq-is-published"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
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
