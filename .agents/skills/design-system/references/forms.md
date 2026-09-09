# Form system

## 소스

- 진입점: `template/react-starter-kit/src/components/form/`
- 폼 훅 등록: `core/use-app-form.ts`
- 단계형 폼: `step-form/`

## 사용 규칙

- `useAppForm`과 `form.AppForm`, `form.AppField`를 사용한다.
- 일반 폼은 `FormLayout`을 사용하고, 제출·초기화는 기존 `FormSubmit`·`FormReset` 또는 현재 화면의 표준 패턴을 따른다.
- 등록된 필드 컴포넌트는 `Input`, `Switch`, `Select`, `Signature`, `Checkbox`, `CheckGroup`, `Combobox`, `DatePicker`, `DateRangePicker`, `DatetimePicker`, `TimePicker`, `FileInput`, `MarkdownEditor`, `OtpInput`, `RadioGroup`, `Textarea`다.
- 필드 이름과 값 타입은 `AppField`의 폼 값 타입에서 추론되도록 유지한다. 공통 필드가 지원하지 않는 동작은 임의 prop으로 해결하지 말고 실제 컴포넌트를 확인한다.
- 다단계 폼은 `StepForm`, `StepFormHeader`, `StepFormContent`, `StepFormFooter`, `StepFormStep`을 사용한다.
- 새 필드가 필요하면 기존 `fields/`의 `FormProps`와 오류 표시·라벨 처리 방식을 따른다.
