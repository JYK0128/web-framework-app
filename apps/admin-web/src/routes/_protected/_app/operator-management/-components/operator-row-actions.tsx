import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { Eye, MoreHorizontal } from 'lucide-react';

import { getOperatorsControllerGetOperatorOverviewV1QueryKey, getOperatorsControllerGetOperatorsV1QueryKey, useOperatorsControllerBanOperatorV1, useOperatorsControllerDeleteOperatorV1, useOperatorsControllerResetOperatorTwoFactorV1, useOperatorsControllerRestoreOperatorV1, useOperatorsControllerUnbanOperatorV1 } from '#/.generated/api/endpoints/operators/operators';
import type { OperatorItem, OperatorsControllerGetOperatorOverviewV1200, OperatorsControllerGetOperatorsV1200 } from '#/.generated/api/model';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { createEntityQueryCache } from '#/lib/entity-query-cache';

type OperatorRowActionsProps = {
  operator: OperatorItem
  canManage: boolean
  currentOperatorId?: string
  onOpenDetail: () => void
  onChangeRole: () => void
};

export function OperatorRowActions({ operator, canManage, currentOperatorId, onOpenDetail, onChangeRole }: OperatorRowActionsProps) {
  const queryClient = useQueryClient();
  const operatorCache = createEntityQueryCache<OperatorItem, OperatorsControllerGetOperatorsV1200>(queryClient, getOperatorsControllerGetOperatorsV1QueryKey());
  const handleSuccess = (patch: Partial<OperatorItem>) => () => {
    operatorCache.patch(operator.id, patch);
    patchOperatorOverviewCache(queryClient, operator, patch);
  };
  const banMutation = useOperatorsControllerBanOperatorV1({ mutation: { onSuccess: handleSuccess({ banned: true }) } });
  const unbanMutation = useOperatorsControllerUnbanOperatorV1({ mutation: { onSuccess: handleSuccess({ banned: false, banReason: null, banExpires: null }) } });
  const deleteMutation = useOperatorsControllerDeleteOperatorV1({ mutation: { onSuccess: handleSuccess({ deleted: true, deletedAt: new Date().toISOString() }) } });
  const restoreMutation = useOperatorsControllerRestoreOperatorV1({ mutation: { onSuccess: handleSuccess({ deleted: false, deletedAt: null }) } });
  const resetTwoFactorMutation = useOperatorsControllerResetOperatorTwoFactorV1({ mutation: { onSuccess: handleSuccess({ twoFactorEnabled: false }) } });
  const isPending = banMutation.isPending || unbanMutation.isPending || deleteMutation.isPending
    || restoreMutation.isPending || resetTwoFactorMutation.isPending;

  const confirmAndRun = (options: Parameters<typeof confirm>[0], action: () => void) => {
    void confirm(options).then((confirmed) => {
      if (confirmed) action();
    });
  };

  const isCurrentOperator = operator.id === currentOperatorId;
  const canRunActions = canManage && !isCurrentOperator;

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
              aria-label="도구"
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
            <Eye className="size-4" />
            상세
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canRunActions || operator.deleted || operator.roleCode === 'super_admin' || !operator.twoFactorEnabled}
            onClick={() => confirmAndRun(
              { title: '2FA 초기화', content: getOperatorContent(operator), description: '이 계정의 2FA 설정을 제거할까요?', confirmLabel: '초기화', tone: 'danger' },
              () => resetTwoFactorMutation.mutate({ id: operator.id }),
            )}
          >
            2FA 초기화
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRunActions || operator.deleted}
            onClick={onChangeRole}
          >
            역할 변경
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRunActions || operator.deleted || operator.roleCode === 'super_admin'}
            onClick={() => {
              if (operator.banned) {
                confirmAndRun(
                  { title: '운영자 정지 해제', content: getOperatorContent(operator), description: '로그인 정지를 해제할까요?', confirmLabel: '정지 해제' },
                  () => unbanMutation.mutate({ id: operator.id }),
                );
                return;
              }
              confirmAndRun(
                { title: '운영자 정지', content: getOperatorContent(operator), description: '이 운영자 계정의 로그인을 정지할까요?', confirmLabel: '정지', tone: 'danger' },
                () => banMutation.mutate({ id: operator.id, data: {} }),
              );
            }}
          >
            {operator.banned ? '정지 해제' : '정지'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={operator.deleted ? 'default' : 'destructive'}
            disabled={!canRunActions || (!operator.deleted && operator.roleCode === 'super_admin')}
            onClick={() => {
              if (operator.deleted) {
                confirmAndRun(
                  { title: '운영자 복구', content: getOperatorContent(operator), description: '삭제된 운영자 계정을 복구할까요?', confirmLabel: '복구' },
                  () => restoreMutation.mutate({ id: operator.id }),
                );
                return;
              }
              confirmAndRun(
                { title: '운영자 삭제', content: getOperatorContent(operator), description: '운영자 계정을 삭제할까요? 삭제 후 복구할 수 있습니다.', confirmLabel: '삭제', tone: 'danger' },
                () => deleteMutation.mutate({ id: operator.id }),
              );
            }}
          >
            {operator.deleted ? '복구' : '삭제'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function patchOperatorOverviewCache(queryClient: QueryClient, operator: OperatorItem, patch: Partial<OperatorItem>) {
  const nextOperator = { ...operator, ...patch };
  queryClient.setQueryData<OperatorsControllerGetOperatorOverviewV1200>(
    getOperatorsControllerGetOperatorOverviewV1QueryKey(),
    (response) => {
      if (!response) return response;

      const currentStatus = getOverviewStatus(operator);
      const nextStatus = getOverviewStatus(nextOperator);
      const data = { ...response.data };

      if (currentStatus !== nextStatus) {
        data[`${currentStatus}Operators`] -= 1;
        data[`${nextStatus}Operators`] += 1;
      }
      if (operator.twoFactorEnabled !== nextOperator.twoFactorEnabled) {
        data.twoFactorEnabledOperators += nextOperator.twoFactorEnabled ? 1 : -1;
      }

      return { ...response, data };
    },
  );
}

function getOverviewStatus(operator: Pick<OperatorItem, 'deleted' | 'banned'>): 'active' | 'banned' | 'deleted' {
  if (operator.deleted) return 'deleted';
  if (operator.banned) return 'banned';
  return 'active';
}

function getOperatorContent(operator: OperatorItem) {
  return (
    <div className="rounded-lg border bg-muted/50 px-3 py-2 text-left">
      <div className="text-sm font-medium">{operator.name}</div>
      <div className="truncate text-xs text-muted-foreground">{operator.email}</div>
    </div>
  );
}
