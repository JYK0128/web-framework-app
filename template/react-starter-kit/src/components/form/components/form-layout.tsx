import { useSelector } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';
import { useFormContext } from '#/components/form/core/context';

export function FormLayout({ children, className, ...props }: Readonly<React.ComponentProps<'form'>>) {
  const form = useFormContext();
  const formRef = useRef<HTMLFormElement>(null);

  // TanStack Form 스토어 상태 구독
  const submissionAttempts = useSelector(form.store, (state) => state.submissionAttempts);
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  // 폼 오류 감지 시 첫 번째 오류 지점으로 자동 스크롤 및 포커스
  useEffect(() => {
    if (!formRef.current || submissionAttempts === 0) return;

    const frameId = requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[data-invalid], [aria-invalid="true"]');
      if (!el) return;

      const target = el.closest<HTMLElement>('[data-slot="field"]') ?? el;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const inputEl = el.querySelector<HTMLElement>('input, select, textarea') ?? el;
      inputEl.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frameId);
  }, [submissionAttempts]);

  return (
    <form
      ref={formRef}
      {...props}
      noValidate
      className={cn(`
        grid grid-cols-[max-content_1fr] gap-4
        *:col-span-2
      `, className)}
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!isSubmitting) {
          props.onSubmit?.(event);
        }
      }}
    >
      {children}
    </form>
  );
}
