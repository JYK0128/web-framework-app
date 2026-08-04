import { useI18n } from '@pkg/shared/web';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Globe } from 'lucide-react';

const SUPPORTED_LOCALES = [
  { code: 'ko', label: '한국어', shortLabel: 'KO' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
] as const;

export function LocaleSwitcher() {
  const { language, changeLanguage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLocaleChange = (nextLocale: string) => {
    if (nextLocale === language) return;

    void changeLanguage(nextLocale);

    const currentPath = location.pathname;
    const targetPath = currentPath.replace(/^\/(ko|en)(\/|$)/, `/${nextLocale}$2`);

    if (targetPath !== currentPath) {
      void navigate({ to: targetPath, replace: true });
    }
  };

  return (
    <div className="
      inline-flex items-center gap-1 rounded-full border border-zinc-200
      bg-white/80 p-1 shadow-xs backdrop-blur-md
      dark:border-zinc-800 dark:bg-zinc-900/80
    "
    >
      <div className="
        flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold
        text-zinc-500
        dark:text-zinc-400
      "
      >
        <Globe className="size-3.5" />
        <span className="
          hidden
          sm:inline
        "
        >
          i18n
        </span>
      </div>
      {SUPPORTED_LOCALES.map((loc) => {
        const isActive = language === loc.code || language.startsWith(loc.code);
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
