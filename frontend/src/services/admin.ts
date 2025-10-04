import api from './api';

export interface UserWithRole {
  id: number;
  username: string;
  email: string | null;
  nombre: string;
  apellido: string | null;
  especialidad: string;
  plan: string;
  activo: boolean;
  fecha_registro: string;
  role_name: string | null;
  role_display_name: string | null;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  permissions_count: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  users_by_role: Record<string, number>;
  users_without_role: number;
  users_by_plan: Record<string, number>;
}

export const adminService = {
  // Users
  async listUsers(skip = 0, limit = 100, activo?: boolean): Promise<UserWithRole[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (activo !== undefined) {
      params.append('activo', activo.toString());
    }
    const response = await api.get<UserWithRole[]>(`/admin/users?${params}`);
    return response.data;
  },

  async getUserDetails(userId: number) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  async assignRole(userId: number, role: string) {
    const response = await api.post(`/admin/users/${userId}/assign-role`, {
      user_id: userId,
      role: role,
    });
    return response.data;
  },

  async updateUserStatus(userId: number, activo: boolean) {
    const response = await api.patch(`/admin/users/${userId}/status`, {
      activo: activo,
    });
    return response.data;
  },

  async deleteUser(userId: number) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Roles
  async listRoles(): Promise<Role[]> {
    const response = await api.get<Role[]>('/admin/roles');
    return response.data;
  },

  async getRolePermissions(roleId: number) {
    const response = await api.get(`/admin/roles/${roleId}/permissions`);
    return response.data;
  },

  // Stats
  async getStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  },
};

