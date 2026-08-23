import { MessageSquare } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';

export interface OperatingMessagesValue {
  lunch: string
  offHours: string
  holiday: string
  maintenance: string
}

export type MessagesTabProps = {
  messages?: Partial<OperatingMessagesValue>
  onSave: (messages: OperatingMessagesValue) => Promise<void>
};

export function MessagesTab({ messages, onSave }: MessagesTabProps) {
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
        className="flex flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              상황별 고객 안내 문구
            </CardTitle>
            <CardDescription>
              고객센터 비업무 및 점검 상태에 따라 대시보드 위젯 및 1:1 문의창에 실시간으로 표시될 안내 문구입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="
            grid grid-cols-1
            md:grid-cols-2
            gap-6
          "
          >
            <msgForm.AppField name="msgLunch">
              {(field) => (
                <field.Textarea
                  label="점심 / 휴게시간 안내 (LUNCH)"
                  rows={3}
                />
              )}
            </msgForm.AppField>

            <msgForm.AppField name="msgOffHours">
              {(field) => (
                <field.Textarea
                  label="운영시간 외 안내 (OFF-HOURS)"
                  rows={3}
                />
              )}
            </msgForm.AppField>

            <msgForm.AppField name="msgHoliday">
              {(field) => (
                <field.Textarea
                  label="주말 및 공휴일 휴무 안내 (HOLIDAY)"
                  rows={3}
                />
              )}
            </msgForm.AppField>

            <msgForm.AppField name="msgMaintenance">
              {(field) => (
                <field.Textarea
                  label="시스템 점검 안내 (MAINTENANCE)"
                  rows={3}
                />
              )}
            </msgForm.AppField>
          </CardContent>
        </Card>
      </FormLayout>
    </msgForm.AppForm>
  );
}
