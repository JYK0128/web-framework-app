import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

/**
 * Checks if a given React node is a valid React element matching a specific component type (slot).
 */
export function isSlotElement<P = { children?: ReactNode }>(
  child: ReactNode,
  componentType: unknown,
): child is ReactElement<P> {
  return isValidElement(child) && child.type === componentType;
}

/**
 * Filters child nodes by matching a specific slot component type.
 */
export function getSlotElements<P = { children?: ReactNode }>(
  children: ReactNode,
  componentType: unknown,
): ReactElement<P>[] {
  return Children.toArray(children).filter((child): child is ReactElement<P> =>
    isSlotElement<P>(child, componentType),
  );
}
