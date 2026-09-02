import 'react';

declare module 'react' {
  /**
   * Override properties in TSource with properties from TOverride
   * (React TypeScript Cheatsheet standard pattern)
   */
  export type OverrideProps<TSource, TOverride> = Omit<TSource, keyof TOverride> & TOverride;

  /**
   * React 19 standard component wrapping props utility:
   * Inherits props from TComponent (including ref) and safely overrides with TOverride.
   */
  export type WrapProps<
    TComponent extends ElementType,
    TOverride = object,
  > = OverrideProps<ComponentProps<TComponent>, TOverride>;
}
