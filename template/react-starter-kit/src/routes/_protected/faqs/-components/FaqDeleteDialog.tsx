import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';

import { getFaqsControllerGetAdminFaqsQueryKey, getFaqsControllerGetFaqsQueryKey, useFaqsControllerDeleteFaq } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '#/.generated/shadcn/components/ui';

interface FaqDeleteDialogProps {
  open: boolean
  faq: FaqItemDto | null
  onOpenChange: (open: boolean) => void
}

export function FaqDeleteDialog({ open, faq, onOpenChange }: FaqDeleteDialogProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const deleteMutation = useFaqsControllerDeleteFaq();

  const handleDelete = async () => {
    if (!faq) return;

    try {
      await deleteMutation.mutateAsync({ id: faq.id });
      await queryClient.invalidateQueries({ queryKey: getFaqsControllerGetAdminFaqsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getFaqsControllerGetFaqsQueryKey() });
      onOpenChange(false);
    }
    catch {
      // ignore
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('faq.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('faq.deleteConfirmDescription')}
            {faq && (
              <span className="mt-2 block font-medium text-foreground">
                &ldquo;
                {faq.question}
                &rdquo;
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('common.processing') : t('faq.deleteFaq')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
