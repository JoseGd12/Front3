/**
 * Servicio para gestión de Entregas de Insumos
 * API: http://edwisbarber.somee.com/api/EntregasInsumos
 */

// Interfaces para la comunicación con la API
export interface EntregaInsumo {
  id: number;
  barbero?: unknown;
  barberoId?: number | string;
  barberoDocumento?: string;
  fecha: string;
  hora: string;
  cantidadTotal: number;
  valorTotal: number;
  estado: 'Entregado' | 'Anulado';
  responsable: string;
  usuarioId?: number | string;
  insumosDetalle: InsumoEntrega[];
}

export interface InsumoEntrega {
  id: number;
  nombre: string;
  categoria: string;
  cantidad: number;
  precio: number;
  imagen?: string;
}

export interface CreateEntregaData {
  barberoId: number;
  usuarioId: number;
  detalles: {
    productoId: number;
    cantidad: number;
  }[];
}

export interface UpdateEntregaData {
  id: number;
  estado: 'Entregado' | 'Anulado';
}

const API_BASE_URL = '/api';

class EntregaInsumosService {
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      // Capturar el mensaje de error del backend
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorText = await response.text();
        console.error('❌ Respuesta de error del servidor:', errorText);
        errorMessage += ` - ${errorText}`;
      } catch (e) {
        console.error('❌ No se pudo leer el error del servidor');
      }
      throw new Error(errorMessage);
    }

    return response;
  }

  // Obtener todas las entregas
  async getEntregas(): Promise<EntregaInsumo[]> {
    try {
      console.log('📋 Obteniendo entregas de insumos...');
      const response = await this.request('/EntregasInsumos');
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];

      console.log('✅ Entregas obtenidas:', data);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo entregas:', error);
      throw error;
    }
  }

  // Obtener una entrega por ID
  async getEntregaById(id: string): Promise<EntregaInsumo | null> {
    try {
      console.log(`🔍 Obteniendo entrega ${id}...`);
      const response = await this.request(`/EntregasInsumos/${id}`);
      const text = await response.text();

      if (!text) return null;

      const data = JSON.parse(text);
      console.log(`✅ Entrega ${id} obtenida:`, data);
      return data;
    } catch (error) {
      console.error(`❌ Error obteniendo entrega ${id}:`, error);
      return null;
    }
  }

  // Crear nueva entrega
  async createEntrega(entregaData: CreateEntregaData) {
    try {
      console.log('🔵 Creando entrega:', entregaData);

      const response = await this.request('/EntregasInsumos', {
        method: 'POST',
        body: JSON.stringify(entregaData),
      });

      const text = await response.text();
      if (!text) throw new Error('Respuesta vacía del servidor');

      return JSON.parse(text);

    } catch (error) {
      console.error('❌ Error creando entrega:', error);
      throw error;
    }
  }

  // Actualizar estado de una entrega (para anular)
  async updateEntrega(id: number, updateData: UpdateEntregaData): Promise<EntregaInsumo> {
    try {
      console.log(`🔄 Actualizando entrega ${id}:`, updateData);

      // Usar el endpoint específico para cambiar estado
      const payload = {
        estado: updateData.estado
      };

      console.log('🔄 Payload enviado al backend:', payload);

      const response = await this.request(`/EntregasInsumos/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      console.log(`✅ Entrega ${id} actualizada:`, data);

      // La API devuelve una respuesta con la propiedad 'entidad'
      return data.entidad || data;
    } catch (error) {
      console.error(`❌ Error actualizando entrega ${id}:`, error);
      throw error;
    }
  }

  // Eliminar una entrega
  async deleteEntrega(id: number): Promise<void> {
    try {
      console.log(`🗑️ Eliminando entrega ${id}...`);

      await this.request(`/EntregasInsumos/${id}`, {
        method: 'DELETE',
      });

      console.log(`✅ Entrega ${id} eliminada`);
    } catch (error) {
      console.error(`❌ Error eliminando entrega ${id}:`, error);
      throw error;
    }
  }
}

export const entregaInsumosService = new EntregaInsumosService();
