import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAppForm } from '#ui/form';

const queryClient = new QueryClient();

function AccountForm() {
  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      role: '',
      bio: '',
      verificationCode: '',
      startsAt: '',
      reminderTime: '00:00',
      attachments: [],
      content: '',
      updates: false,
      notifications: false,
    },
    onSubmit: async ({ value }) => alert(`제출 예시: ${value.name} (${value.email})`),
  });

  return (
    <form.AppForm>
      <form.Layout
        onSubmit={() => void form.handleSubmit()}
        className="grid-cols-1 gap-4"
      >
        <form.FieldSet className="col-span-2 grid gap-4">
          <form.FieldLegend className="text-base font-semibold">계정 정보</form.FieldLegend>
          <form.FieldDescription className="text-sm text-muted-foreground">등록된 필드는 이름과 값 타입에 맞춰 입력 컴포넌트를 연결합니다.</form.FieldDescription>
          <form.FieldGroup className="
            grid gap-4
            md:grid-cols-2
          "
          >
            <form.AppField name="name">{(field) => <field.Input label="이름" placeholder="홍길동" required />}</form.AppField>
            <form.AppField name="email">{(field) => <field.Input type="email" label="이메일" placeholder="name@example.com" required />}</form.AppField>
            <form.AppField name="role">{(field) => <field.Select label="역할" placeholder="역할 선택" options={[{ label: '관리자', value: 'admin' }, { label: '편집자', value: 'editor' }, { label: '조회자', value: 'viewer' }]} />}</form.AppField>
            <form.AppField name="verificationCode">{(field) => <field.OtpInput label="인증 코드" description="6자리 코드를 입력합니다." />}</form.AppField>
            <form.AppField name="startsAt">{(field) => <field.DatetimePicker label="시작 일시" placeholder="시작 일시 선택" />}</form.AppField>
            <form.AppField name="reminderTime">{(field) => <field.TimePicker label="알림 시간" placeholder="시간 선택" />}</form.AppField>
            <form.AppField name="bio">
              {(field) => (
                <field.Textarea
                  label="소개"
                  placeholder="간단한 소개를 입력하세요."
                  rows={3}
                  className="min-h-24"
                />
              )}
            </form.AppField>
            <form.AppField name="attachments">{(field) => <field.FileInput label="첨부 파일" description="여러 파일을 선택할 수 있습니다." multiple />}</form.AppField>
          </form.FieldGroup>
          <form.AppField name="updates">{(field) => <field.Checkbox label="제품 소식 받기" description="새 기능과 업데이트 소식을 이메일로 받습니다." />}</form.AppField>
          <form.AppField name="notifications">{(field) => <field.Switch label="알림 활성화" description="서비스 알림을 받습니다." />}</form.AppField>
          <form.AppField name="content">{(field) => <field.Editor label="본문" description="폼에 리치 텍스트 에디터를 연결합니다." height="240px" />}</form.AppField>
        </form.FieldSet>
        <div className="col-span-2 flex justify-end gap-2">
          <form.Reset variant="outline">초기화</form.Reset>
          <form.Submit>저장</form.Submit>
        </div>
      </form.Layout>
    </form.AppForm>
  );
}

