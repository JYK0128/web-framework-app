import { Link } from '@tanstack/react-router';
import { Layers3 } from 'lucide-react';

export function BrandLogo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 font-extrabold tracking-tight"
    >
      <span className="
        flex size-8 items-center justify-center rounded-lg bg-primary
        text-primary-foreground shadow-xs
      "
      >
        <Layers3 className="size-4" aria-hidden="true" />
      </span>
      <span>Service Web</span>
    </Link>
  );
}
