import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: () => (
    <main>
      <h1>Admin Web</h1>
      <p>관리자 서비스</p>
    </main>
  ),
});
