import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import {
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileText,
  Download,
  User as UserIcon,
  IdCard as IdCard,
  Filter,
  Check,
  History,
  AlertCircle,
  Wallet,
  Ban,
  Receipt,
  ShoppingBag,
  DollarSign,
  TrendingDown,
  Calendar,
  X,
  ShieldCheck
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

import { toast } from "sonner";
import { useDoubleConfirmation } from "../ui/double-confirmation";
import { devolucionService } from "../../services/devolucionService";
import { ventaService } from "../../services/ventaService";
import { clientesService } from "../../services/clientesService";
import { productoService } from "../../services/productos";
import ImageRenderer from "../ui/ImageRenderer";
import { useAuth } from "../AuthContext"; // Added

// Función para formatear moneda colombiana
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-CO');
};

const normalizeSearchText = (value: unknown): string => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const resolveImageSrc = (rawValue: unknown): string => {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  return value;
};

// Motivos estandarizados - Solo para productos
const MOTIVOS_DEVOLUCION = [
  { value: 'producto_defectuoso', label: 'Producto Defectuoso' },
  { value: 'error_compra', label: 'Error en la Compra' },
  { value: 'producto_vencido', label: 'Producto Vencido' },
  { value: 'reaccion_alergica', label: 'Reacción Alérgica' },
  { value: 'no_conforme', label: 'No Conforme con Expectativas' },
  { value: 'cambio_opinion', label: 'Cambio de Opinión' },
  { value: 'otros', label: 'Otros' }
];

// Función para calcular días restantes de garantía
const getRemainingWarrantyDays = (fechaISO: string, garantiaMeses: number): number | null => {
  if (!fechaISO || !garantiaMeses) return null;
  try {
    const fechaVenta = new Date(fechaISO);
    if (isNaN(fechaVenta.getTime())) return null;

    const fechaExp = new Date(fechaVenta);
    fechaExp.setMonth(fechaExp.getMonth() + garantiaMeses);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const expCopy = new Date(fechaExp);
    expCopy.setHours(0, 0, 0, 0);

    const diffTime = expCopy.getTime() - hoy.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return null;
  }
};

// Tipos de datos actualizados
interface Devolucion {
  id: string;
  cliente: string;
  clienteId: string;
  clienteDocumento?: string;
  producto: string;
  productoImagen?: string;
  cantidad: number;
  precioUnitario: number;
  motivoCategoria: string;
  motivoDetalle: string;
  observaciones?: string;
  fecha: string;
  hora: string;
  monto: number;
  estado: 'Completada' | 'Anulada' | 'Pendiente' | 'Procesado';
  responsable: string;
  numeroVenta: string;
  saldoAFavor: number;
  apiId?: number;
  ventaId?: number;
  productoId?: number;
}

// Interface para manejar saldos de clientes
interface SaldoCliente {
  clienteId: string;
  cliente: string;
  saldoTotal: number;
}

// DevolucionesPage component


