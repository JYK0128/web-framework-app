import chart from './chart.json';
import cookie_consent from './cookie-consent.json';
import data_grid from './data-grid.json';
import dialog from './dialog.json';
import form from './form.json';
import global_loading from './global-loading.json';
import locale_switcher from './locale-switcher.json';
import notification from './notification.json';
import password_policy from './password-policy.json';
import profile_dropdown from './profile-dropdown.json';
import router_error from './router-error.json';
import router_error_page from './router-error-page.json';
import router_not_found from './router-not-found.json';
import router_not_found_page from './router-not-found-page.json';
import theme from './theme.json';
import validation from './validation.json';

export const localeResources = {
  app: {
    ...chart,
    ...cookie_consent,
    ...dialog,
    ...global_loading,
    ...profile_dropdown,
    ...router_error,
    ...router_not_found,
    ...theme,
  },
  core: {
    ...data_grid,
    ...form,
    ...validation,
  },
  ...locale_switcher,
  ...notification,
  ...password_policy,
  ...router_error_page,
  ...router_not_found_page,
} as const;
