import '@tanstack/react-router';

import type { i18n } from '@pkg/shared/common';

declare module '@tanstack/router-core' {
  interface Register {
    server: {
      requestContext: {
        cspNonce?: string
        i18n: i18n
      }
    }
  }
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<_TData extends RowData, _TValue> {
    filterType?: 'text' | 'number' | 'date' | 'faceted'
    filterOptions?: Array<{ label: string, value: string }>
  }
}
