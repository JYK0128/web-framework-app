import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Ban, CheckCircle2, KeyRound, Loader2, RotateCcw, ShieldAlert, ShieldCheck, Trash2, UsersRound } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';

import { getUsersControllerGetUserByIdQueryKey, getUsersControllerGetUsersQueryKey, useUsersControllerBanUser, useUsersControllerDeleteUser, useUsersControllerGetUserById, useUsersControllerResetUserPassword, useUsersControllerResetUserTwoFactor, useUsersControllerRestoreUser, useUsersControllerUnbanUser, useUsersControllerUpdateUserRole } from '#/.generated/api/endpoints/users/users';
import type { UserDetailDto } from '#/.generated/api/model';
import { Alert, AlertDescription, AlertTitle, Avatar, AvatarFallback, Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';

type UserDetailDialogProps = {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
};

type RoleOption = 'user' | 'admin';

export function UserDetailDialog({ userId, open, onOpenChange }: UserDetailDialogProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [roleOverride, setRoleOverride] = useState<RoleOption | null>(null);
  const [banReasonOverride, setBanReasonOverride] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const detailQuery = useUsersControllerGetUserById(userId ?? '', {
    query: { enabled: open && Boolean(userId) },
  });
  const user: UserDetailDto | undefined = detailQuery.data;
  const role = roleOverride ?? (user?.role === 'admin' ? 'admin' : 'user');
  const banReason = banReasonOverride ?? user?.banReason ?? '';

  const { mutateAsync: banUser, isPending: isBanning } = useUsersControllerBanUser();
  const { mutateAsync: unbanUser, isPending: isUnbanning } = useUsersControllerUnbanUser();
  const { mutateAsync: deleteUser, isPending: isDeleting } = useUsersControllerDeleteUser();
  const { mutateAsync: restoreUser, isPending: isRestoring } = useUsersControllerRestoreUser();
  const { mutateAsync: updateUserRole, isPending: isUpdatingRole } = useUsersControllerUpdateUserRole();
  const { mutateAsync: resetPassword, isPending: isResettingPassword } = useUsersControllerResetUserPassword();
  const { mutateAsync: resetTwoFactor, isPending: isResettingTwoFactor } = useUsersControllerResetUserTwoFactor();

  const invalidateUser = async () => {
    if (!userId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getUsersControllerGetUserByIdQueryKey(userId) }),
      queryClient.invalidateQueries({ queryKey: getUsersControllerGetUsersQueryKey() }),
    ]);
  };

  const handleBan = async () => {
    if (!userId) return;
    try {
      await banUser({
        id: userId,
        data: { reason: banReason.trim() || undefined },
      });
      await invalidateUser();
      toast.success(t('users.banSuccess'));
    }
    catch {
      return;
    }
  };

  const handleUnban = async () => {
    if (!userId) return;
    try {
      await unbanUser({ id: userId });
      setBanReasonOverride('');
      await invalidateUser();
      toast.success(t('users.unbanSuccess'));
    }
    catch {
      return;
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    const isConfirmed = await confirm({
      description: t('users.deleteConfirm'),
      tone: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteUser({ id: userId });
      await invalidateUser();
      toast.success(t('users.deleteSuccess'));
    }
    catch {
      return;
    }
  };

  const handleRestore = async () => {
    if (!userId) return;
    try {
      await restoreUser({ id: userId });
      await invalidateUser();
      toast.success(t('users.restoreSuccess'));
    }
    catch {
      return;
    }
  };

  const handleRoleSave = async () => {
    if (!userId || !user || role === user.role) return;
    try {
      await updateUserRole({ id: userId, data: { role } });
      await invalidateUser();
      toast.success(t('users.roleUpdateSuccess'));
    }
    catch {
      return;
    }
  };

  const handlePasswordReset = async () => {
    if (!userId) return;
    const isConfirmed = await confirm({
      description: t('users.passwordResetConfirm'),
      tone: 'warning',
    });
    if (!isConfirmed) return;

    try {
      const result = await resetPassword({ id: userId });
      setTemporaryPassword(result.temporaryPassword);
      await invalidateUser();
      toast.success(t('users.passwordResetSuccess'));
    }
    catch {
      return;
    }
  };

  const handleTwoFactorReset = async () => {
    if (!userId) return;
    const isConfirmed = await confirm({
      description: t('users.twoFactorResetConfirm'),
      tone: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await resetTwoFactor({ id: userId });
      await invalidateUser();
      toast.success(t('users.twoFactorResetSuccess'));
    }
    catch {
      return;
    }
  };

  const isBusy = isBanning || isUnbanning || isDeleting || isRestoring || isUpdatingRole
    || isResettingPassword || isResettingTwoFactor;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setTemporaryPassword(null);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersRound className="size-5 text-primary" />
            <span>{t('users.detailTitle')}</span>
          </DialogTitle>
          <DialogDescription>{t('users.detailDescription')}</DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading && (
          <div className="
            flex items-center justify-center gap-2 py-12 text-sm
            text-muted-foreground
          "
          >
            <Loader2 className="size-4 animate-spin" />
            <span>{t('users.detailLoading')}</span>
          </div>
        )}

        {user && (
          <div className="grid gap-5">
            <div className="
              flex items-center gap-4 rounded-lg border bg-muted/40 p-4
            "
            >
              <Avatar className="size-12">
                <AvatarFallback className="
                  bg-primary/20 text-base font-bold text-primary
                "
                >
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-foreground">{user.name || t('users.noName')}</h3>
                <p className="truncate font-mono text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                <StatusBadge
                  user={user}
                  deletedLabel={t('users.deleted')}
                  bannedLabel={t('users.banned')}
                  activeLabel={t('users.active')}
                />
              </div>
            </div>

            <div className="
              grid gap-2 text-xs
              sm:grid-cols-2
            "
            >
              <InfoRow label={t('users.userId')} value={user.id} mono />
              <InfoRow label={t('users.permissionRole')} value={user.role} />
              <InfoRow label={t('users.providers')} value={user.providers.join(', ') || t('users.none')} />
              <InfoRow label={t('users.twoFactor')} value={user.twoFactorEnabled ? t('users.enabled') : t('users.disabled')} />
              <InfoRow label={t('users.joinedAtTime')} value={new Date(user.createdAt).toLocaleString()} />
              <InfoRow label={t('users.lastLoginAt')} value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('users.never')} />
              <InfoRow label={t('users.passwordUpdatedAt')} value={user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt).toLocaleString() : t('users.never')} />
              <InfoRow label={t('users.passwordStatus')} value={user.isPasswordChangeRequired ? t('users.passwordResetRequired') : t('users.passwordCurrent')} />
            </div>

            <section className="grid gap-3 rounded-lg border p-4">
              <SectionTitle icon={<UsersRound className="size-4" />} title={t('users.roleManagement')} />
              <div className="flex items-center gap-2">
                <Select value={role} onValueChange={(value) => setRoleOverride(value)} disabled={user.deleted || isBusy}>
                  <SelectTrigger className="
                    w-full
                    sm:w-56
                  "
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t('users.userRole')}</SelectItem>
                    <SelectItem value="admin">{t('users.adminRole')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => void handleRoleSave()} disabled={user.deleted || role === user.role || isBusy}>
                  {isUpdatingRole && <Loader2 className="size-4 animate-spin" />}
                  {t('users.saveRole')}
                </Button>
              </div>
            </section>

            <section className="grid gap-3 rounded-lg border p-4">
              <SectionTitle icon={<KeyRound className="size-4" />} title={t('users.securityManagement')} />
              <div className="
                grid gap-2
                sm:grid-cols-3
              "
              >
                <Button variant="outline" onClick={() => void handlePasswordReset()} disabled={user.deleted || isBusy}>
                  {isResettingPassword && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {t('users.resetPassword')}
                </Button>
                <Button variant="outline" onClick={() => void handleTwoFactorReset()} disabled={user.deleted || !user.twoFactorEnabled || isBusy}>
                  {isResettingTwoFactor && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {t('users.resetTwoFactor')}
                </Button>
              </div>
              {temporaryPassword && (
                <Alert>
                  <KeyRound className="size-4" />
                  <AlertTitle>{t('users.temporaryPasswordTitle')}</AlertTitle>
                  <AlertDescription>
                    <span>{t('users.temporaryPasswordDescription')}</span>
                    <Input className="mt-2 font-mono" value={temporaryPassword} readOnly />
                  </AlertDescription>
                </Alert>
              )}
            </section>

            <section className="grid gap-3 rounded-lg border p-4">
              <SectionTitle icon={<Ban className="size-4" />} title={t('users.accessManagement')} />
              <p className="text-xs text-muted-foreground">{t('users.accessManagementDescription')}</p>
              {user.banned && user.banReason && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>{t('users.banReason')}</AlertTitle>
                  <AlertDescription>{user.banReason}</AlertDescription>
                </Alert>
              )}
              <Textarea
                value={banReason}
                onChange={(event) => setBanReasonOverride(event.target.value)}
                placeholder={t('users.banReasonPlaceholder')}
                disabled={user.deleted || isBusy}
              />
              <div className="flex flex-wrap gap-2">
                {user.banned
                  ? (
                    <Button variant="outline" onClick={() => void handleUnban()} disabled={user.deleted || isBusy}>
                      <ShieldCheck className="size-4" />
                      {t('users.unban')}
                    </Button>
                  )
                  : (
                    <Button variant="destructive" onClick={() => void handleBan()} disabled={user.deleted || isBusy}>
                      <ShieldAlert className="size-4" />
                      {t('users.ban')}
                    </Button>
                  )}
              </div>
            </section>

            <section className="
              grid gap-3 rounded-lg border border-destructive/30
              bg-destructive/5 p-4
            "
            >
              <SectionTitle icon={<Trash2 className="size-4 text-destructive" />} title={t('users.deletionManagement')} />
              <p className="text-xs text-muted-foreground">{t('users.deletionDescription')}</p>
              <div className="flex flex-wrap gap-2">
                {user.deleted
                  ? (
                    <Button variant="outline" onClick={() => void handleRestore()} disabled={isBusy}>
                      <RotateCcw className="size-4" />
                      {t('users.restore')}
                    </Button>
                  )
                  : (
                    <Button variant="destructive" onClick={() => void handleDelete()} disabled={isBusy}>
                      <Trash2 className="size-4" />
                      {t('users.delete')}
                    </Button>
                  )}
              </div>
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('users.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode, title: string }) {
  return (
    <h3 className="
      flex items-center gap-2 text-sm font-semibold text-foreground
    "
    >
      {icon}
      <span>{title}</span>
    </h3>
  );
}

function StatusBadge({ user, deletedLabel, bannedLabel, activeLabel }: {
  user: UserDetailDto
  deletedLabel: string
  bannedLabel: string
  activeLabel: string
}) {
  if (user.deleted) return <Badge variant="destructive">{deletedLabel}</Badge>;
  if (user.banned) return <Badge variant="destructive">{bannedLabel}</Badge>;

  return (
    <Badge variant="outline" className="text-emerald-600">
      <CheckCircle2 className="mr-1 size-3" />
      {activeLabel}
    </Badge>
  );
}

function InfoRow({ label, value, mono = false }: { label: string, value: string, mono?: boolean }) {
  return (
    <div className="
      flex justify-between gap-3 border-b py-1.5
      last:border-0
    "
    >
      <span className="shrink-0 font-medium text-muted-foreground">{label}</span>
      <span className={`
        truncate text-right text-foreground
        ${mono ? 'font-mono' : ''}
      `}
      >
        {value}
      </span>
    </div>
  );
}
