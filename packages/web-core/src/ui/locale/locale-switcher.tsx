import { useLocation, useNavigate } from '@tanstack/react-router';
import { Check, Globe } from 'lucide-react';

import { useI18n } from '#context/i18n';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '#ui';
import { cn } from '#utils';

import { getSupportedLocales } from './supported-locales';

type LocaleSwitcherProps = {
  presentation?: 'button' | 'submenu'
};

export function LocaleSwitcher({ presentation = 'button' }: LocaleSwitcherProps) {
  const { i18n, language, t } = useI18n();
  const locales = getSupportedLocales(i18n);
  const location = useLocation();
  const navigate = useNavigate();
  const hasLocalePath
    = location.pathname === '/'
      || locales.some(
        ({ code }) => location.pathname === `/${code}` || location.pathname === `/${code}/`,
      );

  const handleLocaleChange = async (nextLocale: string) => {
    if (nextLocale === language) return;

    await i18n.changeLanguage(nextLocale);
    if (!hasLocalePath) return;

    const hash = location.hash ? `#${location.hash}` : '';
    void navigate({
      href: `/${nextLocale}${location.searchStr}${hash}`,
      replace: true,
    });
  };

  const items = locales.map((locale) => {
    const isActive = language === locale.code;
    return (
      <DropdownMenuItem
        key={locale.code}
        onClick={() => void handleLocaleChange(locale.code)}
        className={cn(
          'cursor-pointer flex items-center justify-between gap-2',
          isActive && 'font-bold',
        )}
      >
        <span>{locale.label}</span>
        {isActive && <Check />}
      </DropdownMenuItem>
    );
  });

  if (presentation === 'submenu') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Globe />
          {t('webCore.localeSwitcher.language')}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>{items}</DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button {...props} type="button" variant="outline" size="icon" aria-label={t('webCore.localeSwitcher.language')} title={t('webCore.localeSwitcher.language')}>
            <Globe className="size-4" />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="min-w-32">
        {items}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
