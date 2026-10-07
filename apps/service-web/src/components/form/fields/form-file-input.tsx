import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { type ReactNode } from 'react';

import { Input } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';

import { getFieldAnchorStyle } from './field-anchor';

type FormFileInputProps = FormProps<'input'> & {
  multiple?: boolean
  uploadTiming?: 'immediate' | 'onSubmit'
  loadingMessage?: ReactNode
  onUpload?: (files: File[]) => Promise<string[]>
  onUploadComplete?: (fileIds: string[]) => void
};

export function FormFileInput({
  label,
  description,
  orientation,
  showError,
  labelWidth,
  required,
  multiple = false,
  uploadTiming = 'onSubmit',
  loadingMessage,
  onUpload,
  onUploadComplete,
  ...props
}: FormFileInputProps) {
  const uploadingMessage = loadingMessage ?? '파일 업로드 중...';
  const field = useFieldContext<File[]>();
  const hasError = field.state.meta.errors.length > 0;
  const upload = useMutation({
    mutationFn: (files: File[]) => onUpload!(files),
    onSuccess: (fileIds) => onUploadComplete?.(fileIds),
  });

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <Input
        {...props}
        type="file"
        multiple={multiple}
        disabled={props.disabled || upload.isPending}
        id={field.name}
        style={{ ...props.style, ...getFieldAnchorStyle(field.name) }}
        data-upload-timing={uploadTiming}
        aria-invalid={hasError || undefined}
        className={cn('anchor-name-field w-full', props.className)}
        onBlur={(event) => {
          props.onBlur?.(event);
          field.handleBlur();
        }}
        onChange={(event) => {
          props.onChange?.(event);
          const files = Array.from(event.target.files ?? []);
          field.handleChange(files);
          if (uploadTiming === 'immediate' && onUpload && files.length > 0) upload.mutate(files);
        }}
      />
      {upload.isPending && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          {uploadingMessage}
        </p>
      )}
    </FormField>
  );
}
