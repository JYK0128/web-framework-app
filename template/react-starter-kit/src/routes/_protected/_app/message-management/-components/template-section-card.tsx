import type { ReactNode } from 'react';

import { SectionCard } from '#/components/app';

type TemplateSectionCardProps = {
  header: ReactNode
  toolbar: ReactNode
  table: ReactNode
  pagination: ReactNode
};

export function TemplateSectionCard({ header, toolbar, table, pagination }: TemplateSectionCardProps) {
  return (
    <SectionCard textSize="sm">
      <SectionCard.Content>
        <div className="grid h-full grid-rows-[auto_1fr_auto]">
          {header}
          {toolbar}
          <div className="flex-1">{table}</div>
          {pagination}
        </div>
      </SectionCard.Content>
    </SectionCard>
  );
}
