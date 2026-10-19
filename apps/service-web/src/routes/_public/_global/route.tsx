import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/_global')({ component: Outlet });
