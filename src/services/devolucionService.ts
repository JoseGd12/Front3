const API_BASE_URL = '/api';

export interface Devolucion {
    id: number;
    ventaId: number;
    clienteId: number | null;
    clienteNombre?: string;
    clienteDocumento?: string;
    productoId: number;
    productoNombre?: string;
    cantidad: number;
    monto: number;
    saldoAFavor: number;
    motivo: string;
    fecha: string;
    estado: string;
    usuarioId: number;
    responsableNombre?: string;
    observaciones?: string;
}

export interface CreateDevolucionRequest {
    ventaId: number;
    productoId: number;
    servicioId?: number;
    clienteId: number | null;
    cantidad: number;
    motivoCategoria: string;
    motivoDetalle: string;
    montoDevuelto: number;
    saldoAFavor: number;
    usuarioId: number;
    observaciones?: string;
}

class DevolucionService {
    private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = `${API_BASE_URL}${endpoint}`;

        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            console.log(`🚀 DevolucionService [${config.method || 'GET'}]: ${url}`);
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ DevolucionService Error [${response.status}]: ${errorText}`);
                throw new Error(`Error del servidor (${response.status}): ${errorText || response.statusText}`);
            }

            return response;
        } catch (error: any) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                console.error('🛑 ERROR DE RED/CORS: La petición fue bloqueada o el servidor cerró la conexión.');
                console.warn('Posibles causas:\n1. Referencias circulares en C# (quita los .Include del PUT).\n2. El hosting Somee bloquea verbos PUT/DELETE.\n3. Error de CORS en el Preflight (OPTIONS).');
            }
            console.error('DevolucionService Network/API Error:', error);
            throw error;
        }
    }

    private async normalizeDevolucionData(data: any): Promise<Devolucion> {
        if (!data) return {} as Devolucion;

        // La API ahora usa proyecciones (Select) y devuelve objetos planos
        const producto = data.producto || data.Producto;
        const usuario = data.usuario || data.Usuario;
        const cliente = data.cliente || data.Cliente;

        return {
            id: Number(data.id || data.Id),
            ventaId: data.ventaId || data.VentaId || 0,
            clienteId: data.clienteId || data.ClienteId || null,
            clienteNombre: cliente
                ? (cliente.nombre || cliente.Nombre || 'Cliente')
                : (data.clienteNombre || data.ClienteNombre || 'Cliente'),
            clienteDocumento: cliente
                ? (cliente.documento || cliente.Documento || cliente.usuario?.documento || cliente.usuario?.Documento || '')
                : (data.clienteDocumento || data.ClienteDocumento || data.cliente?.documento || data.cliente?.Documento || ''),
            productoId: data.productoId || data.ProductoId || 0,
            productoNombre: producto?.nombre || producto?.Nombre || 'Producto',
            cantidad: Number(data.cantidad || data.Cantidad || 0),
            monto: Number(data.montoDevuelto || data.MontoDevuelto || 0),
            saldoAFavor: Number(data.saldoAFavor || data.SaldoAFavor || 0),
            motivo: data.motivoCategoria || data.MotivoCategoria || '',
            fecha: data.fecha || data.Fecha || new Date().toISOString(),
            estado: (() => {
                const raw = (data.estado || data.Estado || 'Activo').toString().trim().toLowerCase();
                if (raw === 'activo' || raw === 'completada' || raw === 'completado') return 'Completada';
                if (raw === 'anulado' || raw === 'anulada') return 'Anulada';
                if (raw === 'pendiente') return 'Pendiente';
                if (raw === 'procesado') return 'Procesado';
                return 'Completada';
            })(),
            usuarioId: data.usuarioId || data.UsuarioId || 0,
            responsableNombre: usuario
                ? (usuario.nombre || usuario.Nombre || 'Responsable')
                : 'Responsable',
            observaciones: data.observaciones || data.Observaciones || ''
        };
    }

    async getDevoluciones(): Promise<Devolucion[]> {
        try {
            const response = await this.request('/Devoluciones');
            const data = await response.json();
            return await Promise.all(data.map((item: any) => this.normalizeDevolucionData(item)));
        } catch (error) {
            console.error('Error fetching devoluciones:', error);
            throw error;
        }
    }

    private mapToApiFormat(data: CreateDevolucionRequest): any {
        // Función interna para asegurar que enviamos null si el ID no es válido (> 0)
        // Esto permite que el operador ?? en tu C# funcione correctamente.
        const cleanId = (id: any) => {
            const num = Number(id);
            return (isNaN(num) || num <= 0) ? null : num;
        };

        return {
            VentaId: cleanId(data.ventaId),
            ClienteId: cleanId(data.clienteId),
            UsuarioId: cleanId(data.usuarioId),
            ProductoId: cleanId(data.productoId),
            Cantidad: Number(data.cantidad),
            MotivoCategoria: data.motivoCategoria,
            MotivoDetalle: data.motivoDetalle || '',
            Observaciones: data.observaciones || '',
            MontoDevuelto: Number(data.montoDevuelto),
            SaldoAFavor: Number(data.saldoAFavor)
        };
    }

    async createDevolucion(devolucionData: CreateDevolucionRequest): Promise<Devolucion> {
        try {
            const apiBody = this.mapToApiFormat(devolucionData);
            console.log('📤 Creando devolución - Datos mapeados:', apiBody);

            const response = await this.request('/Devoluciones', {
                method: 'POST',
                body: JSON.stringify(apiBody),
            });
            const data = await response.json();
            return await this.normalizeDevolucionData(data);
        } catch (error) {
            console.error('Error creating devolucion:', error);
            throw error;
        }
    }

    async updateDevolucionStatus(id: number, estado: string): Promise<void> {
        try {
            console.log(`📤 [POST] Actualizando estado devolución ${id} a: ${estado}`);

            // Cambiamos a POST para evitar bloqueos del servidor Somee
            await this.request(`/Devoluciones/${id}/estado`, {
                method: 'POST',
                body: JSON.stringify({ estado: estado }),
            });
        } catch (error) {
            console.error(`Error al actualizar estado de Devolucion ${id}:`, error);
            throw error;
        }
    }

    async deleteDevolucion(id: number): Promise<void> {
        try {
            await this.request(`/Devoluciones/${id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error(`Error deleting devolucion ${id}:`, error);
            throw error;
        }
    }
}

export const devolucionService = new DevolucionService();
export default devolucionService;
