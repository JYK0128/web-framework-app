import { cn } from '@pkg/web-core/utils';
import type { ComponentProps } from 'react';

export type BrandLogoProps = ComponentProps<'div'> & {
  collapsed?: boolean
};

function BrandLogoRoot({ collapsed = false, className, ...props }: BrandLogoProps) {
  return (
    <div
      {...props}
      data-collapsed={collapsed}
      className={cn('group/brand-logo flex shrink-0 items-center gap-2.5 font-extrabold tracking-tight', className)}
    />
  );
}

function BrandLogoIcon({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      {...props}
      className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs [&>svg]:size-4', className)}
    />
  );
}

function BrandLogoLabel({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      {...props}
      className={cn('whitespace-nowrap group-data-[collapsed=true]/brand-logo:hidden', className)}
    />
  );
}

/** The app supplies the icon, label, link and responsive label visibility. */
export const BrandLogo = Object.assign(BrandLogoRoot, {
  Icon: BrandLogoIcon,
  Label: BrandLogoLabel,
});
