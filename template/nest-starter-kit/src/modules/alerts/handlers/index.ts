import { CreateAlertHandler } from './create-alert.handler';
import { DeleteAlertHandler } from './delete-alert.handler';
import { GetMyAlertsHandler } from './get-my-alerts.handler';
import { MarkAlertReadHandler } from './mark-alert-read.handler';
import { MarkAllAlertsReadHandler } from './mark-all-alerts-read.handler';
import { SendInquiryMessageAlertEventHandler } from './send-inquiry-message-alert.event-handler';
import { SendNoticeCreatedAlertEventHandler } from './send-notice-created-alert.event-handler';

export { CreateAlertHandler,
  DeleteAlertHandler,
  GetMyAlertsHandler,
  MarkAlertReadHandler,
  MarkAllAlertsReadHandler,
  SendInquiryMessageAlertEventHandler,
  SendNoticeCreatedAlertEventHandler };

export const alertHandlers = [
  CreateAlertHandler,
  DeleteAlertHandler,
  GetMyAlertsHandler,
  MarkAlertReadHandler,
  MarkAllAlertsReadHandler,
  SendInquiryMessageAlertEventHandler,
  SendNoticeCreatedAlertEventHandler,
];
