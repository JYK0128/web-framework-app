import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

type StatsCardProps = {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  textColor?: string
  className?: string
};

export function StatsCard({ label, value, icon, textColor, className }: StatsCardProps) {
  return (
    <Card
      className={cn('grid grid-rows-[auto_minmax(0,1fr)]', className)}
    >
      <CardHeader className="flex items-center justify-between gap-2 pb-2">
        <CardDescription className="text-xs font-medium">{label}</CardDescription>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn('text-right text-2xl font-bold', textColor)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
