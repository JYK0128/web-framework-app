import type { IconName } from 'lucide-react/dynamic';

import { Card, CardContent, CardDescription, CardHeader, Skeleton } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { AppIcon } from '#/components/app/app-icon';

type StatsCardProps = {
  label: string
  value: Primitive
  icon?: IconName
  iconColor?: string
  textColor?: string
  className?: string
  isLoading?: boolean
};

export function StatsCard({ label, value, icon, iconColor, textColor, className, isLoading = false }: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className={cn('grid grid-rows-[auto_minmax(0,1fr)]', className)}>
        <CardHeader className="flex items-center justify-between gap-2 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-end pt-1">
            <Skeleton className="h-7 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn('grid grid-rows-[auto_minmax(0,1fr)]', className)}
    >
      <CardHeader className="flex items-center justify-between gap-2 pb-2">
        <CardDescription className="text-xs font-medium">{label}</CardDescription>
        {icon && (
          <AppIcon
            name={icon}
            className={cn(`size-4 text-muted-foreground`, iconColor)}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-right text-2xl font-bold', textColor)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
