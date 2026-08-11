import { useI18n } from '@pkg/shared/web';
import { UserX } from 'lucide-react';
import { useState } from 'react';

import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

import { UnregisterConfirmModal } from './modals/UnregisterConfirmModal';

type AccountManagementCardProps = {
  user: {
    id: string
    name?: string | null
    email: string
  }
};

export function AccountManagementCard({ user }: AccountManagementCardProps) {
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <div className="grid gap-6">
        <Card className="p-6">
          <CardContent className="grid gap-4 p-0">
            <h3 className="text-base font-bold">{t('profile.accountDetails')}</h3>

            <div className="grid gap-3 text-xs">
              <div className="flex items-center justify-between border-b py-2">
                <span className="flex-1 text-muted-foreground">{t('profile.name')}</span>
                <span className="shrink-0 font-bold">{user.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <span className="flex-1 text-muted-foreground">{t('profile.emailAccount')}</span>
                <span className="shrink-0 font-bold">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="flex-1 text-muted-foreground">{t('profile.userId')}</span>
                <span className="shrink-0 font-mono font-bold">{user.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 bg-destructive/5 p-6">
          <CardContent className="grid gap-4 p-0">
            <div className="grid gap-1">
              <h3 className="text-base font-bold text-destructive">{t('profile.dangerZone')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('profile.deleteWarning')}
              </p>
            </div>

            <div className="flex items-center justify-end">
              <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setShowUnregisterModal(true)}>
                <UserX className="size-4" />
                <span>{t('profile.deleteAccount')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <UnregisterConfirmModal
        open={showUnregisterModal}
        onOpenChange={setShowUnregisterModal}
      />
    </>
  );
}
