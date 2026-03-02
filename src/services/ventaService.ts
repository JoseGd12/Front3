const API_BASE_URL = '/api';

export interface Venta {
  id: number;
  numeroVenta: number;
  cliente: string;
  clienteId: number | null;
  clienteDocumento: string;
  fecha: string;
  servicios: string;
  productos: string;
  subtotal: number;
  iva: number;
  descuento: number;
  total: number;
  barbero: string;
  barberoId?: number | null;
  responsable?: string;
  estado: string;
  metodoPago: string;
  garantiaMeses: number;
  productosDetalle: ProductoDetalle[];
  serviciosDetalle: ServicioDetalle[];
}

export interface ProductoDetalle {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface ServicioDetalle {
  id: string;
  nombre: string;
  cantidad?: number;
  precio: number;
}

export interface CreateVentaRequest {
  numeroVenta: number;
  clienteId: number | null;
  usuarioId?: number | null;
  clienteDocumento: string;
  fecha: string;
  servicios: string;
  productos: string;
  subtotal: number;
  iva: number;
  descuento: number;
  total: number;
  barberoId?: number | null;
  barberoNombre?: string;
  estado: string;
  metodoPago: string;
  garantiaMeses: number;
  productosDetalle: ProductoDetalle[];
  serviciosDetalle: ServicioDetalle[];
}

class VentaService {
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
      console.log(`VentaService [${config.method || 'GET'}]: ${url}`);
      if (config.body) {
        console.log(`📤 Request Body:`, config.body);
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ VentaService Error [${response.status}]: ${errorText}`);
        throw new Error(`Error del servidor (${response.status}): ${errorText || response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('VentaService Network/API Error:', error);
      throw error;
    }
  }

  private mapToApiFormat(data: any): any {
    const mapped: any = {};

    // Campos requeridos por el backend (VentaInput)
    if (data.id !== undefined) mapped.Id = data.id;
    if (data.clienteId !== undefined && data.clienteId !== null) {
      mapped.ClienteId = Number(data.clienteId);
    }

    // UsuarioId = responsable logeado (NO barbero)
    if (data.usuarioId !== undefined && data.usuarioId !== null) {
      mapped.UsuarioId = Number(data.usuarioId);
    }
    // BarberoId = barbero seleccionado en la venta (opcional e independiente)
    if (data.barberoId !== undefined && data.barberoId !== null) {
      mapped.BarberoId = Number(data.barberoId);
    }

    if (data.metodoPago !== undefined) mapped.MetodoPago = data.metodoPago;
    if (data.numeroVenta !== undefined) mapped.NumeroVenta = Number(data.numeroVenta);
    if (data.fecha !== undefined) mapped.Fecha = data.fecha;
    if (data.estado !== undefined) mapped.Estado = data.estado;
    if (data.descuento !== undefined) mapped.Descuento = Number(data.descuento);
    if (data.iva !== undefined) mapped.IVA = Number(data.iva);
    if (data.subtotal !== undefined) mapped.Subtotal = Number(data.subtotal);
    if (data.total !== undefined) mapped.Total = Number(data.total);
    if (data.garantiaMeses !== undefined) mapped.GarantiaMeses = Number(data.garantiaMeses);

    // Unificar detalles en la propiedad 'Detalles' (PascalCase)
    const detalles: any[] = [];

    if (data.productosDetalle && Array.isArray(data.productosDetalle)) {
      data.productosDetalle.forEach((p: any) => {
        const productoId = parseInt(p.id);
        if (!isNaN(productoId) && productoId > 0) {
          detalles.push({
            ProductoId: productoId,
            Cantidad: Number(p.cantidad || 1),
            PrecioUnitario: Number(p.precio || 0)
          });
        } else {
          console.warn(`⚠️ Producto con ID inválido ignorado:`, p);
        }
      });
    }

    if (data.serviciosDetalle && Array.isArray(data.serviciosDetalle)) {
      data.serviciosDetalle.forEach((s: any) => {
        const idStr = String(s.id || '');

        if (idStr.startsWith('PAQ-')) {
          const id = parseInt(idStr.replace('PAQ-', ''));
          if (!isNaN(id) && id > 0) {
            detalles.push({
              PaqueteId: id,
              Cantidad: Number(s.cantidad || 1),
              PrecioUnitario: Number(s.precio || 0)
            });
          }
        } else if (idStr.startsWith('SERV-')) {
          const id = parseInt(idStr.replace('SERV-', ''));
          if (!isNaN(id) && id > 0) {
            detalles.push({
              ServicioId: id,
              Cantidad: Number(s.cantidad || 1),
              PrecioUnitario: Number(s.precio || 0)
            });
          }
        }
        // Ignorar servicios personalizados (SERVPERS-*) ya que no tienen ID válido en la BD
      });
    }

    if (detalles.length > 0) {
      mapped.Detalles = detalles;
    } else {
      console.warn('⚠️ No se encontraron detalles válidos para la venta');
      // No lanzar error aquí, dejar que el backend valide
    }

    // Validar que ClienteId sea válido
    if (!mapped.ClienteId || mapped.ClienteId <= 0) {
      throw new Error('ClienteId es requerido y debe ser un número válido');
    }
    // Validar responsable
    if (!mapped.UsuarioId || mapped.UsuarioId <= 0) {
      throw new Error('UsuarioId (responsable) es requerido y debe ser un número válido');
    }

    // Validar que haya detalles antes de enviar
    if (!mapped.Detalles || mapped.Detalles.length === 0) {
      throw new Error('La venta debe tener al menos un producto o servicio válido');
    }

    console.log('📋 Mapeo final antes de enviar:', {
      ClienteId: mapped.ClienteId,
      UsuarioId: mapped.UsuarioId,
      BarberoId: mapped.BarberoId,
      NumeroVenta: mapped.NumeroVenta,
      Fecha: mapped.Fecha,
      Estado: mapped.Estado,
      MetodoPago: mapped.MetodoPago,
      Descuento: mapped.Descuento,
      IVA: mapped.IVA,
      Subtotal: mapped.Subtotal,
      Total: mapped.Total,
      DetallesCount: mapped.Detalles?.length || 0,
      Detalles: mapped.Detalles
    });

    return mapped;
  }

