import activityLogs from './activity-logs.json';
import alerts from './alerts.json';
import auth from './auth.json';
import common from './common.json';
import dashboard from './dashboard.json';
import dataGrid from './data-grid.json';
import faq from './faq.json';
import form from './form.json';
import inquiries from './inquiries.json';
import navigation from './navigation.json';
import notices from './notices.json';
import page from './page.json';
import permission from './permission.json';
import profile from './profile.json';
import terms from './terms.json';
import users from './users.json';
import validation from './validation.json';

export default {
  ...validation,
  ...common,
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
};
