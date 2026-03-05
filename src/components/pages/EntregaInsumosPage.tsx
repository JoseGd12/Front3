import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  X,
  ShoppingBag,
  Hash,
  User as UserIcon,
  HandHelping,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Ban,
  XCircle,
  Edit2,
  Clock,
  Truck
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { useDoubleConfirmation } from "../ui/double-confirmation";
import { entregaInsumosService, EntregaInsumo, InsumoEntrega, CreateEntregaData, UpdateEntregaData } from "../../services/entregaInsumosService";
import { apiService, ApiUser } from "../../services/api";
import { barberosService, Barbero } from "../../services/barberosService";
import { insumosService, Insumo } from "../../services/insumosService";
import ImageRenderer from "../ui/ImageRenderer";
import { useCustomAlert } from "../ui/custom-alert";

// Función para formatear moneda colombiana con puntos para separar miles
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0';
  }
  return amount.toLocaleString('es-CO');
};

const getFullName = (nombre?: string, apellido?: string) => {
  return `${nombre || ''}${apellido ? ` ${apellido}` : ''}`.trim();
};

import { useAuth } from "../AuthContext"; // Import newly added

export function EntregaInsumosPage() {
  const { user } = useAuth(); // Get user from context
  const { confirmDeleteAction, confirmEditAction, DoubleConfirmationContainer } = useDoubleConfirmation();

  const generateCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (date: string | Date) => {
    let dateObj: Date;
    if (typeof date === 'string') {
      const plainDateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (plainDateMatch) {
        const [, year, month, day] = plainDateMatch;
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

  // Estados para el componente
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [entregas, setEntregas] = useState<EntregaInsumo[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingDelivery, setCreatingDelivery] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<EntregaInsumo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [insumoSearchTerm, setInsumoSearchTerm] = useState("");
  const [showInsumoResults, setShowInsumoResults] = useState(false);
  const [barberoSearchTerm, setBarberoSearchTerm] = useState("");
  const [showBarberoResults, setShowBarberoResults] = useState(false);
  const [barberoSearchFocused, setBarberoSearchFocused] = useState(false);
  const [insumoSearchFocused, setInsumoSearchFocused] = useState(false);
  const [showEntregaFormErrors, setShowEntregaFormErrors] = useState(false);
  const [entregaValidationAttempt, setEntregaValidationAttempt] = useState(0);
  const [showAddInsumoErrors, setShowAddInsumoErrors] = useState(false);
  const [cantidadInsumo, setCantidadInsumo] = useState(0);
  const [cantidadInsumoInput, setCantidadInsumoInput] = useState('');
  const [tarjetaInputsEntrega, setTarjetaInputsEntrega] = useState<Record<number, { cantidad?: string }>>({});
  const { created, AlertContainer } = useCustomAlert();

  const shakeClass = entregaValidationAttempt % 2 === 0 ? 'input-required-shake-a' : 'input-required-shake-b';
  const barberoInputRef = useRef<HTMLInputElement | null>(null);
  const productoInputRef = useRef<HTMLInputElement | null>(null);
  const cantidadInputRef = useRef<HTMLInputElement | null>(null);
  const addProductoRowRef = useRef<HTMLDivElement | null>(null);
  const productosAgregadosRef = useRef<HTMLDivElement | null>(null);
  const numeroEntregas = 21 + entregas.length;
  const [isProductoDetalleOpen, setIsProductoDetalleOpen] = useState(false);
  const [productoDetalle, setProductoDetalle] = useState<any | null>(null);

  // Función para normalizar texto de búsqueda (quitar tildes, minúsculas)
  const normalizeSearchText = (value: unknown): string => {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const getBarberoNombreById = (barberoId: number | string | undefined | null) => {
    if (barberoId === undefined || barberoId === null) return 'Sin asignar';
    const id = typeof barberoId === 'string' ? Number(barberoId) : barberoId;
    const barbero = barberos.find(b => b.id === id);
    if (!barbero) return 'Sin asignar';
    return getFullName(barbero.nombre, barbero.apellido) || 'Sin asignar';
  };

  const getBarberoDocumentoById = (barberoId: number | string | undefined | null) => {
    if (barberoId === undefined || barberoId === null) return '';
    const id = typeof barberoId === 'string' ? Number(barberoId) : barberoId;
    const barbero = barberos.find(b => b.id === id);
    return String(barbero?.documento || '');
  };

  const getBarberoDisplay = (entrega: EntregaInsumo | null | undefined) => {
    if (!entrega) return 'Sin asignar';
    const entregaAny = entrega as any;
    const barberoValue = entregaAny.barbero ?? entregaAny.Barbero;
    let documentoValue =
      entregaAny.barberoDocumento ??
      entregaAny.BarberoDocumento ??
      '';

    if (barberoValue) {
      if (typeof barberoValue === 'string') return barberoValue;
      const nombre =
        barberoValue.nombre ??
        barberoValue.Nombre ??
        barberoValue.nombres ??
        barberoValue.Nombres ??
        barberoValue.primerNombre ??
        barberoValue.PrimerNombre ??
        barberoValue.name ??
        barberoValue.Name ??
        barberoValue.nombreBarbero ??
        barberoValue.NombreBarbero;
      const apellido =
        barberoValue.apellido ??
        barberoValue.Apellido ??
        barberoValue.apellidos ??
        barberoValue.Apellidos ??
        barberoValue.primerApellido ??
        barberoValue.PrimerApellido ??
        barberoValue.lastName ??
        barberoValue.LastName ??
        barberoValue.apellidoBarbero ??
        barberoValue.ApellidoBarbero;
      const fullName = getFullName(nombre, apellido);
      if (!documentoValue) {
        documentoValue =
          barberoValue.documento ??
          barberoValue.Documento ??
          '';
      }
      if (fullName) {
        return `${fullName}${documentoValue ? ` — CC ${documentoValue}` : ''}`;
      }
    }

    const directName =
      entregaAny.barberoNombre ??
      entregaAny.nombreBarbero ??
      entregaAny.BarberoNombre ??
      entregaAny.NombreBarbero ??
      entregaAny.barberoFullName ??
      entregaAny.BarberoFullName;
    if (directName) return String(directName);

    const barberoId =
      entregaAny.barberoId ??
      entregaAny.BarberoId ??
      entregaAny.barberoSeleccionado ??
      entregaAny.BarberoSeleccionado;
    const nombreById = getBarberoNombreById(barberoId);
    if (!documentoValue) {
      documentoValue = getBarberoDocumentoById(barberoId);
    }
    if (nombreById && nombreById !== 'Sin asignar') {
      return `${nombreById}${documentoValue ? ` — CC ${documentoValue}` : ''}`;
    }

    const barberoDocumento =
      entregaAny.barberoDocumento ??
      entregaAny.BarberoDocumento ??
      entregaAny.documentoBarbero ??
      entregaAny.DocumentoBarbero;
    if (barberoDocumento) {
      const match = barberos.find(b => String(b.documento ?? '') === String(barberoDocumento));
      if (match) {
        const fullName = getFullName(match.nombre, match.apellido);
        if (fullName) return `${fullName} — CC ${String(barberoDocumento)}`;
      }
    }

    return 'Sin asignar';
  };

  const getProductoNombreById = (productoId: number | string | undefined | null) => {
    if (productoId === undefined || productoId === null) return 'Sin asignar';
    const id = typeof productoId === 'string' ? Number(productoId) : productoId;
    const producto = insumos.find(p => p.id === id);
    return producto?.nombre || 'Sin asignar';
  };

  const getUsuarioNombreById = (usuarioId: number | string | undefined | null) => {
    if (usuarioId === undefined || usuarioId === null) return 'Sin asignar';
    const id = typeof usuarioId === 'string' ? Number(usuarioId) : usuarioId;
    const usuario = users.find(u => u.id === id);
    if (!usuario) return 'Sin asignar';
    return getFullName(usuario.nombre, usuario.apellido) || 'Sin asignar';
  };

  const getUsuarioDocumentoById = (usuarioId: number | string | undefined | null) => {
    if (usuarioId === undefined || usuarioId === null) return '';
    const id = typeof usuarioId === 'string' ? Number(usuarioId) : usuarioId;
    const usuario = users.find(u => u.id === id);
    return String((usuario as any)?.documento || (usuario as any)?.Documento || '');
  };

  const getResponsableDisplay = (entrega: EntregaInsumo | null | undefined) => {
    if (!entrega) return 'N/A';
    const e: any = entrega as any;
    let doc =
      e.responsableDocumento ??
      e.ResponsableDocumento ??
      e.usuarioDocumento ??
      e.UsuarioDocumento ??
      '';

    const respObj = e.responsable ?? e.Responsable ?? e.usuario ?? e.Usuario;
    if (respObj) {
      if (typeof respObj === 'string') {
        return `${respObj}${doc ? ` — CC ${doc}` : ''}`;
      }
      const nombre =
        respObj.nombre ?? respObj.Nombre ?? respObj.primerNombre ?? respObj.PrimerNombre ?? respObj.name ?? respObj.Name;
      const apellido =
        respObj.apellido ?? respObj.Apellido ?? respObj.primerApellido ?? respObj.PrimerApellido ?? respObj.lastName ?? respObj.LastName;
      if (!doc) {
        doc = respObj.documento ?? respObj.Documento ?? '';
      }
      const fullName = getFullName(nombre, apellido);
      if (fullName) return `${fullName}${doc ? ` — CC ${doc}` : ''}`;
    }

    const nombreDirecto =
      e.responsableNombre ?? e.ResponsableNombre ?? e.usuarioNombre ?? e.UsuarioNombre ?? e.responsable ?? e.usuario;
    if (nombreDirecto) {
      return `${String(nombreDirecto)}${doc ? ` — CC ${doc}` : ''}`;
    }

    const uid =
      e.responsableId ?? e.ResponsableId ?? e.usuarioId ?? e.UsuarioId ?? e.userId ?? e.UserId;
    const nombreById = getUsuarioNombreById(uid);
    if (!doc) doc = getUsuarioDocumentoById(uid);
    if (nombreById && nombreById !== 'Sin asignar') {
      return `${nombreById}${doc ? ` — CC ${doc}` : ''}`;
    }

    const docFromEntrega =
      e.responsableDocumento ?? e.ResponsableDocumento ?? e.usuarioDocumento ?? e.UsuarioDocumento;
    if (docFromEntrega) {
      const match = users.find(u => String((u as any)?.documento || (u as any)?.Documento || '') === String(docFromEntrega));
      if (match) {
        const fullName = getFullName((match as any).nombre, (match as any).apellido);
        if (fullName) return `${fullName} — CC ${String(docFromEntrega)}`;
      }
    }
    return 'N/A';
  };

  // Cargar datos desde la API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar barberos, insumos, entregas y usuarios desde la API en paralelo
        const [barberosData, insumosData, entregasData, usersData] = await Promise.all([
          barberosService.getBarberos(),
          insumosService.getInsumos(),
          entregaInsumosService.getEntregas(),
          apiService.getUsuarios()
        ]);

        console.log('🔵 Barberos desde API:', barberosData);
        console.log('🔵 Insumos desde API:', insumosData);
        console.log('🔵 Entregas desde API:', entregasData);
        console.log('🔵 Usuarios desde API:', usersData);

        setBarberos(barberosData);
        setInsumos(insumosData.filter(i => i.activo === true));
        setEntregas(entregasData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar los datos desde el servidor');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  // Estado para nueva entrega
  const inicialNuevaEntrega = {
    barberoSeleccionado: 0,
    fechaRegistro: generateCurrentDate(),
    horaEntrega: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    responsable: 'Admin Principal',
    insumos: [] as InsumoEntrega[]
  };

  const [nuevaEntrega, setNuevaEntrega] = useState(inicialNuevaEntrega);

  const [insumoSeleccionado, setInsumoSeleccionado] = useState(0); // Cambiar a number

  function normalizeEstado(estado: string) {
    return (estado || '').toLowerCase().trim();
  }
  function isCompletadaEstado(estado: string) {
    const e = normalizeEstado(estado);
    return e === 'entregado' || e === 'completada' || e === 'completado';
  }
  function isAnuladaEstado(estado: string) {
    const e = normalizeEstado(estado);
    return e === 'anulado' || e === 'anulada';
  }
  function getEstadoDisplay(estado: string) {
    if (isCompletadaEstado(estado)) return 'Completada';
    if (isAnuladaEstado(estado)) return 'Anulada';
    return estado || 'N/A';
  }
  function getEstadoColor(estado: string) {
    if (isAnuladaEstado(estado)) {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    if (isCompletadaEstado(estado)) {
      return 'bg-green-500/10 text-green-400 border border-green-500/20';
    }
    return 'bg-gray-medium text-gray-lighter';
  }

  // Filtros y paginación
  const filteredEntregas = entregas.filter((entrega) => {
    const q = normalizeSearchText(searchTerm);
    if (!q) return true;
    const numero = String(entrega.id || '');
    const documento = String((entrega as any).barberoDocumento || getBarberoDocumentoById((entrega as any).barberoId) || '');
    const nombre = getBarberoNombreById((entrega as any).barberoId);
    const totalInsumos = String(entrega.cantidadTotal ?? '');
    const fecha = formatDate(entrega.fecha || generateCurrentDate());
    const estadoDisplay = getEstadoDisplay(String(entrega.estado || ''));
    // Solo columnas visibles de la tabla: Número, Documento, Nombre, Total Insumos, Fecha, Estado
    const searchable = normalizeSearchText([numero, documento, nombre, totalInsumos, fecha, estadoDisplay].join(' '));
    return searchable.includes(q);
  });

  const totalPages = Math.ceil(filteredEntregas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedEntregas = filteredEntregas.slice(startIndex, startIndex + itemsPerPage);


  const getDetalleInsumosNormalized = (entrega: EntregaInsumo | null | undefined) => {
    if (!entrega) return [] as Array<{ id: number; nombre: string; categoria: string; cantidad: number; precio: number; imagen?: string }>;

    const raw =
      (entrega as any).insumosDetalle ||
      (entrega as any).InsumosDetalle ||
      (entrega as any).detalleEntregasInsumos ||
      (entrega as any).DetalleEntregasInsumos ||
      (entrega as any).detalles ||
      (entrega as any).Detalles ||
      (entrega as any).insumos ||
      (entrega as any).Insumos ||
      (entrega as any).productos ||
      (entrega as any).Productos ||
      [];

    const list = Array.isArray(raw) ? raw : [];
    
    if (list.length > 0) {
      console.log('🔍 Normalizando detalles de entrega:', { id: entrega.id, rawLength: list.length, firstItem: list[0] });
    }

    return list.map((detalle: any, index: number) => {
      // DEBUG: Ver estructura del primer elemento para diagnosticar problemas de mapeo
      if (index === 0) {
        console.log('🔍 Inspeccionando estructura de detalle:', detalle);
      }

      // Intentar obtener el ID del producto
      const productoId = detalle?.productoId ?? detalle?.ProductoId ?? detalle?.producto?.id ?? detalle?.Producto?.Id ?? detalle?.id ?? detalle?.Id;
      
      // Buscar información completa del producto en el catálogo global si es posible
      const productoCatalogo = insumos.find(i => Number(i.id) === Number(productoId));
      
      // Objeto producto base (prioridad: catálogo global > objeto anidado > objeto detalle)
      const producto = productoCatalogo || detalle?.producto || detalle?.Producto || detalle || {};

      const categoriaValue =
        producto?.categoria?.nombre ||
        producto?.categoria?.Nombre ||
        producto?.categoriaNombre ||
        producto?.CategoriaNombre ||
        producto?.categoria ||
        producto?.Categoria ||
        detalle?.categoria?.nombre ||
        detalle?.categoria?.Nombre ||
        detalle?.categoriaNombre ||
        detalle?.CategoriaNombre ||
        detalle?.categoria ||
        detalle?.Categoria ||
        '';

      const imagenValue =
        producto?.imagen ||
        producto?.imagenProduc ||
        producto?.ImagenProduc ||
        producto?.imagenUrl ||
        producto?.ImagenUrl ||
        detalle?.imagen ||
        detalle?.imagenProduc ||
        detalle?.ImagenProduc ||
        detalle?.imagenUrl ||
        detalle?.ImagenUrl ||
        '';

      const cantidadValue = Number(
        detalle?.cantidad ?? 
        detalle?.Cantidad ?? 
        producto?.cantidad ?? 
        producto?.Cantidad ?? 
        0
      );
      
      // El precio debe venir preferiblemente del detalle histórico, si no, del producto actual
      const precioValue = Number(
        detalle?.precio ??
        detalle?.Precio ??
        detalle?.precioUnitario ??
        detalle?.PrecioUnitario ??
        detalle?.precioHistorico ??
        detalle?.PrecioHistorico ??
        producto?.precio ??
        producto?.Precio ??
        producto?.precioVenta ??
        producto?.PrecioVenta ??
        0
      );

      return {
        id: Number(productoId ?? index),
        nombre: String(producto?.nombre ?? producto?.Nombre ?? detalle?.nombre ?? detalle?.Nombre ?? `Insumo ${index + 1}`),
        categoria: String(categoriaValue || 'Sin categoría'),
        cantidad: Number.isFinite(cantidadValue) ? cantidadValue : 0,
        precio: Number.isFinite(precioValue) ? precioValue : 0,
        imagen: imagenValue || undefined,
      };
    });
  };

  const getTarjetaInputEntrega = (insumo: { id: number; cantidad: number }) => {
    const visual = tarjetaInputsEntrega[insumo.id]?.cantidad;
    return visual ?? String(insumo.cantidad ?? 0);
  };

  const actualizarTarjetaInputEntrega = (insumoId: number, valor: string) => {
    setTarjetaInputsEntrega((prev) => ({
      ...prev,
      [insumoId]: { ...prev[insumoId], cantidad: valor }
    }));

    if (valor.trim() === '') return;

    const numero = Number(valor);
    if (Number.isNaN(numero)) return;

    const cantidad = Math.max(1, Math.floor(numero));
    const insumoBase = insumos.find(i => Number(i.id) === Number(insumoId));
    const stockDisponible = insumoBase ? (insumoBase.stockInsumos ?? insumoBase.stock) : Number.POSITIVE_INFINITY;
    const cantidadFinal = cantidad > stockDisponible ? stockDisponible : cantidad;

    if (cantidadFinal !== cantidad) {
      toast.error(`No hay suficiente stock de insumos. Disponible: ${stockDisponible} unidades`);
      setTarjetaInputsEntrega((prev) => ({
        ...prev,
        [insumoId]: { ...prev[insumoId], cantidad: String(cantidadFinal) }
      }));
    }

    setNuevaEntrega((prev) => ({
      ...prev,
      insumos: (prev.insumos || []).map((i: any) =>
        Number(i.id) === Number(insumoId)
          ? { ...i, cantidad: cantidadFinal }
          : i
      )
    }));
  };

  const agregarInsumo = () => {
    console.log('🧪 Click Agregar insumo', {
      insumoSeleccionado,
      cantidadInsumo,
      nuevaEntregaInsumos: nuevaEntrega.insumos,
      insumosCount: insumos.length,
    });

    if (!insumoSeleccionado) {
      setShowAddInsumoErrors(true);
      setEntregaValidationAttempt(prev => prev + 1);
      toast.error('Selecciona un producto antes de agregar');
      console.warn('🟡 No se agregó: insumoSeleccionado vacío/0');
      requestAnimationFrame(() => {
        addProductoRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        productoInputRef.current?.focus();
      });
      return;
    }

    if (!cantidadInsumoInput.trim() || !cantidadInsumo || cantidadInsumo <= 0) {
      setShowAddInsumoErrors(true);
      setEntregaValidationAttempt(prev => prev + 1);
      toast.error('Ingresa una cantidad válida');
      console.warn('🟡 No se agregó: cantidadInsumo inválida', { cantidadInsumo });
      requestAnimationFrame(() => {
        addProductoRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cantidadInputRef.current?.focus();
      });
      return;
    }

    const selectedId = Number(insumoSeleccionado);
    const insumo = insumos.find(i => Number(i.id) === selectedId);
    console.log('🧪 Producto seleccionado encontrado:', { selectedId, insumo });
    if (!insumo) {
      toast.error('Producto no encontrado');
      console.error('❌ Producto no encontrado. insumoSeleccionado=', insumoSeleccionado, 'insumos=', insumos);
      return;
    }

    // Verificar stock disponible (usar stock de insumos si está disponible)
    const stockDisponible = insumo.stockInsumos ?? insumo.stock;
    if (cantidadInsumo > stockDisponible) {
      toast.error(`No hay suficiente stock de insumos. Disponible: ${stockDisponible} unidades`);
      console.warn('🟡 No se agregó: stock insuficiente', {
        id: insumo.id,
        nombre: insumo.nombre,
        solicitado: cantidadInsumo,
        disponible: stockDisponible,
      });
      return;
    }

    const insumosActuales = nuevaEntrega.insumos || [];
    const existeInsumo = insumosActuales.find(i => Number(i.id) === Number(insumo.id));
    console.log('🧪 Estado antes de agregar', { insumosActuales, existeInsumo });

    if (existeInsumo) {
      const nuevaCantidad = existeInsumo.cantidad + cantidadInsumo;
      const stockDisponible = insumo.stockInsumos ?? insumo.stock;
      if (nuevaCantidad > stockDisponible) {
        toast.error(`No hay suficiente stock de insumos. Disponible: ${stockDisponible} unidades`);
        return;
      }

      setNuevaEntrega({
        ...nuevaEntrega,
        insumos: insumosActuales.map(i =>
          Number(i.id) === Number(insumo.id)
            ? { ...i, cantidad: nuevaCantidad }
            : i
        )
      });
      setTarjetaInputsEntrega((prev) => ({
        ...prev,
        [insumo.id]: { ...prev[insumo.id], cantidad: String(nuevaCantidad) }
      }));
    } else {
      setNuevaEntrega({
        ...nuevaEntrega,
        insumos: [...insumosActuales, {
          id: insumo.id,
          nombre: insumo.nombre,
          categoria: insumo.categoria,
          cantidad: cantidadInsumo,
          precio: Number(insumo.precio) || 0,
          imagen: insumo.imagen
        }]
      });
      setTarjetaInputsEntrega((prev) => ({
        ...prev,
        [insumo.id]: { ...prev[insumo.id], cantidad: String(cantidadInsumo) }
      }));
    }

    setInsumoSeleccionado(0);
    setCantidadInsumo(0);
    setCantidadInsumoInput('');
    setInsumoSearchTerm("");
    setShowInsumoResults(false);
    setShowAddInsumoErrors(false);
    if (showEntregaFormErrors) setShowEntregaFormErrors(false);

    console.log('✅ Producto agregado a la entrega:', { id: insumo.id, nombre: insumo.nombre, cantidad: cantidadInsumo });
  };

  const eliminarInsumo = (insumoId: number) => {
    const insumosActuales = nuevaEntrega.insumos || [];
    setNuevaEntrega({
      ...nuevaEntrega,
      insumos: insumosActuales.filter(i => i.id !== insumoId)
    });
    setTarjetaInputsEntrega((prev) => {
      const next = { ...prev };
      delete next[insumoId];
      return next;
    });
  };

  const calcularTotalEntrega = () => {
    if (!nuevaEntrega.insumos || !Array.isArray(nuevaEntrega.insumos)) {
      return 0;
    }

    return nuevaEntrega.insumos.reduce((total, insumo) => {
      const precio = Number((insumo as any).precio) || 0;
      const cantidad = Number((insumo as any).cantidad) || 0;
      return total + (precio * cantidad);
    }, 0);
  };

  const handleCreateEntrega = async () => {
    // Validate session
    if (!user || !user.id) {
      toast.error("Error de sesión", { description: "No se ha identificado el usuario responsable." });
      return;
    }

    console.log('🧪 Click Registrar Entrega', {
      barberoSeleccionado: nuevaEntrega.barberoSeleccionado,
      fechaRegistro: (nuevaEntrega as any).fechaRegistro,
      insumosCount: (nuevaEntrega.insumos || []).length,
      insumos: nuevaEntrega.insumos,
    });

    if (!nuevaEntrega.barberoSeleccionado || !nuevaEntrega.insumos || nuevaEntrega.insumos.length === 0) {
      setShowEntregaFormErrors(true);
      setEntregaValidationAttempt(prev => prev + 1);
      toast.error('Campos obligatorios', { description: 'Por favor completa el barbero y agrega al menos un producto.' });
      requestAnimationFrame(() => {
        if (!nuevaEntrega.barberoSeleccionado) {
          barberoInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          barberoInputRef.current?.focus();
          return;
        }
        (productosAgregadosRef.current ?? addProductoRowRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    try {
      setCreatingDelivery(true);

      const barbero = barberos.find(b => b.id === nuevaEntrega.barberoSeleccionado);
      if (!barbero) {
        toast.error('Barbero no encontrado');
        console.error('❌ Barbero no encontrado', { barberoSeleccionado: nuevaEntrega.barberoSeleccionado, barberos });
        return;
      }


      const numeroEntrega = `ENT${String(Date.now())}`;
      const total = calcularTotalEntrega();
      const insumosActuales = nuevaEntrega.insumos || [];
      const cantidadTotal = insumosActuales.length > 0
        ? insumosActuales.reduce((sum, insumo) => sum + insumo.cantidad, 0)
        : 0;

      const entregaData: CreateEntregaData = {
        barberoId: nuevaEntrega.barberoSeleccionado,
        usuarioId: Number(user?.id) || 0,
        detalles: nuevaEntrega.insumos.map(insumo => ({
          productoId: insumo.id,
          cantidad: insumo.cantidad
        }))
      };

      console.log('📤 Enviando a API:', entregaData);

      const entregaCreada = await entregaInsumosService.createEntrega(entregaData);

      // Actualizar stock de insumos (simulado localmente)
      const nuevosInsumos = insumos.map(insumo => {
        const insumoEntregado = insumosActuales.find(i => i.id === insumo.id);
        if (insumoEntregado) {
          // Descontar del stock de insumos si existe, de lo contrario del stock general
          if (insumo.stockInsumos !== undefined) {
            return {
              ...insumo,
              stockInsumos: Math.max(0, (insumo.stockInsumos || 0) - insumoEntregado.cantidad)
            };
          } else {
            return {
              ...insumo,
              stock: insumo.stock - insumoEntregado.cantidad
            };
          }
        }
        return insumo;
      });

      setInsumos(nuevosInsumos);
      // refrescar lista desde API para evitar inconsistencias
      const entregasActualizadas = await entregaInsumosService.getEntregas();
      setEntregas(entregasActualizadas);
      const insumosActualizados = await insumosService.getInsumos();
      setInsumos(insumosActualizados);
      setNuevaEntrega({ ...inicialNuevaEntrega, fechaRegistro: generateCurrentDate() });
      setBarberoSearchTerm("");
      setShowBarberoResults(false);
      setInsumoSearchTerm("");
      setShowInsumoResults(false);
      setShowEntregaFormErrors(false);
      setShowAddInsumoErrors(false);
      setCantidadInsumo(0);
      setCantidadInsumoInput('');
      setTarjetaInputsEntrega({});
      setIsDialogOpen(false);
      created(
        "Entrega creada ✔️",
        `La entrega ${numeroEntrega} ha sido registrada exitosamente para ${getFullName(barbero?.nombre, barbero?.apellido) || 'Sin asignar'}.`
      );
    } catch (error: any) {
      console.error('Error creando entrega:', error);
      toast.error(error?.message || 'Error al registrar la entrega');
    } finally {
      setCreatingDelivery(false);
    }
  };

  // Función para ver detalles completos de una entrega consumiendo la API
  const handleViewDetails = async (entrega: EntregaInsumo) => {
    // 1. Mostrar inmediatamente lo que tenemos para respuesta rápida
    console.log('👀 Visualizando entrega (datos locales):', entrega);
    setSelectedEntrega(entrega);
    setIsDetailDialogOpen(true);

    try {
      // 2. Intentar obtener detalles completos en segundo plano para enriquecer la data
      const entregaCompleta = await entregaInsumosService.getEntregaById(entrega.id.toString());

      if (entregaCompleta) {
        console.log('✅ Detalles completos cargados:', entregaCompleta);
        // 3. Si tenemos éxito, actualizamos con la info completa
        setSelectedEntrega(entregaCompleta);
      }
    } catch (error) {
      console.error('⚠️ No se pudieron cargar detalles adicionales (se mantienen datos locales):', error);
      // No mostramos error al usuario para no interrumpir la experiencia, 
      // ya que está viendo la información básica que ya teníamos.
    }
  };

  // Función para anular una entrega
  const handleAnularClick = async (entrega: EntregaInsumo) => {
    // Confirmación antes de anular
    confirmEditAction(
      `entrega #${entrega.id}`,
      async () => {
        try {
          console.log(`🚫 Anulando entrega ${entrega.id}...`);

          const response = await entregaInsumosService.updateEntrega(entrega.id, {
            id: entrega.id,
            estado: 'Anulado'
          });

          console.log('✅ Entrega anulada:', response);

          // Actualizar lista local
          setEntregas(entregas.map(e =>
            e.id === entrega.id ? { ...e, estado: 'Anulado' } : e
          ));

          // Devolver stock de insumos al inventario
          // Usar el campo correcto según la API: detalleEntregasInsumos
          const detalles = (entrega as any).detalleEntregasInsumos || entrega.insumosDetalle || [];
          console.log('🔄 Devolviendo stock para detalles:', detalles);

          const nuevosInsumos = insumos.map(insumo => {
            const detalleDevuelto = detalles.find((d: any) => d.productoId === insumo.id);
            if (detalleDevuelto) {
              console.log(`📦 Devolviendo ${detalleDevuelto.cantidad} unidades de ${insumo.nombre} al stock`);
              // Devolver al stock de insumos si existe, de lo contrario al stock general
              if (insumo.stockInsumos !== undefined) {
                return {
                  ...insumo,
                  stockInsumos: (insumo.stockInsumos || 0) + detalleDevuelto.cantidad
                };
              } else {
                return {
                  ...insumo,
                  stock: insumo.stock + detalleDevuelto.cantidad
                };
              }
            }
            return insumo;
          });
          setInsumos(nuevosInsumos);
          const insumosActualizados = await insumosService.getInsumos();
          setInsumos(insumosActualizados);

          // No need to toast success here as confirmEditAction handles success message if configured, 
          // or we can toast if we prefer custom handling. But DoubleConfirmation usually shows success dialog.
          // However, double confirmation shows a success dialog, so let's keep it clean.
        } catch (error) {
          console.error('❌ Error anulando entrega:', error);
          toast.error('Error al anular la entrega');
          throw error; // Propagate error so dialog knows it failed
        }
      },
      {
        confirmTitle: 'Confirmar Anulación',
        confirmMessage: `¿Estás seguro de anular la entrega ${entrega.id}? Esta acción devolverá los insumos al inventario.`,
        successTitle: '¡Entrega anulada!',
        successMessage: `La entrega ${entrega.id} ha sido anulada exitosamente.`,
        requireInput: false
      }
    );
  };

  // Generar reporte PDF individual por entrega
  const generateIndividualEntregaPDF = (entrega: EntregaInsumo) => {
    const barberoNombre = (entrega as any).barbero
      ? String((entrega as any).barbero)
      : getBarberoNombreById((entrega as any).barberoId);
    const reportContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Entrega ${entrega.id} - EDWINS BARBER</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            background: #ffffff;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
          }
          
          .header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: #d8b081;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
            border-radius: 12px;
          }
          
          .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #d8b081;
          }
          
          .subtitle {
            font-size: 18px;
            color: #aaaaaa;
            margin-bottom: 15px;
          }
          
          .entrega-id {
            font-size: 16px;
            background: #d8b081;
            color: #000000;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #d8b081;
          }
          
          .info-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-weight: bold;
          }
          
          .info-value {
            font-size: 16px;
            color: #000;
            font-weight: bold;
          }
          
          .section {
            margin-bottom: 40px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #d8b081;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
          
          .table th {
            background: #1a1a1a;
            color: #d8b081;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
          }
          
          .table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
          }
          
          .table tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          .highlight {
            color: #d8b081;
            font-weight: bold;
          }
          
          .total-box {
            background: #d8b081;
            color: #000;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          
          .total-label {
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .total-value {
            font-size: 24px;
            font-weight: bold;
          }
          
          .footer {
            background: #1a1a1a;
            color: #aaa;
            text-align: center;
            padding: 20px;
            margin-top: 40px;
            font-size: 12px;
            border-radius: 8px;
          }
          
          .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            ${isCompletadaEstado(entrega.estado || '') ? 'background: #10B981; color: white;' : 'background: #EF4444; color: white;'}
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">✂️ EDWINS BARBER</div>
          <div class="subtitle">Reporte de Entrega Individual</div>
          <div class="entrega-id">${entrega.id}</div>
        </div>
        
        <div class="container">
          <!-- Información General -->
          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">Barbero</div>
              <div class="info-value">${barberoNombre}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Fecha y Hora</div>
              <div class="info-value">${entrega.fecha} - ${entrega.hora}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Estado</div>
              <div class="info-value">
                <span class="status-badge">${getEstadoDisplay(entrega.estado || '')}</span>
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Responsable</div>
              <div class="info-value">${entrega.responsable}</div>
            </div>
          </div>

          <!-- Resumen -->
          <div class="total-box">
            <div class="total-label">Total de Insumos: ${entrega.cantidadTotal} unidades</div>
            <div class="total-value">${formatCurrency(entrega.valorTotal)}</div>
          </div>
          
          <!-- Detalle de Insumos -->
          <div class="section">
            <h2 class="section-title">📦 Insumos Entregados</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${entrega.insumosDetalle.map(insumo => `
                  <tr>
                    <td><strong>${insumo.nombre}</strong></td>
                    <td>${insumo.categoria}</td>
                    <td class="highlight">${insumo.cantidad}</td>
                    <td>${formatCurrency(insumo.precio)}</td>
                    <td class="highlight">${formatCurrency(insumo.cantidad * insumo.precio)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="footer">
          <p>Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
          <p><strong class="highlight">EDWINS BARBER</strong> - Sistema de Gestión de Insumos</p>
          <p>Entrega: ${entrega.id} | Barbero: ${barberoNombre}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Entrega_${entrega.id}_${String(barberoNombre).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }

    toast.success(`Reporte PDF generado para la entrega ${entrega.id}`, {
      style: {
        background: 'var(--color-gray-darkest)',
        border: '1px solid var(--color-orange-primary)',
        color: 'var(--color-white-primary)',
      },
    });
  };

  // Estadísticas
  const totalEntregas = entregas.reduce((sum: number, entrega: EntregaInsumo) => sum + entrega.valorTotal, 0);

  if (loading) {
    return (
      <main className="flex-1 overflow-auto p-8 bg-black-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-primary mx-auto mb-4"></div>
          <p className="text-white-primary text-lg">Cargando entregas...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Entrega de Insumos a Barberos</h1>
            <p className="text-sm text-gray-lightest mt-1">Gestión y control de entregas de insumos al personal</p>
          </div>

        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        {/* Sección Principal */}
        <div className="elegante-card">
          {/* Barra de Controles */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-dark">
            <div className="flex flex-wrap items-center gap-4">
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (open) {
                    setNuevaEntrega({
                      ...inicialNuevaEntrega,
                      fechaRegistro: generateCurrentDate()
                    });
                    setBarberoSearchTerm("");
                    setShowBarberoResults(false);
                    setInsumoSeleccionado(0);
                    setCantidadInsumo(0);
                    setCantidadInsumoInput('');
                    setInsumoSearchTerm("");
                    setShowInsumoResults(false);
                    setShowEntregaFormErrors(false);
                    setShowAddInsumoErrors(false);
                    setEntregaValidationAttempt(0);
                    setTarjetaInputsEntrega({});
                  }
                }}
              >
                <DialogTrigger asChild>
                  <button className="elegante-button-primary gap-2 flex items-center">
                    <Plus className="w-4 h-4" />
                    Nueva Entrega
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white-primary">Registrar Nueva Entrega</DialogTitle>
                    <DialogDescription className="text-gray-lightest">
                      Selecciona el barbero y los insumos a entregar
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white-primary flex items-center gap-2">
                            <Hash className="w-4 h-4 text-orange-primary" />
                            Número de Entrega (Automático)
                          </Label>
                          <Input
                            value={numeroEntregas.toString().padStart(3, "0")}
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
                            value={formatDate((nuevaEntrega as any).fechaRegistro || generateCurrentDate())}
                            disabled
                            readOnly
                            className="elegante-input bg-gray-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 relative">
                        <Label className="text-white-primary flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-orange-primary" />
                          Barbero *
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                          <Input
                            ref={barberoInputRef}
                            placeholder="Escribe para buscar un barbero..."
                            value={barberoSearchTerm}
                            onChange={(e) => {
                              setBarberoSearchTerm(e.target.value);
                              setShowBarberoResults(true);
                              setNuevaEntrega({ ...nuevaEntrega, barberoSeleccionado: 0 });
                            }}
                            onFocus={() => {
                              setBarberoSearchFocused(true);
                              setShowBarberoResults(true);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setBarberoSearchFocused(false);
                                setShowBarberoResults(false);
                              }, 120);
                            }}
                            className={`elegante-input pl-11 w-full ${showEntregaFormErrors && !nuevaEntrega.barberoSeleccionado ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                          />
                          {(barberoSearchFocused && showBarberoResults && barberoSearchTerm.trim() !== "") && (
                            <div className="absolute z-50 w-full mt-2 bg-gray-darkest border border-gray-dark rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-200">
                              {(() => {
                                const query = normalizeSearchText(barberoSearchTerm);
                                const filteredResults = barberos
                                  .filter(b => (b as any).estado === true || b.status === 'active')
                                  .filter((b) => {
                                    const searchableText = normalizeSearchText([
                                      b.id,
                                      b.nombre,
                                      b.apellido,
                                      b.tipoDocumento,
                                      b.documento,
                                      b.correo,
                                      b.telefono,
                                      b.direccion,
                                      b.barrio,
                                      b.rol,
                                      b.especialidad,
                                    ].join(" "));
                                    return searchableText.includes(query);
                                  })
                                  .slice(0, 50);

                                if (filteredResults.length === 0) {
                                  return (
                                    <div className="p-4 text-center text-gray-lightest italic">
                                      No se encontraron barberos que coincidan.
                                    </div>
                                  );
                                }

                                return filteredResults.map((barbero) => (
                                  <div
                                    key={barbero.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setNuevaEntrega({ ...nuevaEntrega, barberoSeleccionado: Number(barbero.id ?? 0) });
                                      setBarberoSearchTerm(
                                        `${getFullName(barbero.nombre, barbero.apellido) || ""}${barbero.documento ? ` — CC ${barbero.documento}` : ""}`
                                      );
                                      setShowBarberoResults(false);
                                      if (showEntregaFormErrors) setShowEntregaFormErrors(false);
                                    }}
                                    onClick={() => {
                                      setNuevaEntrega({ ...nuevaEntrega, barberoSeleccionado: Number(barbero.id ?? 0) });
                                      setBarberoSearchTerm(
                                        `${getFullName(barbero.nombre, barbero.apellido) || ""}${barbero.documento ? ` — CC ${barbero.documento}` : ""}`
                                      );
                                      setShowBarberoResults(false);
                                      if (showEntregaFormErrors) setShowEntregaFormErrors(false);
                                    }}
                                    className="p-3 border-b border-gray-dark hover:bg-gray-dark transition-colors cursor-pointer group"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-white-primary font-medium text-sm group-hover:text-orange-secondary transition-colors">
                                          {getFullName(barbero.nombre, barbero.apellido) || "Sin nombre"}
                                        </p>
                                        <p className="text-[10px] text-gray-lightest">
                                          {barbero.documento || "Sin documento"} · {barbero.correo || "Sin correo"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                        {showEntregaFormErrors && !nuevaEntrega.barberoSeleccionado && (
                          <p className="text-xs text-red-400 mt-1">Debes seleccionar un barbero del buscador.</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white-primary">Agregar Productos</h3>

                        <div ref={addProductoRowRef} className="grid grid-cols-3 gap-4">
                          <div className="space-y-2 relative">
                            <Label className="text-white-primary flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-orange-primary" />
                              Producto *
                            </Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                              <Input
                                ref={productoInputRef}
                                placeholder="Escribe para buscar un producto..."
                                value={insumoSearchTerm}
                                onChange={(e) => {
                                  setInsumoSearchTerm(e.target.value);
                                  setShowInsumoResults(true);
                                  setInsumoSeleccionado(0);
                                }}
                                onFocus={() => {
                                  setInsumoSearchFocused(true);
                                  setShowInsumoResults(true);
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setInsumoSearchFocused(false);
                                    setShowInsumoResults(false);
                                  }, 120);
                                }}
                                className={`elegante-input pl-11 pr-10 w-full ${showAddInsumoErrors && !insumoSeleccionado ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                              />
                              {insumoSearchTerm && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInsumoSearchTerm("");
                                    setInsumoSeleccionado(0);
                                    setShowInsumoResults(false);
                                  }}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white-primary z-10"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}

                              {(insumoSearchFocused && showInsumoResults && insumoSearchTerm.trim() !== "") && (
                                <div className="absolute z-50 w-full mt-2 bg-gray-darkest border border-gray-dark rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-200">
                                  {(() => {
                                    const query = normalizeSearchText(insumoSearchTerm);
                                    const filteredResults = insumos
                                      .filter(i =>
                                        normalizeSearchText([
                                             i.id,
                                          i.nombre,
                                          i.categoria,
                                          i.stock,
                                          i.stockInsumos,
                                          i.stockVentas
                                        ].join(" ")).includes(query)
                                      )
                                      .slice(0, 20);

                                    if (filteredResults.length === 0) {
                                      return (
                                        <div className="p-4 text-center text-gray-lightest italic">
                                          Sin resultados.
                                        </div>
                                      );
                                    }

                                    return filteredResults.map((insumo) => (
                                      <div
                                        key={insumo.id}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          setInsumoSeleccionado(Number(insumo.id));
                                          setInsumoSearchTerm(insumo.nombre);
                                          setShowInsumoResults(false);
                                          if (showAddInsumoErrors) setShowAddInsumoErrors(false);
                                        }}
                                        onClick={() => {
                                          setInsumoSeleccionado(Number(insumo.id));
                                          setInsumoSearchTerm(insumo.nombre);
                                          setShowInsumoResults(false);
                                          if (showAddInsumoErrors) setShowAddInsumoErrors(false);
                                        }}
                                        className="p-3 border-b border-gray-dark hover:bg-gray-dark transition-colors cursor-pointer group"
                                      >
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <p className="text-white-primary font-medium text-sm group-hover:text-orange-secondary transition-colors">
                                              {insumo.nombre}
                                            </p>
                                            <p className="text-[10px] text-gray-lightest">
                                              {insumo.categoria || 'Sin categoría'}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-[9px] text-gray-lightest leading-none mb-1">Stock insumos</p>
                                            <p className={`text-xs font-bold ${(((insumo.stockInsumos ?? insumo.stock) ?? 0) > 0) ? 'text-blue-400' : 'text-red-400'}`}>
                                              {insumo.stockInsumos !== undefined ? insumo.stockInsumos : insumo.stock}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              )}
                            </div>
                            {showAddInsumoErrors && !insumoSeleccionado && (
                              <p className="text-xs text-red-400 mt-1">Debes seleccionar un producto del buscador.</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Hash className="w-4 h-4 text-orange-primary" />
                              Cantidad *
                            </Label>
                            <Input
                              ref={cantidadInputRef}
                              type="number"
                              min="1"
                              className={`elegante-input no-spin ${showAddInsumoErrors && (!cantidadInsumoInput.trim() || !cantidadInsumo || cantidadInsumo <= 0) ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                              placeholder="Cantidad"
                              value={cantidadInsumoInput}
                              onKeyDown={(e) => {
                                if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') {
                                  e.preventDefault();
                                }
                              }}
                              onPaste={(e) => {
                                const text = e.clipboardData?.getData('text') || '';
                                if (/[^\d]/.test(text) || text.length > 2) {
                                  e.preventDefault();
                                  const cleaned = text.replace(/\D+/g, '').slice(0, 2);
                                  setCantidadInsumoInput(cleaned);
                                  const n = Number(cleaned || 0);
                                  setCantidadInsumo(Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)));
                                  if (showAddInsumoErrors) setShowAddInsumoErrors(false);
                                }
                              }}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D+/g, '').slice(0, 2);
                                setCantidadInsumoInput(cleaned);
                                const n = Number(cleaned || 0);
                                setCantidadInsumo(Number.isNaN(n) ? 0 : Math.max(0, Math.floor(n)));
                                if (showAddInsumoErrors) setShowAddInsumoErrors(false);
                              }}
                            />
                            {(() => {
                              const selected = insumos.find(i => Number(i.id) === Number(insumoSeleccionado));
                              const stockDisp = selected ? (selected.stockInsumos ?? selected.stock) : 0;
                              const qty = Number(cantidadInsumoInput || 0);
                              const existente = (() => {
                                if (!selected) return 0;
                                const yaAgregado = (nuevaEntrega.insumos || []).find(i => Number(i.id) === Number((selected as any).id));
                                return Number(yaAgregado?.cantidad || 0);
                              })();
                              const sumaDeseada = existente + (Number.isFinite(qty) ? qty : 0);
                              const showCantidadInsumoError = showAddInsumoErrors && (!cantidadInsumoInput.trim() || !cantidadInsumo || cantidadInsumo <= 0);
                              const isStockExceeded = !!selected && sumaDeseada > stockDisp;
                              const maxAdicional = Math.max(0, stockDisp - existente);
                              return (
                                <>
                                  {showCantidadInsumoError && !isStockExceeded && (
                                    <p className="text-xs text-red-400">Ingresa una cantidad válida.</p>
                                  )}
                                  {isStockExceeded && (
                                    <p className="text-xs text-red-500 font-bold animate-pulse mt-1">Stock maximo excedido ( maximo adicional: {maxAdicional} )</p>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white-primary">ㅤ</Label>
                            <button
                              type="button"
                              className="elegante-button-primary w-full"
                              onClick={agregarInsumo}
                            >
                              Agregar producto
                            </button>
                          </div>
                        </div>

                        

                        {showEntregaFormErrors && (nuevaEntrega.insumos || []).length === 0 && (
                          <p className="text-xs text-red-400">Debes agregar al menos un producto.</p>
                        )}
                      </div>
                    </div>

                    <div
                      ref={productosAgregadosRef}
                      className={`space-y-6 ${(showEntregaFormErrors && (nuevaEntrega.insumos || []).length === 0) ? `border border-red-500/60 rounded-lg p-3 ${shakeClass}` : ''}`}
                    >
                      <div>
                        <h4 className="text-white-primary font-semibold mb-3">Productos agregados</h4>
                        <div className="space-y-2 max-h-52 overflow-y-auto">
                          {(nuevaEntrega.insumos || []).length === 0 ? (
                            <p className="text-gray-lightest text-center py-4">No hay productos agregados</p>
                          ) : (
                            (nuevaEntrega.insumos || []).map((insumo) => (
                              <div key={insumo.id} className="bg-gray-darker rounded-lg px-3 py-2.5 border-l-2 border-orange-primary/20">
                                <div className="flex items-center gap-4 flex-nowrap min-w-0">
                                  <div className="shrink-0 w-6" aria-hidden />
                                  <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-dark border border-gray-dark flex items-center justify-center">
                                    <ImageRenderer
                                      url={
                                        insumo.imagen ||
                                        (insumo as any).imagenProduc ||
                                        (insumo as any).ImagenProduc ||
                                        (insumo as any).imagenUrl ||
                                        ''
                                      }
                                      alt={insumo.nombre}
                                      className="w-full h-full border-0 bg-transparent"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1 shrink flex flex-col items-center justify-center">
                                    <span
                                      className="text-white-primary font-semibold text-base truncate block text-center w-full"
                                      title={insumo.nombre}
                                    >
                                      {insumo.nombre}
                                    </span>
                                    <span className="text-[11px] text-gray-400 truncate block text-center w-full">
                                      {(insumo as any).categoria || 'Sin categoría'}
                                    </span>
                                  </div>

                                  <div className="flex flex-col gap-0.5 shrink-0">
                                    <label className="text-[11px] text-gray-400 font-normal">Cantidad</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={getTarjetaInputEntrega(insumo as any)}
                                      onChange={(e) => actualizarTarjetaInputEntrega(insumo.id, e.target.value)}
                                      className="w-12 h-7 text-xs text-center tabular-nums elegante-input no-spin py-0 px-1.5"
                                    />
                                  </div>

                                  <button
                                    onClick={() => eliminarInsumo(insumo.id)}
                                    className="shrink-0 p-2 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
                                    title="Eliminar producto"
                                    type="button"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white-primary font-semibold mb-4">Resumen</h4>
                        <div className="bg-gray-darker p-4 rounded-lg border border-gray-dark">
                          <div className="mt-1">
                            {(nuevaEntrega.insumos || []).length === 0 ? (
                              <p className="text-gray-lightest">No hay productos agregados</p>
                            ) : (
                              <p className="text-gray-lightest text-sm leading-relaxed">
                                {(nuevaEntrega.insumos || [])
                                  .map((i) => `${i.nombre} (${i.cantidad})`)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="pt-3 mt-3 border-t border-gray-medium flex items-center justify-between">
                            <span className="text-gray-lightest">Total productos</span>
                            <span className="text-orange-primary font-semibold text-base tracking-wide">
                              {(nuevaEntrega.insumos || []).reduce((sum, insumo) => sum + insumo.cantidad, 0)} unidades
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-dark">
                    <button
                      onClick={() => {
                        setIsDialogOpen(false);
                        setBarberoSearchTerm("");
                        setShowBarberoResults(false);
                        setInsumoSearchTerm("");
                        setShowInsumoResults(false);
                        setShowEntregaFormErrors(false);
                        setShowAddInsumoErrors(false);
                        setCantidadInsumo(0);
                        setCantidadInsumoInput('');
                        setTarjetaInputsEntrega({});
                      }}
                      className="elegante-button-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateEntrega}
                      className="elegante-button-primary flex items-center gap-2"
                      disabled={creatingDelivery}
                    >
                      {creatingDelivery ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Registrando...
                        </>
                      ) : (
                        'Registrar Entrega'
                      )}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por número, documento, nombre, responsable, insumos, fecha o estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="elegante-input pl-11 w-80"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-lightest">
                Mostrando {displayedEntregas.length} de {filteredEntregas.length} entregas
              </div>
            </div>
          </div>

          {/* Tabla de entregas */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-dark">
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Número</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Documento</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Nombre</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Total Insumos</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Fecha</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Estado</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayedEntregas.map((entrega) => (
                  <tr key={entrega.id} className="border-b border-gray-dark hover:bg-gray-darker transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-orange-primary" />
                        <span className="text-gray-lighter">
                          {String(entrega.id)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-lighter">
                          {`CC ${String((entrega as any).barberoDocumento || getBarberoDocumentoById((entrega as any).barberoId) || '')}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-dark border-2 border-gray-medium flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-lightest" />
                        </div>
                        <span className="text-gray-lighter">
                          {getBarberoNombreById((entrega as any).barberoId)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-lighter">{entrega.cantidadTotal} unidades</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-lighter">{formatDate(entrega.fecha || generateCurrentDate())}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${getEstadoColor(entrega.estado || '')}`}>
                        {getEstadoDisplay(entrega.estado || '')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                      {isCompletadaEstado(entrega.estado || '') && (
                          <button
                            onClick={() => handleAnularClick(entrega)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Anular entrega"
                          >
                            <Ban className="w-4 h-4 text-gray-lightest group-hover:text-red-400" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetails(entrega)}
                          className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4 text-gray-lightest group-hover:text-blue-400" />
                        </button>
                        <button
                          onClick={() => generateIndividualEntregaPDF(entrega)}
                          className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4 text-gray-lightest group-hover:text-green-400" />
                        </button>
                        
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-dark">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-lightest">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-lightest">Filas por página:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-8 bg-gray-darker border-gray-dark text-gray-lightest">
                      <SelectValue placeholder={itemsPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-darkest border-gray-dark text-gray-lightest">
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-lightest" />
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm transition-colors ${currentPage === pageNum
                          ? 'bg-orange-primary text-black-primary font-medium'
                          : 'border border-gray-dark hover:bg-gray-darker text-gray-lightest'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4 text-gray-lightest" />
                </button>
              </div>
            </div>
        </div>

        {/* Modal de detalles de entrega */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white-primary">Detalles de Entrega</DialogTitle>
              <DialogDescription className="text-gray-lightest">
                Información completa de la entrega
              </DialogDescription>
            </DialogHeader>

            {selectedEntrega && (
              <div className="space-y-6 py-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Hash className="w-4 h-4 text-orange-primary" />
                        Número de Entrega (Automático)
                      </Label>
                      <Input
                        value={String((selectedEntrega as any).documento || selectedEntrega.id || '###')}
                        disabled
                        readOnly
                        className="elegante-input bg-gray-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-primary" />
                        Fecha de Registro
                      </Label>
                      <Input
                        value={formatDate((selectedEntrega as any).fechaRegistro || selectedEntrega.fecha || generateCurrentDate())}
                        disabled
                        readOnly
                        className="elegante-input bg-gray-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <Label className="text-white-primary flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-orange-primary" />
                      Barbero
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                      <Input
                        value={getBarberoDisplay(selectedEntrega)}
                        disabled
                        readOnly
                        className="elegante-input pl-11 w-full bg-gray-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white-primary flex items-center gap-2">
                      Responsable
                    </Label>
                    <Input
                      value={getResponsableDisplay(selectedEntrega)}
                      disabled
                      className="elegante-input bg-gray-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white-primary flex items-center gap-2">
                      Estado
                    </Label>
                    <div className="h-10 flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor((selectedEntrega as any).estado || '')}`}>
                        {getEstadoDisplay((selectedEntrega as any).estado || '')}
                      </span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const detalleInsumos = getDetalleInsumosNormalized(selectedEntrega);
                  const totalCantidad = detalleInsumos.reduce((sum, i) => sum + (i.cantidad || 0), 0);

                  return (
                    <div className="space-y-6">
                      <div className="mt-8">
                        <div className="bg-gray-darker border border-gray-dark rounded-xl overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-primary/10 flex items-center justify-center border border-orange-primary/20">
                                  <Package className="w-5 h-5 text-orange-primary" />
                                </div>
                                <div>
                                  <h4 className="text-white-primary font-bold text-lg">Resumen</h4>
                                  <p className="text-xs text-gray-lighter">Productos agregados a la entrega</p>
                                </div>
                              </div>
                              <div className="bg-gray-dark/50 px-3 py-1.5 rounded-full border border-gray-medium">
                                <span className="text-xs font-medium text-gray-lightest">
                                  {detalleInsumos.length} {detalleInsumos.length === 1 ? 'producto único' : 'productos únicos'}
                                </span>
                              </div>
                            </div>

                            {detalleInsumos.length === 0 ? (
                              <div className="text-center py-10 border-2 border-dashed border-gray-dark rounded-xl bg-gray-darkest/30">
                                <Package className="w-12 h-12 mx-auto mb-3 text-gray-lightest opacity-50" />
                                <p className="text-gray-lightest text-sm">No hay productos en esta entrega</p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-gray-lighter font-semibold mb-3 ml-1"></p>
                                  <div className="flex flex-wrap gap-3">
                                    {detalleInsumos.map((item) => (
                                      <div 
                                        key={item.id}
                                        onClick={() => { setProductoDetalle(item); setIsProductoDetalleOpen(true); }}
                                        className="group relative flex items-center gap-3 bg-gray-darker/50 border border-gray-dark hover:border-orange-primary/30 rounded-xl pr-4 pl-2 py-2 transition-all duration-300 hover:bg-gray-dark/50 cursor-pointer"
                                      >
                                        <div className="relative shrink-0">
                                          <div className="w-10 h-10 rounded-lg bg-gray-dark overflow-hidden flex items-center justify-center">
                                            {item.imagen ? (
                                              <ImageRenderer
                                                url={item.imagen}
                                                alt={item.nombre}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="text-[11px] font-bold text-gray-300">
                                                {String(item.nombre || 'N').trim().charAt(0).toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex flex-col max-w-[140px]">
                                          <span className="text-xs font-semibold text-white-primary truncate group-hover:text-orange-primary transition-colors">
                                            {item.nombre}
                                          </span>
                                          <span className="text-[10px] text-gray-lighter truncate">
                                            {item.categoria}
                                          </span>
                                        </div>
                                        <div className="ml-auto">
                                          <span className="px-2 py-0.5 rounded-md bg-orange-primary text-black-primary text-[11px] font-bold tabular-nums">
                                            {item.cantidad}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-dark">
                                  <div className="bg-gray-darker/40 rounded-xl p-4 border border-gray-dark flex flex-col justify-between hover:border-gray-medium transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                      <p className="text-[10px] text-gray-lighter uppercase tracking-wider font-semibold">Total Unidades</p>
                                    </div>
                                    <div className="flex items-end gap-1.5">
                                      <span className="text-3xl font-bold text-white-primary tracking-tight">{totalCantidad}</span>
                                      <span className="text-xs text-gray-lighter font-medium mb-1.5">unds</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-dark">
              <button
                onClick={() => setIsDetailDialogOpen(false)}
                className="elegante-button-secondary"
              >
                Cancelar
              </button>
              {selectedEntrega && (
                <button
                  onClick={() => handleAnularClick(selectedEntrega)}
                  className={`elegante-button-primary ${isAnuladaEstado(String((selectedEntrega as any).estado || '')) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isAnuladaEstado(String((selectedEntrega as any).estado || ''))}
                  title={isAnuladaEstado(String((selectedEntrega as any).estado || '')) ? 'Entrega anulada' : 'Anular entrega'}
                >
                  {isAnuladaEstado(String((selectedEntrega as any).estado || '')) ? 'Entrega Anulada' : 'Anular Entrega'}
                </button>
              )}
              {selectedEntrega && (
                <button
                  onClick={() => generateIndividualEntregaPDF(selectedEntrega)}
                  className="elegante-button-primary"
                >
                  
                  Descargar PDF
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isProductoDetalleOpen} onOpenChange={setIsProductoDetalleOpen}>
          <DialogContent className="bg-gray-darkest border-gray-dark max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white-primary flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-primary" />
                Detalle del Producto
              </DialogTitle>
              <DialogDescription className="text-gray-lightest">
                Información del producto seleccionado
              </DialogDescription>
            </DialogHeader>
            {productoDetalle && (() => {
              const insumoActual = insumos.find(i => Number(i.id) === Number(productoDetalle.id));
              const stockVentasActual = Number(insumoActual?.stockVentas ?? 0);
              const stockInsumosActual = Number(insumoActual?.stockInsumos ?? insumoActual?.stock ?? 0);
              const cantidadEntrega = Number(productoDetalle.cantidad || 0);
              return (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-darker overflow-hidden flex items-center justify-center border border-gray-dark">
                      {productoDetalle.imagen ? (
                        <ImageRenderer url={productoDetalle.imagen} alt={productoDetalle.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-gray-300">
                          {String(productoDetalle.nombre || 'N').trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="elegante-input h-9 text-sm flex items-center px-3 bg-gray-darker border border-gray-dark mb-2 truncate">
                        {productoDetalle.nombre}
                      </div>
                      <div className="elegante-input h-9 text-sm flex items-center px-3 bg-gray-darker border border-gray-dark truncate">
                        {productoDetalle.categoria || 'Sin categoría'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-white-primary text-xs">Cantidad de entrega</Label>
                      <div className="elegante-input h-9 text-sm flex items-center px-3 bg-gray-darker border border-gray-dark">
                        {cantidadEntrega}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white-primary text-xs">Stock Ventas actual</Label>
                      <div className="elegante-input h-9 text-sm flex items-center px-3 bg-gray-darker border border-gray-dark">
                        {stockVentasActual}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white-primary text-xs">Stock Insumos actual</Label>
                      <div className="elegante-input h-9 text-sm flex items-center px-3 bg-gray-darker border border-gray-dark">
                        {stockInsumosActual}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-dark">
              <button
                onClick={() => setIsProductoDetalleOpen(false)}
                className="elegante-button-secondary px-6"
              >
                Cerrar
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <DoubleConfirmationContainer />
      <AlertContainer />
    </>
  );
}