  private async normalizeVentaData(data: any): Promise<Venta> {
    if (!data) return {} as Venta;

    // 1. Normalización de objetos principales (Soporte Pascal/camel)
    const cliente = data.cliente || data.Cliente || {};
    const barberoObj = data.barbero || data.Barbero || {};
    const usuarioResponsable = data.usuario || data.Usuario || {};
    const detallesApi = data.detalleVenta || data.detalleVentas || data.detalles ||
      data.DetalleVenta || data.DetalleVentas || data.Detalles || [];

    // 2. Procesar detalles de productos y servicios
    const productosDetalle: ProductoDetalle[] = [];
    const serviciosDetalle: ServicioDetalle[] = [];

    // Primero procesamos los detalles anidados si existen
    for (const d of detallesApi) {
      const p = d.producto || d.Producto;
      const s = d.servicio || d.Servicio;
      const paq = d.paquete || d.Paquete;
      const precioUnit = Number(d.precioUnitario || d.PrecioUnitario || d.precio || d.Precio || 0);
      const cantidad = Number(d.cantidad || d.Cantidad || 1);
      const productoIdPlano = d.productoId || d.ProductoId;
      const servicioIdPlano = d.servicioId || d.ServicioId;
      const paqueteIdPlano = d.paqueteId || d.PaqueteId;

      if (p) {
        productosDetalle.push({
          id: String(p.id || p.Id || d.productoId || d.ProductoId),
          nombre: p.nombre || p.Nombre || 'Producto',
          cantidad,
          precio: precioUnit
        });
      } else if (productoIdPlano) {
        productosDetalle.push({
          id: String(productoIdPlano),
          nombre: d.productoNombre || d.ProductoNombre || d.nombreProducto || d.NombreProducto || 'Producto',
          cantidad,
          precio: precioUnit
        });
      } else if (s) {
        serviciosDetalle.push({
          id: `SERV-${String(s.id || s.Id || servicioIdPlano).replace(/^SERV-/, '')}`,
          nombre: s.nombre || s.Nombre || 'Servicio',
          cantidad,
          precio: precioUnit
        });
      } else if (servicioIdPlano) {
        serviciosDetalle.push({
          id: `SERV-${String(servicioIdPlano).replace(/^SERV-/, '')}`,
          nombre: d.servicioNombre || d.ServicioNombre || d.nombreServicio || d.NombreServicio || 'Servicio',
          cantidad,
          precio: precioUnit
        });
      } else if (paq || paqueteIdPlano) {
        serviciosDetalle.push({
          id: `PAQ-${paqueteIdPlano || paq?.id || paq?.Id}`,
          nombre: paq?.nombre || paq?.Nombre || 'Paquete',
          cantidad,
          precio: precioUnit
        });
      }
    }

    // Si no hay detalles anidados, buscamos arreglos planos (resiliencia)
    if (productosDetalle.length === 0) {
      (data.productosDetalle || data.ProductosDetalle || []).forEach((p: any) => {
        productosDetalle.push({
          id: String(p.id || p.Id || p.productoId || p.ProductoId || ''),
          nombre: p.nombre || p.Nombre || p.productoNombre || p.ProductoNombre || 'Producto',
          cantidad: Number(p.cantidad || p.Cantidad || 1),
          precio: Number(p.precio || p.Precio || p.precioUnitario || p.PrecioUnitario || 0)
        });
      });
    }
    if (serviciosDetalle.length === 0) {
      (data.serviciosDetalle || data.ServiciosDetalle || []).forEach((s: any) => {
        const rawId = String(s.id || s.Id || s.servicioId || s.ServicioId || '');
        const serviceId = rawId.startsWith('SERV-') || rawId.startsWith('PAQ-')
          ? rawId
          : `SERV-${rawId}`;
        serviciosDetalle.push({
          id: serviceId,
          nombre: s.nombre || s.Nombre || s.servicioNombre || s.ServicioNombre || 'Servicio',
          cantidad: Number(s.cantidad || s.Cantidad || 1),
          precio: Number(s.precio || s.Precio || s.precioUnitario || s.PrecioUnitario || 0)
        });
      });
    }

    // 3. Resolución de nombres con soporte para Pascal/camel y fallbacks
    const clienteNombre = cliente.nombre || cliente.Nombre
      ? `${cliente.nombre || cliente.Nombre} ${cliente.apellido || cliente.Apellido || ''}`.trim()
      : (data.clienteNombre || data.ClienteNombre || data.cliente || data.Cliente || 'Cliente');

    const barberoNombre = barberoObj.nombre || barberoObj.Nombre
      ? `${barberoObj.nombre || barberoObj.Nombre} ${barberoObj.apellido || barberoObj.Apellido || ''}`.trim()
      : (data.barberoNombre || data.BarberoNombre || data.barbero || data.Barbero || 'Sin asignar');

    const responsableNombre = usuarioResponsable.nombre || usuarioResponsable.Nombre
      ? `${usuarioResponsable.nombre || usuarioResponsable.Nombre} ${usuarioResponsable.apellido || usuarioResponsable.Apellido || ''}`.trim()
      : (data.responsableNombre || data.ResponsableNombre || data.usuarioNombre || data.UsuarioNombre || 'Sin asignar');

    // 4. Extracción segura de IDs numéricos para evitar NaN/Nombres en campos de ID
    const getNumericId = (val: any, fallbackId?: any) => {
      const num = Number(val);
      if (!isNaN(num) && val !== null && val !== "" && typeof val !== 'object' && num > 0) return num;
      const fallbackNum = Number(fallbackId);
      return (!isNaN(fallbackNum) && fallbackId !== null && fallbackId !== "" && fallbackNum > 0) ? fallbackNum : null;
    };

    const finalClienteId = getNumericId(data.clienteId || data.ClienteId, cliente.id || cliente.Id);
    const finalBarberoId = getNumericId(data.barberoId || data.BarberoId, barberoObj.id || barberoObj.Id);

    // 5. Retorno del objeto normalizado
    return {
      id: Number(data.id || data.Id) || 0,
      numeroVenta: Number(data.numeroVenta || data.NumeroVenta || data.id || data.Id || 0),
      cliente: clienteNombre,
      clienteId: finalClienteId,
      clienteDocumento: String(cliente.documento || cliente.Documento || data.clienteDocumento || data.ClienteDocumento || ''),
      fecha: String(data.fecha || data.Fecha || ''),
      servicios: data.servicios || data.Servicios || serviciosDetalle.map(s => s.nombre).join(', ') || 'Sin servicios',
      productos: data.productos || data.Productos || productosDetalle.map(p => `${p.nombre} (x${p.cantidad})`).join(', ') || 'Sin productos',
      subtotal: Number(data.subtotal || data.Subtotal) || 0,
      iva: Number(data.iva || data.Iva) || 0,
      descuento: Number(data.descuento || data.Descuento) || 0,
      total: Number(data.total || data.Total) || 0,
      barbero: barberoNombre,
      barberoId: finalBarberoId,
      responsable: responsableNombre,
      estado: String(data.estado || data.Estado || 'Completada'),
      metodoPago: String(data.metodoPago || data.MetodoPago || 'Efectivo'),
      garantiaMeses: Number(data.garantiaMeses || data.GarantiaMeses || 1),
      productosDetalle,
      serviciosDetalle
    };
  }

