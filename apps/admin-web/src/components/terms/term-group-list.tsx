import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

type GroupItem = { id: string, title: string };

type TermGroupListProps<T extends GroupItem> = {
  groups: T[]
  selectedId: string
  onSelect: (id: string) => void
  onEdit?: (group: T) => void
  onDelete?: (group: T) => void
};

export function TermGroupList<T extends GroupItem>({ groups, selectedId, onSelect, onEdit, onDelete }: TermGroupListProps<T>) {
  if (groups.length === 0) return <p className="text-sm text-muted-foreground">등록된 약관 그룹이 없습니다.</p>;

  return (
    <ul className="grid content-start gap-1">
      {groups.map((group) => (
        <li
          key={group.id}
          className={cn(
            'flex items-center gap-1 rounded-lg border',
            selectedId === group.id
              ? 'border-primary/40 bg-primary/10'
              : `
                border-transparent
                hover:bg-muted/50
              `,
          )}
        >
          <button
            type="button"
            className="w-0 flex-1 px-3 py-2 text-left"
            aria-pressed={selectedId === group.id}
            onClick={() => onSelect(group.id)}
          >
            <span className="block truncate font-medium">{group.title}</span>
          </button>
          {(onEdit || onDelete) && (
            <div className="flex shrink-0 items-center gap-0.5 pr-1">
              {onEdit && (
                <Button type="button" variant="ghost" size="icon" aria-label={`${group.title} 그룹 수정`} onClick={() => onEdit(group)}>
                  <Pencil className="size-4" />
                </Button>
              )}
              {onDelete && (
                <Button type="button" variant="ghost" size="icon" aria-label={`${group.title} 그룹 삭제`} onClick={() => onDelete(group)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
