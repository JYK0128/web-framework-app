import type { ColumnMeta as OriginalColumnMeta, TableMeta as OriginalTableMeta } from '@tanstack/react-table';

declare module '@tanstack/router-core' {
  interface Register {
    server: {
      requestContext: {
        cspNonce?: string
        locale?: string
        userAgent?: string
        host?: string
        ip?: string
      }
    }
  }
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> extends OriginalColumnMeta<TData, TValue> {
    className?: string
  }
  interface TableMeta<TData> extends OriginalTableMeta<TData> {
    density?: 'compact' | 'normal' | 'spacious'
  }
}
