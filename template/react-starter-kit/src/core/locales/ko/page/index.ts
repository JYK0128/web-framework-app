import dashboard from './dashboard.json';
import faqManagement from './faq-management.json';
import index from './index.json';
import inquiryManagement from './inquiry-management.json';
import logManagement from './log-management.json';
import login from './login.json';
import maintenance from './maintenance.json';
import messageManagement from './message-management.json';
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
  ...dashboard,
  ...faqManagement,
  ...inquiryManagement,
  ...logManagement,
  ...messageManagement,
  ...noticeManagement,
  ...permissionManagement,
  ...profile,
  ...systemManagement,
  ...termsManagement,
  ...userManagement,
};
