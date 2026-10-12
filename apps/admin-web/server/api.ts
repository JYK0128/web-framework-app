import { fetchViteEnv } from 'nitro/vite/runtime';

export default function handleApi({ req }: { req: Request }): Promise<Response> {
  return fetchViteEnv('ssr', req);
}
