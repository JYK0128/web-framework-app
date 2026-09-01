import type { UserItemDto } from '#/.generated/api/model';
import { Badge } from '#/.generated/shadcn/components/ui';

type ListStatusBadgeProps = {
  user: UserItemDto
  deletedLabel: string
  bannedLabel: string
  activeLabel: string
};

export function ListStatusBadge({ user, deletedLabel, bannedLabel, activeLabel }: ListStatusBadgeProps) {
  if (user.deleted) return <Badge variant="destructive" className="text-xs">{deletedLabel}</Badge>;
  if (user.banned) return <Badge variant="destructive" className="text-xs">{bannedLabel}</Badge>;
  return <Badge variant="outline" className="text-xs text-emerald-600">{activeLabel}</Badge>;
}
