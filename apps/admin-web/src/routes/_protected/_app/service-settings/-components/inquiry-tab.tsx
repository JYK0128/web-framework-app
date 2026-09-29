import { forwardRef, useImperativeHandle } from 'react';

import type { InquiryConfigDto } from '#/.generated/api/model';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';

export interface InquiryTabHandle {
  submitData: () => Promise<InquiryConfigDto | null>
}

export interface InquiryTabProps {
  inquiry: InquiryConfigDto
}

export const InquiryTab = forwardRef<InquiryTabHandle, InquiryTabProps>(function InquiryTab(
  { inquiry }: InquiryTabProps,
  ref,
) {
  const inqForm = useAppForm({
    defaultValues: {
      customerGreeting: inquiry.customerGreeting,
      offlineReplyMessage: inquiry.offlineReplyMessage,
      unansweredThresholdMinutes: inquiry.unansweredThresholdMinutes,
      autoCloseHours: inquiry.autoCloseHours,
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await inqForm.validateAllFields('submit');
      if (!isValid) return null;
      return inqForm.state.values;
    },
  }));

  return (
    <inqForm.AppForm>
      <FormLayout
        id="inquiry-form"
        onSubmit={() => void inqForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="clock"
          title="알림 기준"
          description="문의 미응답 감지와 답변 완료 후 자동 종료 시간을 설정합니다."
        >
          <SectionCard.Content>
            <div className="
              grid grid-cols-1 gap-6
              md:grid-cols-2
            "
            >
              <inqForm.AppField name="unansweredThresholdMinutes">
                {(field) => (
                  <field.Input
                    type="number"
                    min={1}
                    max={120}
                    label="미응답 감지 기준 시간"
                    placeholder="미응답 기준 시간을 입력해 주세요."
                    rightSide="분"
                  />
                )}
              </inqForm.AppField>
              <inqForm.AppField name="autoCloseHours">
                {(field) => (
                  <field.Input
                    type="number"
                    min={1}
                    max={720}
                    label="자동 종료 기준 시간"
                    placeholder="자동 종료 기준 시간을 입력해 주세요."
                    rightSide="시간"
                  />
                )}
              </inqForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>

        <SectionCard
          variant="ghost"
          textSize="base"
          icon="message-square"
          title="고객지원"
          description="상담 채팅에서 사용할 인사말과 부재중 응답 문구를 설정합니다."
        >
          <SectionCard.Content className="grid gap-6">
            <inqForm.AppField name="customerGreeting">
              {(field) => (
                <field.Textarea
                  label="인사말"
                  placeholder="고객에게 표시할 인사말을 입력해 주세요."
                  maxLength={500}
                  rows={4}
                  required
                />
              )}
            </inqForm.AppField>
            <inqForm.AppField name="offlineReplyMessage">
              {(field) => (
                <field.Textarea
                  label="부재중 응답"
                  placeholder="운영시간 외 채팅에 표시할 응답 문구를 입력해 주세요."
                  maxLength={500}
                  rows={4}
                  required
                />
              )}
            </inqForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </inqForm.AppForm>
  );
});
