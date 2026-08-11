import { axios } from '#/core/config/axios';

export type AdminUserStatus = 'active' | 'suspended';

export type AdminUser = {
  id: string
  name: string
  email: string
  status: AdminUserStatus
  role: 'admin' | 'super-admin' | null
  createdAt: string
  lastLoginAt: string | null
};

export type ServiceUser = {
  id: string
  name: string
  email: string
  status: AdminUserStatus
  role: 'user' | null
  createdAt: string
  lastLoginAt: string | null
};

export type AdminOverview = {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  newUsersToday: number
};

type ApiResponse<T> = {
  data: T
};

export const adminApi = {
  getOverview: () => axios<ApiResponse<AdminOverview>>({
    url: '/api/v1/admin/overview',
    method: 'GET',
  }),
  getUsers: (params: { search?: string, status?: 'all' | AdminUserStatus, limit?: number }) => axios<ApiResponse<{
    users: AdminUser[]
    total: number
  }>>({
    url: '/api/v1/admin/users',
    method: 'GET',
    params,
  }),
  updateUserStatus: (id: string, status: AdminUserStatus) => axios<ApiResponse<AdminUser>>({
    url: `/api/v1/admin/users/${id}/status`,
    method: 'PATCH',
    data: { status },
  }),
  getServiceOverview: () => axios<ApiResponse<AdminOverview>>({
    url: '/api/v1/admin/service-overview',
    method: 'GET',
  }),
  getServiceUsers: (params: { search?: string, status?: 'all' | AdminUserStatus, limit?: number }) => axios<ApiResponse<{
    users: ServiceUser[]
    total: number
  }>>({
    url: '/api/v1/admin/service-users',
    method: 'GET',
    params,
  }),
  updateServiceUserStatus: (id: string, status: AdminUserStatus) => axios<ApiResponse<ServiceUser>>({
    url: `/api/v1/admin/service-users/${id}/status`,
    method: 'PATCH',
    data: { status },
  }),
};