export function DevolucionesPage() {
  const { user } = useAuth();
  const { confirmCreateAction, confirmEditAction, DoubleConfirmationContainer } = useDoubleConfirmation();
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [ventasDisponibles, setVentasDisponibles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isHistorialDialogOpen, setIsHistorialDialogOpen] = useState(false);
  const [selectedDevolucion, setSelectedDevolucion] = useState<Devolucion | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [isPdfPopoverOpen, setIsPdfPopoverOpen] = useState(false);
  const [showDevolucionFormErrors, setShowDevolucionFormErrors] = useState(false);
  const [devolucionValidationAttempt, setDevolucionValidationAttempt] = useState(0);

  // Estados para búsqueda de ventas en el formulario de nueva devolución
  const [ventaSearchTerm, setVentaSearchTerm] = useState("");
  const [showVentaResults, setShowVentaResults] = useState(false);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [devs, sales, clientes, productos] = await Promise.all([
        devolucionService.getDevoluciones(),
        ventaService.getVentas(),
        clientesService.getClientes(),
        productoService.getProductos().catch(() => [])
      ]);

      const imagenesProductoMap = new Map<number, string>();
      (productos || []).forEach((producto: any) => {
        const id = Number(producto?.id || 0);
        const imagen = String(producto?.imagen || producto?.imagenProduc || producto?.imagenUrl || '');
        if (id > 0 && imagen.trim()) {
          imagenesProductoMap.set(id, imagen);
        }
      });
      setImagenesProductosCatalogo(Object.fromEntries(imagenesProductoMap.entries()));

      // Crear mapa de clienteId -> info de cliente para búsqueda rápida
      const clientesMapa = new Map<number, { documento: string; tipoDocumento?: string; nombreCompleto?: string }>();
      clientes.forEach(cliente => {
        if (cliente.id) {
          const documentoStr = cliente.documento || '';
          const partesDocumento = documentoStr.split(' ');
          const tipoDocumento = partesDocumento.length > 1 ? partesDocumento[0] : 'CC';
          const numeroDocumento = partesDocumento.length > 1 ? partesDocumento.slice(1).join(' ') : documentoStr;
          const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();

          clientesMapa.set(cliente.id, {
            documento: numeroDocumento,
            tipoDocumento: tipoDocumento,
            nombreCompleto
          });
        }
      });

      // Formatear devoluciones de la API al formato de la interfaz local si es necesario
      // Pero por ahora miremos si coinciden lo suficiente
      const formattedDevs: Devolucion[] = devs.map(d => {
        const monto = Number(d.monto) || 0;
        const cantidad = Number(d.cantidad) || 1;
        const estadoRawStr = (d.estado || 'Completada').toString().toLowerCase().trim();
        const estadoRaw = estadoRawStr === 'activo' || estadoRawStr === 'completada' || estadoRawStr === 'completado'
          ? 'Completada'
          : estadoRawStr === 'anulada' || estadoRawStr === 'anulado'
            ? 'Anulada'
            : estadoRawStr === 'pendiente'
              ? 'Pendiente'
              : estadoRawStr === 'procesado'
                ? 'Procesado'
                : 'Completada';

        // Obtener documento del cliente desde el mapa o desde la respuesta de la API
        const clienteIdNum = d.clienteId ? Number(d.clienteId) : null;
        let clienteDocumento = d.clienteDocumento || '';
        let tipoDocumento = 'CC';
        let clienteNombreCompleto = (d.clienteNombre || '').trim();

        if (!clienteDocumento && clienteIdNum && clientesMapa.has(clienteIdNum)) {
          const clienteInfo = clientesMapa.get(clienteIdNum)!;
          clienteDocumento = clienteInfo.documento;
          tipoDocumento = clienteInfo.tipoDocumento || 'CC';
          if (clienteInfo.nombreCompleto) {
            clienteNombreCompleto = clienteInfo.nombreCompleto;
          }
        } else if (clienteDocumento) {
          // Si viene de la API, puede venir como "CC 123456789" o solo "123456789"
          const partes = clienteDocumento.split(' ');
          if (partes.length > 1 && partes[0] && partes[0].trim()) {
            tipoDocumento = partes[0].trim();
            clienteDocumento = partes.slice(1).join(' ');
          }
          if (clienteIdNum && clientesMapa.has(clienteIdNum)) {
            const clienteInfo = clientesMapa.get(clienteIdNum)!;
            if (!clienteNombreCompleto || clienteNombreCompleto.toLowerCase() === 'cliente') {
              clienteNombreCompleto = clienteInfo.nombreCompleto || clienteNombreCompleto;
            }
          }
        } else if (clienteIdNum && clientesMapa.has(clienteIdNum)) {
          const clienteInfo = clientesMapa.get(clienteIdNum)!;
          tipoDocumento = clienteInfo.tipoDocumento || 'CC';
          clienteDocumento = clienteInfo.documento || '';
          if (!clienteNombreCompleto || clienteNombreCompleto.toLowerCase() === 'cliente') {
            clienteNombreCompleto = clienteInfo.nombreCompleto || clienteNombreCompleto;
          }
        }

        return {
          id: String(d.id),
          cliente: clienteNombreCompleto || d.clienteNombre || 'Cliente',
          clienteId: String(d.clienteId || ''),
          clienteDocumento: clienteDocumento ? `${tipoDocumento} ${clienteDocumento}` : '',
          producto: d.productoNombre || 'Producto',
          productoImagen: String(
            (d as any).productoImagen ||
            (d as any).imagenProducto ||
            imagenesProductoMap.get(Number(d.productoId || 0)) ||
            ''
          ),
          cantidad: cantidad,
          precioUnitario: monto / (cantidad || 1),
          motivoCategoria: d.motivo,
          motivoDetalle: getMotivoLabel(d.motivo),
          observaciones: d.observaciones,
          fecha: d.fecha ? new Date(d.fecha).toLocaleDateString('es-CO') : '',
          hora: d.fecha ? new Date(d.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
          monto: monto,
          estado: estadoRaw as any,
          responsable: d.responsableNombre || 'Responsable',
          numeroVenta: String(d.ventaId),
          saldoAFavor: d.saldoAFavor || 0,
          apiId: d.id,
          ventaId: d.ventaId,
          productoId: d.productoId
        };
      });

      setDevoluciones(formattedDevs);

      // Formatear ventas para el selector
      const formattedSales = sales.map(s => {
        const clienteIdNum = Number(s.clienteId || 0);
        const clienteInfo = clienteIdNum > 0 ? clientesMapa.get(clienteIdNum) : undefined;

        // Asegurar que cliente sea siempre una cadena y enriquecer históricos
        let clienteNombre = '';
        if (typeof s.cliente === 'string') {
          clienteNombre = s.cliente;
        } else if (s.cliente && typeof s.cliente === 'object') {
          // Si cliente es un objeto, extraer el nombre
          const clienteObj = s.cliente as any;
          clienteNombre = clienteObj.nombre || clienteObj.Nombre || '';
          if (clienteObj.apellido || clienteObj.Apellido) {
            clienteNombre = `${clienteNombre} ${clienteObj.apellido || clienteObj.Apellido || ''}`.trim();
          }
          if (!clienteNombre) {
            clienteNombre = 'Cliente';
          }
        } else {
          clienteNombre = 'Cliente';
        }

        const nombreNormalizado = String(clienteNombre || '').trim().toLowerCase();
        const nombreGenerico = !nombreNormalizado || nombreNormalizado === 'cliente' || /^\d+$/.test(nombreNormalizado);
        if (nombreGenerico && clienteInfo?.nombreCompleto) {
          clienteNombre = clienteInfo.nombreCompleto;
        }

        const clienteDocumento = String(
          s.clienteDocumento ||
          (clienteInfo?.documento ? `${clienteInfo?.tipoDocumento || 'CC'} ${clienteInfo.documento}` : '')
        );

        const venta = {
          id: s.id,
          numeroVenta: String(s.numeroVenta || s.id),
          cliente: clienteNombre,
          clienteDocumento,
          clienteId: s.clienteId,
          fecha: s.fecha ? new Date(s.fecha).toLocaleDateString('es-CO') : '',
          fechaISO: s.fecha || '',
          garantiaMeses: Number(s.garantiaMeses || 1),
          total: s.total,
          estado: s.estado || 'Completada',
          productos: (s.productosDetalle || []).map((p: any) => ({
            id: Number(p.id || p.productoId || p.ProductoId || 0),
            nombre: p.nombre,
            precio: Number(p.precio || 0),
            cantidad: Number(p.cantidad || 0),
            imagen: String(
              p.imagen ||
              p.imagenProduc ||
              p.imagenUrl ||
              p.Imagen ||
              p.ImagenProduc ||
              p.ImagenUrl ||
              p.producto?.imagen ||
              p.producto?.imagenProduc ||
              p.producto?.imagenUrl ||
              imagenesProductoMap.get(Number(p.id || p.productoId || p.ProductoId || 0)) ||
              ''
            )
          }))
        };
        return venta;
      });

      // Evitar excluir ventas históricas por diferencias de texto en estado.
      // Solo se excluyen ventas anuladas/canceladas.
      const ventasParaDevolucion = formattedSales.filter(v => {
        const estado = normalizeEstadoVenta(v.estado);
        return estado !== 'anulada' && estado !== 'anulado' && estado !== 'cancelada' && estado !== 'cancelado';
      });
      setVentasDisponibles(ventasParaDevolucion);
    } catch (error) {
      toast.error("Error al cargar datos");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Estados para rango de fechas en reporte Excel
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Estado para nueva devolución
  const [nuevaDevolucion, setNuevaDevolucion] = useState({
    numeroVenta: '',
    ventaId: 0,
    clienteId: null as number | null,
    cliente: '',
    clienteDocumento: '',
    productoId: 0,
    producto: '',
    cantidad: 1,
    precioUnitario: 0,
    motivoCategoria: '',
    observaciones: '',
    monto: 0
  });

  const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<number | null>(null);
  const [cantidadesDevolucion, setCantidadesDevolucion] = useState<Record<number, string>>({});
  const [imagenesProductosCatalogo, setImagenesProductosCatalogo] = useState<Record<number, string>>({});
  const shakeClass = devolucionValidationAttempt % 2 === 0 ? 'input-required-shake-a' : 'input-required-shake-b';
  const showVentaError = showDevolucionFormErrors && !nuevaDevolucion.ventaId;
  const showProductoError = showDevolucionFormErrors && !productoSeleccionadoId;
  const showMotivoError = showDevolucionFormErrors && !nuevaDevolucion.motivoCategoria;
  const selectedProductoVenta = ventaSeleccionada?.productos?.find((p: any) => Number(p.id) === Number(productoSeleccionadoId));
  const selectedCantidadInput = productoSeleccionadoId ? (cantidadesDevolucion[productoSeleccionadoId] ?? '') : '';
  const maxCantidadSeleccionada = Number(selectedProductoVenta?.cantidad || 0);
  const showCantidadError = showDevolucionFormErrors && !!productoSeleccionadoId && (
    selectedCantidadInput.trim() === '' ||
    Number(selectedCantidadInput) <= 0 ||
    (maxCantidadSeleccionada > 0 && Number(selectedCantidadInput) > maxCantidadSeleccionada)
  );

  // Filtros y paginación - Actualizado para eliminar búsqueda por producto
  const filteredDevoluciones = devoluciones.filter(devolucion => {
    const query = normalizeSearchText(searchTerm);
    const searchableText = normalizeSearchText([
      devolucion.id,
      devolucion.clienteDocumento,
      devolucion.cliente,
      formatCurrency(devolucion.monto),
      devolucion.monto,
      formatCurrency(devolucion.saldoAFavor),
      devolucion.saldoAFavor,
      devolucion.fecha,
      devolucion.estado,
      devolucion.numeroVenta,
      devolucion.producto,
      devolucion.motivoDetalle,
      devolucion.responsable,
      devolucion.clienteId
    ].join(' '));
    const matchesSearch = query.length === 0 || searchableText.includes(query);
    const matchesEstado = filtroEstado === "Todos" || devolucion.estado === filtroEstado;
    return matchesSearch && matchesEstado;
  });

  const totalPages = Math.ceil(filteredDevoluciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedDevoluciones = filteredDevoluciones.slice(startIndex, startIndex + itemsPerPage);

  // Funciones auxiliares
  const getEstadoColor = (estado: string) => {
    const e = (estado || '').toLowerCase().trim();
    if (e === 'completada' || e === 'completado' || e === 'activo') return "bg-green-500/10 text-green-400 border border-green-500/20";
    if (e === 'anulada' || e === 'anulado') return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (e === 'pendiente') return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    if (e === 'procesado') return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    return "bg-gray-medium text-gray-lighter";
  };

  const getMotivoLabel = (motivoCategoria: string) => {
    const motivo = MOTIVOS_DEVOLUCION.find(m => m.value === motivoCategoria);
    return motivo ? motivo.label : motivoCategoria;
  };

  const normalizeEstadoVenta = (estado: string) => {
    return String(estado || '').toLowerCase().trim();
  };

  const getHistorialCliente = (clienteId: string) => {
    return devoluciones.filter(d => d.clienteId === clienteId).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // Función para calcular el saldo total acumulativo de un cliente
  const getSaldoTotalCliente = (clienteId: string): number => {
    return devoluciones
      .filter(d => d.clienteId === clienteId && d.estado === 'Completada')
      .reduce((total, d) => total + d.saldoAFavor, 0);
  };

  // Función para obtener todos los saldos por cliente
  const getSaldosClientes = (): SaldoCliente[] => {
    const clientesUnicos = [...new Set(devoluciones.map(d => d.clienteId))];
    return clientesUnicos.map(clienteId => {
      const cliente = devoluciones.find(d => d.clienteId === clienteId);
      return {
        clienteId,
        cliente: cliente?.cliente || '',
        saldoTotal: getSaldoTotalCliente(clienteId)
      };
    }).filter(s => s.saldoTotal > 0);
  };

  const handleVentaChange = async (ventaIdStr: string) => {
    const ventaId = Number(ventaIdStr);
    if (showDevolucionFormErrors) setShowDevolucionFormErrors(false);
    let venta = ventasDisponibles.find(v => v.id === ventaId);

    if (venta) {
      // Si la venta no tiene productos o servicios cargados, intentar obtener los detalles completos
      if (!venta.productos || venta.productos.length === 0) {
        try {
          const ventaCompleta = await ventaService.getVentaById(ventaId);
          if (ventaCompleta) {
            const productosActualizados = (ventaCompleta.productosDetalle || []).map((p: any) => {
              const productoId = Number(p.id || p.productoId || p.ProductoId || 0);
              const productoPrevio = (venta?.productos || []).find((item: any) => {
                const prevId = Number(item?.id || 0);
                if (productoId > 0 && prevId === productoId) return true;
                return String(item?.nombre || '').trim().toLowerCase() === String(p?.nombre || '').trim().toLowerCase();
              });

              return {
                id: productoId,
                nombre: p.nombre,
                precio: Number(p.precio || 0),
                cantidad: Number(p.cantidad || 0),
                imagen: String(
                  p.imagen ||
                  p.imagenProduc ||
                  p.imagenUrl ||
                  p.Imagen ||
                  p.ImagenProduc ||
                  p.ImagenUrl ||
                  p.producto?.imagen ||
                  p.producto?.imagenProduc ||
                  p.producto?.imagenUrl ||
                  imagenesProductosCatalogo[productoId] ||
                  productoPrevio?.imagen ||
                  ''
                )
              };
            });

            // Asegurar que cliente sea siempre una cadena
            const clienteNombreRaw = typeof ventaCompleta.cliente === 'string'
              ? ventaCompleta.cliente
              : '';
            const clienteNombre = clienteNombreRaw.trim() && clienteNombreRaw.trim().toLowerCase() !== 'cliente'
              ? clienteNombreRaw
              : (venta?.cliente || 'Cliente');
            const clienteDocumento = String(ventaCompleta.clienteDocumento || venta?.clienteDocumento || '');

            // Actualizar el objeto localmente
            venta = { ...venta, productos: productosActualizados, cliente: clienteNombre, clienteDocumento };

            // Actualizar en el estado global de la página para no repetir la carga
            setVentasDisponibles(prev => prev.map(v =>
              v.id === ventaId ? { ...v, productos: productosActualizados, cliente: clienteNombre, clienteDocumento } : v
            ));
          }
        } catch (error) {
          console.error("Error al cargar detalles completos de la venta:", error);
        }
      }

      setVentaSeleccionada(venta);
      const cantidadesIniciales: Record<number, string> = {};
      (venta?.productos || []).forEach((p: any) => {
        const id = Number(p.id);
        if (!Number.isNaN(id) && id > 0) {
          cantidadesIniciales[id] = '1';
        }
      });
      setCantidadesDevolucion(cantidadesIniciales);
      setProductoSeleccionadoId(null);
      setNuevaDevolucion(prev => ({
        ...prev,
        numeroVenta: venta!.numeroVenta,
        ventaId: venta!.id,
        clienteId: venta!.clienteId,
        cliente: venta!.cliente,
        clienteDocumento: venta!.clienteDocumento || '',
        producto: '',
        productoId: 0,
        cantidad: 1,
        precioUnitario: 0,
        monto: 0
      }));
    } else {
      setVentaSeleccionada(null);
      setProductoSeleccionadoId(null);
      setCantidadesDevolucion({});
      setNuevaDevolucion(prev => ({
        ...prev,
        numeroVenta: '',
        ventaId: 0,
        clienteId: null,
        cliente: '',
        clienteDocumento: '',
        producto: '',
        productoId: 0,
        cantidad: 1,
        precioUnitario: 0,
        monto: 0
      }));
    }
  };

  const handleToggleProductoSeleccion = (producto: any, checked: boolean) => {
    if (showDevolucionFormErrors) setShowDevolucionFormErrors(false);
    const productoId = Number(producto?.id || 0);
    if (!productoId || Number.isNaN(productoId)) return;

    if (!checked) {
      setProductoSeleccionadoId(null);
      setNuevaDevolucion(prev => ({
        ...prev,
        producto: '',
        productoId: 0,
        cantidad: 1,
        precioUnitario: 0,
        monto: 0
      }));
      return;
    }

    const maxCantidad = Math.max(1, Number(producto?.cantidad || 1));
    const rawCantidad = cantidadesDevolucion[productoId] ?? '1';
    const parsedCantidad = Number(rawCantidad);
    const cantidadValida = !Number.isNaN(parsedCantidad) && parsedCantidad > 0
      ? Math.min(maxCantidad, Math.floor(parsedCantidad))
      : 1;

    setCantidadesDevolucion(prev => ({
      ...prev,
      [productoId]: String(cantidadValida)
    }));
    setProductoSeleccionadoId(productoId);

    const precio = Number(producto?.precio || 0);
    setNuevaDevolucion(prev => ({
      ...prev,
      producto: String(producto?.nombre || 'Producto'),
      productoId,
      cantidad: cantidadValida,
      precioUnitario: precio,
      monto: precio * cantidadValida
    }));
  };

  const handleCantidadProductoSeleccionChange = (producto: any, valor: string) => {
    const productoId = Number(producto?.id || 0);
    if (!productoId || Number.isNaN(productoId)) return;
    if (showDevolucionFormErrors) setShowDevolucionFormErrors(false);

    setCantidadesDevolucion(prev => ({
      ...prev,
      [productoId]: valor
    }));

    if (productoSeleccionadoId !== productoId) return;

    const maxCantidad = Math.max(1, Number(producto?.cantidad || 1));
    if (valor.trim() === '') {
      setNuevaDevolucion(prev => ({
        ...prev,
        cantidad: 0,
        monto: 0
      }));
      return;
    }

    const parsedCantidad = Number(valor);
    if (Number.isNaN(parsedCantidad)) return;

    const cantidadValida = Math.min(maxCantidad, Math.max(1, Math.floor(parsedCantidad)));
    const precio = Number(producto?.precio || 0);
    setNuevaDevolucion(prev => ({
      ...prev,
      cantidad: cantidadValida,
      precioUnitario: precio,
      monto: precio * cantidadValida
    }));
  };

  const handleCreateDevolucion = () => {
    setShowDevolucionFormErrors(true);


    setDevolucionValidationAttempt((prev) => prev + 1);

    // Validación de Garantía
    if (ventaSeleccionada) {
      const fechaVenta = new Date(ventaSeleccionada.fechaISO);
      const mesesGarantia = Number(ventaSeleccionada.garantiaMeses || 0);

      if (mesesGarantia > 0) {
        const fechaExpiracion = new Date(fechaVenta);
        fechaExpiracion.setMonth(fechaExpiracion.getMonth() + mesesGarantia);
        const hoy = new Date();

        if (hoy > fechaExpiracion) {
          const opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
          toast.error("Garantía Expirada", {
            description: `La garantía de esta venta expiró el ${fechaExpiracion.toLocaleDateString('es-CO', opciones)}. No es posible realizar devoluciones fuera de este periodo.`,
            duration: 6000
          });
          return;
        }
      } else if (mesesGarantia === 0) {
        toast.error("Sin Garantía", {
          description: "Esta venta fue registrada sin periodo de garantía.",
          duration: 4000
        });
        return;
      }
    }

    // ---------------------------------------------------------
    // VALIDACIÓN FUERTE (SOLUCIÓN PROFESIONAL)
    // ---------------------------------------------------------
    if (!nuevaDevolucion.ventaId || Number(nuevaDevolucion.ventaId) <= 0) {
      toast.error("Venta inválida: El ID de la venta debe ser mayor a 0");
      return;
    }

    if (!nuevaDevolucion.clienteId || Number(nuevaDevolucion.clienteId) <= 0) {
      toast.error("Cliente inválido: El ID del cliente debe ser mayor a 0");
      return;
    }

    if (!nuevaDevolucion.productoId || Number(nuevaDevolucion.productoId) <= 0) {
      toast.error("Producto inválido: El ID del producto debe ser mayor a 0");
      return;
    }

    const cantidadIngresada = Number(selectedCantidadInput);
    const cantidadInvalida = !!productoSeleccionadoId && (
      selectedCantidadInput.trim() === '' ||
      Number.isNaN(cantidadIngresada) ||
      cantidadIngresada <= 0 ||
      (maxCantidadSeleccionada > 0 && cantidadIngresada > maxCantidadSeleccionada)
    );
    if (cantidadInvalida) {
      toast.error("Cantidad inválida", { description: "Ingresa una cantidad válida para el producto seleccionado." });
      return;
    }

    if (!nuevaDevolucion.cantidad || Number(nuevaDevolucion.cantidad) <= 0) {
      toast.error("Cantidad inválida: Debe ser mayor a 0");
      return;
    }

    if (maxCantidadSeleccionada > 0 && Number(nuevaDevolucion.cantidad) > maxCantidadSeleccionada) {
      toast.error("Cantidad inválida", { description: "La cantidad a devolver no puede superar la cantidad vendida." });
      return;
    }

    if (!nuevaDevolucion.motivoCategoria) {
      toast.error("Por favor selecciona un motivo");
      return;
    }
    // ---------------------------------------------------------

    // Cerrar el modal temporalmente para evitar conflictos de z-index
    setIsDialogOpen(false);

    confirmCreateAction(
      `${nuevaDevolucion.producto} - ${nuevaDevolucion.cliente}`,
      async () => {
        try {
          // Validar sesión de usuario
          const stringUserId = user?.id ? String(user.id) : null;
          const currentUserId = stringUserId ? parseInt(stringUserId) : 0;

          if (!currentUserId || isNaN(currentUserId) || currentUserId <= 0) {
            toast.error("Error de sesión", { description: "No se ha identificado el usuario responsable. Por favor inicie sesión nuevamente." });
            return;
          }

          const payload = {
            ventaId: Number(nuevaDevolucion.ventaId),
            productoId: Number(nuevaDevolucion.productoId),
            clienteId: Number(nuevaDevolucion.clienteId),
            cantidad: Number(nuevaDevolucion.cantidad),
            motivoCategoria: nuevaDevolucion.motivoCategoria,
            motivoDetalle: getMotivoLabel(nuevaDevolucion.motivoCategoria),
            montoDevuelto: Number(nuevaDevolucion.monto),
            saldoAFavor: Number(nuevaDevolucion.monto),
            usuarioId: currentUserId,
            observaciones: nuevaDevolucion.observaciones || ''
          };

          console.log("🚀 Payload real antes del service:", payload);

          // Verificar si hay algún valor sospechoso
          const hasInvalidIds = [payload.ventaId, payload.productoId, payload.clienteId, payload.usuarioId].some(id => isNaN(id) || id <= 0);
          if (hasInvalidIds) {
            console.error("❌ Se detectaron IDs inválidos en el payload:", payload);
            toast.error("Error crítico: Se detectaron IDs inválidos (0 o NaN)");
            return;
          }

          await devolucionService.createDevolucion(payload);

          // Ajustar stock si el motivo no es 'Defectuoso' o 'Vencido'
          // Si el motivo es 'Defectuoso' o 'Vencido', el producto no regresa al stock vendible.
          // En su lugar, se registra como insumo defectuoso/vencido.
          if (payload.motivoCategoria === 'Defectuoso' || payload.motivoCategoria === 'Vencido') {
            await productoService.agregarStockInsumos(payload.productoId, payload.cantidad, payload.motivoCategoria);
          } else {
            // Para otros motivos (ej. "Cambio de producto", "Error de cliente"), el producto regresa al stock vendible.
            await productoService.adjustStock(payload.productoId, payload.cantidad, 'increment', 'ventas');
          }

          toast.success(`Devolución registrada exitosamente.`);
          loadData(); // Recargar todos los datos desde la API
          resetFormularios();
        } catch (error) {
          toast.error("Error al registrar la devolución");
          console.error(error);
        }
      },
      {
        confirmTitle: 'Confirmar Registro de Devolución',
        confirmMessage: `¿Estás seguro de que deseas registrar la devolución de ${nuevaDevolucion.cantidad} unidad(es) de "${nuevaDevolucion.producto}" para el cliente "${nuevaDevolucion.cliente}"?`,
        successTitle: '¡Devolución registrada exitosamente!',
        successMessage: `La devolución ha sido registrada correctamente en el sistema.`,
        requireInput: false
      }
    );
  };

  const resetFormularios = () => {
    setNuevaDevolucion({
      numeroVenta: '',
      ventaId: 0,
      clienteId: null,
      cliente: '',
      clienteDocumento: '',
      productoId: 0,
      producto: '',
      cantidad: 1,
      precioUnitario: 0,
      motivoCategoria: '',
      observaciones: '',
      monto: 0
    });

    setVentaSeleccionada(null);
    setProductoSeleccionadoId(null);
    setCantidadesDevolucion({});
    setVentaSearchTerm("");
    setShowVentaResults(false);
  };

  const handleToggleEstado = (devolucion: Devolucion) => {
    if (devolucion.estado !== 'Completada') {
      toast.info("La devolución anulada no puede reactivarse");
      return;
    }

    // Aseguramos que tenemos un ID válido antes de proceder
    const idParaActualizar = devolucion.apiId || Number(devolucion.id);

    if (!idParaActualizar || isNaN(idParaActualizar)) {
      toast.error("No se pudo identificar el ID de la devolución para actualizar");
      console.error("❌ Error: ID de devolución inválido:", { apiId: devolucion.apiId, id: devolucion.id });
      return;
    }

    const nuevoEstado = 'Anulada';
    const accion = 'anular';

    confirmEditAction(
      `${devolucion.producto} - ${devolucion.cliente}`,
      async () => {
        try {
          console.log(`🚀 Intentando ${accion} devolución con ID: ${idParaActualizar}, Nuevo estado: ${nuevoEstado}`);
          await devolucionService.updateDevolucionStatus(idParaActualizar, nuevoEstado);

          // Revertir el stock si tenemos el ID del producto
          if (devolucion.productoId) {
            console.log(`📦 Revirtiendo stock por anulación de devolución: Producto ${devolucion.productoId}, Cantidad ${devolucion.cantidad}`);
            const destinoReversion = (devolucion.motivoCategoria === 'Defectuoso' || devolucion.motivoCategoria === 'Vencido')
              ? 'insumos'
              : 'ventas';

            await productoService.adjustStock(
              devolucion.productoId,
              devolucion.cantidad,
              'decrement',
              destinoReversion
            );
          }

          toast.success(`Devolución ${nuevoEstado.toLowerCase()}ada exitosamente`);
          loadData();

        } catch (error: any) {
          console.error(`❌ Error al ${accion} devolución:`, error);
          toast.error(error.message || `Error al actualizar el estado`);
        }
      },
      {
        confirmTitle: `Confirmar Anulación de Devolución`,
        confirmMessage: `¿Estás seguro de que deseas anular la devolución del producto "${devolucion.producto}" para el cliente "${devolucion.cliente}"?`,
        successTitle: `¡Devolución anulada exitosamente!`,
        successMessage: `El estado ha sido actualizado a Anulada y el stock ha sido ajustado según corresponda.`,
        requireInput: false
      }
    );
  };



  // Función para generar reporte Excel real por rango de fechas
  const generateExcelReport = async (_periodo: 'custom', startDate?: string, endDate?: string) => {
    try {
      // Validar que las fechas estén presentes
      if (!startDate || !endDate) {
        toast.error('Por favor selecciona ambas fechas para generar el reporte');
        return;
      }

      setIsGeneratingReport(true);
      toast.info('Generando reporte Excel...', { duration: 1000 });

      const XLSX = await import('xlsx');
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validar que la fecha de inicio sea anterior a la de fin
      if (start > end) {
        toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
        setIsGeneratingReport(false);
        return;
      }

      // Filtrar devoluciones por rango de fechas
      const filteredData = devoluciones.filter(d => {
        const devDate = new Date(d.fecha.split('-').reverse().join('-'));
        return devDate >= start && devDate <= end;
      });

      // Si no hay datos en el rango, mostrar mensaje
      if (filteredData.length === 0) {
        toast.warning('No se encontraron devoluciones en el rango de fechas seleccionado');
        setIsGeneratingReport(false);
        return;
      }

      const periodoTexto = `${startDate}_a_${endDate}`;

      const totalRegistros = filteredData.length;
      const totalMonto = filteredData.reduce((sum, d) => sum + d.monto, 0);
      const totalSaldos = filteredData.filter(d => d.estado === 'Completada').reduce((sum, d) => sum + d.saldoAFavor, 0);

      // Preparar datos para Excel
      const excelData = filteredData.map(dev => ({
        'ID Devolución': dev.id,
        'Cliente': dev.cliente,
        'Producto': dev.producto,
        'Cantidad': dev.cantidad,
        'Precio Unitario': `${formatCurrency(dev.precioUnitario)}`,
        'Monto Total': `${formatCurrency(dev.monto)}`,
        'Motivo': dev.motivoDetalle,
        'Estado': dev.estado,
        'Fecha': dev.fecha,
        'Hora': dev.hora,
        'Responsable': dev.responsable,
        'No. Venta': dev.numeroVenta,
        'Saldo a Favor': `${formatCurrency(dev.saldoAFavor)}`,
        'Observaciones': dev.observaciones || 'N/A'
      }));

      // Agregar resumen al final
      excelData.push({
        'ID Devolución': '',
        'Cliente': '',
        'Producto': '',
        'Cantidad': 0,
        'Precio Unitario': '',
        'Monto Total': '',
        'Motivo': '',
        'Estado': 'Completada',
        'Fecha': '',
        'Hora': '',
        'Responsable': '',
        'No. Venta': '',
        'Saldo a Favor': '',
        'Observaciones': ''
      } as any);
      excelData.push({
        'ID Devolución': 'RESUMEN',
        'Cliente': '',
        'Producto': '',
        'Cantidad': 0,
        'Precio Unitario': '',
        'Monto Total': '',
        'Motivo': '',
        'Estado': 'Completada',
        'Fecha': '',
        'Hora': '',
        'Responsable': '',
        'No. Venta': '',
        'Saldo a Favor': '',
        'Observaciones': ''
      } as any);
      excelData.push({
        'ID Devolución': 'Total Registros:',
        'Cliente': totalRegistros.toString(),
        'Producto': '',
        'Cantidad': 0,
        'Precio Unitario': '',
        'Monto Total': '',
        'Motivo': '',
        'Estado': 'Completada',
        'Fecha': '',
        'Hora': '',
        'Responsable': '',
        'No. Venta': '',
        'Saldo a Favor': '',
        'Observaciones': ''
      } as any);
      excelData.push({
        'ID Devolución': 'Total Monto:',
        'Cliente': `${formatCurrency(totalMonto)}`,
        'Producto': '',
        'Cantidad': 0,
        'Precio Unitario': '',
        'Monto Total': '',
        'Motivo': '',
        'Estado': 'Completada',
        'Fecha': '',
        'Hora': '',
        'Responsable': '',
        'No. Venta': '',
        'Saldo a Favor': '',
        'Observaciones': ''
      } as any);
      excelData.push({
        'ID Devolución': 'Total Saldos:',
        'Cliente': `${formatCurrency(totalSaldos)}`,
        'Producto': '',
        'Cantidad': 0,
        'Precio Unitario': '',
        'Monto Total': '',
        'Motivo': '',
        'Estado': 'Completada',
        'Fecha': '',
        'Hora': '',
        'Responsable': '',
        'No. Venta': '',
        'Saldo a Favor': '',
        'Observaciones': ''
      } as any);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 15 }, // ID Devolución
        { wch: 20 }, // Cliente
        { wch: 25 }, // Producto
        { wch: 10 }, // Cantidad
        { wch: 15 }, // Precio Unitario
        { wch: 15 }, // Monto Total
        { wch: 25 }, // Motivo
        { wch: 10 }, // Estado
        { wch: 12 }, // Fecha
        { wch: 8 },  // Hora
        { wch: 20 }, // Responsable
        { wch: 12 }, // No. Venta
        { wch: 15 }, // Saldo a Favor
        { wch: 30 }  // Observaciones
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Devoluciones');

      // Generar nombre de archivo con fecha actual
      const fechaActual = new Date().toISOString().split('T')[0];
      const fileName = `Devoluciones_${periodoTexto}_${fechaActual}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Reporte Excel generado exitosamente`, {
        description: `Archivo: ${fileName} - ${totalRegistros} devoluciones exportadas`
      });

      setIsPdfPopoverOpen(false);
      setIsGeneratingReport(false);
    } catch (error) {
      // Error handling - could be replaced with proper logging service
      toast.error('Error al generar el reporte Excel');
      setIsGeneratingReport(false);
    }
  };

  // Función para generar PDF individual de devolución real
  const generateIndividualPdf = async (devolucion: Devolucion) => {
    try {
      const jsPDF = (await import('jspdf')).default;

      const doc = new jsPDF();

      // Configuración de fuentes y colores
      doc.setTextColor(40, 40, 40);

      // Header del documento
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPROBANTE DE DEVOLUCIÓN', 105, 25, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Barbería - Sistema de Gestión`, 105, 35, { align: 'center' });

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 45, 190, 45);

      // Información de la devolución
      let yPos = 60;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DE LA DEVOLUCIÓN', 20, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Datos en dos columnas
      const leftColumn = 20;
      const rightColumn = 110;

      doc.setFont('helvetica', 'bold');
      doc.text('ID Devolución:', leftColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(devolucion.id, leftColumn + 35, yPos);

      doc.setFont('helvetica', 'bold');
      doc.text('Estado:', rightColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(devolucion.estado, rightColumn + 20, yPos);
      yPos += 12;

      doc.setFont('helvetica', 'bold');
      doc.text('Cliente:', leftColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(devolucion.cliente, leftColumn + 25, yPos);

      doc.setFont('helvetica', 'bold');
      doc.text('Fecha:', rightColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(devolucion.fecha, rightColumn + 20, yPos);
      yPos += 12;

      doc.setFont('helvetica', 'bold');
      doc.text('No. Venta:', leftColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(devolucion.numeroVenta, leftColumn + 30, yPos);

      doc.setFont('helvetica', 'bold');
      doc.text('Hora:', rightColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(devolucion.hora, rightColumn + 20, yPos);
      yPos += 20;

      // Información del producto
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL PRODUCTO', 20, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Producto:', leftColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(devolucion.producto, leftColumn + 25, yPos);
      yPos += 12;

      doc.setFont('helvetica', 'bold');
      doc.text('Cantidad:', leftColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(devolucion.cantidad.toString(), leftColumn + 25, yPos);

      doc.setFont('helvetica', 'bold');
      doc.text('Precio Unitario:', rightColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${formatCurrency(devolucion.precioUnitario)}`, rightColumn + 35, yPos);
      yPos += 12;

      doc.setFont('helvetica', 'bold');
      doc.text('Monto Total:', leftColumn, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`${formatCurrency(devolucion.monto)}`, leftColumn + 30, yPos);
      yPos += 20;

      // Motivo y observaciones
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MOTIVO DE LA DEVOLUCIÓN', 20, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(devolucion.motivoDetalle, 20, yPos);
      yPos += 15;

      if (devolucion.observaciones) {
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', 20, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');

        // Dividir observaciones en líneas si es muy largo
        const splitObservaciones = doc.splitTextToSize(devolucion.observaciones, 170);
        doc.text(splitObservaciones, 20, yPos);
        yPos += splitObservaciones.length * 6;
      }

      yPos += 20;

      // Información del saldo
      if (devolucion.estado === 'Completada' && devolucion.saldoAFavor > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SALDO A FAVOR', 20, yPos);
        yPos += 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`El cliente ${devolucion.cliente} tiene un saldo a favor de:`, 20, yPos);
        yPos += 10;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${formatCurrency(devolucion.saldoAFavor)}`, 20, yPos);
        yPos += 20;
      }

      // Responsable
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Responsable: ${devolucion.responsable}`, 20, yPos);

      // Footer
      yPos = 270;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Este documento es un comprobante oficial de devolución.', 105, yPos, { align: 'center' });
      doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}`, 105, yPos + 5, { align: 'center' });

      // Guardar el PDF
      const fileName = `Devolucion_${devolucion.id}_${devolucion.cliente.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);

      toast.success(`PDF generado exitosamente`, {
        description: `Archivo: ${fileName} para ${devolucion.cliente}`
      });

    } catch (error) {
      // Error handling - could be replaced with proper logging service
      toast.error('Error al generar el PDF de la devolución');
    }
  };

  // Estadísticas
  const devolucionesHoy = devoluciones.filter(d => d.fecha === new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })).length;
  const totalMontoDevoluciones = devoluciones.reduce((sum, d) => sum + d.monto, 0);
  const devolucionesActivas = devoluciones.filter(d => d.estado === "Completada").length;
  const devolucionesAnuladas = devoluciones.filter(d => d.estado === "Anulada").length;
  const totalSaldosAFavor = devoluciones.filter(d => d.estado === "Completada").reduce((sum, d) => sum + d.saldoAFavor, 0);
  const clientesConSaldo = getSaldosClientes().length;

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Gestión de Devoluciones</h1>
            <p className="text-sm text-gray-lightest mt-1">Control y seguimiento de devoluciones de productos con saldo a favor acumulativo</p>
          </div>
          <div className="flex items-center space-x-4">
            <Popover open={isPdfPopoverOpen} onOpenChange={setIsPdfPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="elegante-button-primary gap-2 flex items-center hover:scale-105 transition-transform"
                  title="Generar reporte de devoluciones en Excel por rango de fechas"
                >
                  <Download className="w-4 h-4" />
                  Reporte Excel
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-darkest border-gray-dark">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white-primary mb-2">Generar Reporte de Devoluciones</h4>
                    <p className="text-sm text-gray-lightest">Selecciona el rango de fechas para el reporte en Excel</p>
                    <p className="text-xs text-orange-primary mt-1">✓ Sin límite de rango de fechas</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-white-primary text-sm mb-2 block">Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="elegante-input"
                      />
                    </div>
                    <div>
                      <Label className="text-white-primary text-sm mb-2 block">Fecha Fin</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="elegante-input"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (customStartDate && customEndDate) {
                          generateExcelReport('custom', customStartDate, customEndDate);
                        } else {
                          toast.error('Por favor selecciona ambas fechas');
                        }
                      }}
                      disabled={isGeneratingReport}
                      className="elegante-button-primary w-full p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className={`w-4 h-4 ${isGeneratingReport ? 'animate-bounce' : ''}`} />
                      {isGeneratingReport ? 'Generando...' : 'Generar Reporte'}
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        {/* Stats Cards */}
        <div style={{ display: 'none' }} className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="elegante-card text-center">
            <RotateCcw className="w-8 h-8 text-orange-primary mx-auto mb-2" />
            <h4 className="text-2xl font-bold text-white-primary mb-1">{devolucionesHoy}</h4>
            <p className="text-gray-lightest text-sm">Devoluciones Hoy</p>
          </div>
          <div className="elegante-card text-center">
            <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h4 className="text-2xl font-bold text-white-primary mb-1">${formatCurrency(totalMontoDevoluciones)}</h4>
            <p className="text-gray-lightest text-sm">Monto Total</p>
          </div>
          <div className="elegante-card text-center">
            <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h4 className="text-2xl font-bold text-white-primary mb-1">{devolucionesActivas}</h4>
            <p className="text-gray-lightest text-sm">Devoluciones Activas</p>
          </div>
          <div className="elegante-card text-center">
            <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h4 className="text-2xl font-bold text-white-primary mb-1">{devolucionesAnuladas}</h4>
            <p className="text-gray-lightest text-sm">Devoluciones Anuladas</p>
          </div>
          <div className="elegante-card text-center">
            <Wallet className="w-8 h-8 text-orange-secondary mx-auto mb-2" />
            <h4 className="text-2xl font-bold text-white-primary mb-1">${formatCurrency(totalSaldosAFavor)}</h4>
            <p className="text-gray-lightest text-sm">Saldos a Favor</p>
          </div>
        </div>

        {/* Sección Principal */}
        <div className="elegante-card">
          {/* Barra de Controles */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-dark">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  setShowDevolucionFormErrors(false);
                  setIsDialogOpen(true);
                }}
                className="elegante-button-primary gap-2 flex items-center"
              >
                <Plus className="w-4 h-4" />
                Nueva Devolución
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por cualquier campo de la tabla..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="elegante-input pl-11 w-80"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="elegante-button-secondary gap-2 flex items-center">
                    <Filter className="w-4 h-4" />
                    Filtrar: {filtroEstado}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-gray-darkest border-gray-dark">
                  <div className="space-y-2">
                    <Label className="text-white-primary">Estado</Label>
                    <div className="grid gap-2">
                      {['Todos', 'Completada', 'Anulada', 'Pendiente', 'Procesado'].map((estado) => (
                        <button
                          key={estado}
                          onClick={() => setFiltroEstado(estado)}
                          className={`text-left p-2 rounded text-sm transition-colors ${filtroEstado === estado
                            ? 'bg-orange-primary text-black-primary'
                            : 'hover:bg-gray-darker text-gray-lightest'
                            }`}
                        >
                          {estado}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {getSaldosClientes().length > 0 && (
                <button
                  onClick={() => setIsHistorialDialogOpen(true)}
                  className="elegante-button-secondary gap-2 flex items-center"
                >
                  <History className="w-4 h-4" />
                  Saldos a Favor ({clientesConSaldo})
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-lightest">
                Mostrando {displayedDevoluciones.length} de {filteredDevoluciones.length} devoluciones
              </div>
            </div>
          </div>

          {/* Tabla de Devoluciones - MODIFICADA PARA ELIMINAR COLUMNAS */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-dark">
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">ID</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Documento</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Cliente</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Monto Devolución</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Saldo a Favor</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Fecha de Registro</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Estado</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-lighter">
                      Cargando devoluciones...
                    </td>
                  </tr>
                ) : displayedDevoluciones.length > 0 ? (
                  displayedDevoluciones.map((devolucion) => (
                    <tr key={devolucion.id} className="border-b border-gray-dark hover:bg-gray-darker transition-colors">
                      <td className="py-4 px-4 text-center">
                        <span className="text-gray-lighter">{devolucion.id}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-gray-lighter">
                          {devolucion.clienteDocumento || devolucion.clienteId || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-gray-lighter">{devolucion.cliente || 'Cliente'}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-gray-lighter font-bold">${formatCurrency(devolucion.monto)}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-gray-lighter">${formatCurrency(devolucion.saldoAFavor)}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-lighter">{devolucion.fecha}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs ${getEstadoColor(devolucion.estado)}`}>
                          {devolucion.estado}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDevolucion(devolucion);
                              setIsDetailDialogOpen(true);
                            }}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-gray-lightest group-hover:text-orange-primary" />
                          </button>
                          <button
                            onClick={() => generateIndividualPdf(devolucion)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Generar PDF de devolución"
                          >
                            <FileText className="w-4 h-4 text-gray-lightest group-hover:text-orange-primary" />
                          </button>
                          <button
                            onClick={() => devolucion.estado === 'Completada' && handleToggleEstado(devolucion)}
                            disabled={devolucion.estado !== 'Completada'}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                            title={devolucion.estado === 'Completada' ? 'Anular devolución' : 'No se puede reactivar una devolución anulada'}
                          >
                            <Ban className="w-4 h-4 text-gray-lightest group-hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-lightest">
                      <div className="flex flex-col items-center gap-4">
                        <RotateCcw className="w-12 h-12 text-gray-medium" />
                        <div>
                          <p className="font-medium">No hay devoluciones registradas</p>
                          <p className="text-sm">Crea tu primera devolución para comenzar</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowDevolucionFormErrors(false);
                            setIsDialogOpen(true);
                          }}
                          className="elegante-button-primary gap-2 flex items-center"
                        >
                          <Plus className="w-4 h-4" />
                          Nueva Devolución
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
        </div>
      </main>

      {/* Modal de Ver Detalle - MODIFICADO PARA AGREGAR CANTIDAD */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white-primary">Detalle de Devolución </DialogTitle>

            <DialogDescription className="text-gray-lightest">
              Información completa de la devolución {selectedDevolucion?.id}

            </DialogDescription>

          </DialogHeader>

          {selectedDevolucion && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-end">

              </div>


              {/* Selección de Venta (Lectura) */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-orange-primary" />
                    Número de Venta
                  </Label>
                  <Input
                    value={selectedDevolucion.numeroVenta}
                    disabled
                    className="elegante-input bg-gray-dark cursor-not-allowed w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-orange-primary" />
                    Documento Cliente
                  </Label>
                  <Input
                    value={selectedDevolucion.clienteDocumento}
                    disabled
                    className="elegante-input bg-gray-dark cursor-not-allowed w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">

                    Estado
                  </Label>

                  <span className={`px-3 py-1 rounded-full items-center justify-center text-xs ${getEstadoColor(selectedDevolucion.estado)}`}>
                    {selectedDevolucion.estado}
                  </span>
                </div>
              </div>



              {/* Información del Cliente y Venta */}
              <div className="bg-gray-darker p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-light">
                      <UserIcon className="w-4 h-4 text-orange-primary" />
                      Cliente
                    </Label>
                    <p className="font-semibold text-white-primary">
                      {selectedDevolucion.cliente}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-light">Responsable</p>
                    <p className="font-semibold text-white-primary">
                      {selectedDevolucion.responsable}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-light">Fecha y Hora</p>
                    <p className="font-semibold text-white-primary">
                      {selectedDevolucion.fecha} - {selectedDevolucion.hora}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-light">Producto Devuelto</p>
                  <div className="bg-gray-darkest rounded-lg px-3 py-2.5 border-l-2 border-[#D9C3A4]/70">
                    <div className="flex items-center gap-4 flex-nowrap min-w-0">
                      <div className="shrink-0 w-7 h-7 rounded-md border flex items-center justify-center transition-colors border-[#D9C3A4] bg-[#D9C3A4]/20">
                        <input
                          type="checkbox"
                          checked={true}
                          readOnly
                          className="h-4 w-4 accent-[#D9C3A4] shrink-0 cursor-not-allowed"
                        />
                      </div>

                      <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-dark border border-gray-dark flex items-center justify-center">
                        <ImageRenderer
                          url={selectedDevolucion.productoImagen}
                          alt={selectedDevolucion.producto}
                          className="w-full h-full border-0 bg-transparent"
                        />
                      </div>

                      <div className="min-w-0 flex-1 shrink flex items-center justify-start">
                        <span className="text-white-primary font-semibold text-base truncate block w-full">
                          {selectedDevolucion.producto}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 shrink-0">
                        <label className="text-[11px] text-gray-400 font-normal">Cantidad</label>
                        <Input
                          type="number"
                          value={selectedDevolucion.cantidad}
                          disabled
                          className="w-16 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5 bg-gray-dark cursor-not-allowed"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5 shrink-0">
                        <label className="text-[11px] text-gray-400 font-normal">Precio Unit.</label>
                        <span className="text-white-primary font-semibold text-xs tabular-nums leading-7">
                          ${formatCurrency(selectedDevolucion.precioUnitario)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 shrink-0 justify-center">
                        <label className="text-[11px] text-gray-400 font-normal">Subt.</label>
                        <span className="text-orange-primary font-semibold text-xs tabular-nums leading-7">
                          ${formatCurrency(selectedDevolucion.monto)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-primary" />
                    Motivo de la Devolución
                  </Label>
                  <Input
                    value={selectedDevolucion.motivoDetalle}
                    disabled
                    className="elegante-input bg-gray-dark cursor-not-allowed w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-primary" />
                    Resumen Seleccionado
                  </Label>
                  <Input
                    type="text"
                    value={`${selectedDevolucion.producto} x${selectedDevolucion.cantidad}`}
                    disabled
                    className="elegante-input bg-gray-dark cursor-not-allowed w-full"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label className="text-white-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-primary" />
                  Observaciones
                </Label>
                <textarea
                  value={selectedDevolucion.observaciones || 'Sin observaciones adicionales.'}
                  disabled
                  rows={3}
                  className="elegante-input w-full resize-none bg-gray-dark cursor-not-allowed"
                />
                <div className="flex justify-start mt-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {(selectedDevolucion.observaciones || 'Sin observaciones adicionales.').length}/300 caracteres
                  </span>
                </div>
              </div>

              {/* Resumen de la Venta Asociada - Productos post-devolución */}
              {(() => {
                const ventaAsociada = ventasDisponibles.find(v => Number(v.id) === Number(selectedDevolucion.ventaId || selectedDevolucion.numeroVenta));
                if (!ventaAsociada || !ventaAsociada.productos || ventaAsociada.productos.length === 0) return null;

                const devolucionesDeEstaVenta = devoluciones.filter(d => {
                  const dVentaId = Number(d.ventaId || d.numeroVenta);
                  const estado = (d.estado || '').toLowerCase().trim();
                  return dVentaId === Number(ventaAsociada.id) && estado !== 'anulada' && estado !== 'anulado';
                });

                const devPorProductoId = new Map<number, number>();
                const devPorNombre = new Map<string, number>();
                devolucionesDeEstaVenta.forEach(dev => {
                  const pid = Number(dev.productoId || 0);
                  if (pid > 0) devPorProductoId.set(pid, (devPorProductoId.get(pid) || 0) + dev.cantidad);
                  const nom = (dev.producto || '').toLowerCase().trim();
                  if (nom) devPorNombre.set(nom, (devPorNombre.get(nom) || 0) + dev.cantidad);
                });

                const productosAjustados = ventaAsociada.productos.map((p: any) => {
                  const cantOrig = Number(p.cantidad || 1);
                  const precio = Number(p.precio || 0);
                  const pid = Number(p.id || 0);
                  const cantDev = (pid > 0 ? devPorProductoId.get(pid) : undefined)
                    ?? devPorNombre.get((p.nombre || '').toLowerCase().trim())
                    ?? 0;
                  const cantFinal = Math.max(0, cantOrig - cantDev);
                  return { ...p, cantidadOriginal: cantOrig, cantidadDevuelta: cantDev, cantidad: cantFinal, precio, subtotal: cantFinal * precio };
                });

                const subtotalAjustado = productosAjustados.reduce((s: number, p: any) => s + p.subtotal, 0);
                const subtotalOriginal = ventaAsociada.productos.reduce((s: number, p: any) => s + (Number(p.precio || 0) * Number(p.cantidad || 1)), 0);

                return (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-md font-medium text-white-primary flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-orange-primary" />
                      Venta Asociada — Productos después de la devolución
                    </h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                      {productosAjustados.map((p: any, idx: number) => (
                        <div key={`vp-${p.id || idx}`} className={`bg-gray-darker rounded-lg px-3 py-2.5 border-l-2 ${p.cantidadDevuelta > 0 ? 'border-yellow-500/40' : 'border-orange-primary/20'}`}>
                          <div className="flex items-center gap-4 flex-nowrap min-w-0">
                            <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-dark border border-gray-dark flex items-center justify-center">
                              <ImageRenderer
                                url={p.imagen}
                                alt={p.nombre}
                                className="w-full h-full border-0 bg-transparent"
                              />
                            </div>
                            <div className="min-w-0 flex-1 shrink flex items-center justify-center">
                              <span className="text-white-primary font-semibold text-base truncate block text-center w-full" title={p.nombre}>
                                {p.nombre}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <label className="text-[11px] text-gray-400 font-normal">Cantidad</label>
                              <div className="flex items-center gap-1">
                                <Input type="number" value={p.cantidad} disabled className="w-14 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5 bg-gray-medium" />
                                {p.cantidadDevuelta > 0 && (
                                  <span className="text-[10px] text-yellow-400" title={`Original: ${p.cantidadOriginal}, Devueltos: ${p.cantidadDevuelta}`}>
                                    (-{p.cantidadDevuelta})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <label className="text-[11px] text-gray-400 font-normal">Precio unit.</label>
                              <Input type="number" value={p.precio} disabled className="w-20 h-7 text-xs text-right tabular-nums elegante-input no-spin py-0 px-1.5 bg-gray-medium" />
                            </div>
                            <div className="flex flex-col gap-0.5 shrink-0 justify-center">
                              <label className="text-[11px] text-gray-400 font-normal">Subt.</label>
                              <span className="text-orange-primary font-semibold text-xs tabular-nums leading-7">
                                ${formatCurrency(p.subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-darker p-3 rounded-lg space-y-1 text-sm">
                      <div className="flex justify-between text-gray-lightest">
                        <span>Subtotal Original Venta:</span>
                        <span>${formatCurrency(subtotalOriginal)}</span>
                      </div>
                      <div className="flex justify-between text-yellow-400">
                        <span>Subtotal Ajustado:</span>
                        <span>${formatCurrency(subtotalAjustado)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Resumen del Monto */}
              <div className="bg-gray-darker p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-gray-lightest">
                  <span>Monto Total Devuelto:</span>
                  <span className="text-orange-primary font-bold text-lg">${formatCurrency(selectedDevolucion.monto)}</span>
                </div>
                <div className="flex justify-between text-gray-lightest">
                  <span>Saldo a Favor Actual:</span>
                  <span className="text-green-400 font-bold text-md">${formatCurrency(selectedDevolucion.saldoAFavor)}</span>
                </div>
                <p className="text-sm text-gray-lightest pt-2 border-t border-gray-dark mt-2">
                  Saldo Total Acumulado del Cliente: <span className="text-green-400 font-bold">${formatCurrency(getSaldoTotalCliente(selectedDevolucion.clienteId))}</span>
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-dark">
                <button
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="elegante-button-secondary"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Nueva Devolución */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white-primary">Nueva Devolución</DialogTitle>
            <DialogDescription className="text-gray-lightest">
              Registra una nueva devolución de producto para generar saldo a favor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Buscador Principal de Ventas */}
            <div className="space-y-2 relative">
              <Label className="text-white-primary flex items-center gap-2">
                <Search className="w-4 h-4 text-orange-primary" />
                Buscar Venta por Número, Cliente o Documento *
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                <Input
                  placeholder="Escribe para buscar una venta..."
                  value={ventaSearchTerm}
                  onChange={(e) => {
                    setVentaSearchTerm(e.target.value);
                    setShowVentaResults(true);
                  }}
                  onFocus={() => setShowVentaResults(true)}
                  className={`elegante-input pl-11 w-full ${showVentaError ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                />

                {showVentaResults && ventaSearchTerm.trim() !== "" && (
                  <div className="absolute z-50 w-full mt-2 bg-gray-darkest border border-gray-dark rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-200">
                    {(() => {
                      const query = normalizeSearchText(ventaSearchTerm);
                      const filteredResults = ventasDisponibles.filter(v => {
                        const searchableText = normalizeSearchText([
                          v.id,
                          v.numeroVenta,
                          v.cliente,
                          v.clienteDocumento,
                          v.fecha,
                          v.total
                        ].join(' '));
                        return searchableText.includes(query);
                      }).slice(0, 50);

                      if (filteredResults.length === 0) {
                        return (
                          <div className="p-4 text-center text-gray-lightest italic">
                            No se encontraron ventas que coincidan.
                          </div>
                        );
                      }

                      return filteredResults.map((venta) => {
                        const clienteNombre = typeof venta.cliente === 'string' ? venta.cliente : String(venta.cliente || 'Cliente');
                        const saldoFavor = getSaldoTotalCliente(String(venta.clienteId));

                        return (
                          <div
                            key={venta.id}
                            onClick={() => {
                              handleVentaChange(venta.id.toString());
                              setVentaSearchTerm(`${venta.numeroVenta} - ${clienteNombre}`);
                              setShowVentaResults(false);
                            }}
                            className="p-3 border-b border-gray-dark hover:bg-gray-dark transition-colors cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-orange-primary font-bold text-sm">#{venta.numeroVenta}</span>
                                <span className="text-[11px] text-gray-lightest bg-gray-dark px-1.5 py-0.5 rounded border border-gray-darker font-medium">
                                  Total: ${formatCurrency(venta.total || 0)}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-lightest/60">{venta.fecha}</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-white-primary font-medium text-xs group-hover:text-orange-secondary transition-colors">
                                  {clienteNombre}
                                </p>
                                <p className="text-[10px] text-gray-lightest">{venta.clienteDocumento || 'Sin documento'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] text-gray-lightest uppercase tracking-widest leading-none mb-1">Saldo Cliente</p>
                                <p className={`text-xs font-bold ${saldoFavor > 0 ? 'text-green-400' : 'text-gray-lightest'}`}>
                                  ${formatCurrency(saldoFavor)}
                                </p>
                              </div>
                            </div>

                            {/* Información de Garantía */}
                            <div className="mt-2 flex items-center justify-between border-t border-gray-dark/50 pt-2">
                              {(() => {
                                const diffDays = getRemainingWarrantyDays(venta.fechaISO, venta.garantiaMeses);
                                if (diffDays === null) {
                                  return (
                                    <div className="flex items-center gap-1.5">
                                      <ShieldCheck className="w-3 h-3 text-gray-500" />
                                      <span className="text-[10px] text-gray-lighter">Sin garantía</span>
                                    </div>
                                  );
                                }

                                const isExpired = diffDays < 0;
                                return (
                                  <>
                                    <div className="flex items-center gap-1.5">
                                      <ShieldCheck className={`w-3 h-3 ${isExpired ? 'text-red-400' : 'text-green-400'}`} />
                                      <span className="text-[10px] text-gray-lighter">
                                        Garantía: {venta.garantiaMeses} {venta.garantiaMeses === 1 ? 'Mes' : 'Meses'}
                                      </span>
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isExpired
                                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                      : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                      }`}>
                                      {isExpired ? `EXPIRADA (${Math.abs(diffDays)}d)` : `ACTIVA (${diffDays}d)`}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
              {showVentaError && (
                <p className="text-xs text-red-400 mt-1">Debes seleccionar una venta del buscador.</p>
              )}
            </div>

            {/* Información del Cliente y productos de la venta */}
            {ventaSeleccionada && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                {/* Tarjeta de Información de la Venta */}
                <div className="bg-gray-darker p-5 rounded-2xl border border-gray-dark/50 shadow-lg group hover:border-orange-primary/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4 border-b border-gray-dark pb-3">
                    <div className="p-2 bg-orange-primary/10 rounded-lg">
                      <UserIcon className="w-5 h-5 text-orange-primary" />
                    </div>
                    <div>
                      <h3 className="text-white-primary font-bold text-lg">Información de la Venta</h3>
                      <p className="text-xs text-gray-lightest">Detalles del cliente y registro de transacción</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-lightest uppercase tracking-widest font-bold">Cliente</p>
                      <p className="text-white-primary font-semibold flex items-center gap-2">
                        {typeof ventaSeleccionada.cliente === 'string' ? ventaSeleccionada.cliente : String(ventaSeleccionada.cliente || 'Cliente')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-lightest uppercase tracking-widest font-bold">Documento</p>
                      <p className="text-white-primary font-semibold flex items-center gap-2">
                        {ventaSeleccionada.clienteDocumento || nuevaDevolucion.clienteDocumento || 'No registrado'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-lightest uppercase tracking-widest font-bold">Fecha de Venta</p>
                      <p className="text-white-primary font-semibold flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-orange-primary/70" />
                        {ventaSeleccionada.fecha}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-lightest uppercase tracking-widest font-bold">Garantía</p>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const diffDays = getRemainingWarrantyDays(ventaSeleccionada.fechaISO, ventaSeleccionada.garantiaMeses);
                          if (diffDays === null) {
                            return (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 border border-gray-500/20 flex items-center gap-1.5">
                                <ShieldCheck className="w-3 h-3" />
                                SIN GARANTÍA
                              </span>
                            );
                          }

                          const isExpired = diffDays < 0;
                          return (
                            <>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${isExpired
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                }`}>
                                <ShieldCheck className="w-3 h-3" />
                                {isExpired ? `EXPIRADA (${Math.abs(diffDays)}d)` : `ACTIVA (${diffDays}d)`}
                              </span>
                              <span className="text-[10px] text-gray-lightest">
                                ({ventaSeleccionada.garantiaMeses} {ventaSeleccionada.garantiaMeses === 1 ? 'Mes' : 'Meses'})
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-bold text-white-primary flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-orange-primary" />
                      Productos de la venta
                    </p>
                    <span className="text-xs text-gray-lightest px-2 py-0.5 bg-gray-darker rounded-full border border-gray-dark">
                      Selecciona los productos a devolver
                    </span>
                  </div>
                  {ventaSeleccionada?.productos && Array.isArray(ventaSeleccionada.productos) && ventaSeleccionada.productos.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {ventaSeleccionada.productos.map((producto: any, index: number) => {
                        const productoId = Number(producto?.id || 0);
                        const isChecked = productoSeleccionadoId === productoId;
                        const cantidadInput = cantidadesDevolucion[productoId] ?? '';
                        const maxCantidad = Number(producto?.cantidad || 0);
                        const imagenProducto = String(
                          producto?.imagen ||
                          producto?.imagenProduc ||
                          producto?.imagenUrl ||
                          producto?.Imagen ||
                          producto?.ImagenProduc ||
                          producto?.ImagenUrl ||
                          producto?.producto?.imagen ||
                          producto?.producto?.imagenProduc ||
                          producto?.producto?.imagenUrl ||
                          ''
                        );

                        return (
                          <div key={`${productoId}-${index}`} className="bg-gray-darkest rounded-lg px-3 py-2.5 border-l-2 border-orange-primary/20">
                            <div className="flex items-center gap-4 flex-nowrap min-w-0">
                              <div
                                className={`shrink-0 w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${showProductoError && !isChecked
                                  ? `border-red-500 ring-1 ring-red-500 ${shakeClass}`
                                  : isChecked
                                    ? 'border-[#D9C3A4] bg-[#D9C3A4]/20'
                                    : 'border-[#D9C3A4]/70 bg-[#D9C3A4]/10'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleToggleProductoSeleccion(producto, e.target.checked)}
                                  className="h-4 w-4 accent-[#D9C3A4] shrink-0 cursor-pointer"
                                />
                              </div>

                              <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-dark flex items-center justify-center border border-gray-dark">
                                {resolveImageSrc(imagenProducto) ? (
                                  <ImageRenderer
                                    url={imagenProducto}
                                    alt={producto?.nombre || 'Producto'}
                                    className="w-full h-full border-0 bg-transparent"
                                  />
                                ) : (
                                  <ShoppingBag className="w-5 h-5 text-gray-500" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <span className="text-white-primary font-semibold text-sm truncate block">
                                  {producto?.nombre || 'Producto'}
                                </span>
                                <span className="text-[11px] text-gray-lightest">
                                  Vendidos: {maxCantidad} | Precio: ${formatCurrency(Number(producto?.precio || 0))}
                                </span>
                              </div>

                              <div className="flex flex-col gap-0.5 shrink-0">
                                <label className="text-[11px] text-gray-400 font-normal">Cantidad</label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={Math.max(1, maxCantidad)}
                                  value={cantidadInput}
                                  onChange={(e) => handleCantidadProductoSeleccionChange(producto, e.target.value)}
                                  disabled={!isChecked}
                                  className={`w-16 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5 ${showCantidadError && isChecked ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-lightest">Esta venta no tiene productos disponibles para devolución.</p>
                  )}
                  {showProductoError && (
                    <p className="text-xs text-red-400">Selecciona un producto para la devolución.</p>
                  )}
                  {showCantidadError && (
                    <p className="text-xs text-red-400">Ingresa una cantidad válida para el producto seleccionado.</p>
                  )}
                </div>
              </div>
            )}

            {/* Motivo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white-primary flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-primary" />
                  Motivo de la Devolución *
                </Label>
                <select
                  value={nuevaDevolucion.motivoCategoria}
                  onChange={(e) => {
                    if (showDevolucionFormErrors) setShowDevolucionFormErrors(false);
                    setNuevaDevolucion(prev => ({ ...prev, motivoCategoria: e.target.value }));
                  }}
                  className={`elegante-input w-full ${showMotivoError ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                >
                  <option value="">Seleccionar motivo...</option>
                  {MOTIVOS_DEVOLUCION.map((motivo) => (
                    <option key={motivo.value} value={motivo.value}>
                      {motivo.label}
                    </option>
                  ))}
                </select>
                {showMotivoError && (
                  <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white-primary flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-primary" />
                  Resumen Seleccionado
                </Label>
                <Input
                  type="text"
                  value={nuevaDevolucion.producto ? `${nuevaDevolucion.producto} x${nuevaDevolucion.cantidad}` : 'Selecciona un producto'}
                  disabled
                  className="elegante-input bg-gray-medium"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label className="text-white-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-primary" />
                Observaciones (Opcional)
              </Label>
              <textarea
                value={nuevaDevolucion.observaciones}
                onChange={(e) => setNuevaDevolucion(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Describe detalles adicionales sobre la devolución..."
                maxLength={300}
                rows={3}
                className="elegante-input w-full resize-none"
              />
              <div className="flex justify-start mt-1">
                <span className="text-xs text-gray-500 font-medium">
                  {(nuevaDevolucion.observaciones || '').length}/300 caracteres
                </span>
              </div>
            </div>

            {/* Resumen del Monto */}
            {nuevaDevolucion.monto > 0 && (
              <div className="bg-gray-darker p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-gray-lightest">
                  <span>Monto Total a Devolver:</span>
                  <span className="text-orange-primary font-bold text-lg">${formatCurrency(nuevaDevolucion.monto)}</span>
                </div>
                <p className="text-sm text-gray-lightest">
                  Este monto se agregará como saldo a favor del cliente
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-dark">
              <button
                onClick={() => {
                  setShowDevolucionFormErrors(false);
                  setIsDialogOpen(false);
                  resetFormularios();
                }}
                className="elegante-button-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateDevolucion}
                className="elegante-button-primary"
              >
                Registrar Devolución
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Modal de Saldos a Favor */}
      <Dialog open={isHistorialDialogOpen} onOpenChange={setIsHistorialDialogOpen}>
        <DialogContent className="max-w-4xl bg-gray-darkest border-gray-dark">
          <DialogHeader>
            <DialogTitle className="text-white-primary">Saldos a Favor por Cliente</DialogTitle>
            <DialogDescription className="text-gray-lightest">
              Clientes con saldo acumulativo disponible para futuras compras
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {getSaldosClientes().map((saldo) => (
              <div key={saldo.clienteId} className="bg-gray-darker p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-dark border-2 border-gray-medium flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-lightest" />
                    </div>
                    <div>
                      <h4 className="text-white-primary font-medium">{saldo.cliente}</h4>
                      <p className="text-gray-lightest text-sm">{saldo.clienteId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-lg">${formatCurrency(saldo.saldoTotal)}</p>
                    <p className="text-gray-lightest text-sm">Saldo disponible</p>
                  </div>
                </div>

                {/* Historial resumido */}
                <div className="mt-4 pt-4 border-t border-gray-dark">
                  <h5 className="text-white-primary text-sm font-medium mb-2">Devoluciones Activas:</h5>
                  <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {getHistorialCliente(saldo.clienteId)
                      .filter(d => d.estado === 'Completada')
                      .slice(0, 3)
                      .map((dev) => (
                        <div key={dev.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-lightest">{dev.id} - {dev.producto}</span>
                          <span className="text-green-400">${formatCurrency(dev.saldoAFavor)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}

            {getSaldosClientes().length === 0 && (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-medium mx-auto mb-4" />
                <p className="text-gray-lightest">No hay clientes con saldo a favor actualmente</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DoubleConfirmationContainer />
    </>
  );
}