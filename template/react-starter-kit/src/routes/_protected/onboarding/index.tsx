import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/onboarding/')({
  beforeLoad: () => {
    throw redirect({ to: '/onboarding/email' });
  },
});
