import dashboard from './dashboard.json';
import faq from './faq.json';
import faqManagement from './faq-management.json';
import index from './index.json';
import inquiry from './inquiry.json';
import inquiryManagement from './inquiry-management.json';
import logManagement from './log-management.json';
import login from './login.json';
import maintenance from './maintenance.json';
import messageManagement from './message-management.json';
import notice from './notice.json';
import noticeManagement from './notice-management.json';
import onboarding from './onboarding.json';
import permissionManagement from './permission-management.json';
import profile from './profile.json';
import systemManagement from './system-management.json';
import termsManagement from './terms-management.json';
import userManagement from './user-management.json';

export default {
  ...index,
  ...maintenance,
  ...login,
  ...onboarding,
  ...faq,
  ...dashboard,
  ...faqManagement,
  ...inquiryManagement,
  ...inquiry,
  ...logManagement,
  ...messageManagement,
  ...noticeManagement,
  ...notice,
  ...permissionManagement,
  ...profile,
  ...systemManagement,
  ...termsManagement,
  ...userManagement,
};
