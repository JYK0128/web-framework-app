import { createColumnHelper } from '@tanstack/react-table';
import { Eye, Pencil, Send, Trash2 } from 'lucide-react';

import type { AdminTermDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

const columnHelper = createColumnHelper<AdminTermDto>();

type TermColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  canUpdate: boolean
  canDelete: boolean
  onView: (term: AdminTermDto) => void
  onEdit: (term: AdminTermDto) => void
  onPublish: (term: AdminTermDto) => void
  onDelete: (term: AdminTermDto) => void
};

export function createTermColumns({ i18n, canUpdate, canDelete, onView, onEdit, onPublish, onDelete }: TermColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  return [
    columnHelper.accessor('version', {
      id: 'version',
      header: translate('termsManagement.fields.version'),
    }),
    columnHelper.accessor('isPublished', {
      id: 'status',
      header: translate('termsManagement.status'),
      enableSorting: false,
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? 'default' : 'secondary'}>
          {getValue() ? translate('termsManagement.published') : translate('termsManagement.draft')}
        </Badge>
      ),
    }),
    columnHelper.accessor('publishedAt', {
      id: 'publishedAt',
      header: translate('termsManagement.fields.publishedAt'),
      cell: ({ getValue }) => {
        const publishedAt = getValue();
        return <span className="text-xs text-muted-foreground">{publishedAt ? new Date(publishedAt).toLocaleString(dateLocale) : '-'}</span>;
      },
    }),
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: translate('termsManagement.createdAt'),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleString(dateLocale)}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('termsManagement.manage'),
      enableSorting: false,
      size: 110,
      cell: ({ row }) => {
        const term = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => onView(term)} title={translate('termsManagement.view')} aria-label={translate('termsManagement.view')}>
              <Eye className="size-4 text-muted-foreground" />
            </Button>
            {canUpdate && !term.isPublished && (
              <>
                <Button variant="ghost" size="icon" onClick={() => onEdit(term)} title={translate('termsManagement.edit')} aria-label={translate('termsManagement.edit')}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onPublish(term)} title={translate('termsManagement.publish')} aria-label={translate('termsManagement.publish')}>
                  <Send className="size-4 text-primary" />
                </Button>
              </>
            )}
            {canDelete && !term.isPublished && (
              <Button variant="ghost" size="icon" onClick={() => onDelete(term)} title={translate('termsManagement.delete')} aria-label={translate('termsManagement.delete')}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
    }),
  ];
}
