import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';

import { getUsersControllerGetUserOverviewV1QueryKey, getUsersControllerGetUsersV1QueryKey, useUsersControllerBanUserV1, useUsersControllerDeleteUserV1, useUsersControllerResetUserTwoFactorV1, useUsersControllerRestoreUserV1, useUsersControllerUnbanUserV1 } from '#/.generated/api/endpoints/users/users';
import type { UserItemDto, UsersControllerGetUserOverviewV1200, UsersControllerGetUsersV1200 } from '#/.generated/api/model';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { createEntityQueryCache } from '#/lib/entity-query-cache';

type AdminRowActionsProps = {
  user: UserItemDto
  canManage: boolean
  currentUserId?: string
  onOpenDetail: () => void
  onChangeRole: () => void
};

export function AdminRowActions({ user, canManage, currentUserId, onOpenDetail, onChangeRole }: AdminRowActionsProps) {
  const queryClient = useQueryClient();
  const userCache = createEntityQueryCache<UserItemDto, UsersControllerGetUsersV1200>(queryClient, getUsersControllerGetUsersV1QueryKey());
  const handleSuccess = (patch: Partial<UserItemDto>) => () => {
    userCache.patch(user.id, patch);
    patchUserOverviewCache(queryClient, user, patch);
  };
  const banMutation = useUsersControllerBanUserV1({ mutation: { onSuccess: handleSuccess({ banned: true }) } });
  const unbanMutation = useUsersControllerUnbanUserV1({ mutation: { onSuccess: handleSuccess({ banned: false, banReason: null, banExpires: null }) } });
  const deleteMutation = useUsersControllerDeleteUserV1({ mutation: { onSuccess: handleSuccess({ deleted: true, deletedAt: new Date().toISOString() }) } });
  const restoreMutation = useUsersControllerRestoreUserV1({ mutation: { onSuccess: handleSuccess({ deleted: false, deletedAt: null }) } });
  const resetTwoFactorMutation = useUsersControllerResetUserTwoFactorV1({ mutation: { onSuccess: handleSuccess({ twoFactorEnabled: false }) } });
  const isPending = banMutation.isPending || unbanMutation.isPending || deleteMutation.isPending
    || restoreMutation.isPending || resetTwoFactorMutation.isPending;

  const confirmAndRun = (options: Parameters<typeof confirm>[0], action: () => void) => {
    void confirm(options).then((confirmed) => {
      if (confirmed) action();
    });
  };

  const isCurrentUser = user.id === currentUserId;
  const canRunActions = canManage && !isCurrentUser;

  return (
    <div className="flex items-center justify-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending}
              aria-label="관리 작업"
              onClick={(event) => {
                event.stopPropagation();
                props.onClick?.(event);
              }}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          )}
        />
        <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
          <DropdownMenuItem onClick={onOpenDetail}>
            상세
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canRunActions || user.deleted || user.roleCode === 'super_admin' || !user.twoFactorEnabled}
            onClick={() => confirmAndRun(
              { title: '2FA 초기화', content: getTargetContent(user), description: '이 계정의 2FA 설정을 제거할까요?', confirmLabel: '초기화', tone: 'danger' },
              () => resetTwoFactorMutation.mutate({ id: user.id }),
            )}
          >
            2FA 초기화
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRunActions || user.deleted}
            onClick={onChangeRole}
          >
            역할 변경
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRunActions || user.deleted || user.roleCode === 'super_admin'}
            onClick={() => {
              if (user.banned) {
                confirmAndRun(
                  { title: '관리자 정지 해제', content: getTargetContent(user), description: '로그인 정지를 해제할까요?', confirmLabel: '정지 해제' },
                  () => unbanMutation.mutate({ id: user.id }),
                );
                return;
              }
              confirmAndRun(
                { title: '관리자 정지', content: getTargetContent(user), description: '이 관리자 계정의 로그인을 정지할까요?', confirmLabel: '정지', tone: 'danger' },
                () => banMutation.mutate({ id: user.id, data: {} }),
              );
            }}
          >
            {user.banned ? '정지 해제' : '정지'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={user.deleted ? 'default' : 'destructive'}
            disabled={!canRunActions || (!user.deleted && user.roleCode === 'super_admin')}
            onClick={() => {
              if (user.deleted) {
                confirmAndRun(
                  { title: '관리자 복구', content: getTargetContent(user), description: '삭제된 관리자 계정을 복구할까요?', confirmLabel: '복구' },
                  () => restoreMutation.mutate({ id: user.id }),
                );
                return;
              }
              confirmAndRun(
                { title: '관리자 삭제', content: getTargetContent(user), description: '관리자 계정을 삭제할까요? 삭제 후 복구할 수 있습니다.', confirmLabel: '삭제', tone: 'danger' },
                () => deleteMutation.mutate({ id: user.id }),
              );
            }}
          >
            {user.deleted ? '복구' : '삭제'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function patchUserOverviewCache(queryClient: QueryClient, user: UserItemDto, patch: Partial<UserItemDto>) {
  const nextUser = { ...user, ...patch };
  queryClient.setQueryData<UsersControllerGetUserOverviewV1200>(
    getUsersControllerGetUserOverviewV1QueryKey(),
    (response) => {
      if (!response) return response;

      const currentStatus = getOverviewStatus(user);
      const nextStatus = getOverviewStatus(nextUser);
      const data = { ...response.data };

      if (currentStatus !== nextStatus) {
        data[`${currentStatus}Users`] -= 1;
        data[`${nextStatus}Users`] += 1;
      }
      if (user.twoFactorEnabled !== nextUser.twoFactorEnabled) {
        data.twoFactorEnabledUsers += nextUser.twoFactorEnabled ? 1 : -1;
      }

      return { ...response, data };
    },
  );
}

function getOverviewStatus(user: Pick<UserItemDto, 'deleted' | 'banned'>): 'active' | 'banned' | 'deleted' {
  if (user.deleted) return 'deleted';
  if (user.banned) return 'banned';
  return 'active';
}

function getTargetContent(user: UserItemDto) {
  return (
    <div className="rounded-lg border bg-muted/50 px-3 py-2 text-left">
      <div className="text-sm font-medium">{user.name}</div>
      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
    </div>
  );
}
