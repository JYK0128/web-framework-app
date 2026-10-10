import '#/components/editor/editor.css';

import { sanitizeEditorHtml } from '@pkg/shared/editor';
import { useMemo } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';

type EditorViewerProps = Omit<WithoutChildren<'div'>, 'dangerouslySetInnerHTML'> & {
  content: string
  format?: 'html' | 'text'
};

export function EditorViewer({ content, format = 'html', className, ...props }: EditorViewerProps) {
  const html = useMemo(() => sanitizeEditorHtml(content), [content]);

  // Existing event and notice bodies were stored as plain text.
  const isText = format === 'text' || !/<\/?[a-z][^>]*>/i.test(content);
  const classes = cn('suneditor-scope sun-editor-editable editor-viewer', isText && `
    whitespace-pre-wrap
  `, className);
  if (isText) return <div {...props} className={classes}>{content}</div>;
  return <div {...props} className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
}
