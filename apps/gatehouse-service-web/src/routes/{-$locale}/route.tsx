import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: async ({ context, params }) => {
    const locale = params.locale;
    const supportedLngs = context.i18n.options.supportedLngs || [];
    if (locale && !supportedLngs.includes(locale)) {
      throw notFound({ routeId: Route.id });
    }

    const currentLocale = context.i18n.language;
    if (locale && currentLocale !== locale) {
      await context.i18n.changeLanguage(locale);
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  return <Outlet />;
}
