import type { OperatingMessagesDto } from '#/.generated/api/model';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export type MessagesTabProps = {
  messages?: Partial<OperatingMessagesDto>
  onSave: (messages: OperatingMessagesDto) => Promise<void>
};

export function MessagesTab({ messages, onSave }: MessagesTabProps) {
  const { t } = useI18n();

  const msgForm = useAppForm({
    defaultValues: {
      msgLunch: messages?.lunch ?? '현재 점심시간(12:00 ~ 13:00)입니다. 문의를 남겨주시면 순차적으로 답변드리겠습니다.',
      msgOffHours: messages?.offHours ?? '현재는 운영시간 외입니다. 남겨주신 문의는 다음 영업일 09:00부터 순차 처리됩니다.',
      msgHoliday: messages?.holiday ?? '주말 및 공휴일은 고객센터 휴무입니다. 문의는 다음 영업일에 순차 답변드립니다.',
      msgMaintenance: messages?.maintenance ?? '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.',
    },
    onSubmit: async ({ value }) => {
      await onSave({
        lunch: value.msgLunch,
        offHours: value.msgOffHours,
        holiday: value.msgHoliday,
        maintenance: value.msgMaintenance,
      });
    },
  });

  return (
    <msgForm.AppForm>
      <FormLayout
        id="messages-form"
        onSubmit={() => void msgForm.handleSubmit()}
        className="flex flex-col"
      >
        <SectionCard variant="ghost" textSize="base" icon="message-square" title={t('systemManagement.messages.title')} description={t('systemManagement.messages.description')}>
          <SectionCard.Content className="grid grid-cols-1">
            <msgForm.AppField name="msgLunch">
              {(field) => (
                <field.Textarea
                  label={t('systemManagement.messages.lunch')}
                  rows={3}
                />
              )}
            </msgForm.AppField>

            <msgForm.AppField name="msgOffHours">
              {(field) => (
                <field.Textarea
                  label={t('systemManagement.messages.offHours')}
                  rows={3}
                />
              )}
            </msgForm.AppField>

            <msgForm.AppField name="msgHoliday">
              {(field) => (
                <field.Textarea
                  label={t('systemManagement.messages.holiday')}
                  rows={3}
                />
              )}
            </msgForm.AppField>

            <msgForm.AppField name="msgMaintenance">
              {(field) => (
                <field.Textarea
                  label={t('systemManagement.messages.maintenance')}
                  rows={3}
                />
              )}
            </msgForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </msgForm.AppForm>
  );
}
