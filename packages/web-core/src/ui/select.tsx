import { Select as SelectPrimitive } from '@base-ui/react/select';
import * as React from 'react';

import { SelectItem } from '#.generated/shadcn/components/ui/select';

type SelectItemOption = {
  value: unknown
  label: React.ReactNode
};

function collectSelectItems(children: React.ReactNode): SelectItemOption[] {
  const items: SelectItemOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const props = child.props as { children?: React.ReactNode, value?: unknown };
    if (child.type === SelectItem && props.value !== undefined) {
      items.push({ value: props.value, label: props.children });
      return;
    }

    if (props.children) items.push(...collectSelectItems(props.children));
  });

  return items;
}

export type SelectProps<Value = string, Multiple extends boolean | undefined = false>
  = SelectPrimitive.Root.Props<Value, Multiple>;

/** Resolves SelectValue labels from the SelectItem children when items is omitted. */
export function Select<Value = string, Multiple extends boolean | undefined = false>({
  children,
  items,
  ...props
}: SelectProps<Value, Multiple>) {
  const resolvedItems = items ?? collectSelectItems(children);

  return (
    <SelectPrimitive.Root<Value, Multiple> {...props} items={resolvedItems}>
      {children}
    </SelectPrimitive.Root>
  );
}
