import activityLogs from './activity-logs.json';
import alerts from './alerts.json';
import auth from './auth.json';
import common from './common.json';
import cookieConsent from './cookie-consent.json';
import chart from './chart.json';
import dashboard from './dashboard.json';
import dataGrid from './data-grid.json';
import faq from './faq.json';
import form from './form.json';
import inquiries from './inquiries.json';
import navigation from './navigation.json';
import pagination from './pagination.json';
import dialog from './dialog.json';
import notices from './notices.json';
import page from './page.json';
import permission from './permission.json';
import profile from './profile.json';
import profileMenu from './profile-menu.json';
import stepForm from './step-form.json';
import systemConfig from './system-config.json';
import templates from './templates.json';
import terms from './terms.json';
import theme from './theme.json';
import users from './users.json';
import validation from './validation.json';

export default {
  ...validation,
  ...common,
  ...dialog,
  ...pagination,
  ...cookieConsent,
  ...profileMenu,
  ...stepForm,
  ...theme,
  ...chart,
  ...navigation,
  ...auth,
  ...dashboard,
  ...alerts,
  ...users,
  ...permission,
  ...terms,
  ...notices,
  ...inquiries,
  ...faq,
  ...activityLogs,
  ...profile,
  ...dataGrid,
  ...form,
  ...page,
  ...templates,
  ...systemConfig,
};
