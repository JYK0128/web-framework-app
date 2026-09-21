import { Check, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '#/.generated/shadcn/components/ui';

export function LocaleSwitcher() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<'ko' | 'en'>(() => (
    typeof window !== 'undefined' && localStorage.getItem('user-locale') === 'en' ? 'en' : 'ko'
  ));

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem('user-locale', locale);
  }, [locale]);

  const selectLocale = (nextLocale: 'ko' | 'en') => {
    setLocale(nextLocale);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button type="button" variant="outline" size="icon" aria-label="언어 선택" onClick={() => setOpen((current) => !current)}>
        <Globe className="size-4" />
      </Button>
      {open && (
        <div className="
          absolute right-0 z-50 mt-2 grid min-w-32 gap-1 rounded-md border
          bg-popover p-1 text-popover-foreground shadow-md
        "
        >
          {([['ko', '한국어'], ['en', 'English']] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="
                flex items-center justify-between rounded-sm px-3 py-2 text-left
                text-sm
                hover:bg-accent
              "
              onClick={() => selectLocale(value)}
            >
              {label}
              {locale === value && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
