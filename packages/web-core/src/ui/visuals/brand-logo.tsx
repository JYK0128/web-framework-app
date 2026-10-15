import { Link } from '@tanstack/react-router';

export type BrandLogoProps = {
  logoSrc?: string
  iconSrc?: string
  alt?: string
  to?: string
};

export function BrandLogo({ logoSrc, iconSrc, alt = '', to }: BrandLogoProps) {
  if (!logoSrc && !iconSrc) return null;

  const content = (
    <picture>
      {iconSrc && <source media="(max-width: 639px)" srcSet={iconSrc} />}
      <img
        src={logoSrc ?? iconSrc}
        alt={alt}
        className="h-8 max-w-40 object-contain object-left"
      />
    </picture>
  );

  const className = 'flex items-center';
  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return <div className={className}>{content}</div>;
}
