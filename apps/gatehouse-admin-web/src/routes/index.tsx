import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    const user = context.authSession?.user;
    if (user) {
      if (user.role === 'admin' || user.role === 'super-admin') {
        throw redirect({ to: '/admin', replace: true });
      }
      throw redirect({ to: '/profile', replace: true });
    }

    throw redirect({ to: '/login', replace: true });
  },
});
