import alertBell from './alert-bell.json';
import chart from './chart.json';
import cookieConsent from './cookie-consent.json';
import dialog from './dialog.json';
import globalLoading from './global-loading.json';
import localeSwitcher from './locale-switcher.json';
import profileDropdown from './profile-dropdown.json';
import routerError from './router-error.json';
import routerNotFound from './router-not-found.json';
import theme from './theme.json';

export default {
  app: {
    ...alertBell,
    ...chart,
    ...cookieConsent,
    ...dialog,
    ...localeSwitcher,
    ...globalLoading,
    ...profileDropdown,
    ...routerError,
    ...routerNotFound,
    ...theme,
  },
};
