import './editor.css';

import { ClientOnly } from '@tanstack/react-router';
import { useTheme } from 'next-themes';
import { useEffect, useId, useRef, useState } from 'react';
import type suneditor from 'suneditor';
import en from 'suneditor/langs/en';
import ko from 'suneditor/langs/ko';

import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/i18n/use-i18n';

export type EditorProps = Omit<WithoutChildren<'div'>, 'onChange' | 'onBlur' | 'defaultValue'> & {
  name?: string
  label?: string
  required?: boolean
  invalid?: boolean
  disabled?: boolean
  value: string
  height?: string
  placeholder?: string
  options?: Parameters<typeof suneditor.create>[1]
  onChange: (html: string) => void
  onBlur?: () => void
};

export function Editor({
  name,
  label,
  required = false,
  invalid = false,
  disabled = false,
  value,
  height = '320px',
  placeholder = '내용을 입력해 주세요.',
  options,
  onChange,
  onBlur,
  className,
  ...props
}: EditorProps) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const { language } = useI18n();
  const fallback = (
    <div className="animate-pulse rounded-md border bg-muted" role="status">
      에디터를 불러오는 중입니다.
    </div>
  );

  return (
    <div {...props} className={cn('suneditor-scope', className)}>
      <ClientOnly fallback={fallback}>
        <EditorInstance
          name={name ?? id}
          label={label}
          required={required}
          invalid={invalid}
          disabled={disabled}
          value={value}
          height={height}
          placeholder={placeholder}
          options={options}
          theme={resolvedTheme === 'dark' ? 'dark' : ''}
          language={language}
          onChange={onChange}
          onBlur={onBlur}
        />
      </ClientOnly>
    </div>
  );
}

type EditorInstanceProps = {
  name: string
  label?: string
  required: boolean
  invalid: boolean
  disabled: boolean
  value: string
  height: string
  placeholder: string
  options?: Parameters<typeof suneditor.create>[1]
  theme: string
  language: string
  onChange: (html: string) => void
  onBlur?: () => void
};

function EditorInstance(props: EditorInstanceProps) {
  const targetRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<ReturnType<typeof suneditor.create> | null>(null);
  const latest = useRef(props);
  const lastValue = useRef(props.value);
  useEffect(() => {
    latest.current = props;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    void Promise.all([import('suneditor'), import('suneditor/plugins')]).then(([{ default: factory }, { default: plugins }]) => {
      if (disposed || !targetRef.current) return;
      const current = latest.current;
      const emitChange = (html: string) => {
        lastValue.current = html;
        latest.current.onChange(html);
      };
      const editor = factory.create(targetRef.current, {
        plugins,
        value: current.value,
        height: current.height,
        placeholder: current.placeholder,
        lang: current.language.split('-')[0] === 'ko' ? ko : en,
        theme: current.theme,
        statusbar: false,
        buttonList: [
          ['undo', 'redo'],
          ['blockStyle', 'fontSize'],
          ['bold', 'italic', 'underline', 'strike'],
          ['fontColor', 'backgroundColor'],
          ['align', 'list', 'outdent', 'indent'],
          ['table', 'link', 'image'],
          ['removeFormat', 'codeView', 'fullScreen'],
        ],
        ...current.options,
        events: {
          ...current.options?.events,
          onChange: ({ data }) => emitChange(data),
          onInput: ({ frameContext }) => emitChange(frameContext.get('wysiwyg').innerHTML),
          onBlur: () => {
            emitChange(String(editor.$.html.get()));
            latest.current.onBlur?.();
          },
        },
      });
      editorRef.current = editor;
      setReady(true);
    });
    return () => {
      disposed = true;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !ready) return;
    editor.$.ui.setTheme(props.theme);
    if (props.disabled) editor.$.ui.disable();
    else editor.$.ui.enable();
    const editable = targetRef.current?.parentElement?.querySelector<HTMLElement>('.sun-editor-editable');
    if (editable) {
      editable.id = props.name;
      editable.setAttribute('tabindex', props.disabled ? '-1' : '0');
      editable.setAttribute('aria-invalid', String(props.invalid));
      editable.setAttribute('aria-required', String(props.required));
      editable.setAttribute('role', 'textbox');
      editable.setAttribute('aria-multiline', 'true');
      if (props.label) editable.setAttribute('aria-label', props.label);
    }
  }, [ready, props.theme, props.disabled, props.invalid, props.required, props.name, props.label]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !ready) return;
    if (props.value === lastValue.current) return;
    lastValue.current = props.value;
    const html = String(editor.$.html.get());
    if (props.value !== html && !(props.value === '' && html === '<p><br></p>')) {
      editor.$.html.set(props.value);
    }
  }, [ready, props.value]);

  return <textarea ref={targetRef} aria-hidden tabIndex={-1} />;
}
