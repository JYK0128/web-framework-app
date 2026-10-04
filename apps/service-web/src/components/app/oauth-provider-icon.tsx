export interface OAuthProviderIconProps {
  iconUrl?: string
  className?: string
}

export function OAuthProviderIcon({ iconUrl, className }: OAuthProviderIconProps) {
  if (!iconUrl) return null;

  return (
    <img
      src={iconUrl}
      alt=""
      aria-hidden="true"
      className={
        className
          ? `
            ${className}
            object-contain
          `
          : 'size-4 shrink-0 object-contain'
      }
    />
  );
}
