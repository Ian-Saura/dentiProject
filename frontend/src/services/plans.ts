import api from './api';

export interface PlanStatus {
  plan: string;
  fecha_inicio_plan: string | null;
  fecha_vencimiento: string | null;
  dias_restantes: number | null;
  trial_expirado: boolean;
  puede_usar_app: boolean;
  mensaje: string | null;
}

export interface AssignPlanRequest {
  plan: 'trial' | 'premium' | 'enterprise';
  dias_duracion?: number;
}

export const plansService = {
  // Get current user's plan status
  async getMyPlanStatus(): Promise<PlanStatus> {
    const response = await api.get<PlanStatus>('/auth/me/plan-status');
    return response.data;
  },

  // Get another user's plan status (admin/moderator only)
  async getUserPlanStatus(userId: number): Promise<PlanStatus> {
    const response = await api.get<PlanStatus>(`/admin/users/${userId}/plan-status`);
    return response.data;
  },

  // Assign plan to a user (admin/moderator only)
  async assignPlan(userId: number, planRequest: AssignPlanRequest): Promise<any> {
    const response = await api.post(`/admin/users/${userId}/assign-plan`, planRequest);
    return response.data;
  },
};




