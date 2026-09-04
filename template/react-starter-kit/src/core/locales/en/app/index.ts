import alerts from './alerts.json';
import cookieConsent from './cookie-consent.json';
import dialog from './dialog.json';
import profileMenu from './profile-menu.json';
import routerError from './router-error.json';
import routerNotFound from './router-not-found.json';
import theme from './theme.json';

export default {
  app: {
    ...alerts,
    ...cookieConsent,
    ...dialog,
    ...profileMenu,
    ...routerError,
    ...routerNotFound,
    ...theme,
  },
};
