import { useLocation, useNavigate } from '@tanstack/react-router';
import { Globe } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { type AppLocale, locales } from '#/core/isomorphic/i18n';
import { useI18n } from '#/hooks';

export function LocaleSwitcher() {
  const { i18n, t, language } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const currentLocale = language;
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
    <Select
      value={currentLocale}
      items={locales.map((locale) => ({ value: locale.code, label: locale.label }))}
      onValueChange={(value) => {
        const locale = locales.find((item) => item.code === value);
        if (locale) handleLocaleChange(locale.code);
      }}
    >
      <SelectTrigger className="w-32" aria-label={t('app.localeSwitcher.language')}>
        <Globe className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale.code} value={locale.code}>{locale.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
