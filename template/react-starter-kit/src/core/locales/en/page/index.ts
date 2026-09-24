import accessRestricted from './access-restricted.json';
import dashboard from './dashboard.json';
import faq from './faq.json';
import faqManagement from './faq-management.json';
import findAccount from './find-account.json';
import index from './index.json';
import inquiry from './inquiry.json';
import inquiryManagement from './inquiry-management.json';
import login from './login.json';
import logs from './logs.json';
import maintenance from './maintenance.json';
import notice from './notice.json';
import noticeManagement from './notice-management.json';
import onboarding from './onboarding.json';
import permissionManagement from './permission-management.json';
import profile from './profile.json';
import serviceUnavailable from './service-unavailable.json';
import support from './support.json';
import supportManagement from './support-management.json';
import systemManagement from './system-management.json';
import termsManagement from './terms-management.json';
import userManagement from './user-management.json';

export default {
  ...index,
  ...maintenance,
  ...serviceUnavailable,
  ...accessRestricted,
  ...login,
  ...findAccount,
  ...onboarding,
  ...faq,
  ...dashboard,
  ...faqManagement,
  ...inquiryManagement,
  ...inquiry,
  ...logs,
  ...noticeManagement,
  ...notice,
  ...permissionManagement,
  ...profile,
  ...systemManagement,
  ...support,
  ...supportManagement,
  ...termsManagement,
  ...userManagement,
};
