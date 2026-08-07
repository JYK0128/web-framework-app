import '@tanstack/react-router';

declare module '@tanstack/router-core' {
  interface Register {
    server: {
      requestContext: {
        cspNonce?: string
        userAgent?: string | null
        host?: string | null
        ip?: string | null
        url?: URL
        method?: string | null
        referer?: string | null
        locale?: string
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