function FieldOptionsForm() {
  const form = useAppForm({
    defaultValues: { vertical: '', horizontal: '', responsive: '', password: '', amount: 0 },
    onSubmit: async ({ value }) => alert(JSON.stringify(value, null, 2)),
  });

  return (
    <form.AppForm>
      <form.Layout
        onSubmit={() => void form.handleSubmit()}
        className="max-w-3xl gap-5"
      >
        <form.FieldSet className="grid gap-4">
          <form.FieldLegend className="text-base font-semibold">필드 옵션과 배치</form.FieldLegend>
          <form.FieldDescription>세로·가로·반응형 라벨 배치, 필수 표시, 도움말, 에러 표시와 입력 adornment를 확인합니다.</form.FieldDescription>
          <form.AppField name="vertical">{(field) => <field.Input label="세로 배치" description="기본 orientation입니다." placeholder="값 입력" required showError />}</form.AppField>
          <form.AppField name="horizontal">{(field) => <field.Input label="가로 배치" description="labelWidth로 라벨 너비를 지정할 수 있습니다." placeholder="값 입력" orientation="horizontal" labelWidth="9rem" showError />}</form.AppField>
          <form.AppField name="responsive">{(field) => <field.Textarea label="반응형 배치" description="작은 화면에서는 세로, 넓은 화면에서는 가로로 배치합니다." placeholder="내용 입력" orientation="responsive" rows={2} />}</form.AppField>
          <form.AppField name="password">{(field) => <field.Input type="password" label="비밀번호" description="보기 버튼과 자동 완성 설정을 확인합니다." placeholder="비밀번호" autoComplete="new-password" />}</form.AppField>
          <form.AppField name="amount">{(field) => <field.Input type="number" label="금액" leftSide={<span>₩</span>} rightSide={<span>원</span>} bottomSide={<span>숫자 입력은 number 값으로 관리됩니다.</span>} />}</form.AppField>
        </form.FieldSet>
        <div className="flex justify-end gap-2">
          <form.Reset variant="outline">초기화</form.Reset>
          <form.Submit>제출</form.Submit>
        </div>
      </form.Layout>
    </form.AppForm>
  );
}

function ValidationForm() {
  const form = useAppForm({
    defaultValues: { name: '', email: '', role: '' },
    validators: {
      onSubmit: ({ value }) => ({
        fields: {
          name: value.name.trim() ? undefined : '이름을 입력하세요.',
          email: /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.email)
            ? undefined
            : '올바른 이메일 주소를 입력하세요.',
          role: value.role ? undefined : '역할을 선택하세요.',
        },
      }),
    },
    onSubmit: async ({ value }) => alert(`검증 통과: ${value.name}`),
  });

  return (
    <form.AppForm>
      <form.Layout
        onSubmit={() => void form.handleSubmit()}
        className="max-w-xl gap-4"
      >
        <form.FieldSet className="grid gap-4">
          <form.FieldLegend className="text-base font-semibold">검증과 오류</form.FieldLegend>
          <form.FieldDescription>빈 상태에서 제출하면 필드 오류 표시와 첫 오류 위치로 이동하는 동작을 확인할 수 있습니다.</form.FieldDescription>
          <form.AppField name="name">{(field) => <field.Input label="이름" required showError placeholder="홍길동" />}</form.AppField>
          <form.AppField name="email">{(field) => <field.Input type="email" label="이메일" required showError placeholder="name@example.com" />}</form.AppField>
          <form.AppField name="role">{(field) => <field.Select label="역할" required showError placeholder="역할 선택" options={[{ label: '관리자', value: 'admin' }, { label: '편집자', value: 'editor' }, { label: '조회자', value: 'viewer', disabled: true }]} />}</form.AppField>
        </form.FieldSet>
        <div className="flex justify-end gap-2">
          <form.Reset variant="outline">초기화</form.Reset>
          <form.Submit>검증 후 제출</form.Submit>
        </div>
      </form.Layout>
    </form.AppForm>
  );
}

function FieldStatesForm() {
  const form = useAppForm({
    defaultValues: { code4: '', code6: '', accepted: false, updates: true, disabledChoice: true },
    onSubmit: async ({ value }) => alert(JSON.stringify(value, null, 2)),
  });

  return (
    <form.AppForm>
      <form.Layout
        onSubmit={() => void form.handleSubmit()}
        className="max-w-xl gap-5"
      >
        <form.FieldSet className="grid gap-4">
          <form.FieldLegend className="text-base font-semibold">선택·인증 필드 상태</form.FieldLegend>
          <form.FieldDescription>초기 선택값, 비활성 상태, OTP 길이별 표시를 확인합니다.</form.FieldDescription>
          <form.AppField name="code4">{(field) => <field.OtpInput label="4자리 코드" maxLength={4} description="maxLength를 지정할 수 있습니다." />}</form.AppField>
          <form.AppField name="code6">{(field) => <field.OtpInput label="비활성 6자리 코드" description="disabled 상태 예시입니다." disabled />}</form.AppField>
          <form.AppField name="accepted">{(field) => <field.Checkbox label="약관 동의" description="미선택 상태입니다." required showError />}</form.AppField>
          <form.AppField name="updates">{(field) => <field.Checkbox label="업데이트 수신" description="초기 선택 상태입니다." />}</form.AppField>
          <form.AppField name="disabledChoice">{(field) => <field.Switch label="잠긴 설정" description="비활성 스위치는 값을 변경할 수 없습니다." disabled />}</form.AppField>
        </form.FieldSet>
        <div className="flex justify-end gap-2">
          <form.Reset variant="outline">초기화</form.Reset>
          <form.Submit>제출</form.Submit>
        </div>
      </form.Layout>
    </form.AppForm>
  );
}

