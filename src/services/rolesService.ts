const API_BASE_URL = '/api';

export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

class RolesService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  getRoles(): Promise<Role[]> {
    return this.request<Role[]>('/Roles');
  }

  deleteRole(id: number): Promise<void> {
    return this.request<void>(`/Roles/${id}`, { method: 'DELETE' });
  }
}

export const rolesService = new RolesService();
