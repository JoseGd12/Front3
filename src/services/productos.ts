// =============================================================================
// MÓDULO COMPLETO DE PRODUCTOS - TODO EN UN SOLO ARCHIVO
// =============================================================================

// -----------------------------------------------------------------------------
// INTERFACES Y TIPOS
// -----------------------------------------------------------------------------

export interface ApiProducto {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: {
    id: number;
    nombre: string;
  } | null;
  precioBase: number;
  precio: number;
  iva: number;
  porcentajeIva: number;
  stockVentas: number;
  stockInsumos: number;
  cantidad: number;
  minCantidad: number;
  marca: string | null;
  imagenProduc: string | null;
  activo: boolean;
}

export interface ApiCategoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

// -----------------------------------------------------------------------------
// SERVICIO DE PRODUCTOS
// -----------------------------------------------------------------------------

const API_BASE_URL = '/api';

// Mapeo dinámico de nombres de categorías a IDs (se pobla desde la API)
let CATEGORIA_MAP: { [key: string]: number } = {};
let CATEGORIAS_LOADED = false;

class ProductoService {
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
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = response.statusText;
        }
        console.error(`❌ Producto API Error [${response.status}]:`, errorText);
        throw new Error(`Error del servidor (${response.status}): ${errorText || response.statusText}`);
      }
      return response;
    } catch (error) {
      console.error('Producto API Network/Error:', error);
      throw error;
    }
  }

  private mapFromApiFormat(data: any): ApiProducto {
    if (!data) return data as any;

    // Normalizar categoría para asegurar que tenga 'id' y 'nombre'
    const catRaw = data.Categoria || data.categoria;
    const catIdRaw = data.CategoriaId || data.categoriaId || data.IdCategoria || data.idCategoria;

    let categoriaNormalizada = null;

    if (catRaw && typeof catRaw === 'object') {
      categoriaNormalizada = {
        id: Number(catRaw.Id || catRaw.id || catIdRaw || 0),
        nombre: String(catRaw.Nombre || catRaw.nombre || "")
      };
    } else if (catIdRaw || (catRaw && typeof catRaw === 'number')) {
      // Si la API devuelve el ID directamente en Categoria o CategoriaId
      categoriaNormalizada = {
        id: Number(catIdRaw || catRaw),
        nombre: "" // El nombre se resolverá después si es necesario
      };
    }

    // Normalizar flags de estado/activo provenientes de la API
    const estadoRaw = (data as any).Estado ?? (data as any).estado;
    let activoNormalizado: boolean;

    if (
      (data as any).Activo !== undefined ||
      (data as any).activo !== undefined ||
      estadoRaw !== undefined
    ) {
      // Si la API envía explícitamente alguno de los flags, usamos su valor
      const flag =
        (data as any).Activo ??
        (data as any).activo ??
        estadoRaw;
      activoNormalizado = !!flag;
    } else {
      // Fallback: si no hay ningún flag, asumimos que el producto está activo
      activoNormalizado = true;
    }

    return {
      id: data.Id || data.id,
      nombre: data.Nombre || data.nombre,
      descripcion: data.Descripcion || data.descripcion,
      categoria: categoriaNormalizada,
      precioBase: Number(data.PrecioBase || data.precioBase || data.precioVenta || data.precioCompra || 0),
      precio: Number(data.Precio || data.precio || data.precioVenta || data.precioCompra || 0),
      iva: Number(data.Iva || data.iva || 0),
      porcentajeIva: Number(data.PorcentajeIva || data.porcentajeIva || 0),
      stockVentas: Number(data.StockVentas || data.stockVentas || 0),
      stockInsumos: Number(data.StockInsumos || data.stockInsumos || 0),
      cantidad: Number(data.Cantidad || data.cantidad || 0),
      minCantidad: Number(data.MinCantidad || data.minCantidad || data.stockMinimo || 0),
      marca: data.Marca || data.marca || '',
      imagenProduc: data.imagenProduc || data.ImagenProduc || '',
      activo: activoNormalizado,
    };
  }

  async getProductos(): Promise<ApiProducto[]> {
    try {
      const response = await this.request('/Productos');
      const text = await response.text();

      // A veces el backend devuelve 200 con body vacío / no JSON.
      // Evitamos romper la app y simplemente retornamos lista vacía.
      if (!text || !text.trim()) return [];

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        return [];
      }

      // Manejar envoltorio $values común en .NET
      if (data && typeof data === 'object' && !Array.isArray(data) && data.$values) {
        data = data.$values;
      }

      return Array.isArray(data) ? data.map(item => this.mapFromApiFormat(item)) : [];
    } catch (error) {
      console.error('Error fetching productos:', error);
      throw error;
    }
  }

  async getProductoById(id: number): Promise<ApiProducto | null> {
    try {
      const response = await this.request(`/Productos/${id}`);
      const text = await response.text();
      if (!text || !text.trim()) return null;
      const data = JSON.parse(text);
      return this.mapFromApiFormat(data);
    } catch (error) {
      return null;
    }
  }

  async createProducto(productoData: Partial<ApiProducto>): Promise<ApiProducto> {
    let categoriaId = 0;
    if (typeof (productoData as any).categoriaId === 'number' && (productoData as any).categoriaId > 0) {
      categoriaId = (productoData as any).categoriaId;
    } else if (typeof productoData.categoria === 'object' && productoData.categoria?.id) {
      categoriaId = productoData.categoria.id;
    } else {
      const categoriaName = String(typeof productoData.categoria === 'string' ? productoData.categoria : (productoData.categoria as any)?.nombre || '').trim();
      // Búsqueda insensible a mayúsculas/minúsculas en el mapa
      const mapping = Object.entries(CATEGORIA_MAP).find(([name]) => name.toLowerCase() === categoriaName.toLowerCase());
      categoriaId = mapping ? mapping[1] : (CATEGORIA_MAP[categoriaName] || 1);
    }

    console.log(`📦 Creando producto - CategoriaID resuelto: ${categoriaId} para categoria:`, productoData.categoria);

    const apiBody = {
      Nombre: productoData.nombre || '',
      Descripcion: productoData.descripcion || '',
      PrecioVenta: Number(productoData.precioBase) || 0,
      PrecioCompra: Number(productoData.precioBase) || 0,
      StockVentas: Number(productoData.stockVentas) || 0,
      StockInsumos: Number(productoData.stockInsumos) || 0,
      StockMinimo: Number(productoData.minCantidad) || 0,
      CategoriaId: categoriaId,
      ImagenProduc: productoData.imagenProduc || '',
      Estado: productoData.activo !== undefined ? !!productoData.activo : true,
      Activo: productoData.activo !== undefined ? !!productoData.activo : true
    };

    const response = await this.request('/Productos', {
      method: 'POST',
      body: JSON.stringify(apiBody),
    });
    const text = await response.text();
    const result = text ? JSON.parse(text) : apiBody;
    return this.mapFromApiFormat(result);
  }

  async updateProducto(id: number, productoData: Partial<ApiProducto>): Promise<ApiProducto> {
    // Intentar obtener el ID de categoría de varias fuentes para evitar errores de mapeo
    let categoriaId = 0;

    // 1. Si ya viene el ID directamente
    if (typeof (productoData as any).categoriaId === 'number' && (productoData as any).categoriaId > 0) {
      categoriaId = (productoData as any).categoriaId;
    }
    // 2. Si viene un objeto categoría con ID
    else if (typeof productoData.categoria === 'object' && productoData.categoria?.id) {
      categoriaId = productoData.categoria.id;
    }
    // 3. Resolución por nombre
    else {
      const categoriaName = String(typeof productoData.categoria === 'string' ? productoData.categoria : (productoData.categoria as any)?.nombre || '').trim();

      // Si tenemos nombre, buscamos en el mapa
      if (categoriaName) {
        // Si no hemos cargado categorías aún, o el mapa está sospechosamente vacío
        if (!CATEGORIAS_LOADED || Object.keys(CATEGORIA_MAP).length === 0) {
          try {
            await this.getCategorias();
          } catch (e) {
            console.warn("⚠️ No se pudieron cargar categorías para resolución de ID");
          }
        }

        const mapping = Object.entries(CATEGORIA_MAP).find(([name]) => name.toLowerCase() === categoriaName.toLowerCase());
        categoriaId = mapping ? mapping[1] : (CATEGORIA_MAP[categoriaName] || 0);
      }
    }

    // 4. Si después de todo seguimos sin ID y es una actualización, intentar obtener el ID actual del producto
    if (categoriaId === 0 && id > 0) {
      try {
        const currentProd = await this.getProductoById(id);
        if (currentProd?.categoria?.id) {
          categoriaId = currentProd.categoria.id;
          console.log(`ℹ️ Usando CategoriaId actual del producto: ${categoriaId}`);
        }
      } catch (e) {
        // silenciar error de fetch
      }
    }

    // 5. Fallback dinámico: Si seguimos sin ID, usar el primero disponible en el mapa
    if (categoriaId === 0) {
      const ids = Object.values(CATEGORIA_MAP);
      if (ids.length > 0 && ids[0] !== undefined) {
        categoriaId = ids[0];
        console.log(`ℹ️ Fallback a primera categoría disponible: ${categoriaId}`);
      } else {
        // Si el mapa aún está vacío, intentar cargar y re-resolver
        try {
          const cats = await this.getCategorias();
          if (cats.length > 0 && cats[0]) {
            categoriaId = cats[0].id;
            console.log(`ℹ️ Fallback tras carga de emergencia: ${categoriaId}`);
          }
        } catch (e) {
          console.error("❌ Fallback fallido: No se pudo obtener ninguna categoría");
        }
      }
    }

    // Último recurso desesperado (aunque ya no debería ser 1 hardcodeado si sabemos que no existe)
    if (categoriaId === 0) categoriaId = 1;

    console.log(`📦 Actualizando producto ${id} - CategoriaId final: ${categoriaId}`);

    const apiBody = {
      Id: id,
      Nombre: productoData.nombre,
      Descripcion: productoData.descripcion,
      PrecioVenta: Number(productoData.precioBase),
      PrecioCompra: Number(productoData.precioBase),
      StockVentas: Number(productoData.stockVentas),
      StockInsumos: Number(productoData.stockInsumos),
      StockMinimo: Number(productoData.minCantidad),
      CategoriaId: categoriaId,
      Marca: productoData.marca || '',
      ImagenProduc: productoData.imagenProduc || '',
      Estado: productoData.activo !== undefined ? !!productoData.activo : true,
      Activo: productoData.activo !== undefined ? !!productoData.activo : true
    };

    const response = await this.request(`/Productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiBody),
    });
    const text = await response.text();
    const result = text ? JSON.parse(text) : { ...apiBody, id };
    return this.mapFromApiFormat(result);
  }

  async deleteProducto(id: number): Promise<void> {
    await this.request(`/Productos/${id}`, { method: 'DELETE' });
  }

  // =============================================================================
  // MÉTODOS DE STOCK Y ESTADO
  // =============================================================================

  async toggleProductoActivo(id: number): Promise<ApiProducto> {
    const producto = await this.getProductoById(id);
    if (!producto) throw new Error('Producto no encontrado');
    const nuevoEstado = !producto.activo;
    await this.request(`/Productos/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ Estado: nuevoEstado, Activo: nuevoEstado }),
    });
    return await this.getProductoById(id) as ApiProducto;
  }

  async updateStock(id: number, stockVentas: number, stockInsumos: number): Promise<ApiProducto> {
    const producto = await this.getProductoById(id);
    if (!producto) throw new Error('Producto no encontrado');
    return await this.updateProducto(id, {
      ...producto,
      stockVentas,
      stockInsumos,
      cantidad: stockVentas + stockInsumos
    });
  }

  async adjustStock(id: number, cantidad: number, type: 'increment' | 'decrement', destino: 'ventas' | 'insumos' = 'insumos'): Promise<ApiProducto> {
    const producto = await this.getProductoById(id);
    if (!producto) throw new Error('Producto no encontrado');
    const factor = type === 'increment' ? 1 : -1;
    let nuevoStockVentas = producto.stockVentas || 0;
    let nuevoStockInsumos = producto.stockInsumos || 0;
    if (destino === 'ventas') nuevoStockVentas += (cantidad * factor);
    else nuevoStockInsumos += (cantidad * factor);
    return await this.updateStock(id, Math.max(0, nuevoStockVentas), Math.max(0, nuevoStockInsumos));
  }

  async revertirStockProducto(id: number, cantidadVentas: number, cantidadInsumos: number): Promise<ApiProducto> {
    const producto = await this.getProductoById(id);
    if (!producto) throw new Error('Producto no encontrado');
    const nuevoStockVentas = Math.max(0, (producto.stockVentas || 0) - (cantidadVentas || 0));
    const nuevoStockInsumos = Math.max(0, (producto.stockInsumos || 0) - (cantidadInsumos || 0));
    return await this.updateStock(id, nuevoStockVentas, nuevoStockInsumos);
  }

  async agregarStockInsumos(id: number, cantidad: number, motive?: string): Promise<ApiProducto> {
    console.log(`📦 Stock Insumos: +${cantidad} (${motive || 'Sin motivo'})`);
    return await this.adjustStock(id, cantidad, 'increment', 'insumos');
  }

  async transferirStock(id: number, cantidad: number, origen: 'ventas' | 'insumos', destino: 'ventas' | 'insumos'): Promise<ApiProducto> {
    const response = await this.request(`/Productos/${id}/transferir-stock`, {
      method: 'POST',
      body: JSON.stringify({ cantidad, origen, destino }),
    });
    const result = await response.json();
    return this.mapFromApiFormat(result);
  }

  async searchProductos(query: string): Promise<ApiProducto[]> {
    const productos = await this.getProductos();
    const q = query.toLowerCase();
    return productos.filter(p =>
      p.nombre?.toLowerCase().includes(q) ||
      p.descripcion?.toLowerCase().includes(q) ||
      p.marca?.toLowerCase().includes(q)
    );
  }

  async getCategorias(): Promise<ApiCategoria[]> {
    try {
      const response = await this.request('/Categorias');
      const text = await response.text();
      if (!text || !text.trim()) return [];
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        return [];
      }

      // Manejar envoltorio $values
      if (data && typeof data === 'object' && !Array.isArray(data) && data.$values) {
        data = data.$values;
      }

      const normalized = Array.isArray(data) ? data.map((cat: any) => ({
        id: cat.Id || cat.id,
        nombre: cat.Nombre || cat.nombre,
        descripcion: cat.Descripcion || cat.descripcion || null,
        estado: !!(cat.Estado || cat.estado || cat.Activo || cat.activo)
      })) : [];

      // Limpiar y poblar el mapa de categorías
      const nuevoMapa: { [key: string]: number } = {};
      normalized.forEach(cat => {
        if (cat.nombre) {
          nuevoMapa[cat.nombre.trim()] = cat.id;
        }
      });

      CATEGORIA_MAP = nuevoMapa;
      CATEGORIAS_LOADED = true;

      console.log("📂 CATEGORIA_MAP actualizado:", CATEGORIA_MAP);
      return normalized;
    } catch (error) {
      console.error("❌ Error en getCategorias:", error);
      return [];
    }
  }
}

export const productoService = new ProductoService();
export default productoService;

// UTILIDADES EXPORTADAS
export const formatCurrency = (amount: number): string => amount.toLocaleString('es-CO');
export const formatearPrecio = (precio: number): string => `$ ${precio.toLocaleString('es-CO')}`;
