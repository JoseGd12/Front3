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

  getRoleById(id: number): Promise<Role> {
    return this.request<Role>(`/Roles/${id}`);
  }

  createRole(data: Partial<Role>): Promise<Role> {
    const payload = {
      Nombre: data.nombre ?? '',
      Descripcion: data.descripcion ?? '',
      Estado: data.estado ?? true
    };
    return this.request<Role>('/Roles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  updateRole(id: number, data: Partial<Role>): Promise<Role> {
    const payload = {
      Id: id,
      Nombre: data.nombre ?? '',
      Descripcion: data.descripcion ?? '',
      Estado: data.estado ?? true
    };
    return this.request<Role>(`/Roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  deleteRole(id: number): Promise<void> {
    return this.request<void>(`/Roles/${id}`, { method: 'DELETE' });
  }
}

export const rolesService = new RolesService();
