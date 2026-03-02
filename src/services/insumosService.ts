/**
 * Servicio para gestión de Insumos/Productos
 * API: http://edwisbarber.somee.com/api/Productos
 */

export interface Insumo {
  id: number;
  nombre: string;
  categoria: string;
  stock: number;
  minimo: number;
  precio: number;
  imagen: string;
  activo?: boolean;
}

const API_BASE_URL = '/api';

class InsumosService {
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
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

  // Obtener todos los insumos
  async getInsumos(): Promise<Insumo[]> {
    try {
      console.log('📋 Obteniendo insumos...');
      const response = await this.request('/Productos');
      const text = await response.text();
      const raw = text ? JSON.parse(text) : [];

      if (Array.isArray(raw) && raw.length > 0) {
        console.log('🧪 Producto raw[0] desde API:', raw[0]);
      }

      const pickNumber = (obj: any, keys: string[], fallback = 0) => {
        for (const k of keys) {
          const v = obj?.[k];
          if (v !== undefined && v !== null && v !== '') return Number(v);
        }
        return fallback;
      };

      const inferNumberByKeyMatch = (
        obj: any,
        matcher: (key: string) => boolean,
        fallback = 0
      ) => {
        if (!obj || typeof obj !== 'object') return fallback;

        for (const [k, v] of Object.entries(obj)) {
          if (!matcher(k)) continue;
          const n = Number(v);
          if (!Number.isNaN(n)) return n;
        }

        return fallback;
      };

      const data: Insumo[] = (Array.isArray(raw) ? raw : []).map((p: any) => {
        const categoria =
          typeof p?.categoria === 'string'
            ? p.categoria
            : (p?.categoria?.nombre ?? p?.categoria?.name ?? p?.categoria?.descripcion ?? '');

        return {
          id: Number(p?.id ?? p?.productoId ?? 0),
          nombre: String(p?.nombre ?? p?.nombreProducto ?? p?.descripcion ?? ''),
          categoria: String(categoria),
          stock: (() => {
            const direct = pickNumber(p, ['stockInsumos', 'StockInsumos', 'stock', 'Stock', 'existencia', 'Existencia', 'cantidad', 'Cantidad', 'stockActual', 'StockActual', 'cantidadDisponible', 'CantidadDisponible'], 0);
            if (direct !== 0) return direct;

            const inferred = inferNumberByKeyMatch(
              p,
              (k) => /stock|exist/i.test(k) && !/min|max/i.test(k),
              0
            );

            if (inferred !== 0) return inferred;

            // Nested common shapes
            const nested = pickNumber(p?.inventario, ['stock', 'Stock', 'existencia', 'Existencia'], 0);
            return nested;
          })(),
          minimo: (() => {
            const direct = pickNumber(p, ['minimo', 'Minimo', 'stockMinimo', 'StockMinimo', 'minStock', 'MinStock'], 0);
            if (direct !== 0) return direct;

            const inferred = inferNumberByKeyMatch(
              p,
              (k) => /(minimo|min)/i.test(k) && /stock/i.test(k),
              0
            );

            if (inferred !== 0) return inferred;

            const nested = pickNumber(p?.inventario, ['minimo', 'Minimo', 'stockMinimo', 'StockMinimo'], 0);
            return nested;
          })(),
          // Precio de venta (lo que se debe sumar en el resumen)
          precio: (() => {
            const direct = pickNumber(
              p,
              [
                'PrecioVenta',
                'precioVenta',
                'precio_venta',
                'precioVentaUnitario',
                'precio',
                'Precio',
                'valor',
                'Valor',
              ],
              0
            );

            if (direct !== 0) return direct;

            // A veces viene en PascalCase/camelCase distinto o anidado
            const inferred = inferNumberByKeyMatch(
              p,
              (k) => /precio.*venta|venta.*precio/i.test(k),
              0
            );
            if (inferred !== 0) return inferred;

            const nested = pickNumber(p?.producto ?? p?.detalle, ['PrecioVenta', 'precioVenta', 'precio', 'Precio'], 0);
            return nested;
          })(),
          imagen: String(p?.imagen ?? p?.Imagen ?? p?.imagenProduc ?? p?.ImagenProduc ?? p?.imagenUrl ?? p?.ImagenUrl ?? ''),
          activo: Boolean(
            p?.activo === true || p?.Activo === true ||
            p?.estado === true || p?.Estado === true ||
            p?.active === true || p?.Active === true ||
            (p?.activo !== false && p?.Activo !== false && p?.estado !== false && p?.Estado !== false && p?.active !== false && p?.Active !== false)
          )
        };
      });

      console.log('✅ Insumos obtenidos:', data);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo insumos:', error);
      throw error;
    }
  }

  // Obtener un insumo por ID
  async getInsumoById(id: number): Promise<Insumo | null> {
    try {
      console.log(`🔍 Obteniendo insumo ${id}...`);
      const response = await this.request(`/Productos/${id}`);
      const text = await response.text();

      if (!text) return null;

      const p: any = JSON.parse(text);
      const categoria =
        typeof p?.categoria === 'string'
          ? p.categoria
          : (p?.categoria?.nombre ?? p?.categoria?.name ?? p?.categoria?.descripcion ?? '');

      const data: Insumo = {
        id: Number(p?.id ?? p?.productoId ?? id),
        nombre: String(p?.nombre ?? p?.nombreProducto ?? p?.descripcion ?? ''),
        categoria: String(categoria),
        stock: Number(p?.stock ?? p?.cantidad ?? 0),
        minimo: Number(p?.minimo ?? p?.stockMinimo ?? 0),
        precio: Number(p?.precio ?? p?.valor ?? 0),
        imagen: String(p?.imagen ?? p?.Imagen ?? p?.imagenProduc ?? p?.ImagenProduc ?? p?.imagenUrl ?? p?.ImagenUrl ?? ''),
        activo: Boolean(
          p?.activo === true || p?.Activo === true ||
          p?.estado === true || p?.Estado === true ||
          p?.active === true || p?.Active === true ||
          (p?.activo !== false && p?.Activo !== false && p?.estado !== false && p?.Estado !== false && p?.active !== false && p?.Active !== false)
        )
      };

      console.log(`✅ Insumo ${id} obtenido:`, data);
      return data;
    } catch (error) {
      console.error(`❌ Error obteniendo insumo ${id}:`, error);
      return null;
    }
  }
}

export const insumosService = new InsumosService();
