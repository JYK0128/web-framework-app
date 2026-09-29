import { useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Ban, CheckCircle2, Eye, FileText, KeyRound, MoreHorizontal } from 'lucide-react';

import { getCustomersControllerListCustomersV1QueryKey, useCustomersControllerBanCustomerV1, useCustomersControllerUnbanCustomerV1 } from '#/.generated/api/endpoints/customers/customers';
import type { AdminCustomerItem } from '#/.generated/api/model';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { Action } from '#/components/auth/action';
import { openModal } from '#/components/modal';

import { CustomerRoleModal } from './customer-role-modal';

type CustomerRowActionsProps = {
  customer: AdminCustomerItem
  canUpdate: boolean
  onOpenDetail: () => void
  onOpenMemo: () => void
  onOpenSessions: () => void
  onChanged?: () => void
};

export function CustomerRowActions({ customer, canUpdate, onOpenDetail, onOpenMemo, onOpenSessions, onChanged }: CustomerRowActionsProps) {
  const queryClient = useQueryClient();
  const banMutation = useCustomersControllerBanCustomerV1();
  const unbanMutation = useCustomersControllerUnbanCustomerV1();
  const isPending = banMutation.isPending || unbanMutation.isPending;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: getCustomersControllerListCustomersV1QueryKey() });
    onChanged?.();
  };
  const toggleBan = () => {
    void confirm({
      title: customer.banned ? '고객 정지 해제' : '고객 이용 정지',
      content: `${customer.name} 고객의 이용을 ${customer.banned ? '다시 허용' : '정지'}하시겠습니까?`,
      description: customer.banned ? '정지 상태가 해제됩니다.' : '고객은 더 이상 로그인할 수 없습니다.',
      confirmLabel: customer.banned ? '정지 해제' : '정지',
      tone: customer.banned ? 'default' : 'danger',
    }).then(async (confirmed) => {
      if (!confirmed) return;
      if (customer.banned) {
        await unbanMutation.mutateAsync({ id: customer.id });
      }
      else {
        await banMutation.mutateAsync({ id: customer.id, data: {} });
      }
      await refresh();
    });
  };

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
          <DropdownMenuItem disabled={!canUpdate} onClick={onOpenMemo}>
            <FileText className="size-4" />
            운영 메모
          </DropdownMenuItem>
          <Action
            permission="customer:update"
            fallback={<DropdownMenuItem disabled>멤버십 변경</DropdownMenuItem>}
            render={(
              <DropdownMenuItem
                disabled={!canUpdate || isPending}
                onClick={() => void openModal(CustomerRoleModal, { customer, onChanged })}
              >
                <BadgeCheck className="size-4" />
                멤버십 변경
              </DropdownMenuItem>
            )}
          />
          <DropdownMenuItem disabled={!canUpdate} onClick={onOpenSessions}>
            <KeyRound className="size-4" />
            로그인 세션
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <Action
            permission="customer:update"
            fallback={(
              <DropdownMenuItem disabled>
                {customer.banned
                  ? <CheckCircle2 className="size-4" />
                  : (
                    <Ban className="size-4" />
                  )}
                {customer.banned ? '정지 해제' : '이용 정지'}
              </DropdownMenuItem>
            )}
            render={(
              <DropdownMenuItem
                className={customer.banned
                  ? `
                    text-emerald-600
                    focus:text-emerald-600
                    dark:text-emerald-400
                    dark:focus:text-emerald-400
                  `
                  : `
                    text-destructive
                    focus:text-destructive
                  `}
                disabled={!canUpdate || isPending}
                onClick={toggleBan}
              >
                {customer.banned
                  ? <CheckCircle2 className="size-4" />
                  : (
                    <Ban className="size-4" />
                  )}
                {customer.banned ? '정지 해제' : '이용 정지'}
              </DropdownMenuItem>
            )}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
