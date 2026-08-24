import { useI18n } from '@pkg/shared/web';
import { KeyRound, UserX } from 'lucide-react';
import { useState } from 'react';

import { Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

import { UnregisterConfirmModal } from './modals/UnregisterConfirmModal';

type AccountManagementCardProps = {
  user: {
    id: string
    name?: string | null
    email: string
  }
  onChangePassword: () => void
};

export function AccountManagementCard({ user, onChangePassword }: AccountManagementCardProps) {
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.accountDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">{t('profile.name')}</span>
                <span className="font-semibold">{user.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">{t('profile.emailAccount')}</span>
                <span className="font-semibold">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('profile.userId')}</span>
                <span className="font-mono font-semibold">{user.id}</span>
              </div>
            </div>

            <div className="
              flex items-center justify-between gap-4 border-t pt-4
            "
            >
              <div className="space-y-0.5">
                <span className="text-sm font-semibold">{t('profile.changePassword')}</span>
                <p className="text-xs text-muted-foreground">{t('profile.passwordChangeDescription')}</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={onChangePassword}>
                <KeyRound className="size-4" />
                <span>{t('profile.changePassword')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account Card */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">{t('profile.dangerZone')}</CardTitle>
            <CardDescription>{t('profile.deleteWarning')}</CardDescription>
            <CardAction>
              <Button variant="destructive" size="sm" onClick={() => setShowUnregisterModal(true)}>
                <UserX className="size-4" />
                <span>{t('profile.deleteAccount')}</span>
              </Button>
            </CardAction>
          </CardHeader>
        </Card>
      </div>

      <UnregisterConfirmModal
        open={showUnregisterModal}
        onOpenChange={setShowUnregisterModal}
      />
    </>
  );
}
