import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
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
  const { confirmCreateAction, confirmDeleteAction, confirmEditAction, DoubleConfirmationContainer } = useDoubleConfirmation();

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
  const [itemsPerPage] = useState(5);
  const [insumoSearchTerm, setInsumoSearchTerm] = useState("");
  const [showInsumoResults, setShowInsumoResults] = useState(false);

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

        setBarberos(barberosData.filter(b => b.estado === true));
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
    fechaEntrega: new Date().toISOString().split('T')[0],
    horaEntrega: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    responsable: 'Admin Principal',
    insumos: [] as InsumoEntrega[]
  };

  const [nuevaEntrega, setNuevaEntrega] = useState(inicialNuevaEntrega);

  const [insumoSeleccionado, setInsumoSeleccionado] = useState(0); // Cambiar a number

  const [cantidadInsumo, setCantidadInsumo] = useState(1);

  // Filtros y paginación
  const filteredEntregas = entregas.filter(entrega => {
    const barberoNombre = getBarberoNombreById((entrega as any).barberoId);
    const entregaId = String(entrega.id || '');

    return barberoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entregaId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredEntregas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedEntregas = filteredEntregas.slice(startIndex, startIndex + itemsPerPage);

  // Funciones auxiliares
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Entregado": return "bg-green-600 text-white";
      case "Anulado": return "bg-red-600 text-white";
      default: return "bg-gray-medium text-white";
    }
  };

  const agregarInsumo = () => {
    console.log('🧪 Click Agregar insumo', {
      insumoSeleccionado,
      cantidadInsumo,
      nuevaEntregaInsumos: nuevaEntrega.insumos,
      insumosCount: insumos.length,
    });

    if (!insumoSeleccionado) {
      toast.error('Selecciona un producto antes de agregar');
      console.warn('🟡 No se agregó: insumoSeleccionado vacío/0');
      return;
    }

    if (!cantidadInsumo || cantidadInsumo <= 0) {
      toast.error('Ingresa una cantidad válida');
      console.warn('🟡 No se agregó: cantidadInsumo inválida', { cantidadInsumo });
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

    // Verificar stock disponible
    if (cantidadInsumo > insumo.stock) {
      toast.error(`No hay suficiente stock. Disponible: ${insumo.stock} unidades`);
      console.warn('🟡 No se agregó: stock insuficiente', {
        id: insumo.id,
        nombre: insumo.nombre,
        solicitado: cantidadInsumo,
        disponible: insumo.stock,
      });
      return;
    }

    const insumosActuales = nuevaEntrega.insumos || [];
    const existeInsumo = insumosActuales.find(i => Number(i.id) === Number(insumo.id));
    console.log('🧪 Estado antes de agregar', { insumosActuales, existeInsumo });

    if (existeInsumo) {
      const nuevaCantidad = existeInsumo.cantidad + cantidadInsumo;
      if (nuevaCantidad > insumo.stock) {
        toast.error(`No hay suficiente stock. Disponible: ${insumo.stock} unidades`);
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
    }

    setInsumoSeleccionado(0);
    setCantidadInsumo(1);
    setInsumoSearchTerm("");
    setShowInsumoResults(false);

    console.log('✅ Producto agregado a la entrega:', { id: insumo.id, nombre: insumo.nombre, cantidad: cantidadInsumo });
  };

  const eliminarInsumo = (insumoId: number) => {
    const insumosActuales = nuevaEntrega.insumos || [];
    setNuevaEntrega({
      ...nuevaEntrega,
      insumos: insumosActuales.filter(i => i.id !== insumoId)
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
      fechaEntrega: nuevaEntrega.fechaEntrega,
      insumosCount: (nuevaEntrega.insumos || []).length,
      insumos: nuevaEntrega.insumos,
    });

    if (!nuevaEntrega.barberoSeleccionado || !nuevaEntrega.insumos || nuevaEntrega.insumos.length === 0) {
      toast.error('Por favor complete todos los campos obligatorios');
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
          return {
            ...insumo,
            stock: insumo.stock - insumoEntregado.cantidad
          };
        }
        return insumo;
      });

      setInsumos(nuevosInsumos);
      // refrescar lista desde API para evitar inconsistencias
      const entregasActualizadas = await entregaInsumosService.getEntregas();
      setEntregas(entregasActualizadas);
      setNuevaEntrega(inicialNuevaEntrega);
      setInsumoSearchTerm("");
      setShowInsumoResults(false);
      setIsDialogOpen(false);

      toast.success(`Entrega ${numeroEntrega} registrada exitosamente para ${getFullName(barbero?.nombre, barbero?.apellido) || 'Sin asignar'}`);
    } catch (error: any) {
      console.error('Error creando entrega:', error);
      toast.error(error?.message || 'Error al registrar la entrega');
    } finally {
      setCreatingDelivery(false);
    }
  };

  // Función para ver detalles completos de una entrega consumiendo la API
  const handleViewDetails = async (entrega: EntregaInsumo) => {
    try {
      console.log(`🔍 Obteniendo detalles completos de entrega ${entrega.id}...`);

      // Obtener detalles completos desde la API
      const entregaCompleta = await entregaInsumosService.getEntregaById(entrega.id.toString());

      if (entregaCompleta) {
        console.log('✅ Detalles completos obtenidos:', entregaCompleta);
        console.log('🔍 Estructura del barbero:', (entregaCompleta as any).barbero);
        console.log('🔍 Barbero ID:', (entregaCompleta as any).barberoId);
        console.log('🔍 Estructura de insumosDetalle:', (entregaCompleta as any).insumosDetalle);
        console.log('🔍 Tipo de insumosDetalle:', typeof (entregaCompleta as any).insumosDetalle);
        console.log('🔍 Length de insumosDetalle:', (entregaCompleta as any).insumosDetalle?.length);
        console.log('🔍 Todos los detalles de la entrega:', JSON.stringify(entregaCompleta, null, 2));
        setSelectedEntrega(entregaCompleta);
      } else {
        console.warn('⚠️ No se pudieron obtener detalles completos, usando datos locales');
        setSelectedEntrega(entrega);
      }

      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('❌ Error obteniendo detalles de entrega:', error);
      // Si falla la API, mostrar los datos locales que tenemos
      setSelectedEntrega(entrega);
      setIsDetailDialogOpen(true);
      toast.error('No se pudieron cargar los detalles completos');
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
              return {
                ...insumo,
                stock: insumo.stock + detalleDevuelto.cantidad
              };
            }
            return insumo;
          });
          setInsumos(nuevosInsumos);

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
            ${entrega.estado === 'Entregado' ? 'background: #10B981; color: white;' : 'background: #EF4444; color: white;'}
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
                <span class="status-badge">${entrega.estado}</span>
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
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-darkest border border-gray-dark rounded-lg p-6 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-primary"></div>
              <span className="text-white-primary">Cargando datos...</span>
            </div>
          </div>
        )}

        {/* Sección Principal */}
        <div className="elegante-card">
          {/* Barra de Controles */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-dark">
            <div className="flex flex-wrap items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                    {/* Formulario de entrega */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-white-primary">Barbero</Label>
                        <select
                          value={nuevaEntrega.barberoSeleccionado}
                          onChange={(e) => setNuevaEntrega({ ...nuevaEntrega, barberoSeleccionado: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-darker border border-gray-dark rounded-lg text-white-primary focus:outline-none focus:ring-2 focus:ring-blue-primary"
                        >
                          {barberos
                            .filter(barbero => (barbero as any).estado === true || barbero.status === 'active')
                            .map((barbero) => (
                              <option key={barbero.id} value={barbero.id}>
                                {barbero.nombre} {barbero.apellido ? ` ${barbero.apellido}` : ""}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white-primary">Fecha de Entrega</Label>
                        <Input
                          type="text"
                          className="elegante-input"
                          value={nuevaEntrega.fechaEntrega}
                          onChange={(e) => setNuevaEntrega({ ...nuevaEntrega, fechaEntrega: e.target.value })}
                        />
                      </div>

                      <div className="border-t border-gray-dark pt-6">
                        <h4 className="text-white-primary font-semibold mb-4">Agregar Insumos</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                              <Input
                                placeholder="Buscar insumo..."
                                value={insumoSearchTerm}
                                onChange={(e) => {
                                  setInsumoSearchTerm(e.target.value);
                                  setShowInsumoResults(true);
                                }}
                                onFocus={() => setShowInsumoResults(true)}
                                className="elegante-input pl-10 pr-10 w-full"
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

                              {showInsumoResults && insumoSearchTerm.trim() !== "" && (
                                <div className="absolute z-50 w-full mt-2 bg-gray-darkest border border-gray-dark rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-200">
                                  {(() => {
                                    const query = normalizeSearchText(insumoSearchTerm);
                                    const filteredResults = insumos.filter(i =>
                                      normalizeSearchText(i.nombre).includes(query) && i.stock > 0
                                    ).slice(0, 20);

                                    if (filteredResults.length === 0) {
                                      return (
                                        <div className="p-4 text-center text-gray-lightest italic">
                                          Sin resultados o sin stock.
                                        </div>
                                      );
                                    }

                                    return filteredResults.map((insumo) => (
                                      <div
                                        key={insumo.id}
                                        onClick={() => {
                                          setInsumoSeleccionado(Number(insumo.id));
                                          setInsumoSearchTerm(insumo.nombre);
                                          setShowInsumoResults(false);
                                        }}
                                        className="p-3 border-b border-gray-dark hover:bg-gray-dark transition-colors cursor-pointer group"
                                      >
                                        <div className="flex justify-between items-center">
                                          <div>
                                            <p className="text-white-primary font-medium text-sm group-hover:text-orange-secondary transition-colors">
                                              {insumo.nombre}
                                            </p>
                                            <p className="text-[10px] text-gray-lightest">{insumo.categoria}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-[9px] text-gray-lightest uppercase tracking-widest leading-none mb-1">Stock</p>
                                            <p className="text-xs font-bold text-green-400">
                                              {insumo.stock}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              )}
                            </div>
                            <Input
                              type="number"
                              min="1"
                              className="elegante-input no-spin"
                              placeholder="Cantidad"
                              value={cantidadInsumo}
                              onChange={(e) => setCantidadInsumo(parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="space-y-2">
                            {/* Imagen del insumo seleccionado */}
                            {insumoSeleccionado > 0 && insumos.find(i => i.id === insumoSeleccionado)?.imagen && (
                              <div className="w-full h-10 flex items-center gap-2 px-3 py-1 bg-gray-darker border border-gray-dark rounded-lg">
                                <ImageRenderer
                                  url={insumos.find(i => i.id === insumoSeleccionado)?.imagen}
                                  alt="Vista previa"
                                  className="w-8 h-8 rounded object-cover"
                                />
                                <span className="text-xs text-gray-lightest truncate">Imagen disponible</span>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="elegante-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed "
                            onClick={agregarInsumo}
                            disabled={!insumoSeleccionado}
                          >
                            Agregar insumo

                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Resumen de la entrega */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-white-primary font-semibold mb-4">Resumen de la Entrega</h4>
                        <div className="bg-gray-darker p-4 rounded-lg border border-gray-dark">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-lightest">Total Insumos:</span>
                            <span className="text-white-primary font-semibold">
                              {(nuevaEntrega.insumos || []).reduce((sum, insumo) => sum + insumo.cantidad, 0)} unidades
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-lightest">Valor Total:</span>
                            <span className="text-orange-primary font-bold">
                              ${formatCurrency(calcularTotalEntrega())}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white-primary font-semibold mb-3">Insumos Seleccionados</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {(nuevaEntrega.insumos || []).length === 0 ? (
                            <p className="text-gray-lightest text-center py-4">No hay insumos seleccionados</p>
                          ) : (
                            (nuevaEntrega.insumos || []).map((insumo) => (
                              <div key={insumo.id} className="flex justify-between items-center p-3 bg-gray-darker rounded-lg border border-gray-dark">
                                <div className="flex items-center gap-2 flex-1">
                                  <ImageRenderer
                                    url={
                                      insumo.imagen ||
                                      insumo.imagenProduc ||
                                      insumo.ImagenProduc ||
                                      insumo.imagenUrl ||
                                      detalle.imagen ||
                                      detalle.imagenProduc ||
                                      ''
                                    }
                                    alt={insumo.nombre}
                                    className="w-8 h-8 border-0 bg-transparent rounded object-cover"
                                  />
                                  <div>
                                    <div className="text-white-primary font-medium">{insumo.nombre}</div>
                                    <div className="text-sm text-gray-lightest">{insumo.categoria} • ${formatCurrency(insumo.precio)} c/u</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-orange-primary font-semibold">{insumo.cantidad}</span>
                                  <button
                                    onClick={() => eliminarInsumo(insumo.id)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-dark">
                    <button
                      onClick={() => {
                        setIsDialogOpen(false);
                        setInsumoSearchTerm("");
                        setShowInsumoResults(false);
                      }}
                      className="elegante-button-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateEntrega}
                      className="elegante-button-primary flex items-center gap-2"
                      disabled={!nuevaEntrega.barberoSeleccionado || (nuevaEntrega.insumos || []).length === 0 || creatingDelivery}
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
                  placeholder="Buscar por barbero o ID..."
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
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Documento</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Barbero</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Fecha</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Insumos</th>
                  <th className="text-right py-3 px-4 text-white-primary font-bold text-sm">Total</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Estado</th>
                  <th className="text-right py-3 px-4 text-white-primary font-bold text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayedEntregas.map((entrega) => (
                  <tr key={entrega.id} className="border-b border-gray-dark hover:bg-gray-darker transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-orange-primary" />
                        <span className="text-gray-lighter">
                          {(entrega as any).documento || entrega.barberoDocumento || entrega.id}
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
                      <span className="text-sm text-gray-lighter">{entrega.fecha?.split(' ')[0] || entrega.fecha}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-lighter">{entrega.cantidadTotal} unidades</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-gray-lighter">
                        ${formatCurrency(entrega.valorTotal)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-3 py-1 rounded-full text-xs bg-gray-medium text-gray-lighter">
                        {entrega.estado}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {entrega.estado === "Entregado" && (
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

        {/* Modal de detalles de entrega */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-gray-darkest border-gray-dark max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-white-primary">Detalles de Entrega {selectedEntrega?.id}</DialogTitle>
              <DialogDescription className="text-gray-lightest">
                Información completa de la entrega realizada
              </DialogDescription>
            </DialogHeader>

            {selectedEntrega && (
              <div className="space-y-6 py-4">
                {/* Información general */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-lightest">Barbero:</span>
                      <p className="text-white-primary font-semibold">
                        {(selectedEntrega as any).barbero
                          ? (typeof (selectedEntrega as any).barbero === 'object'
                            ? getFullName((selectedEntrega as any).barbero.nombre, (selectedEntrega as any).barbero.apellido)
                            : String((selectedEntrega as any).barbero))
                          : getBarberoNombreById((selectedEntrega as any).barberoId)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-lightest">Fecha y Hora:</span>
                      <p className="text-white-primary font-semibold">
                        {selectedEntrega.fecha?.split(' ')[0] || 'Sin fecha'} - {selectedEntrega.hora || 'Sin hora'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-lightest">Estado:</span>
                      <p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(selectedEntrega.estado || 'Desconocido')}`}>
                          {selectedEntrega.estado || 'Desconocido'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-lightest">Responsable:</span>
                      <p className="text-white-primary font-semibold">
                        {getUsuarioNombreById((selectedEntrega as any).usuarioId) || selectedEntrega.responsable || 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-gray-darker p-4 rounded-lg border border-gray-dark">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white-primary">{selectedEntrega.cantidadTotal || 0}</div>
                      <div className="text-gray-lightest">Insumos Entregados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-primary">${formatCurrency(selectedEntrega.valorTotal || 0)}</div>
                      <div className="text-gray-lightest">Valor Total</div>
                    </div>
                  </div>
                </div>

                {/* Lista de insumos */}
                <div>
                  <h4 className="text-white-primary font-semibold mb-3">Insumos Entregados</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(() => {
                      const insumos = selectedEntrega.insumosDetalle ||
                        (selectedEntrega as any).detalleEntregasInsumos ||
                        (selectedEntrega as any).detalles ||
                        (selectedEntrega as any).insumos ||
                        (selectedEntrega as any).productos ||
                        [];

                      console.log('🔍 Insumos a mostrar:', insumos);

                      return insumos && insumos.length > 0 ? (
                        insumos.map((detalle: any, index: number) => {
                          const insumo = detalle.producto || detalle;
                          return (
                            <div key={detalle.id || index} className="flex justify-between items-center p-3 bg-gray-darker rounded-lg border border-gray-dark">
                              <div className="flex items-center gap-2 flex-1">
                                <ImageRenderer
                                  url={
                                    insumo.imagen ||
                                    insumo.imagenProduc ||
                                    insumo.ImagenProduc ||
                                    insumo.imagenUrl ||
                                    detalle.imagen ||
                                    detalle.imagenProduc ||
                                    ''
                                  }
                                  alt={insumo.nombre}
                                  className="w-8 h-8 border-0 bg-transparent rounded object-cover"
                                />
                                <div>
                                  <div className="text-white-primary font-medium">
                                    {insumo.nombre || `Insumo ${index + 1}`}
                                  </div>
                                  <div className="text-sm text-gray-lightest">
                                    {insumo.categoria?.nombre || 'Sin categoría'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-orange-primary font-semibold">{detalle.cantidad || 0} unidades</div>
                                <div className="text-sm text-gray-lightest">${formatCurrency(detalle.precioHistorico || insumo.precioVenta || 0)} c/u</div>
                              </div>
                              <div className="ml-4 text-right">
                                <div className="text-white-primary font-semibold">
                                  ${formatCurrency((detalle.cantidad || 0) * (detalle.precioHistorico || insumo.precioVenta || 0))}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-lightest">
                          No hay detalles de insumos disponibles para esta entrega
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-dark">
              <button
                onClick={() => setIsDetailDialogOpen(false)}
                className="elegante-button-secondary"
              >
                Cerrar
              </button>
              {selectedEntrega && (
                <button
                  onClick={() => generateIndividualEntregaPDF(selectedEntrega)}
                  className="elegante-button-primary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <DoubleConfirmationContainer />
    </>
  );
}