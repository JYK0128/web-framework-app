import { createFileRoute, Outlet } from '@tanstack/react-router';

import { beforeLoadPublicRoute } from '#/lib/route-access';

export const Route = createFileRoute('/_app/_public')({ beforeLoad: beforeLoadPublicRoute, component: Outlet });
