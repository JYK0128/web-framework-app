import type { ComponentProps } from 'react';
import { enUS, ko } from 'react-day-picker/locale';

import { useI18n } from '#context/i18n';
import { Calendar as ShadcnCalendar } from '#ui';

export function Calendar({ locale, ...props }: ComponentProps<typeof ShadcnCalendar>) {
  const { language } = useI18n();
  const currentLocale = language.split('-')[0] === 'ko' ? ko : enUS;

  return <ShadcnCalendar locale={locale ?? currentLocale} {...props} />;
}
