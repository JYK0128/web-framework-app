import { useI18n } from '@pkg/shared/web';
import { Globe2 } from 'lucide-react';

export function LocaleSwitcher() {
  const { language, changeLanguage } = useI18n();
  const nextLocale = language === 'ko' ? 'en' : 'ko';

  return (
    <button
      type="button"
      className="
        flex w-20 items-center justify-center gap-1.5 rounded-full border
        border-zinc-900 px-3 py-1.5 text-xs font-bold transition-colors shrink-0
        hover:bg-zinc-900 hover:text-white
      "
      onClick={() => void changeLanguage(nextLocale)}
    >
      <Globe2 size={15} className="shrink-0" />
      <span className="w-5 text-center">{language === 'ko' ? '한' : 'En'}</span>
    </button>
  );
}
