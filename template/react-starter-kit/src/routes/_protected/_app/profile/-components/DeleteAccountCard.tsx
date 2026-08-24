import { useI18n } from '@pkg/shared/web';
import { UserX } from 'lucide-react';

import { Button, Card, CardAction, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

type DeleteAccountCardProps = {
  onOpenDeleteModal: () => void
};

export function DeleteAccountCard({ onOpenDeleteModal }: DeleteAccountCardProps) {
  const { t } = useI18n();

  return (
    <Card className="border-destructive/30 shadow-xs">
      <CardHeader className="
        flex flex-col gap-4
        sm:flex-row sm:items-center sm:justify-between
      "
      >
        <div className="space-y-1">
          <CardTitle className="text-destructive text-base font-bold">
            {t('profile.dangerZone')}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t('profile.deleteWarning')}
          </CardDescription>
        </div>
        <CardAction>
          <Button
            variant="destructive"
            size="sm"
            className="shrink-0 cursor-pointer"
            onClick={onOpenDeleteModal}
          >
            <UserX className="size-4" />
            <span>{t('profile.deleteAccount')}</span>
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
