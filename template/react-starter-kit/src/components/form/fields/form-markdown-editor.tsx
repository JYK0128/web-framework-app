import '@toast-ui/editor/dist/toastui-editor.css';

import { ClientOnly } from '@tanstack/react-router';
import { Editor as ToastUiEditor } from '@toast-ui/react-editor';
import { useEffect, useRef } from 'react';

import { Skeleton } from '#/.generated/shadcn/components/ui';
import { FormField } from '#/components/form/components';
import { useFieldContext } from '#/components/form/core/context';
import type { FormProps } from '#/components/form/core/types';
import { useI18n } from '#/hooks';

type FormMarkdownEditorProps = FormProps<typeof ToastUiEditor> & {
  autofocus?: boolean
  initialEditType?: 'markdown' | 'wysiwyg'
  previewStyle?: 'vertical' | 'tab'
  height?: string
  hideModeSwitch?: boolean
  language?: string
  placeholder?: string
  theme?: string
  useCommandShortcut?: boolean
};

type MarkdownEditorHandle = {
  getInstance: () => {
    getMarkdown: () => string
    setMarkdown: (markdown: string) => void
  }
};

export function FormMarkdownEditor({
  label,
  description,
  autofocus = false,
  initialEditType = 'markdown',
  previewStyle = 'vertical',
  height = '420px',
  hideModeSwitch = false,
  language,
  placeholder,
  theme,
  useCommandShortcut = true,
  orientation,
  showError,
  labelWidth,
  required,
  ...props
}: FormMarkdownEditorProps) {
  const { t } = useI18n();
  const displayPlaceholder = placeholder ?? t('core.form.markdownPlaceholder');
  const field = useFieldContext<string>();
  const editorRef = useRef<MarkdownEditorHandle | null>(null);

  useEffect(() => {
    const editor = editorRef.current?.getInstance();
    if (!editor) return;

    const nextValue = field.state.value ?? '';
    if (editor.getMarkdown() !== nextValue) {
      editor.setMarkdown(nextValue);
    }
  }, [field.state.value]);

  return (
    <FormField label={label} description={description} orientation={orientation} showError={showError} labelWidth={labelWidth} required={required}>
      <div className="
        scroll-x max-w-full
        [&_.toastui-editor-md-container]:min-w-160
        [&_.toastui-editor-md-container]:scroll-x
        [&_.toastui-editor-ww-container]:scroll-x
        [&_.toastui-editor-ww-container_.toastui-editor-contents]:min-w-160
        [&_.toastui-editor-ww-container_.toastui-editor-contents]:scroll-x
        [&_.toastui-editor-contents_pre]:scroll-x
        [&_.toastui-editor-contents_pre]:whitespace-pre
      "
      >
        <div className="min-w-160">
          <ClientOnly fallback={(
            <Skeleton
              id={field.name}
              className="w-full rounded-md"
              style={{ height }}
            />
          )}
          >
            <ToastUiEditor
              id={field.name}

              ref={(instance: MarkdownEditorHandle | null) => {
                editorRef.current = instance;
              }}
              initialValue={field.state.value ?? ''}
              initialEditType={initialEditType}
              autofocus={autofocus}
              language={language}
              previewStyle={previewStyle}
              height={height}
              hideModeSwitch={hideModeSwitch}
              placeholder={displayPlaceholder}
              theme={theme}
              useCommandShortcut={useCommandShortcut}
              usageStatistics={false}
              {...props}
              onChange={() => {
                const editor = editorRef.current?.getInstance();
                field.handleChange(editor?.getMarkdown() ?? '');
              }}
            />
          </ClientOnly>
        </div>
      </div>
    </FormField>
  );
}
