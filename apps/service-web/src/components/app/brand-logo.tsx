import { BrandLogo as CoreBrandLogo } from '@pkg/web-core/ui';
import { Link } from '@tanstack/react-router';
import { Layers3 } from 'lucide-react';

type BrandLogoProps = {
  collapsed?: boolean
  labelClassName?: string
};

export function BrandLogo({ collapsed = false, labelClassName }: BrandLogoProps) {
  return (
    <Link to="/" aria-label="Service Web" className="shrink-0">
      <CoreBrandLogo collapsed={collapsed}>
        <CoreBrandLogo.Icon>
          <Layers3 aria-hidden="true" />
        </CoreBrandLogo.Icon>
        <CoreBrandLogo.Label className={labelClassName}>Service Web</CoreBrandLogo.Label>
      </CoreBrandLogo>
    </Link>
  );
}
