export function getUnansweredAlertCooldownKey(inquiryId: string): string {
  return `inquiry:unanswered-alert:${inquiryId}`;
}
