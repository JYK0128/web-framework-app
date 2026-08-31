import { useCallback, useState } from 'react';

type UseStepFormOptions<TStep> = {
  steps: readonly TStep[]
};

export function useStepForm<TStep>({ steps }: UseStepFormOptions<TStep>) {
  const [stepIndex, setStepIndex] = useState(0);
  const lastStepIndex = Math.max(steps.length - 1, 0);
  const currentIndex = clampStep(stepIndex, steps.length);

  const next = useCallback(() => {
    setStepIndex((index) => Math.min(index + 1, lastStepIndex));
  }, [lastStepIndex]);

  const previous = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  return {
    stepIndex: currentIndex,
    currentStep: steps[currentIndex],
    isFirstStep: currentIndex === 0,
    next,
    previous,
  };
}

function clampStep(index: number, stepCount: number) {
  if (stepCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), stepCount - 1);
}
