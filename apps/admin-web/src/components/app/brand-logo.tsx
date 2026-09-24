import { Link } from '@tanstack/react-router';
import { Layers3 } from 'lucide-react';

export function BrandLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 font-extrabold tracking-tight"
      aria-label={collapsed ? 'Admin Web' : undefined}
    >
      <span className="
        flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary
        text-primary-foreground shadow-xs
      "
      >
        <Layers3 className="size-4" aria-hidden="true" />
      </span>
      {!collapsed && <span>Admin Web</span>}
    </Link>
  );
}
