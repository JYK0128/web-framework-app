import type { IconName } from 'lucide-react/dynamic';

import { AppIcon, Card, CardContent, CardDescription, CardHeader, Skeleton } from '#ui';
import { cn } from '#utils';

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
  return (
    <Card className={cn('grid grid-rows-[auto_minmax(0,1fr)]', className)}>
      <CardHeader className="flex items-center justify-between gap-2 pb-2">
        {isLoading
          ? <Skeleton className="h-4 w-20" />
          : (
            <CardDescription className="text-xs font-medium">
              {label}
            </CardDescription>
          )}
        {isLoading
          ? <Skeleton className="size-4 rounded-full" />
          : icon && (
            <AppIcon
              name={icon}
              className={cn(`size-4 text-muted-foreground`, iconColor)}
            />
          )}
      </CardHeader>
      <CardContent>
        <div className={cn('flex justify-end pt-1 text-right text-2xl font-bold', !isLoading && textColor)}>
          {isLoading ? <Skeleton className="h-7 w-24" /> : value}
        </div>
      </CardContent>
    </Card>
  );
}
