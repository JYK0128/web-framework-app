import { useLocation, useNavigate } from '@tanstack/react-router';
import { Check, Globe } from 'lucide-react';

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { type AppLocale, locales } from '#/core/isomorphic/i18n';
import { useI18n } from '#/hooks';

export function LocaleSwitcher() {
  const { i18n, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const currentLocale = i18n.language;
  const hasLocalePath
    = location.pathname === '/'
      || locales.some(
        ({ code }) => location.pathname === `/${code}` || location.pathname === `/${code}/`,
      );

  const handleLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === currentLocale) return;

    void i18n.changeLanguage(nextLocale).then(() => {
      if (!hasLocalePath) return;

      const hash = location.hash ? `#${location.hash}` : '';
      void navigate({
        href: `/${nextLocale}${location.searchStr}${hash}`,
        replace: true,
      });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="icon"
            aria-label={t('common.language')}
            title={t('common.language')}
          >
            <Globe className="size-4" />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="min-w-32">
        {locales.map((loc) => {
          const isActive = currentLocale === loc.code;
          return (
            <DropdownMenuItem
              key={loc.code}
              onClick={() => handleLocaleChange(loc.code)}
              className={cn(
                'cursor-pointer',
                'flex items-center justify-between gap-2',
                isActive && 'font-bold',
              )}
            >
              <span>{loc.label}</span>
              {isActive && <Check />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
