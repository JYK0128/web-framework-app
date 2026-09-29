import type { CSSProperties } from 'react';

export function getFieldAnchorStyle(fieldName: string): CSSProperties & { anchorName: string } {
  return {
    anchorName: `--${fieldName.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
  };
}