function FileUploadForm() {
  const form = useAppForm({
    defaultValues: { immediateFiles: [] as File[], deferredFiles: [] as File[] },
    onSubmit: async ({ value }) => {
      // onSubmit 모드는 선택한 File[]을 제출 시점에 앱의 업로드 API로 전달합니다.
      const uploadedIds = value.deferredFiles.map((file) => `deferred:${file.name}`);
      alert(`즉시 업로드 선택: ${value.immediateFiles.length}개\n제출 시 업로드 대상: ${uploadedIds.join(', ') || '없음'}`);
    },
  });

  return (
    <form.AppForm>
      <form.Layout
        onSubmit={() => void form.handleSubmit()}
        className="max-w-xl gap-4"
      >
        <form.FieldSet className="grid gap-4">
          <form.FieldLegend className="text-base font-semibold">파일 업로드 방식</form.FieldLegend>
          <form.FieldDescription>immediate는 선택 즉시 onUpload를 호출합니다. onSubmit은 File[]을 폼 제출 값으로 전달하므로 제출 핸들러에서 업로드 API를 호출합니다.</form.FieldDescription>
          <form.AppField name="immediateFiles">{(field) => <field.FileInput label="즉시 업로드" description="여러 파일을 선택하면 업로드 콜백이 실행됩니다." multiple uploadTiming="immediate" loadingMessage="파일 전송 중..." onUpload={async (files) => files.map((file) => `uploaded:${file.name}`)} onUploadComplete={(ids) => console.info('업로드 완료', ids)} />}</form.AppField>
          <form.AppField name="deferredFiles">
            {(field) => (
              <field.FileInput
                label="제출 시 업로드"
                description="선택한 파일은 폼 값으로 유지되며 제출 핸들러에서 처리합니다."
                multiple
                uploadTiming="onSubmit"
              />
            )}
          </form.AppField>
        </form.FieldSet>
        <div className="flex justify-end gap-2">
          <form.Reset variant="outline">초기화</form.Reset>
          <form.Submit>파일 제출</form.Submit>
        </div>
      </form.Layout>
    </form.AppForm>
  );
}

const meta = { title: '웹코어/폼/useAppForm', component: AccountForm, decorators: [(Story) => <QueryClientProvider client={queryClient}><Story /></QueryClientProvider>], tags: ['autodocs'], parameters: { docs: { description: { component: 'useAppForm으로 기본값과 제출 처리를 정의하고, form.AppField에서 Input, OtpInput, Select, Textarea, Checkbox, Switch, FileInput, DatetimePicker, TimePicker, Editor 필드를 연결합니다. 에디터는 Storybook 전역 ThemeProvider와 i18n 제공자 안에서 동작합니다. 폼 레이아웃에는 FieldSet, FieldLegend, FieldDescription, FieldGroup, Reset, Submit을 조합합니다.' } } } } satisfies Meta<typeof AccountForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AccountDetails: Story = {};

export const FieldOptions: Story = { render: () => <FieldOptionsForm /> };

export const ValidationAndErrors: Story = { render: () => <ValidationForm /> };

export const FieldStates: Story = { render: () => <FieldStatesForm /> };

export const FileUploadModes: Story = { render: () => <FileUploadForm /> };
