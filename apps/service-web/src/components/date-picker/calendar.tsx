import { DayPicker } from 'react-day-picker';

import { cn } from '#/.generated/shadcn/lib/utils';

export function Calendar({ className, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays
      className={cn('bg-background p-3', className)}
      classNames={{
        months: 'flex flex-col gap-4',
        month: 'space-y-4',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        button_previous: 'size-7 rounded-md hover:bg-muted',
        button_next: 'size-7 rounded-md hover:bg-muted',
        month_caption: 'flex justify-center pt-1 relative items-center',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative',
        day_button: 'size-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-muted',
        today: 'bg-muted text-foreground',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
      }}
      {...props}
    />
  );
}
