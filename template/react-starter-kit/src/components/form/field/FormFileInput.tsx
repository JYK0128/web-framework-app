import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { useI18n } from '@pkg/shared/web';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/context';
import type { FormProps } from '#/components/form/types';

type FormFileInputProps = FormProps<'input'> & {
  multiple?: boolean
  uploadTiming?: 'immediate' | 'onSubmit'
  loadingMessage?: ReactNode
  completeMessage?: ReactNode
  errorMessage?: ReactNode
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
  completeMessage,
  errorMessage,
  onUpload,
  onUploadComplete,
  ...props
}: FormFileInputProps) {
  const { t } = useI18n();
  const uploadingMessage = loadingMessage ?? t('file.uploading');
  const uploadedMessage = completeMessage ?? t('file.complete');
  const failedMessage = errorMessage ?? t('file.failed');
  const field = useFieldContext<File[]>();
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<ReactNode>();
  const hasError = field.state.meta.errors.length > 0;

  const uploadFiles = async (files: File[]) => {
    if (!onUpload || files.length === 0) return;
    setStatus('uploading');
    setUploadError(undefined);
    try {
      const fileIds = await onUpload(files);
      onUploadComplete?.(fileIds);
      setStatus('success');
    }
    catch (error) {
      setStatus('error');
      setUploadError(error instanceof Error ? error.message : failedMessage);
    }
  };

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <input
        {...props}
        type="file"
        multiple={multiple}
        disabled={props.disabled || status === 'uploading'}
        id={field.name}
        name={field.name}
        data-upload-timing={uploadTiming}
        aria-invalid={hasError || undefined}
        onBlur={(event) => {
          props.onBlur?.(event);
          field.handleBlur();
        }}
        onChange={(event) => {
          props.onChange?.(event);
          const files = Array.from(event.target.files ?? []);
          field.handleChange(files);
          if (uploadTiming === 'immediate') void uploadFiles(files);
        }}
      />
      {status !== 'idle' && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {status === 'uploading' && <LoaderCircle className="size-4 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="size-4 text-green-600" />}
          {status === 'error' && <AlertCircle className="size-4 text-destructive" />}
          {status === 'uploading' && uploadingMessage}
          {status === 'success' && uploadedMessage}
          {status === 'error' && uploadError}
        </p>
      )}
    </FormField>
  );
}
