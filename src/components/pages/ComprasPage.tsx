import React, { useState, useEffect, useMemo } from "react";
import { Input } from "../ui/input";
import {
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  CreditCard,
  Receipt,
  Hash,
  Building,
  FileText,
  Ban,
  Calculator,
  FileDown,
  Boxes,
  ShoppingBag,
  DollarSign,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { useDoubleConfirmation } from "../ui/double-confirmation";
import { useCustomAlert } from "../ui/custom-alert";
import { compraService, Compra, CreateCompraRequest } from "../../services/compraService";
import { proveedorService, Proveedor } from "../../services/proveedorService";
import { insumosService, Insumo } from "../../services/insumosService";
import { productoService } from "../../services/productos";
import ImageRenderer from "../ui/ImageRenderer";

// Función para formatear moneda colombiana con puntos para separar miles
const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return amount.toLocaleString('es-CO');
};

const normalizeSearchText = (value: unknown): string => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

import { useAuth } from "../AuthContext";

// Lazy load components incorrectly was causing a crash. 
// Standardizing imports at the top and only using lazy if strictly necessary.
// For now, using the static imports already present for stability.

// Memoized row component defined outside to avoid recreation
const CompraRow = React.memo(({
  compra,
  onViewDetails,
  onGenerateReport,
  onAnular,
  getEstadoColor
}: {
  compra: Compra & { totalFormatted: string; fechaFormatted: string, proveedorDocumento?: string },
  onViewDetails: (c: Compra) => void,
  onGenerateReport: (c: Compra) => void,
  onAnular: (id: number) => void,
  getEstadoColor: (e: string) => string
}) => (
  <tr className="border-b border-gray-dark hover:bg-gray-darker transition-colors">
    <td className="py-4 px-4 text-center">
      <span className="text-gray-lighter">{compra.id}</span>
    </td>
    <td className="py-4 px-4 text-center">
      <span className="text-gray-lighter">{compra.proveedorDocumento || 'N/A'}</span>
    </td>
    <td className="py-4 px-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <Building className="w-4 h-4 text-orange-primary" />
        <span className="text-gray-lighter">{compra.proveedorNombre}</span>
      </div>
    </td>
    <td className="py-4 px-4 text-center">
      <span className="text-gray-lighter font-bold">${compra.totalFormatted}</span>
    </td>
    <td className="py-4 px-4 text-center">
      <span className="text-gray-lighter">{compra.fechaFormatted}</span>
    </td>
    <td className="py-4 px-4 text-center">
      <span className={`px-3 py-1 rounded-full text-xs ${getEstadoColor(compra.estado)}`}>
        {compra.estado}
      </span>
    </td>
    <td className="py-4 px-4 text-center">
      <div className="flex items-center justify-center gap-2">
        {compra.estado?.toLowerCase() !== "anulada" && compra.estado?.toLowerCase() !== "anulado" && (
          <button
            onClick={() => onAnular(compra.id)}
            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
            title="Anular"
          >
            <Ban className="w-4 h-4 text-gray-lightest group-hover:text-red-400" />
          </button>
        )}
        <button
          onClick={() => onViewDetails(compra)}
          className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
          title="Ver detalles"
        >
          <Eye className="w-4 h-4 text-gray-lightest group-hover:text-orange-primary" />
        </button>
        <button
          onClick={() => onGenerateReport(compra)}
          className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
          title="Generar reporte"
        >
          <FileDown className="w-4 h-4 text-gray-lightest group-hover:text-blue-400" />
        </button>
      </div>
    </td>
  </tr>
));

