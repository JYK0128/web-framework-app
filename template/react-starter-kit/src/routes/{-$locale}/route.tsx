import { createFileRoute, notFound, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ context, params }) => {
    const locale = params.locale;

    if (!locale) {
      throw redirect({ href: `/${context.i18n.language}` });
    }

    const supportedLngs = context.i18n.options.supportedLngs;
    if (!Array.isArray(supportedLngs) || !supportedLngs.includes(locale)) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  return <Outlet />;
}
