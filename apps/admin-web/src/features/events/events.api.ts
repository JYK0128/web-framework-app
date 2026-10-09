import { axios } from '#/lib/axios';

export type PublicationStatus = 'draft' | 'published';
export type EventItem = { id: string, title: string, content: string, startsAt: string, endsAt: string, imageUrl: string | null, linkUrl: string | null, status: PublicationStatus, publishedAt: string | null, createdAt: string, updatedAt: string };
export type EventInput = Omit<EventItem, 'id' | 'publishedAt' | 'createdAt' | 'updatedAt'>;
export type EventPage = { items: EventItem[], page: number, totalPages: number, totalCount: number, hasNextPage: boolean, hasPrevPage: boolean };
export type EventListParams = { page: number, limit: number, search?: string, status?: PublicationStatus };

export const eventKeys = { all: ['events'] as const, list: (params: EventListParams) => [...eventKeys.all, params] as const };
export const listEvents = (params: EventListParams, signal?: AbortSignal) => axios<EventPage>({ url: '/api/v1/events', method: 'GET', params, signal });
export const createEvent = (data: EventInput) => axios<EventItem>({ url: '/api/v1/events', method: 'POST', data });
export const updateEvent = (id: string, data: Partial<EventInput>) => axios<EventItem>({ url: `/api/v1/events/${id}`, method: 'PATCH', data });
export const deleteEvent = (id: string) => axios<{ ok: boolean }>({ url: `/api/v1/events/${id}`, method: 'DELETE' });
