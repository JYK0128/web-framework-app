import { Link } from '@tanstack/react-router';

import { cn } from '#/.generated/shadcn/lib/utils';
import { AppIcon } from '#/components/app/app-icon';

type BrandLogoProps = {
  collapsed?: boolean
  onClick?: () => void
};

export function BrandLogo({ collapsed, onClick }: BrandLogoProps) {
  return (
    <Link
      to="/dashboard"
      onClick={onClick}
      className="flex items-center gap-2.5 font-extrabold tracking-tight"
      title="STARTER KIT"
    >
      <div className="
        flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary
        text-primary-foreground shadow-xs
      "
      >
        <AppIcon name="layers" className="size-4" />
      </div>
      <span className={cn(
        'truncate text-base font-black',
        collapsed && 'hidden',
      )}
      >
        STARTER KIT
      </span>
    </Link>
  );
}
