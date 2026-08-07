import { useI18n } from '@pkg/shared/web';
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';

const VALID_LOCALES = ['ko', 'en'];

export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params }) => {
    const locale = params.locale;
    if (locale && !VALID_LOCALES.some((l) => l === locale)) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  const { i18n } = useI18n();

  useEffect(() => {
    if (locale && VALID_LOCALES.some((l) => l === locale) && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  return <Outlet />;
}
