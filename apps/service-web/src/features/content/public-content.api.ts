import { axios } from '#/lib/axios';

export type PublicNotice = { id: string, title: string, content: string, importance: 'normal' | 'important' | 'urgent', isPinned: boolean, status: 'published', publishedAt: string | null, createdAt: string, updatedAt: string };
export type PublicEvent = { id: string, title: string, content: string, startsAt: string, endsAt: string, imageUrl: string | null, linkUrl: string | null, status: 'published', publishedAt: string | null, createdAt: string, updatedAt: string };
export type PublicPage<T> = { items: T[], page: number, totalPages: number, totalCount: number, hasNextPage: boolean, hasPrevPage: boolean };
export const listPublicNotices = (page: number, signal?: AbortSignal) => axios<PublicPage<PublicNotice>>({ url: '/api/v1/notices', method: 'GET', params: { page, limit: 20 }, signal });
export const listPublicEvents = (page: number, signal?: AbortSignal) => axios<PublicPage<PublicEvent>>({ url: '/api/v1/events', method: 'GET', params: { page, limit: 20 }, signal });
