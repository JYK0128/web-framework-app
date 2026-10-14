import { useI18n } from '@pkg/web-core/i18n';
import { Calendar as ShadcnCalendar } from '@pkg/web-core/ui';
import type { ComponentProps } from 'react';
import { enUS, ko } from 'react-day-picker/locale';

export function Calendar({ locale, ...props }: ComponentProps<typeof ShadcnCalendar>) {
  const { language } = useI18n();
  const currentLocale = language.split('-')[0] === 'ko' ? ko : enUS;

  return <ShadcnCalendar locale={locale ?? currentLocale} {...props} />;
}