  async getVentas(): Promise<Venta[]> {
    try {
      console.log('📥 Obteniendo ventas desde:', `${API_BASE_URL}/ventas`);
      const response = await this.request('/Ventas');
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      console.log('✅ Ventas obtenidas:', data);
      const normalizedData = Array.isArray(data) ? await Promise.all(data.map(item => this.normalizeVentaData(item))) : [];
      console.log('✅ Ventas normalizadas:', normalizedData);
      return normalizedData;
    } catch (error: any) {
      console.error('❌ Error obteniendo ventas:', error);
      throw error;
    }
  }

  async getVentaById(id: number): Promise<Venta | null> {
    try {
      console.log(`📥 Obteniendo venta ${id} desde:`, `${API_BASE_URL}/ventas/${id}`);
      const response = await this.request(`/Ventas/${id}`);
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      console.log(`✅ Venta ${id} obtenida:`, data);

      if (!data) return null;

      return await this.normalizeVentaData(data);
    } catch (error: any) {
      console.error(`❌ Error obteniendo venta ${id}:`, error);
      throw error;
    }
  }

  async createVenta(ventaData: CreateVentaRequest): Promise<Venta> {
    try {
      console.log('🔍 Original ventaData before mapping:', ventaData);
      console.log('🔍 productosDetalle:', ventaData.productosDetalle);
      console.log('🔍 serviciosDetalle:', ventaData.serviciosDetalle);

      const mappedBase = this.mapToApiFormat(ventaData);
      console.log('📤 VentaService [POST]: /Ventas - Payload completo:', JSON.stringify(mappedBase, null, 2));
      console.log('🔍 ClienteId enviado a la API:', mappedBase.ClienteId);
      console.log('🔍 Detalles enviados:', mappedBase.Detalles);
      console.log('🔍 Cantidad de detalles:', mappedBase.Detalles?.length || 0);

      if (!mappedBase.Detalles || mappedBase.Detalles.length === 0) {
        throw new Error('No se pueden enviar detalles vacíos. Asegúrate de agregar productos o servicios válidos.');
      }

      const variantes: Array<{ nombre: string; payload: any }> = [];

      // V1: payload base actual
      variantes.push({ nombre: 'base', payload: { ...mappedBase } });

      // V2: algunos backends calculan estos campos y fallan si se envían
      variantes.push({
        nombre: 'sin-campos-calculados',
        payload: (() => {
          const p = { ...mappedBase };
          delete p.NumeroVenta;
          delete p.Fecha;
          delete p.Estado;
          return p;
        })()
      });

      // V3: fallback financiero conservador (sin IVA explícito)
      variantes.push({
        nombre: 'sin-iva-explicito',
        payload: (() => {
          const p = { ...mappedBase };
          const subtotal = Number(p.Subtotal || 0);
          const descuento = Number(p.Descuento || 0);
          p.IVA = 0;
          p.Total = subtotal - descuento;
          return p;
        })()
      });

      let ultimoError: any = null;
      for (const variante of variantes) {
        try {
          const jsonBody = JSON.stringify(variante.payload);
          console.log(`📤 Intentando crear venta [${variante.nombre}]`);
          console.log('📤 JSON serializado que se enviará:', jsonBody);
          console.log('📤 Primeros 500 caracteres del JSON:', jsonBody.substring(0, 500));

          const response = await this.request('/Ventas', {
            method: 'POST',
            body: jsonBody,
          });
          const text = await response.text();
          const data = text ? JSON.parse(text) : {};
          console.log(`✅ Venta creada con variante [${variante.nombre}]:`, data);
          return await this.normalizeVentaData(data);
        } catch (err: any) {
          ultimoError = err;
          console.error(`❌ Variante [${variante.nombre}] falló:`, err?.message || err);
        }
      }

      throw ultimoError || new Error('No se pudo crear la venta con ninguna variante de payload');
    } catch (error: any) {
      console.error('❌ Error creando venta:', error);
      console.error('❌ Stack trace:', error.stack);
      throw error;
    }
  }

