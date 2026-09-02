import { useQueryClient } from '@tanstack/react-query';

import { getFaqsControllerGetAdminFaqsQueryKey, getFaqsControllerGetFaqsQueryKey, useFaqsControllerCreateFaq, useFaqsControllerUpdateFaq } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Button, DialogFooter, Input, Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';
import { getFaqCategoryOptions } from '#/routes/_protected/_app/faq-management/-configs/faq.config';

export function FaqEditorForm({
  faq,
  onSuccess,
}: {
  faq: FaqItemDto | null
  onSuccess: () => void
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const isEditing = Boolean(faq);
  const createMutation = useFaqsControllerCreateFaq();
  const updateMutation = useFaqsControllerUpdateFaq();

  const categoryOptions = getFaqCategoryOptions(t);

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
      onSuccess();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const submitText = isPending ? t('common.processing') : t('common.save');

  return (
    <faqForm.AppForm>
      <FormLayout
        onSubmit={() => void faqForm.handleSubmit()}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-4">
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

          <faqForm.AppField name="question">
            {(field) => (
              <field.Input
                label={t('faq.question')}
                placeholder={t('faq.questionPlaceholder')}
                required
              />
            )}
          </faqForm.AppField>

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

          <div className="flex items-center justify-between border-t">
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
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
