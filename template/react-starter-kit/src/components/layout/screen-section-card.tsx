import type { ReactNode } from 'react';

import { Card, CardContent, CardFooter } from '#/.generated/shadcn/components/ui';

type ScreenSectionCardProps = {
  children: ReactNode;
  className?: string;
};

function ScreenSectionCardComponent({ children, className }: ScreenSectionCardProps) {
  return <Card className={className}>{children}</Card>;
}

function ScreenSectionCardContent({ children, className }: ScreenSectionCardProps) {
  return <CardContent className={className}>{children}</CardContent>;
}

function ScreenSectionCardFooter({ children, className }: ScreenSectionCardProps) {
  return <CardFooter className={className}>{children}</CardFooter>;
}

export const ScreenSectionCard = Object.assign(ScreenSectionCardComponent, {
  Content: ScreenSectionCardContent,
  Footer: ScreenSectionCardFooter,
});
