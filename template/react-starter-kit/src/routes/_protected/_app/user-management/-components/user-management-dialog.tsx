import { when } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, ShieldAlert, ShieldCheck, UsersRound } from 'lucide-react';
import { useState } from 'react';

import { useRolesControllerGetRoles } from '#/.generated/api/endpoints/roles/roles';
import { getUsersControllerGetUserByIdQueryKey, getUsersControllerGetUsersQueryKey, useUsersControllerBanUser, useUsersControllerDeleteUser, useUsersControllerGetUserById, useUsersControllerResetUserPassword, useUsersControllerResetUserTwoFactor, useUsersControllerRestoreUser, useUsersControllerUnbanUser, useUsersControllerUpdateUserRole } from '#/.generated/api/endpoints/users/users';
import type { GetUserByIdResponseDto, RoleKey } from '#/.generated/api/model';
import { Alert, AlertDescription, AlertTitle, Avatar, AvatarFallback, Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { type DialogComponentProps } from '#/components/dialog';
import { ActionCard, SectionCard } from '#/components/layout';
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
  const [roleOverride, setRoleOverride] = useState<RoleKey | null>(null);
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
      description: t('userManagement.deleteConfirm'),
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
      description: t('userManagement.passwordResetConfirm'),
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
      description: t('userManagement.twoFactorResetConfirm'),
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
            <span>{t('userManagement.detailTitle')}</span>
          </DialogTitle>
          <DialogDescription>{t('userManagement.detailDescription')}</DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading && (
          <div className="
            flex items-center justify-center gap-2 p-8 text-sm
            text-muted-foreground
          "
          >
            <Loader2 className="size-5 animate-spin" />
            <span>{t('userManagement.detailLoading')}</span>
          </div>
        )}

        {user && (
          <div className="grid gap-4">
            {/* 기본 정보 섹션 */}
            <SectionCard
              textSize="sm"
              icon="user-round"
              title={user.name || t('userManagement.noName')}
              description={user.email}
            >
              <SectionCard.Content className="grid gap-3">
                <div className="flex justify-end">
                  <StatusBadge
                    user={user}
                    deletedLabel={t('userManagement.deleted')}
                    bannedLabel={t('userManagement.banned')}
                    activeLabel={t('userManagement.active')}
                  />
                </div>
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
                    <InfoRow label={t('userManagement.userId')} value={user.id} mono />
                    <InfoRow label={t('userManagement.permissionRole')} value={user.role} />
                  </div>
                </div>

                <div className="grid gap-1.5 border-t pt-2 text-xs">
                  <InfoRow label={t('userManagement.providers')} value={user.providers.join(', ') || t('userManagement.none')} />
                  <InfoRow label={t('userManagement.twoFactor')} value={user.twoFactorEnabled ? t('userManagement.enabled') : t('userManagement.disabled')} />
                  <InfoRow label={t('userManagement.joinedAtTime')} value={new Date(user.createdAt).toLocaleString()} />
                  <InfoRow label={t('userManagement.lastLoginAt')} value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : t('userManagement.never')} />
                  <InfoRow label={t('userManagement.passwordUpdatedAt')} value={user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt).toLocaleString() : t('userManagement.never')} />
                  <InfoRow label={t('userManagement.passwordStatus')} value={user.isPasswordChangeRequired ? t('userManagement.passwordResetRequired') : t('userManagement.passwordCurrent')} />
                </div>
              </SectionCard.Content>
            </SectionCard>

            {/* 역할 관리 */}
            <SectionCard
              textSize="sm"
              icon="users"
              title={t('userManagement.roleManagement')}
            >
              <SectionCard.Content>
                <div className="flex items-center gap-2">
                  <Select
                    items={
                      dynamicRoles.length > 0
                        ? dynamicRoles.map((r) => ({
                          label: `${r.label || r.key} (${r.key})`,
                          value: r.key,
                        }))
                        : [
                          { label: t('userManagement.userRole'), value: 'user' },
                          { label: t('userManagement.adminRole'), value: 'admin' },
                        ]
                    }
                    value={role}
                    onValueChange={(value) => {
                      if (value === 'user' || value === 'admin') setRoleOverride(value);
                    }}
                    disabled={user.deleted || isBusy}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dynamicRoles.length > 0
                        ? (
                          dynamicRoles.map((r) => (
                            <SelectItem key={r.id} value={r.key}>
                              {r.label || r.key}
                              {' '}
                              (
                              {r.key}
                              )
                            </SelectItem>
                          ))
                        )
                        : (
                          <>
                            <SelectItem value="user">{t('userManagement.userRole')}</SelectItem>
                            <SelectItem value="admin">{t('userManagement.adminRole')}</SelectItem>
                          </>
                        )}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => void handleRoleSave()} disabled={user.deleted || role === user.role || isBusy}>
                    {isUpdatingRole && <Loader2 className="size-4 animate-spin" />}
                    {t('userManagement.saveRole')}
                  </Button>
                </div>
              </SectionCard.Content>
            </SectionCard>

            {/* 보안 관리 (ActionCard 활용) */}
            <SectionCard
              textSize="sm"
              icon="key-round"
              title={t('userManagement.securityManagement')}
            >
              <SectionCard.Content className="grid gap-2">
                <ActionCard
                  variant="ghost"
                  icon="key-round"
                  title={t('userManagement.resetPassword')}
                  description={t('userManagement.passwordResetConfirm')}
                >
                  <ActionCard.Actions>
                    <Button variant="outline" size="sm" disabled={user.deleted || isBusy || isResettingPassword} onClick={() => void handlePasswordReset()}>
                      {t('userManagement.resetPassword')}
                    </Button>
                  </ActionCard.Actions>
                </ActionCard>

                <ActionCard
                  variant="ghost"
                  icon="shield-check"
                  title={t('userManagement.resetTwoFactor')}
                  description={user.twoFactorEnabled ? t('userManagement.twoFactorResetConfirm') : t('userManagement.disabled')}
                >
                  <ActionCard.Actions>
                    <Button variant="outline" size="sm" disabled={user.deleted || !user.twoFactorEnabled || isBusy || isResettingTwoFactor} onClick={() => void handleTwoFactorReset()}>
                      {t('userManagement.resetTwoFactor')}
                    </Button>
                  </ActionCard.Actions>
                </ActionCard>

                {temporaryPassword && (
                  <Alert className="mt-2">
                    <KeyRound className="size-4" />
                    <AlertTitle>{t('userManagement.temporaryPasswordTitle')}</AlertTitle>
                    <AlertDescription className="mt-1 flex flex-col gap-1.5">
                      <span>{t('userManagement.temporaryPasswordDescription')}</span>
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
              title={t('userManagement.accessManagement')}
              description={t('userManagement.accessManagementDescription')}
            >
              <SectionCard.Content className="grid gap-3">
                {user.banned && user.banReason && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>{t('userManagement.banReason')}</AlertTitle>
                    <AlertDescription>{user.banReason}</AlertDescription>
                  </Alert>
                )}
                <Textarea
                  value={banReason}
                  onChange={(event) => setBanReasonOverride(event.target.value)}
                  placeholder={t('userManagement.banReasonPlaceholder')}
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
                        {t('userManagement.unban')}
                      </Button>
                    )
                    : (
                      <Button variant="destructive" onClick={() => void handleBan()} disabled={user.deleted || isBusy}>
                        <ShieldAlert className="size-4" />
                        {t('userManagement.ban')}
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
              title={t('userManagement.deletionManagement')}
              description={t('userManagement.deletionDescription')}
            >
              <ActionCard.Actions>
                <Button variant={user.deleted ? 'outline' : 'destructive'} size="sm" disabled={isBusy} onClick={() => void (user.deleted ? handleRestore() : handleDelete())}>
                  {user.deleted ? t('userManagement.restore') : t('userManagement.delete')}
                </Button>
              </ActionCard.Actions>
            </ActionCard>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>{t('app.dialog.close')}</Button>
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
