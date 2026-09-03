import { when } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, KeyRound, ShieldAlert, ShieldCheck, UsersRound } from 'lucide-react';
import { useState } from 'react';

import { useRolesControllerGetRoles } from '#/.generated/api/endpoints/roles/roles';
import { getUsersControllerGetUserByIdQueryKey, getUsersControllerGetUsersQueryKey, useUsersControllerBanUser, useUsersControllerDeleteUser, useUsersControllerGetUserById, useUsersControllerResetUserPassword, useUsersControllerResetUserTwoFactor, useUsersControllerRestoreUser, useUsersControllerUnbanUser, useUsersControllerUpdateUserRole } from '#/.generated/api/endpoints/users/users';
import type { GetUserByIdResponseDto } from '#/.generated/api/model';
import { Alert, AlertDescription, AlertTitle, Avatar, AvatarFallback, Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '#/.generated/shadcn/components/ui';
import { ActionCard, type DialogComponentProps, SectionCard } from '#/components/app';
import { confirm } from '#/components/app/system-dialog';
import { useI18n } from '#/hooks';

type UserManagementDialogProps = DialogComponentProps<void> & {
  userId: string
};

export function UserManagementDialog({
  userId,
  open,
  onOpenChange,
  close,
}: UserManagementDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      close?.();
      setTemporaryPassword(null);
    }
  };
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [roleOverride, setRoleOverride] = useState<string | null>(null);
  const [banReasonOverride, setBanReasonOverride] = useState<string | null>(null);
  const [banExpiresOverride, setBanExpiresOverride] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const { data: rolesData } = useRolesControllerGetRoles();
  const dynamicRoles = rolesData?.roles ?? [];

  const detailQuery = useUsersControllerGetUserById(userId, {
    query: { enabled: open && Boolean(userId) },
  });
  const user: GetUserByIdResponseDto | undefined = detailQuery.data;
  const role = roleOverride ?? user?.role ?? 'user';
  const banReason = banReasonOverride ?? user?.banReason ?? '';

  const banUserMutation = useUsersControllerBanUser();
  const unbanUserMutation = useUsersControllerUnbanUser();
  const deleteUserMutation = useUsersControllerDeleteUser();
  const restoreUserMutation = useUsersControllerRestoreUser();
  const updateUserRoleMutation = useUsersControllerUpdateUserRole();
  const resetPasswordMutation = useUsersControllerResetUserPassword();
  const resetTwoFactorMutation = useUsersControllerResetUserTwoFactor();

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
      await banUserMutation.mutateAsync({
        id: userId,
        data: {
          reason: banReason.trim() || undefined,
          expiresAt: when((value): value is string => Boolean(value), (expiresAt) => new Date(expiresAt).toISOString())(banExpiresOverride),
        },
      });
      await invalidateUser();
    }
    catch {
      return;
    }
  };

  const handleUnban = async () => {
    if (!userId) return;
    try {
      await unbanUserMutation.mutateAsync({ id: userId });
      setBanReasonOverride('');
      await invalidateUser();
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
      await deleteUserMutation.mutateAsync({ id: userId });
      await invalidateUser();
    }
    catch {
      return;
    }
  };

  const handleRestore = async () => {
    if (!userId) return;
    try {
      await restoreUserMutation.mutateAsync({ id: userId });
      await invalidateUser();
    }
    catch {
      return;
    }
  };

  const handleRoleSave = async () => {
    if (!userId || !user || role === user.role) return;
    try {
      await updateUserRoleMutation.mutateAsync({ id: userId, data: { role } });
      await invalidateUser();
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
      const result = await resetPasswordMutation.mutateAsync({ id: userId });
      setTemporaryPassword(result.temporaryPassword);
      await invalidateUser();
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
      await resetTwoFactorMutation.mutateAsync({ id: userId });
      await invalidateUser();
    }
    catch {
      return;
    }
  };

  const isUpdatingRole = updateUserRoleMutation.isPending;
  const isResettingPassword = resetPasswordMutation.isPending;
  const isResettingTwoFactor = resetTwoFactorMutation.isPending;

  const isBusy = banUserMutation.isPending
    || unbanUserMutation.isPending
    || deleteUserMutation.isPending
    || restoreUserMutation.isPending
    || isUpdatingRole
    || isResettingPassword
    || isResettingTwoFactor;

  if (!open || !userId) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            flex items-center justify-center gap-2 p-8 text-sm
            text-muted-foreground
          "
          >
            <Loader2 className="size-5 animate-spin" />
            <span>{t('users.detailLoading')}</span>
          </div>
        )}

        {user && (
          <div className="grid gap-4">
            {/* 기본 정보 섹션 */}
            <SectionCard
              textSize="sm"
              icon="user-round"
              title={user.name || t('users.noName')}
              description={user.email}
            >
              <SectionCard.Actions>
                <StatusBadge
                  user={user}
                  deletedLabel={t('users.deleted')}
                  bannedLabel={t('users.banned')}
                  activeLabel={t('users.active')}
                />
              </SectionCard.Actions>
              <SectionCard.Content className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback className="
                      bg-primary/20 text-base font-bold text-primary
                    "
                    >
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 gap-1 text-xs">
                    <InfoRow label={t('users.userId')} value={user.id} mono />
                    <InfoRow label={t('users.permissionRole')} value={user.role} />
                  </div>
                </div>

                <div className="grid gap-1.5 border-t pt-2 text-xs">
                  <InfoRow label={t('users.providers')} value={user.providers.join(', ') || t('users.none')} />
                  <InfoRow label={t('users.twoFactor')} value={user.twoFactorEnabled ? t('users.enabled') : t('users.disabled')} />
                  <InfoRow label={t('users.joinedAtTime')} value={new Date(user.createdAt).toLocaleString()} />
                  <InfoRow label={t('users.lastLoginAt')} value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('users.never')} />
                  <InfoRow label={t('users.passwordUpdatedAt')} value={user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt).toLocaleString() : t('users.never')} />
                  <InfoRow label={t('users.passwordStatus')} value={user.isPasswordChangeRequired ? t('users.passwordResetRequired') : t('users.passwordCurrent')} />
                </div>
              </SectionCard.Content>
            </SectionCard>

            {/* 역할 관리 */}
            <SectionCard
              textSize="sm"
              icon="users"
              title={t('users.roleManagement')}
            >
              <SectionCard.Content>
                <div className="flex items-center gap-2">
                  <Select
                    items={
                      dynamicRoles.length > 0
                        ? dynamicRoles.map((r) => ({
                          label: `${r.label || r.name} (${r.name})`,
                          value: r.name,
                        }))
                        : [
                          { label: t('users.userRole'), value: 'user' },
                          { label: t('users.adminRole'), value: 'admin' },
                        ]
                    }
                    value={role}
                    onValueChange={(value) => setRoleOverride(value)}
                    disabled={user.deleted || isBusy}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dynamicRoles.length > 0
                        ? (
                          dynamicRoles.map((r) => (
                            <SelectItem key={r.id} value={r.name}>
                              {r.label || r.name}
                              {' '}
                              (
                              {r.name}
                              )
                            </SelectItem>
                          ))
                        )
                        : (
                          <>
                            <SelectItem value="user">{t('users.userRole')}</SelectItem>
                            <SelectItem value="admin">{t('users.adminRole')}</SelectItem>
                          </>
                        )}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => void handleRoleSave()} disabled={user.deleted || role === user.role || isBusy}>
                    {isUpdatingRole && <Loader2 className="size-4 animate-spin" />}
                    {t('users.saveRole')}
                  </Button>
                </div>
              </SectionCard.Content>
            </SectionCard>

            {/* 보안 관리 (ActionCard 활용) */}
            <SectionCard
              textSize="sm"
              icon="key-round"
              title={t('users.securityManagement')}
            >
              <SectionCard.Content className="grid gap-2">
                <ActionCard
                  variant="ghost"
                  icon="key-round"
                  title={t('users.resetPassword')}
                  description={t('users.passwordResetConfirm')}
                  actions={[
                    {
                      label: t('users.resetPassword'),
                      variant: 'outline',
                      size: 'sm',
                      loading: isResettingPassword,
                      disabled: user.deleted || isBusy,
                      onClick: () => void handlePasswordReset(),
                    },
                  ]}
                />

                <ActionCard
                  variant="ghost"
                  icon="shield-check"
                  title={t('users.resetTwoFactor')}
                  description={user.twoFactorEnabled ? t('users.twoFactorResetConfirm') : t('users.disabled')}
                  actions={[
                    {
                      label: t('users.resetTwoFactor'),
                      variant: 'outline',
                      size: 'sm',
                      loading: isResettingTwoFactor,
                      disabled: user.deleted || !user.twoFactorEnabled || isBusy,
                      onClick: () => void handleTwoFactorReset(),
                    },
                  ]}
                />

                {temporaryPassword && (
                  <Alert className="mt-2">
                    <KeyRound className="size-4" />
                    <AlertTitle>{t('users.temporaryPasswordTitle')}</AlertTitle>
                    <AlertDescription className="mt-1 flex flex-col gap-1.5">
                      <span>{t('users.temporaryPasswordDescription')}</span>
                      <Input className="font-mono" value={temporaryPassword} readOnly />
                    </AlertDescription>
                  </Alert>
                )}
              </SectionCard.Content>
            </SectionCard>

            {/* 접근 제어 및 차단 관리 */}
            <SectionCard
              textSize="sm"
              icon="alert-triangle"
              title={t('users.accessManagement')}
              description={t('users.accessManagementDescription')}
            >
              <SectionCard.Content className="grid gap-3">
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
                {!user.banned && (
                  <Input
                    type="datetime-local"
                    value={banExpiresOverride}
                    onChange={(event) => setBanExpiresOverride(event.target.value)}
                    disabled={user.deleted || isBusy}
                    required
                  />
                )}
                <div className="flex flex-wrap justify-end gap-2">
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
              </SectionCard.Content>
            </SectionCard>

            {/* 계정 삭제 및 복구 (위험 구역 ActionCard) */}
            <ActionCard
              variant="destructive"
              icon="alert-triangle"
              iconColor="text-destructive"
              title={t('users.deletionManagement')}
              description={t('users.deletionDescription')}
              actions={[
                user.deleted
                  ? {
                    label: t('users.restore'),
                    icon: 'rotate-ccw',
                    variant: 'outline',
                    size: 'sm',
                    disabled: isBusy,
                    onClick: () => void handleRestore(),
                  }
                  : {
                    label: t('users.delete'),
                    icon: 'trash-2',
                    variant: 'destructive',
                    size: 'sm',
                    disabled: isBusy,
                    onClick: () => void handleDelete(),
                  },
              ]}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('users.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type StatusBadgeProps = {
  user: GetUserByIdResponseDto
  deletedLabel: string
  bannedLabel: string
  activeLabel: string
};

function StatusBadge({ user, deletedLabel, bannedLabel, activeLabel }: StatusBadgeProps) {
  if (user.deleted) return <Badge variant="destructive">{deletedLabel}</Badge>;
  if (user.banned) return <Badge variant="destructive">{bannedLabel}</Badge>;

  return (
    <Badge variant="outline" className="text-emerald-600">
      <CheckCircle2 className="size-3" />
      {activeLabel}
    </Badge>
  );
}

type InfoRowProps = { label: string, value: string, mono?: boolean };

function InfoRow({ label, value, mono = false }: InfoRowProps) {
  return (
    <div className="
      flex justify-between gap-3 border-b
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