export function ComprasPage() {
  const { user } = useAuth();
  const { confirmDeleteAction, DoubleConfirmationContainer } = useDoubleConfirmation();
  const { created, AlertContainer } = useCustomAlert();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Insumo[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [loading, setLoading] = useState(!sessionStorage.getItem('compras_cache'));

  // Función para generar fecha automática (solo visualización o defaults)
  const generateCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para formatear fecha en formato estándar DD/MM/YYYY
  const formatDate = (date: string | Date) => {
    let dateObj: Date;
    if (typeof date === 'string') {
      const plainDateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (plainDateMatch) {
        const [, year, month, day] = plainDateMatch;
        // Importante: crear fecha en zona local para evitar desfase de -1 día
        dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    return dateObj.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const inicialNuevaCompra = {
    proveedorId: 0,
    metodoPago: '',
    fechaRegistro: generateCurrentDate(),
    fechaFactura: '',
    porcentajeDescuento: 0,
    productos: [] as Array<{
      id: number,
      nombre: string,
      cantidad: number,
      precio: number,
      stockVentas: number,
      stockInsumos: number,
      imagen?: string
    }>
  };

  const [nuevaCompra, setNuevaCompra] = useState(inicialNuevaCompra);
  const [tarjetaInputs, setTarjetaInputs] = useState<Record<number, {
    cantidad?: string;
    stockVentas?: string;
    stockInsumos?: string;
    precio?: string;
  }>>({});
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [providerSearchTerm, setProviderSearchTerm] = useState('');
  const [showProviderResults, setShowProviderResults] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);
  const [cantidadProducto, setCantidadProducto] = useState(0);
  const [cantidadProductoInput, setCantidadProductoInput] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [precioUnitarioInput, setPrecioUnitarioInput] = useState('');
  const [stockVentas, setStockVentas] = useState(0);
  const [stockInsumos, setStockInsumos] = useState(0);
  const [stockVentasInput, setStockVentasInput] = useState('');
  const [stockInsumosInput, setStockInsumosInput] = useState('');
  const [porcentajeDescuentoInput, setPorcentajeDescuentoInput] = useState('');
  const [showCompraFormErrors, setShowCompraFormErrors] = useState(false);
  const [showAddCompraProductoErrors, setShowAddCompraProductoErrors] = useState(false);
  const [compraValidationAttempt, setCompraValidationAttempt] = useState(0);
  const shakeClass = compraValidationAttempt % 2 === 0 ? 'input-required-shake-a' : 'input-required-shake-b';
  const noProductosAgregados = (nuevaCompra.productos?.length || 0) === 0;
  const showProductoSelectorError = (showCompraFormErrors && noProductosAgregados && !productoSeleccionado) || (showAddCompraProductoErrors && !productoSeleccionado);
  const showCantidadProductoError = (showCompraFormErrors && noProductosAgregados && cantidadProducto <= 0) || (showAddCompraProductoErrors && cantidadProducto <= 0);
  const showStockVentasError = (showCompraFormErrors && noProductosAgregados && stockVentasInput.trim() === '') || (showAddCompraProductoErrors && stockVentasInput.trim() === '');
  const showStockInsumosError = (showCompraFormErrors && noProductosAgregados && stockInsumosInput.trim() === '' && stockVentas !== cantidadProducto) || (showAddCompraProductoErrors && stockInsumosInput.trim() === '' && stockVentas !== cantidadProducto);
  const showDistribucionError = (showCompraFormErrors || showAddCompraProductoErrors) && cantidadProducto > 0 && (stockVentas + stockInsumos) !== cantidadProducto;

  // Cargar datos de forma separada y perezosa con cache SWR
  const loadCompras = async (useCache = false) => {
    if (useCache) {
      const cached = sessionStorage.getItem('compras_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setCompras(parsed);
          // Si tenemos cache, ya no necesitamos mostrar el spinner principal
          // aunque sigamos cargando datos frescos en background
          setLoading(false);
        } catch (e) {
          console.error("Error parsing cache", e);
        }
      }
    }

    try {
      const comprasData = await compraService.getCompras();
      setCompras(comprasData);
      sessionStorage.setItem('compras_cache', JSON.stringify(comprasData));
    } catch (error) {
      toast.error("Error al cargar compras", { description: "No se pudieron obtener las compras." });
      console.error(error);
    }
  };

  const loadProveedores = async () => {
    try {
      const proveedoresData = await proveedorService.obtenerProveedoresJuridicos();
      const filtrados = (proveedoresData || []).filter(p => p.nombre && (p.estado !== false && p.activo !== false));
      setProveedores(filtrados);
    } catch (error) {
      toast.error("Error al cargar proveedores", { description: "No se pudieron obtener los proveedores." });
      console.error("❌ Error en loadProveedores:", error);
    }
  };

  const loadProductos = async () => {
    try {
      const productosData = await insumosService.getInsumos();
      setProductos(productosData.filter(p => p.activo === true));
    } catch (error) {
      toast.error("Error al cargar productos", { description: "No se pudieron obtener los productos." });
      console.error(error);
    }
  };

  // Cargar datos iniciales (compras y proveedores)
  const initData = async () => {
    const hasCache = !!sessionStorage.getItem('compras_cache');

    // Solo mostrar loading si NO hay cache
    if (!hasCache) {
      setLoading(true);
    }

    try {
      // Iniciamos ambas cargas. loadCompras(true) se encarga de mostrar la cache
      // primero si existe, y luego actualizar con datos frescos.
      const comprasPromise = loadCompras(true);
      const proveedoresPromise = loadProveedores();

      // Esperamos que loadCompras termine (incluyendo la petición de red)
      // para asegurar que los datos estén actualizados, pero permitimos
      // que proveedores se cargue en background si tarda más.
      await comprasPromise;

      // Proveedores es secundario (solo para el diálogo de nueva compra)
      proveedoresPromise.catch(err => console.error("Error background providers:", err));
    } catch (error) {
      console.error("Error en la carga inicial:", error);
    } finally {
      // Si la carga de compras fue exitosa o falló, quitamos el loading.
      // Si hubo cache, loadCompras ya habrá quitado el loading antes.
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // Cargar productos cuando se abre el diálogo de crear/editar compra
  useEffect(() => {
    if (isDialogOpen && productos.length === 0) {
      loadProductos();
    }
  }, [isDialogOpen]);
  // Debounce search term to avoid recomputing on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);


  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Memoized filtered compras based on debounced term
  const filteredCompras = useMemo(() => {
    const query = normalizeSearchText(debouncedSearch);
    if (!query) return compras;
    return compras.filter(compra => {
      return (compra as any).searchString?.includes(query);
    });
  }, [compras, debouncedSearch]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredCompras.length / itemsPerPage)), [filteredCompras, itemsPerPage]);
  const startIndex = (currentPage - 1) * itemsPerPage;
  // Pre‑compute formatted fields for displayed rows
  const displayedCompras = useMemo(() => {
    return filteredCompras.slice(startIndex, startIndex + itemsPerPage).map(compra => ({
      ...compra,
      totalFormatted: formatCurrency(compra.total),
      fechaFormatted: formatDate(compra.fecha)
    }));
  }, [filteredCompras, startIndex, itemsPerPage]);


  // Ajustar página actual si el total de páginas cambia
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  const getEstadoColor = (estado: string) => {
    const estadoNormalizado = (estado || '').toLowerCase().trim();
    if (estadoNormalizado === 'anulada' || estadoNormalizado === 'anulado') {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    if (estadoNormalizado === 'completada' || estadoNormalizado === 'completado') {
      return 'bg-green-500/10 text-green-400 border border-green-500/20';
    }
    return 'bg-gray-medium text-gray-lighter';
  };

  const calcularSubtotal = () => {
    if (!nuevaCompra.productos || !Array.isArray(nuevaCompra.productos)) {
      return 0;
    }
    return nuevaCompra.productos.reduce((total, producto) =>
      total + (producto.precio * producto.cantidad), 0
    );
  };

  const calcularDescuento = (subtotal: number) => {
    return subtotal * (nuevaCompra.porcentajeDescuento / 100);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const descuento = calcularDescuento(subtotal);
    return subtotal - descuento;
  };

  // Al seleccionar producto, actualizar precio unitario sugerido
  useEffect(() => {
    if (productoSeleccionado) {
      const prod = productos.find(p => p.id === Number(productoSeleccionado));
      if (prod) {
        setPrecioUnitario(prod.precio);
        setPrecioUnitarioInput(String(prod.precio ?? ''));
      }
    } else {
      setPrecioUnitario(0);
      setPrecioUnitarioInput('');
    }
  }, [productoSeleccionado, productos]);

  const agregarProducto = () => {
    if (!productoSeleccionado || cantidadProducto <= 0 || stockVentasInput.trim() === '' || (stockInsumosInput.trim() === '' && stockVentas !== cantidadProducto)) {
      setShowAddCompraProductoErrors(true);
      setCompraValidationAttempt((prev) => prev + 1);
      return;
    }

    const producto = productos.find(p => p.id === Number(productoSeleccionado));
    if (!producto) {
      setShowAddCompraProductoErrors(true);
      setCompraValidationAttempt((prev) => prev + 1);
      return;
    }

    // Validación de stock es opcional en compras o requerida según lógica de negocio.
    if (stockVentas + stockInsumos !== cantidadProducto) {
      setShowAddCompraProductoErrors(true);
      setCompraValidationAttempt((prev) => prev + 1);
      toast.error("Error en distribución", { description: "La suma de Stock Ventas y Entregas debe ser igual a la Cantidad Total" });
      return;
    }

    const productosActuales = nuevaCompra.productos || [];
    const existeProducto = productosActuales.find(p => p.id === producto.id);

    if (existeProducto) {
      const cantidadActualizada = existeProducto.cantidad + cantidadProducto;
      const stockVentasActualizado = existeProducto.stockVentas + stockVentas;
      const stockInsumosActualizado = existeProducto.stockInsumos + stockInsumos;
      setNuevaCompra({
        ...nuevaCompra,
        productos: productosActuales.map(p =>
          p.id === producto.id
            ? {
              ...p,
              cantidad: cantidadActualizada,
              precio: precioUnitario,
              stockVentas: stockVentasActualizado,
              stockInsumos: stockInsumosActualizado
            }
            : p
        )
      });
      setTarjetaInputs((prev) => ({
        ...prev,
        [producto.id]: {
          cantidad: String(cantidadActualizada),
          stockVentas: String(stockVentasActualizado),
          stockInsumos: String(stockInsumosActualizado),
          precio: String(precioUnitario)
        }
      }));
    } else {
      const cantidadNueva = cantidadProducto;
      const stockVentasNuevo = stockVentas;
      const stockInsumosNuevo = stockInsumos;
      setNuevaCompra({
        ...nuevaCompra,
        productos: [...productosActuales, {
          id: producto.id,
          nombre: producto.nombre,
          cantidad: cantidadNueva,
          precio: precioUnitario,
          stockVentas: stockVentasNuevo,
          stockInsumos: stockInsumosNuevo,
          imagen: (producto as Insumo).imagen ?? (producto as { imagenProduc?: string }).imagenProduc ?? ''
        }]
      });
      setTarjetaInputs((prev) => ({
        ...prev,
        [producto.id]: {
          cantidad: String(cantidadNueva),
          stockVentas: String(stockVentasNuevo),
          stockInsumos: String(stockInsumosNuevo),
          precio: String(precioUnitario)
        }
      }));
    }

    setProductoSeleccionado('');
    setCantidadProducto(0);
    setCantidadProductoInput('');
    setPrecioUnitario(0);
    setPrecioUnitarioInput('');
    setStockVentas(0);
    setStockInsumos(0);
    setStockVentasInput('');
    setStockInsumosInput('');
    setShowAddCompraProductoErrors(false);
    setShowCompraFormErrors(false);
  };

  const eliminarProducto = (productId: number) => {
    const productosActuales = nuevaCompra.productos || [];
    setNuevaCompra({
      ...nuevaCompra,
      productos: productosActuales.filter(p => p.id !== productId)
    });
    setTarjetaInputs((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const getTarjetaInput = (
    producto: { id: number; cantidad: number; stockVentas: number; stockInsumos: number; precio: number },
    campo: 'cantidad' | 'stockVentas' | 'stockInsumos' | 'precio'
  ) => {
    const visual = tarjetaInputs[producto.id]?.[campo];
    return visual ?? '';
  };

  const actualizarTarjetaInput = (
    productId: number,
    campo: 'cantidad' | 'stockVentas' | 'stockInsumos' | 'precio',
    valor: string
  ) => {
    setTarjetaInputs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [campo]: valor
      }
    }));

    if (valor.trim() === '') return;

    const numero = Number(valor);
    if (Number.isNaN(numero)) return;

    if (campo === 'cantidad' && numero >= 1) {
      actualizarCantidadProducto(productId, numero);
      return;
    }
    if (campo === 'stockVentas' && numero >= 0) {
      actualizarStockVentas(productId, numero);
      return;
    }
    if (campo === 'stockInsumos' && numero >= 0) {
      actualizarStockInsumos(productId, numero);
      return;
    }
    if (campo === 'precio' && numero >= 0) {
      actualizarPrecioProducto(productId, numero);
    }
  };

  const handleCantidadProductoInputChange = (valor: string) => {
    setCantidadProductoInput(valor);
    if (showAddCompraProductoErrors) setShowAddCompraProductoErrors(false);
    if (valor.trim() === '') {
      setCantidadProducto(0);
      return;
    }
    const numero = Number(valor);
    if (!Number.isNaN(numero)) {
      setCantidadProducto(Math.max(0, Math.floor(numero)));
    }
  };

  const handlePrecioUnitarioInputChange = (valor: string) => {
    setPrecioUnitarioInput(valor);
    if (valor.trim() === '') {
      setPrecioUnitario(0);
      return;
    }
    const numero = Number(valor);
    if (!Number.isNaN(numero)) {
      setPrecioUnitario(Math.max(0, numero));
    }
  };



  const handleStockVentasInputChange = (valor: string) => {
    setStockVentasInput(valor);
    if (showAddCompraProductoErrors) setShowAddCompraProductoErrors(false);
    if (valor.trim() === '') {
      setStockVentas(0);
      return;
    }
    const numero = Number(valor);
    if (!Number.isNaN(numero)) {
      setStockVentas(Math.max(0, Math.floor(numero)));
    }
  };

  const handleStockInsumosInputChange = (valor: string) => {
    setStockInsumosInput(valor);
    if (showAddCompraProductoErrors) setShowAddCompraProductoErrors(false);
    if (valor.trim() === '') {
      setStockInsumos(0);
      return;
    }
    const numero = Number(valor);
    if (!Number.isNaN(numero)) {
      setStockInsumos(Math.max(0, Math.floor(numero)));
    }
  };

  const handlePorcentajeDescuentoInputChange = (valor: string) => {
    setPorcentajeDescuentoInput(valor);
    if (valor.trim() === '') {
      setNuevaCompra({ ...nuevaCompra, porcentajeDescuento: 0 });
      return;
    }
    const numero = Number(valor);
    if (!Number.isNaN(numero)) {
      const clamped = Math.min(100, Math.max(0, numero));
      setNuevaCompra({ ...nuevaCompra, porcentajeDescuento: clamped });
    }
  };

  const actualizarCantidadProducto = (productId: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    const productosActuales = nuevaCompra.productos || [];
    const producto = productosActuales.find(p => p.id === productId);
    if (!producto) return;

    // Mantener la proporción de stocks o ajustar si es necesario
    const diferencia = nuevaCantidad - producto.cantidad;
    let nuevoStockVentas = producto.stockVentas + diferencia;
    let nuevoStockInsumos = producto.stockInsumos;

    // Si el stock de ventas excede la nueva cantidad, ajustar proporcionalmente
    if (nuevoStockVentas > nuevaCantidad) {
      nuevoStockVentas = nuevaCantidad;
      nuevoStockInsumos = 0;
    } else if (nuevoStockVentas < 0) {
      nuevoStockVentas = 0;
      nuevoStockInsumos = nuevaCantidad;
    } else {
      // Mantener stockInsumos ajustado para que sumen la cantidad total
      nuevoStockInsumos = nuevaCantidad - nuevoStockVentas;
    }

    setNuevaCompra({
      ...nuevaCompra,
      productos: productosActuales.map(p =>
        p.id === productId
          ? { ...p, cantidad: nuevaCantidad, stockVentas: nuevoStockVentas, stockInsumos: nuevoStockInsumos }
          : p
      )
    });
    setTarjetaInputs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        cantidad: String(nuevaCantidad),
        stockVentas: String(nuevoStockVentas),
        stockInsumos: String(nuevoStockInsumos)
      }
    }));
  };

  const actualizarPrecioProducto = (productId: number, nuevoPrecio: number) => {
    if (nuevoPrecio < 0) return;
    const productosActuales = nuevaCompra.productos || [];
    setNuevaCompra({
      ...nuevaCompra,
      productos: productosActuales.map(p =>
        p.id === productId ? { ...p, precio: nuevoPrecio } : p
      )
    });
    setTarjetaInputs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        precio: String(nuevoPrecio)
      }
    }));
  };

  const actualizarStockVentas = (productId: number, nuevoStock: number) => {
    if (nuevoStock < 0) return;
    const productosActuales = nuevaCompra.productos || [];
    const producto = productosActuales.find(p => p.id === productId);
    if (!producto) return;

    // Asegurar que stockVentas + stockInsumos = cantidad
    const stockInsumos = producto.cantidad - nuevoStock;
    if (stockInsumos < 0) {
      toast.error("El stock de ventas no puede ser mayor que la cantidad total");
      return;
    }

    setNuevaCompra({
      ...nuevaCompra,
      productos: productosActuales.map(p =>
        p.id === productId
          ? { ...p, stockVentas: nuevoStock, stockInsumos: stockInsumos }
          : p
      )
    });
    setTarjetaInputs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        stockVentas: String(nuevoStock),
        stockInsumos: String(stockInsumos)
      }
    }));
  };

  const actualizarStockInsumos = (productId: number, nuevoStock: number) => {
    if (nuevoStock < 0) return;
    const productosActuales = nuevaCompra.productos || [];
    const producto = productosActuales.find(p => p.id === productId);
    if (!producto) return;

    // Asegurar que stockVentas + stockInsumos = cantidad
    const stockVentas = producto.cantidad - nuevoStock;
    if (stockVentas < 0) {
      toast.error("El stock de insumos no puede ser mayor que la cantidad total");
      return;
    }

    setNuevaCompra({
      ...nuevaCompra,
      productos: productosActuales.map(p =>
        p.id === productId
          ? { ...p, stockInsumos: nuevoStock, stockVentas: stockVentas }
          : p
      )
    });
    setTarjetaInputs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        stockInsumos: String(nuevoStock),
        stockVentas: String(stockVentas)
      }
    }));
  };

  const handleViewDetails = async (compra: Compra) => {
    try {
      // Show dialog immediately or loading state
      const detalles = await compraService.getDetallesPorCompra(compra.id);
      setSelectedCompra({ ...compra, detalles: detalles });
      setIsDetailDialogOpen(true);
    } catch (error) {
      toast.error("Error al cargar detalles de la compra");
    }
  };

  const handleCreateCompra = React.useCallback(async () => {
    setShowCompraFormErrors(true);
    setCompraValidationAttempt((prev) => prev + 1);

    if (!user || !user.id) {
      toast.error("Error de sesión", { description: "No se ha identificado el usuario responsable. Por favor inicie sesión nuevamente." });
      return;
    }

    if (!nuevaCompra.proveedorId || !nuevaCompra.metodoPago || !nuevaCompra.fechaFactura || nuevaCompra.productos.length === 0) {
      toast.error("Por favor completa todos los campos obligatorios y agrega al menos un producto");
      return;
    }

    // Validar que todos los productos tengan stockVentas + stockInsumos = cantidad
    const productosInvalidos = nuevaCompra.productos.filter(p => {
      const sumaStocks = p.stockVentas + p.stockInsumos;
      return sumaStocks !== p.cantidad;
    });

    if (productosInvalidos.length > 0) {
      const nombresInvalidos = productosInvalidos.map(p => p.nombre).join(', ');
      toast.error(
        "Error en distribución de stock",
        {
          description: `Los siguientes productos tienen una distribución de stock incorrecta (la suma de ventas e insumos debe igualar la cantidad total): ${nombresInvalidos}`
        }
      );
      return;
    }

    const subtotal = calcularSubtotal();
    const descuento = calcularDescuento(subtotal);

    const compraRequest: CreateCompraRequest = {
      proveedorId: Number(nuevaCompra.proveedorId),
      fecha: nuevaCompra.fechaRegistro || generateCurrentDate(),
      fechaFactura: nuevaCompra.fechaFactura,
      metodoPago: nuevaCompra.metodoPago,
      // subtotal and total removed as per API requirement
      iva: 0,
      descuento: descuento,
      usuarioId: user?.id ? Number(user.id) : 0, // Usar ID del usuario autenticado
      detalles: nuevaCompra.productos.map(p => ({
        productoId: p.id,
        cantidad: p.cantidad,
        precioUnitario: p.precio,
        cantidadVentas: Number.isFinite(p.stockVentas) ? p.stockVentas : 0,
        cantidadInsumos: Number.isFinite(p.stockInsumos) ? p.stockInsumos : 0
      }))
    };

    try {
      await compraService.createCompra(compraRequest);

      // Incrementar stock para cada producto comprado
      for (const p of nuevaCompra.productos) {
        if (p.stockVentas > 0) {
          await productoService.adjustStock(p.id, p.stockVentas, 'increment', 'ventas');
        }
        if (p.stockInsumos > 0) {
          await productoService.adjustStock(p.id, p.stockInsumos, 'increment', 'insumos');
        }
      }

      created("Compra creada ✔️", `La compra ha sido registrada exitosamente.`);
      setIsDialogOpen(false);
      setNuevaCompra({
        ...inicialNuevaCompra,
        fechaRegistro: generateCurrentDate()
      });
      setTarjetaInputs({});
      setCantidadProducto(0);
      setCantidadProductoInput('');
      setPrecioUnitario(0);
      setPrecioUnitarioInput('');
      setStockVentas(0);
      setStockInsumos(0);
      setStockVentasInput('');
      setStockInsumosInput('');
      setPorcentajeDescuentoInput('');

      // Recargar compras y productos para reflejar los cambios de stock
      await Promise.all([
        loadCompras().catch(() => { }),
        productoService.getProductos()
          .then(data => setProductos(data as any))
          .catch(() => setProductos([]))
      ]);
    } catch (error) {
      toast.error("Error al crear compra", { description: "Hubo un problema al guardar la compra o actualizar el stock." });
      console.error(error);
    }
  }, [user, nuevaCompra, inicialNuevaCompra, generateCurrentDate, loadCompras, created]);
  const handleAnularCompra = (compraId: number) => {
    const compra = compras.find(c => c.id === compraId);
    if (!compra) return;

    confirmDeleteAction(
      String(compraId),
      async () => {
        try {
          // Anular la compra
          await compraService.anularCompra(compraId);
          toast.success("Compra anulada", { description: `La compra ${compra.numeroCompra} ha sido anulada.` });

          // Obtener los detalles de la compra para revertir el stock
          const detallesCompra = await compraService.getDetallesPorCompra(compraId);

          // Revertir el stock de cada producto
          for (const detalle of detallesCompra) {
            await productoService.revertirStockProducto(
              detalle.productoId,
              detalle.cantidadVentas ?? 0,
              detalle.cantidadInsumos ?? 0
            );
          }

          // Recargar compras y productos para reflejar los cambios
          await Promise.all([
            loadCompras().catch(() => { }),
            productoService.getProductos()
              .then(data => setProductos(data as any))
              .catch(() => setProductos([]))
          ]);
        } catch (error: any) {
          const errorMsg = error.message || "";
          if (errorMsg.includes("ya está anulada") || errorMsg.includes("ya esta anulada")) {
            toast.info("Información", { description: "Esta compra ya figuraba como anulada en el sistema." });
            // Aun así recargamos para sincronizar UI
            await loadCompras().catch(() => { });
            return;
          }
          toast.error("Error al anular", { description: "No se pudo anular la compra o revertir el stock." });
          console.error("Error al anular compra o revertir stock:", error);
        }
      },
      {
        confirmTitle: "Confirmar Anulación",
        confirmMessage: `¿Estás seguro de que deseas anular la compra?`,
        successTitle: "Compra anulada ✔️",
        successMessage: `La compra ha sido anulada exitosamente.`,
        requireInput: false
      }
    );
  };

  const generatePurchaseReport = async (compra: Compra) => {
    let productosDetalle = compra.detalles || [];

    if (productosDetalle.length === 0) {
      try {
        const toastId = toast.loading("Obteniendo detalles para el reporte...");
        productosDetalle = await compraService.getDetallesPorCompra(compra.id);
        toast.dismiss(toastId);
      } catch (error) {
        console.error(error);
        toast.error("No se pudieron cargar los productos para el reporte.");
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Compra - ${compra.numeroCompra}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #d8b081; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { color: #d8b081; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .report-title { font-size: 18px; color: #666; }
          .info-section { margin: 20px 0; }
          .section-title { background-color: #f5f5f5; padding: 10px; font-weight: bold; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
          .info-item { border-bottom: 1px solid #eee; padding: 8px 0; }
          .info-label { font-weight: bold; color: #666; }
          .info-value { color: #333; margin-top: 5px; }
          .products-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .products-table th, .products-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .products-table th { background-color: #f8f9fa; font-weight: bold; }
          .totals-section { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .total-final { font-size: 18px; font-weight: bold; color: #d8b081; border-top: 2px solid #d8b081; padding-top: 10px; margin-top: 15px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">BARBERÍA ELEGANTE</div>
          <div class="report-title">Reporte de Compra</div>
          <div>Fecha de generación: ${formatDate(new Date())}</div>
        </div>

        <div class="info-section">
          <div class="section-title">Información General</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">ID de Compra:</div>
              <div class="info-value">${(compra.numeroCompra || '').replace(/^(FC|CPR)-?/i, '')}</div>
            </div>
             <div class="info-item">
              <div class="info-label">N factura:</div>
              <div class="info-value">${(compra.numeroFactura || 'N/A').replace(/^(FC|CPR)-?/i, '')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Estado:</div>
              <div class="info-value">${compra.estado}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Proveedor:</div>
              <div class="info-value">${compra.proveedorNombre}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Responsable:</div>
              <div class="info-value">${compra.responsableNombre}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fecha de Registro:</div>
              <div class="info-value">${formatDate(compra.fecha)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fecha de Factura:</div>
              <div class="info-value">${compra.fechaFactura ? formatDate(compra.fechaFactura) : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Método de Pago:</div>
              <div class="info-value">${compra.metodoPago}</div>
            </div>
          </div>
        </div>

        ${productosDetalle.length > 0 ? `
        <div class="info-section">
          <div class="section-title">Productos</div>
          <table class="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productosDetalle.map((producto) => `
                <tr>
                  <td>${producto.productoNombre}</td>
                  <td>
                    ${producto.cantidad}
                    <br>
                    <small style="color: #666;">(🛒: ${producto.cantidadVentas} | 📦: ${producto.cantidadInsumos})</small>
                  </td>
                  <td>${formatCurrency(producto.precioUnitario)}</td>
                  <td>${formatCurrency(producto.subtotal || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="totals-section">
          <div class="section-title">Resumen Financiero</div>
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(compra.subtotal)}</span>
          </div>
          <div class="total-row">
            <span>IVA:</span>
            <span>${formatCurrency(compra.iva)}</span>
          </div>
          <div class="total-row">
            <span>Descuento:</span>
            <span>-${formatCurrency(compra.descuento)}</span>
          </div>
          <div class="total-row total-final">
            <span>TOTAL:</span>
            <span>${formatCurrency(compra.total)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Este es un documento generado automáticamente por el sistema de gestión de barbería.</p>
          <p>Reporte generado el ${formatDate(new Date())} a las ${new Date().toLocaleTimeString('es-CO')}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Compra_${compra.numeroCompra || compra.id}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Reporte HTML generado exitosamente");
  };

  return (
    <>
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Gestión de Compras</h1>
            <p className="text-sm text-gray-lightest mt-1">Control y seguimiento de compras a proveedores</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        <div style={{ display: 'none' }} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Stats removed/hidden */}
        </div>

        <div className="elegante-card">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-dark">
            <div className="flex flex-wrap items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    className="elegante-button-primary gap-2 flex items-center"
                    onClick={() => {
                      setShowCompraFormErrors(false);
                      setShowAddCompraProductoErrors(false);
                      setNuevaCompra({
                        ...inicialNuevaCompra,
                        fechaRegistro: generateCurrentDate()
                      });
                      setTarjetaInputs({});
                      setCantidadProducto(0);
                      setCantidadProductoInput('');
                      setPrecioUnitario(0);
                      setPrecioUnitarioInput('');
                      setStockVentas(0);
                      setStockInsumos(0);
                      setStockVentasInput('');
                      setStockInsumosInput('');
                      setPorcentajeDescuentoInput('');
                      setProviderSearchTerm('');
                      setShowProviderResults(false);
                      setProductSearchTerm('');
                      setShowProductResults(false);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Nueva Compra
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white-primary flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-orange-primary" />
                      Registrar Nueva Compra
                    </DialogTitle>
                    <DialogDescription className="text-gray-lightest">
                      Completa la información de la compra al proveedor
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Hash className="w-4 h-4 text-orange-primary" />
                          Número de Compra (Automático)
                        </Label>
                        <Input
                          value="###"
                          disabled
                          className="elegante-input bg-gray-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-primary" />
                          Fecha de Registro
                        </Label>
                        <Input
                          value={formatDate(nuevaCompra.fechaRegistro || new Date())}
                          disabled
                          readOnly
                          className="elegante-input bg-gray-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-primary" />
                          Fecha de Factura *
                        </Label>
                        <Input
                          type="date"
                          value={nuevaCompra.fechaFactura}
                          onChange={(e) => setNuevaCompra({ ...nuevaCompra, fechaFactura: e.target.value })}
                          className={`elegante-input ${showCompraFormErrors && !nuevaCompra.fechaFactura ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                        />
                        {showCompraFormErrors && !nuevaCompra.fechaFactura && (
                          <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-orange-primary" />
                          Metodo de Pago *
                        </Label>
                        <select
                          value={nuevaCompra.metodoPago}
                          onChange={(e) => setNuevaCompra({ ...nuevaCompra, metodoPago: e.target.value })}
                          className={`elegante-input w-full ${showCompraFormErrors && !nuevaCompra.metodoPago ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                        >
                          <option value="">Seleccionar metodo...</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Transferencia">Transferencia</option>
                        </select>
                        {showCompraFormErrors && !nuevaCompra.metodoPago && (
                          <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Building className="w-4 h-4 text-orange-primary" />
                          Proveedor *
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                          <Input
                            placeholder="Escribe para buscar proveedor por nombre, NIT o correo..."
                            value={providerSearchTerm}
                            onChange={(e) => {
                              setProviderSearchTerm(e.target.value);
                              setShowProviderResults(true);
                            }}
                            onFocus={() => setShowProviderResults(true)}
                            className={`elegante-input pl-11 w-full ${showCompraFormErrors && !nuevaCompra.proveedorId ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                          />
                          {showProviderResults && providerSearchTerm.trim() !== '' && (
                            <div className="absolute z-50 w-full mt-2 bg-gray-darkest border border-gray-dark rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar">
                              {(() => {
                                const query = normalizeSearchText(providerSearchTerm);
                                const filtered = proveedores.filter(p => {
                                  const searchable = normalizeSearchText([
                                    p.id,
                                    p.nombre,
                                    p.nit,
                                    p.correo
                                  ].join(' '));
                                  return searchable.includes(query);
                                }).slice(0, 50);
                                if (filtered.length === 0) {
                                  return (
                                    <div className="p-4 text-center text-gray-lightest italic">
                                      No se encontraron proveedores que coincidan.
                                    </div>
                                  );
                                }
                                return filtered.map(p => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      setNuevaCompra({ ...nuevaCompra, proveedorId: Number(p.id) });
                                      setProviderSearchTerm(`${p.nombre}${p.nit ? ` — ${p.nit}` : ''}`);
                                      setShowProviderResults(false);
                                    }}
                                    className="p-3 border-b border-gray-dark hover:bg-gray-dark transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4 text-orange-primary" />
                                        <span className="text-white-primary font-medium">{p.nombre}</span>
                                      </div>
                                      <span className="text-xs text-gray-lightest">{p.nit || 'NIT no disponible'}</span>
                                    </div>
                                    <div className="text-xs text-gray-lightest mt-1">{p.correo || 'Sin correo'}</div>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                        {showCompraFormErrors && !nuevaCompra.proveedorId && (
                          <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-orange-primary" />
                          Porcentaje Descuento (%)
                        </Label>
                        <Input
                          type="number"
                          value={porcentajeDescuentoInput}
                          onChange={(e) => {
                            if (e.target.value.length <= 5) {
                              handlePorcentajeDescuentoInputChange(e.target.value);
                            }
                          }}
                          className="elegante-input no-spin"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <div className="flex justify-start mt-1">
                          <span className="text-xs text-gray-500 font-medium">
                            {porcentajeDescuentoInput.length}/5 caracteres
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white-primary">Agregar Productos</h3>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label className="text-white-primary flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-orange-primary" />
                            Producto *
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                            <Input
                              placeholder="Escribe para buscar producto por nombre o categoría..."
                              value={productSearchTerm}
                              onChange={(e) => {
                                setProductSearchTerm(e.target.value);
                                setShowProductResults(true);
                                if (showAddCompraProductoErrors) setShowAddCompraProductoErrors(false);
                              }}
                              onFocus={() => setShowProductResults(true)}
                              className={`elegante-input pl-11 w-full ${showProductoSelectorError ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                            />
                            {showProductResults && productSearchTerm.trim() !== '' && (
                              <div className="absolute z-50 w-full mt-2 bg-gray-darkest border border-gray-dark rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar">
                                {(() => {
                                  const query = normalizeSearchText(productSearchTerm);
                                  const filtered = productos.filter(prod => {
                                    const searchable = normalizeSearchText([
                                      prod.id,
                                      prod.nombre,
                                      prod.categoria
                                    ].join(' '));
                                    return searchable.includes(query);
                                  }).slice(0, 50);
                                  if (filtered.length === 0) {
                                    return (
                                      <div className="p-4 text-center text-gray-lightest italic">
                                        No se encontraron productos que coincidan.
                                      </div>
                                    );
                                  }
                                  return filtered.map(prod => (
                                    <div
                                      key={prod.id}
                                      onClick={() => {
                                        setProductoSeleccionado(String(prod.id));
                                        setProductSearchTerm(prod.nombre);
                                        setShowProductResults(false);
                                      }}
                                      className="p-3 border-b border-gray-dark hover:bg-gray-dark transition-colors cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-dark border border-gray-dark flex items-center justify-center">
                                          <ImageRenderer
                                            url={prod.imagen}
                                            alt={prod.nombre}
                                            className="w-full h-full border-0 bg-transparent"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-center">
                                            <span className="text-white-primary font-medium truncate">{prod.nombre}</span>
                                            <span className="text-xs text-orange-primary font-semibold">${formatCurrency(prod.precio)}</span>
                                          </div>
                                          <div className="text-xs text-gray-lightest truncate">{prod.categoria}</div>
                                        </div>
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            )}
                          </div>
                          {showProductoSelectorError && (
                            <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white-primary flex items-center gap-2">
                            <Hash className="w-4 h-4 text-orange-primary" />
                            Cantidad Total *
                          </Label>
                          <Input
                            type="number"
                            value={cantidadProductoInput}
                            onChange={(e) => {
                              if (e.target.value.length <= 10) {
                                handleCantidadProductoInputChange(e.target.value);
                              }
                            }}
                            className={`elegante-input no-spin ${showCantidadProductoError ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                            min="1"
                          />
                          <div className="flex justify-start mt-1">
                            <span className="text-xs text-gray-500 font-medium">
                              {cantidadProductoInput.length}/10 caracteres
                            </span>
                          </div>
                          {showCantidadProductoError && (
                            <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white-primary flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-orange-primary" />
                            Precio Unitario *
                          </Label>
                          <Input
                            type="number"
                            value={precioUnitarioInput}
                            onChange={(e) => {
                              if (e.target.value.length <= 15) {
                                handlePrecioUnitarioInputChange(e.target.value);
                              }
                            }}
                            className="elegante-input no-spin"
                            min="0"
                            step="100"
                          />
                          <div className="flex justify-start mt-1">
                            <span className="text-xs text-gray-500 font-medium">
                              {precioUnitarioInput.length}/15 caracteres
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-orange-primary/10 border border-orange-primary/30 rounded-lg space-y-4">
                        <div className="flex items-center gap-2 text-orange-primary text-sm font-medium">
                          <Boxes className="w-4 h-4" />
                          <span>Distribución de Stock (debe sumar {cantidadProducto})</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Boxes className="w-4 h-4 text-orange-primary" />
                              Stock para Ventas *
                            </Label>
                            <Input
                              type="number"
                              value={stockVentasInput}
                              onChange={(e) => {
                                if (e.target.value.length <= 10) {
                                  handleStockVentasInputChange(e.target.value);
                                }
                              }}
                              className={`elegante-input no-spin ${(showStockVentasError || showDistribucionError) ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                              min="0"
                              max={cantidadProducto}
                            />
                            <div className="flex justify-start mt-1">
                              <span className="text-xs text-gray-500 font-medium">
                                {stockVentasInput.length}/10 caracteres
                              </span>
                            </div>
                            {showStockVentasError && (
                              <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Boxes className="w-4 h-4 text-orange-primary" />
                              Stock para Entregas *
                            </Label>
                            <Input
                              type="number"
                              value={stockInsumosInput}
                              onChange={(e) => {
                                if (e.target.value.length <= 10) {
                                  handleStockInsumosInputChange(e.target.value);
                                }
                              }}
                              className={`elegante-input no-spin ${(showStockInsumosError || showDistribucionError) ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                              min="0"
                              max={cantidadProducto}
                            />
                            <div className="flex justify-start mt-1">
                              <span className="text-xs text-gray-500 font-medium">
                                {stockInsumosInput.length}/10 caracteres
                              </span>
                            </div>
                            {showStockInsumosError && (
                              <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white-primary">ㅤ</Label>
                            <button
                              onClick={agregarProducto}
                              className="elegante-button-primary w-full"
                            >
                              Agregar Producto
                            </button>
                          </div>
                        </div>
                        {showDistribucionError && (
                          <p className="text-red-400 text-sm">
                            ⚠️ La suma ({stockVentas + stockInsumos}) debe ser igual a la cantidad total ({cantidadProducto})
                          </p>
                        )}
                      </div>
                      {(showCompraFormErrors || showAddCompraProductoErrors) && noProductosAgregados && (
                        <p className="text-xs text-red-400">Debes agregar al menos un producto.</p>
                      )}

                      {nuevaCompra.productos && nuevaCompra.productos.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-medium text-white-primary">Productos Agregados:</h4>


                          </div>
                          <div className="space-y-2 max-h-52 overflow-y-auto">
                            {nuevaCompra.productos.map((producto, index) => (
                              <div key={index} className="bg-gray-darker rounded-lg px-3 py-2.5 border-l-2 border-orange-primary/20">
                                <div className="flex items-center gap-4 flex-nowrap min-w-0">
                                  {/* Espacio a la izquierda para desplazar la imagen a la derecha */}
                                  <div className="shrink-0 w-6" aria-hidden />
                                  {/* Imagen del producto */}
                                  <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-dark border border-gray-dark flex items-center justify-center">
                                    <ImageRenderer
                                      url={producto.imagen}
                                      alt={producto.nombre}
                                      className="w-full h-full border-0 bg-transparent"
                                    />
                                  </div>
                                  {/* Nombre del producto — centrado en la tarjeta */}
                                  <div className="min-w-0 flex-1 shrink flex items-center justify-center">
                                    <span className="text-white-primary font-semibold text-base truncate block text-center w-full" title={producto.nombre}>
                                      {producto.nombre}
                                    </span>
                                  </div>

                                  {/* Total — label arriba, input abajo */}
                                  <div className="flex flex-col gap-0.5 shrink-0">
                                    <label className="text-[11px] text-gray-400 font-normal">Total</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={getTarjetaInput(producto, 'cantidad')}

                                      onChange={(e) => actualizarTarjetaInput(producto.id, 'cantidad', e.target.value)}
                                      className="w-12 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5"
                                    />
                                  </div>

                                  {/* Ventas — label arriba, input abajo */}
                                  <div className="flex flex-col gap-0.5 shrink-0">
                                    <label className="text-[11px] text-gray-400 font-normal">Ventas</label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={getTarjetaInput(producto, 'stockVentas')}

                                      onChange={(e) => actualizarTarjetaInput(producto.id, 'stockVentas', e.target.value)}
                                      className="w-12 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5 border-green-500/20"
                                    />
                                  </div>

                                  {/* Insumos — label arriba, input abajo */}
                                  <div className="flex flex-col gap-0.5 shrink-0">
                                    <label className="text-[11px] text-gray-400 font-normal">Insumos</label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={getTarjetaInput(producto, 'stockInsumos')}

                                      onChange={(e) => actualizarTarjetaInput(producto.id, 'stockInsumos', e.target.value)}
                                      className="w-12 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5 border-blue-500/20"
                                    />
                                  </div>

                                  {/* Precio unitario — label arriba, input abajo */}
                                  <div className="flex flex-col gap-0.5 shrink-0">
                                    <label className="text-[11px] text-gray-400 font-normal">Precio unit.</label>
                                    <Input
                                      type="number"
                                      min={0}
                                      step={100}
                                      value={getTarjetaInput(producto, 'precio')}

                                      onChange={(e) => actualizarTarjetaInput(producto.id, 'precio', e.target.value)}
                                      className="w-20 h-7 text-xs text-right tabular-nums elegante-input no-spin py-0 px-1.5"
                                    />
                                  </div>

                                  {/* Subtotal — label arriba, valor abajo */}
                                  <div className="flex flex-col gap-0.5 shrink-0 justify-center">
                                    <label className="text-[11px] text-gray-400 font-normal">Subt.</label>
                                    <span className="text-orange-primary font-semibold text-xs tabular-nums leading-7">
                                      ${formatCurrency(producto.precio * producto.cantidad)}
                                    </span>
                                  </div>

                                  {producto.stockVentas + producto.stockInsumos !== producto.cantidad && (
                                    <span className="shrink-0 text-red-400 text-xs" title="Ventas + Insumos = Total">⚠️</span>
                                  )}

                                  <button
                                    onClick={() => eliminarProducto(producto.id)}
                                    className="shrink-0 p-2 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
                                    title="Eliminar producto"
                                    type="button"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {nuevaCompra.productos && nuevaCompra.productos.length > 0 && (
                        <div className="bg-gray-darker p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-gray-lightest">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(calcularSubtotal())}</span>
                          </div>
                          {nuevaCompra.porcentajeDescuento > 0 && (
                            <div className="flex justify-between text-gray-lightest">
                              <span>Descuento ({nuevaCompra.porcentajeDescuento}%):</span>
                              <span>-${formatCurrency(calcularDescuento(calcularSubtotal()))}</span>
                            </div>
                          )}
                          <hr className="border-gray-medium" />
                          <div className="flex justify-between text-white-primary font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-orange-primary">${formatCurrency(calcularTotal())}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-dark">
                      <button
                        onClick={() => {
                          setShowCompraFormErrors(false);
                          setShowAddCompraProductoErrors(false);
                          setIsDialogOpen(false);
                          setNuevaCompra(inicialNuevaCompra);
                          setTarjetaInputs({});
                          setCantidadProducto(0);
                          setCantidadProductoInput('');
                          setPrecioUnitario(0);
                          setPrecioUnitarioInput('');
                          setStockVentas(0);
                          setStockInsumos(0);
                          setStockVentasInput('');
                          setStockInsumosInput('');
                          setPorcentajeDescuentoInput('');
                          setProviderSearchTerm('');
                          setShowProviderResults(false);
                          setProductSearchTerm('');
                          setShowProductResults(false);
                        }}
                        className="elegante-button-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCreateCompra}
                        className="elegante-button-primary"
                      >
                        Crear Compra
                      </button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por cualquier campo de la tabla..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="elegante-input pl-11 w-80"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-white-primary text-center py-8">Cargando compras...</div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-dark">
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">###</th>
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Documento/NIT Prov.</th>
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Proveedor</th>
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Total</th>
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Fecha de Registro</th>
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Estado</th>
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCompras.length > 0 ? displayedCompras.map((compra) => (
                      <CompraRow
                        key={compra.id}
                        compra={compra as any}
                        onViewDetails={handleViewDetails}
                        onGenerateReport={generatePurchaseReport}
                        onAnular={handleAnularCompra}
                        getEstadoColor={getEstadoColor}
                      />
                    )) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-gray-lighter">No se encontraron compras.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Paginación */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-dark">
                  <div className="text-sm text-gray-lightest">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-lightest" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-lightest" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[90vh] overflow-y-auto text-white-primary">
            {selectedCompra && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white-primary flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-orange-primary" />
                    Detalle de Compra
                  </DialogTitle>
                  <DialogDescription className="text-gray-lightest">
                    Información registrada de la compra (solo lectura)
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Hash className="w-4 h-4 text-orange-primary" />
                        Número de Compra
                      </Label>
                      <Input
                        value={(selectedCompra.numeroCompra || String(selectedCompra.id)).replace(/^(FC|CPR)-?/i, '')}
                        disabled
                        className="elegante-input bg-gray-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-primary" />
                        Fecha de Registro
                      </Label>
                      <Input
                        value={formatDate(selectedCompra.fecha)}
                        disabled
                        className="elegante-input bg-gray-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-primary" />
                        Fecha de Factura
                      </Label>
                      <Input
                        type="date"
                        value={selectedCompra.fechaFactura || ''}
                        disabled
                        className="elegante-input bg-gray-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-orange-primary" />
                        Método de Pago
                      </Label>
                      <Input
                        value={selectedCompra.metodoPago || 'N/A'}
                        disabled
                        className="elegante-input bg-gray-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Building className="w-4 h-4 text-orange-primary" />
                        Proveedor
                      </Label>
                      <Input
                        value={selectedCompra.proveedorNombre || 'N/A'}
                        disabled
                        className="elegante-input bg-gray-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-orange-primary" />
                        Porcentaje Descuento (%)
                      </Label>
                      <Input
                        type="number"
                        value={selectedCompra.subtotal > 0 ? ((selectedCompra.descuento / selectedCompra.subtotal) * 100).toFixed(2) : '0'}
                        disabled
                        className="elegante-input no-spin bg-gray-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-primary" />
                        Responsable
                      </Label>
                      <Input
                        value={selectedCompra.responsableNombre || 'N/A'}
                        disabled
                        className="elegante-input bg-gray-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        Estado
                      </Label>
                      <div className="h-10 flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(selectedCompra.estado)}`}>
                          {selectedCompra.estado === 'Anulada' ? 'Anulada' : 'Completada'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedCompra.detalles && selectedCompra.detalles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-white-primary">Productos Agregados:</h4>
                      </div>
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {selectedCompra.detalles.map((detalle, idx) => {
                          const stockVentasDetalle = detalle.cantidadVentas ?? 0;
                          const stockInsumosDetalle = detalle.cantidadInsumos ?? 0;
                          // Usar la imagen que viene directamente en el detalle para mayor confiabilidad
                          const imgUrl = detalle.productoImagen;

                          return (
                            <div key={idx} className="bg-gray-darker rounded-lg px-3 py-2.5 border-l-2 border-orange-primary/20">
                              <div className="flex items-center gap-4 flex-nowrap min-w-0">
                                <div className="shrink-0 w-6" aria-hidden />
                                <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-dark border border-gray-dark flex items-center justify-center">
                                  <ImageRenderer
                                    url={imgUrl}
                                    alt={detalle.productoNombre || 'Producto'}
                                    className="w-full h-full border-0 bg-transparent"
                                  />
                                </div>
                                <div className="min-w-0 flex-1 shrink flex items-center justify-center">
                                  <span className="text-white-primary font-semibold text-base truncate block text-center w-full" title={detalle.productoNombre || 'Producto'}>
                                    {detalle.productoNombre || 'Producto'}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <label className="text-[11px] text-gray-400 font-normal">Total</label>
                                  <Input type="number" value={detalle.cantidad} disabled className="w-12 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5 bg-gray-medium" />
                                </div>

                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <label className="text-[11px] text-gray-400 font-normal">Ventas</label>
                                  <Input type="number" value={stockVentasDetalle} disabled className="w-12 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5 border-green-500/20 bg-gray-medium" />
                                </div>

                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <label className="text-[11px] text-gray-400 font-normal">Insumos</label>
                                  <Input type="number" value={stockInsumosDetalle} disabled className="w-12 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5 border-blue-500/20 bg-gray-medium" />
                                </div>

                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <label className="text-[11px] text-gray-400 font-normal">Precio unit.</label>
                                  <Input type="number" value={detalle.precioUnitario} disabled className="w-20 h-7 text-xs text-right tabular-nums elegante-input no-spin py-0 px-1.5 bg-gray-medium" />
                                </div>

                                <div className="flex flex-col gap-0.5 shrink-0 justify-center">
                                  <label className="text-[11px] text-gray-400 font-normal">Subt.</label>
                                  <span className="text-orange-primary font-semibold text-xs tabular-nums leading-7">
                                    ${formatCurrency((detalle.cantidad || 0) * (detalle.precioUnitario || 0))}
                                  </span>
                                </div>

                                {(stockVentasDetalle + stockInsumosDetalle) !== detalle.cantidad && (
                                  <span className="shrink-0 text-red-400 text-xs" title="Ventas + Insumos = Total"></span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-darker p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-gray-lightest">
                      <span>Subtotal:</span>
                      <span>${formatCurrency(selectedCompra.subtotal)}</span>
                    </div>
                    {selectedCompra.descuento > 0 && (
                      <div className="flex justify-between text-gray-lightest">
                        <span>
                          Descuento ({selectedCompra.subtotal > 0 ? ((selectedCompra.descuento / selectedCompra.subtotal) * 100).toFixed(2) : '0'}%):
                        </span>
                        <span>-${formatCurrency(selectedCompra.descuento)}</span>
                      </div>
                    )}
                    <hr className="border-gray-medium" />
                    <div className="flex justify-between text-white-primary font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-orange-primary">${formatCurrency(selectedCompra.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-dark mt-4">
                  <button
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="elegante-button-secondary"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <DoubleConfirmationContainer />
      <AlertContainer />
    </>
  );
}
