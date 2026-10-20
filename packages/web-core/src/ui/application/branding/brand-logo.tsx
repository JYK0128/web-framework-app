import { Link } from '@tanstack/react-router';

export type BrandLogoProps = {
  text: string
  logoSrc?: string
  iconSrc?: string
  to?: string
};

export function BrandLogo({ text, logoSrc, iconSrc, to }: BrandLogoProps) {
  const content = logoSrc || iconSrc
    ? (
      <picture>
        {iconSrc && <source media="(max-width: 639px)" srcSet={iconSrc} />}
        <img
          src={logoSrc ?? iconSrc}
          alt={text}
          className="h-8 max-w-40 object-contain object-left"
        />
      </picture>
    )
    : (
      <span className="text-lg font-extrabold tracking-tight text-foreground">
        {text}
      </span>
    );

  const className = 'flex items-center';
  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return <div className={className}>{content}</div>;
}
