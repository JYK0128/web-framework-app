import { defineEventHandler } from 'nitro/h3';
import { fetchViteEnv } from 'nitro/vite/runtime';

// API의 파일 확장자가 개발 서버에서 정적 파일로 분류되지 않도록 Start로 전달한다.
export default defineEventHandler((event) => fetchViteEnv('ssr', event.req));
