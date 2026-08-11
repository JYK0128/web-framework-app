import { useI18n } from '@pkg/shared/web';
import { Globe } from 'lucide-react';

import { type AppLocale, locales } from '#/core/i18n.config';

export function LocaleSwitcher() {
  const { i18n } = useI18n();
  const currentLocale = i18n.language;

  const handleLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === currentLocale) return;

    void i18n.changeLanguage(nextLocale);
  };

  return (
    <div className="
      inline-flex items-center gap-1 rounded-full border border-zinc-200
      bg-white/80 p-1 shadow-xs backdrop-blur-md
      dark:border-zinc-800 dark:bg-zinc-900/80
    "
    >
      <div className="
        flex items-center px-2 py-1 text-xs font-semibold text-zinc-500
        dark:text-zinc-400
      "
      >
        <Globe className="size-3.5" />
      </div>
      {locales.map((loc) => {
        const isActive = currentLocale === loc.code;
        return (
          <button
            key={loc.code}
            type="button"
            onClick={() => handleLocaleChange(loc.code)}
            className={`
              rounded-full px-3 py-1 text-xs font-bold transition-all
              ${
          isActive
            ? `
              bg-orange-600 text-white shadow-xs
              dark:bg-orange-500
            `
            : `
              text-zinc-600
              hover:bg-zinc-100
              dark:text-zinc-400
              dark:hover:bg-zinc-800
            `
          }
            `}
          >
            {loc.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