  async updateVenta(id: number, ventaData: Partial<Venta>): Promise<Venta> {
    try {
      const mapped = this.mapToApiFormat({ ...ventaData, id });
      console.log(`📤 Actualizando venta ${id}:`, mapped);
      const response = await this.request(`/Ventas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapped),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      console.log(`✅ Venta ${id} actualizada:`, data);
      return await this.normalizeVentaData(data);
    } catch (error: any) {
      console.error(`❌ Error actualizando venta ${id}:`, error);
      throw error;
    }
  }

  async anularVenta(id: number): Promise<void> {
    try {
      console.log(`📤 Anulando venta ${id}...`);
      await this.request(`/Ventas/${id}/anular`, {
        method: 'PUT'
      });
      console.log(`✅ Venta ${id} anulada`);
    } catch (error: any) {
      console.error(`❌ Error anulando venta ${id}:`, error);
      throw error;
    }
  }

  async deleteVenta(id: number): Promise<void> {
    try {
      console.log(`🗑️ Eliminando venta ${id}...`);
      await this.request(`/Ventas/${id}`, {
        method: 'DELETE',
      });
      console.log(`✅ Venta ${id} eliminada`);
    } catch (error: any) {
      console.error(`❌ Error eliminando venta ${id}:`, error);
      throw error;
    }
  }

  async getVentasByBarbero(barbero: string): Promise<Venta[]> {
    try {
      console.log(`📥 Obteniendo ventas del barbero ${barbero}...`);
      const ventas = await this.getVentas();
      const filtered = ventas.filter(v => v.barbero === barbero);
      console.log(`✅ Ventas del barbero ${barbero}:`, filtered);
      return filtered;
    } catch (error: any) {
      console.error(`❌ Error obteniendo ventas del barbero ${barbero}:`, error);
      throw error;
    }
  }

  async getVentasByFecha(fechaInicio: string, fechaFin: string): Promise<Venta[]> {
    try {
      console.log(`📥 Obteniendo ventas entre ${fechaInicio} y ${fechaFin}...`);
      const ventas = await this.getVentas();
      const filtered = ventas.filter(v => {
        const ventaFecha = new Date(v.fecha);
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return ventaFecha >= inicio && ventaFecha <= fin;
      });
      console.log(`✅ Ventas filtradas por fecha:`, filtered);
      return filtered;
    } catch (error: any) {
      console.error(`❌ Error obteniendo ventas por fecha:`, error);
      throw error;
    }
  }
}

export const ventaService = new VentaService();
export default ventaService;