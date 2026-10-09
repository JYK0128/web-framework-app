import { axios } from '#/lib/axios';

export type NoticeImportance = 'normal' | 'important' | 'urgent';
export type PublicationStatus = 'draft' | 'published';
export type NoticeItem = { id: string, title: string, content: string, importance: NoticeImportance, isPinned: boolean, status: PublicationStatus, publishedAt: string | null, createdAt: string, updatedAt: string };
export type NoticeInput = Omit<NoticeItem, 'id' | 'publishedAt' | 'createdAt' | 'updatedAt'>;
export type NoticePage = { items: NoticeItem[], page: number, totalPages: number, totalCount: number, hasNextPage: boolean, hasPrevPage: boolean };
export type NoticeListParams = { page: number, limit: number, search?: string, status?: PublicationStatus, importance?: NoticeImportance };

export const noticeKeys = { all: ['notices'] as const, list: (params: NoticeListParams) => [...noticeKeys.all, params] as const };
export const listNotices = (params: NoticeListParams, signal?: AbortSignal) => axios<NoticePage>({ url: '/api/v1/notices', method: 'GET', params, signal });
export const createNotice = (data: NoticeInput) => axios<NoticeItem>({ url: '/api/v1/notices', method: 'POST', data });
export const updateNotice = (id: string, data: Partial<NoticeInput>) => axios<NoticeItem>({ url: `/api/v1/notices/${id}`, method: 'PATCH', data });
export const deleteNotice = (id: string) => axios<{ ok: boolean }>({ url: `/api/v1/notices/${id}`, method: 'DELETE' });
