import type { ComponentProps } from 'react';
import { enUS, ko } from 'react-day-picker/locale';

import { Calendar as ShadcnCalendar } from '#/.generated/shadcn/components/ui/calendar';
import { useI18n } from '#/i18n/use-i18n';

export function Calendar({ locale, ...props }: ComponentProps<typeof ShadcnCalendar>) {
  const { language } = useI18n();
  const currentLocale = language.split('-')[0] === 'ko' ? ko : enUS;

  return <ShadcnCalendar locale={locale ?? currentLocale} {...props} />;
}
