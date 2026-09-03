import { createColumnHelper } from '@tanstack/react-table';
import { Eye, ShieldAlert, ShieldCheck } from 'lucide-react';

import type { UserItemDto } from '#/.generated/api/model';
import { Avatar, AvatarFallback, Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';
import { ListStatusBadge } from '#/routes/_protected/_app/user-management/-components/list-status-badge';

const columnHelper = createColumnHelper<UserItemDto>();

type UserColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  onShowDetails: (userId: string) => void
};

export function createUserColumns({ i18n, onShowDetails }: UserColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  return [
    columnHelper.accessor('name', {
      id: 'name',
      header: translate('users.user'),
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="
              bg-primary/10 text-xs font-bold text-primary
            "
            >
              {row.original.name ? row.original.name.slice(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground">{row.original.name || translate('users.noName')}</span>
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      id: 'email',
      header: translate('users.email'),
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('role', {
      id: 'role',
      header: translate('users.role'),
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterOptions: [
          { label: translate('users.adminRole'), value: 'admin' },
          { label: translate('users.userRole'), value: 'user' },
        ],
      },
      cell: ({ getValue }) => {
        const role = getValue();
        let roleLabel = role;
        if (role === 'admin') roleLabel = translate('users.adminRole');
        else if (role === 'user') roleLabel = translate('users.userRole');
        return (
          <Badge
            variant={role === 'admin' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {roleLabel}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('deleted', {
      id: 'status',
      header: translate('users.status'),
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterOptions: [
          { label: translate('users.active'), value: 'active' },
          { label: translate('users.banned'), value: 'banned' },
          { label: translate('users.deleted'), value: 'deleted' },
        ],
      },
      cell: ({ row }) => <ListStatusBadge user={row.original} deletedLabel={translate('users.deleted')} bannedLabel={translate('users.banned')} activeLabel={translate('users.active')} />,
    }),
    columnHelper.accessor('twoFactorEnabled', {
      id: 'twoFactorEnabled',
      header: translate('users.twoFactorSecurity'),
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterOptions: [
          { label: translate('users.twoFactorOn'), value: 'true' },
          { label: translate('users.twoFactorOff'), value: 'false' },
        ],
      },
      cell: ({ getValue }) => getValue()
        ? (
          <Badge
            variant="outline"
            className="
              flex w-fit items-center gap-1 border-emerald-300 bg-emerald-50
              text-2xs text-emerald-600
              dark:bg-emerald-950/30
            "
          >
            <ShieldCheck className="size-3 text-emerald-500" />
            <span>{translate('users.twoFactorOn')}</span>
          </Badge>
        )
        : (
          <Badge
            variant="outline"
            className="
              flex w-fit items-center gap-1 text-2xs text-muted-foreground
            "
          >
            <ShieldAlert className="size-3 text-amber-500" />
            <span>{translate('users.twoFactorOff')}</span>
          </Badge>
        ),
    }),
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: translate('users.joinedAt'),
      enableColumnFilter: false,
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleDateString(language.startsWith('ko') ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('common.manage'),
      enableSorting: false,
      enableColumnFilter: false,
      size: 80,
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" onClick={() => onShowDetails(row.original.id)} title={translate('users.details')} aria-label={translate('users.details')}>
            <Eye className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
        </div>
      ),
    }),
  ];
}
