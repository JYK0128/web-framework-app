import { BrandLogo as CoreBrandLogo } from '@pkg/web-core/ui';
import { Link } from '@tanstack/react-router';
import { Layers3 } from 'lucide-react';

type BrandLogoProps = {
  collapsed?: boolean
  labelClassName?: string
};

export function BrandLogo({ collapsed = false, labelClassName }: BrandLogoProps) {
  return (
    <Link to="/" aria-label="운영자 웹" className="shrink-0">
      <CoreBrandLogo collapsed={collapsed}>
        <CoreBrandLogo.Icon>
          <Layers3 aria-hidden="true" />
        </CoreBrandLogo.Icon>
        <CoreBrandLogo.Label className={labelClassName}>운영자 웹</CoreBrandLogo.Label>
      </CoreBrandLogo>
    </Link>
  );
}
