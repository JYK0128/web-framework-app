import type { CSSProperties } from 'react';

export function getFieldAnchorStyle(fieldName: string): CSSProperties & { '--form-field-anchor-name': string } {
  return {
    '--form-field-anchor-name': `--${fieldName.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
  };
}
