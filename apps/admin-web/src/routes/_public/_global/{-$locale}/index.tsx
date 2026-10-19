import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/_global/{-$locale}/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: context.user ? '/' : '/login', replace: true });
  },
});
