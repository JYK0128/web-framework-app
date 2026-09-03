import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '#/.generated/shadcn/components/ui/button';
import { useI18n } from '#/hooks';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark');

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative"
    >
      <Sun className="
        size-4 rotate-0 scale-100 transition-all
        dark:-rotate-90 dark:scale-0
      "
      />
      <Moon className="
        absolute size-4 rotate-90 scale-0 transition-all
        dark:rotate-0 dark:scale-100
      "
      />
    </Button>
  );
}
