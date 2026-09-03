import { valueIf, z } from '@pkg/shared/common';
import { createContext, type ReactNode, type SyntheticEvent, useContext } from 'react';

import { Button } from '#/.generated/shadcn/components/ui';
import { useFormContext } from '#/components/form/core/context';
import type { useAppForm } from '#/components/form/core/useAppForm';
import { useI18n } from '#/hooks';

import { useStepForm } from './useStepForm';

export type StepFormStep = {
  title: string
  content: ReactNode
  isCompleteStep?: boolean
  schema?: z.ZodTypeAny
};

type StepFormProps<TForm> = {
  form: TForm
  steps: readonly StepFormStep[]
  children: ReactNode
};

const stepFormContext = createContext<{
  steps: readonly StepFormStep[]
  stepForm: ReturnType<typeof useStepForm<StepFormStep>>
} | null>(null);

function useStepFormContext() {
  const context = useContext(stepFormContext);

  if (!context) {
    throw new Error('StepForm components must be used inside StepForm');
  }

  return context;
}

export function StepForm<TForm>({
  form: formInstance,
  steps,
  children,
}: StepFormProps<TForm>) {
  const form = formInstance as ReturnType<typeof useAppForm>;
  const stepForm = useStepForm({ steps });

  if (steps.length === 0) {
    return null;
  }

  const isCompleteStep = stepForm.currentStep.isCompleteStep === true;
  const isSubmitStep = steps[stepForm.stepIndex + 1]?.isCompleteStep === true;

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCompleteStep) {
      return;
    }

    let isValid = false;

    if (isSubmitStep) {
      await form.handleSubmit();
      isValid = form.state.isSubmitSuccessful;
    }
    else {
      isValid = (await form.validateAllFields('blur')).length === 0;
    }

    if (isValid) {
      stepForm.next();
      return;
    }

    const field = Object.entries(form.state.fieldMeta).find(([, meta]) => meta?.errors.length);
    const element = field ? document.getElementById(field[0]) : null;

    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', container: 'nearest' });
      element.focus({ preventScroll: true });
    }
  }

  return (
    <form.AppForm>
      <form.Layout className="flex min-h-full flex-col" noValidate onSubmit={handleSubmit}>
        <stepFormContext.Provider value={{ steps, stepForm }}>
          {children}
        </stepFormContext.Provider>
      </form.Layout>
    </form.AppForm>
  );
}

export function StepFormHeader() {
  const { steps, stepForm } = useStepFormContext();
  const { t } = useI18n();

  return (
    <div className="mb-10 flex items-center gap-3" aria-label={t('common.stepProgress')}>
      {steps.map((step, index) => {
        let indicatorClass = 'border border-zinc-300 text-zinc-400';
        if (index === stepForm.stepIndex) {
          indicatorClass = 'bg-zinc-950 text-white';
        }
        else if (index < stepForm.stepIndex) {
          indicatorClass = 'bg-zinc-200 text-zinc-950';
        }

        return (
          <div className="flex min-w-0 items-center gap-3" key={step.title}>
            <span
              aria-current={valueIf(index === stepForm.stepIndex, 'step')}
              className={`
                flex size-8 shrink-0 items-center justify-center rounded-full
                text-sm font-bold
                ${indicatorClass}
              `}
            >
              {index + 1}
            </span>
            <span className="
              hidden truncate text-sm text-zinc-600
              sm:inline
            "
            >
              {step.title}
            </span>
            {index < steps.length - 1 && <span className="h-px w-6 bg-zinc-200" />}
          </div>
        );
      })}
    </div>
  );
}

export function StepFormContent() {
  const { stepForm } = useStepFormContext();

  return (
    <div className="flex-1">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        Step
        {' '}
        {String(stepForm.stepIndex + 1).padStart(2, '0')}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
        {stepForm.currentStep.title}
      </h2>
      <div className="mt-8">{stepForm.currentStep.content}</div>
    </div>
  );
}

export function StepFormFooter() {
  const form = useFormContext();
  const { t } = useI18n();
  const { steps, stepForm } = useStepFormContext();
  const isCompleteStep = stepForm.currentStep.isCompleteStep === true;
  const isSubmitStep = steps[stepForm.stepIndex + 1]?.isCompleteStep === true;

  if (isCompleteStep) {
    return null;
  }

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => {
        let actionLabel = t('stepForm.next');
        if (isSubmitting) {
          actionLabel = t('stepForm.submitting');
        }
        else if (isSubmitStep) {
          actionLabel = t('stepForm.submit');
        }

        return (
          <div className="
            mt-12 flex items-center justify-between border-t border-zinc-200
            pt-6
          "
          >
            <Button
              variant="ghost"
              className="
                text-sm font-bold text-zinc-500 transition-colors
                hover:text-zinc-950
                disabled:cursor-not-allowed disabled:opacity-30
              "
              disabled={stepForm.isFirstStep || isSubmitting}
              onClick={stepForm.previous}
              type="button"
            >
              {t('stepForm.previous')}
            </Button>
            <Button
              aria-busy={isSubmitting}
              className="
                bg-zinc-950 px-5 py-3 text-sm font-bold text-white
                transition-opacity
                hover:opacity-75
                disabled:cursor-wait disabled:opacity-50
              "
              disabled={isSubmitting}
              type="submit"
            >
              {actionLabel}
            </Button>
          </div>
        );
      }}
    </form.Subscribe>
  );
}
