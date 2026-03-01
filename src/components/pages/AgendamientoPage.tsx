import { useState, useEffect } from "react";
import { agendamientoService } from "../../services/agendamientoService";
import { barberosService } from "../../services/barberosService";
import { servicioService } from "../../services/servicioService";
import { clientesService } from "../../services/clientesService";
import { apiService } from "../../services/api";
import { Input } from "../ui/input";
import { Calendar, Clock, User, Edit, Trash2, Search, ChevronLeft, ChevronRight, Eye, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useCustomAlert } from "../ui/custom-alert";

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const horasDelDia = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 AM a 9:00 PM

// Los datos se cargan dinámicamente desde la API

const estados = [
  { value: "Pendiente", label: "Pendiente", color: "bg-orange-primary" },
  { value: "Confirmada", label: "Confirmada", color: "bg-orange-primary text-black-primary" },
  { value: "En Proceso", label: "En Proceso", color: "bg-green-600" },
  { value: "Completada", label: "Completada", color: "bg-blue-600" },
  { value: "Cancelada", label: "Cancelada", color: "bg-red-600" }
];

// Función para formatear precios
const formatearPrecio = (precio: number): string => {
  const precioEntero = Math.round(precio);
  return `$ ${precioEntero.toLocaleString('es-CO')}`;
};

export function AgendamientoPage() {
  const { success, error, AlertContainer } = useCustomAlert();
  const [citas, setCitas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listas para los selects
  const [serviciosList, setServiciosList] = useState<any[]>([]);
  const [paquetesList, setPaquetesList] = useState<any[]>([]);
  const [barberosList, setBarberosList] = useState<any[]>([]);
  const [clientesList, setClientesList] = useState<any[]>([]);

  const [currentWeek, setCurrentWeek] = useState(0);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [citasData, barberosData, serviciosData, clientesData, paquetesData] = await Promise.all([
        agendamientoService.getAgendamientos(),
        barberosService.getBarberos(),
        servicioService.getServicios(),
        clientesService.getClientes(),
        apiService.getPaquetes()
      ]);

      setCitas(citasData);
      setBarberosList(barberosData.filter(b => b.estado === true));
      setServiciosList(serviciosData.filter(s => s.estado === true));
      setClientesList(clientesData.filter(c => c.estado === true));
      setPaquetesList(paquetesData.filter(p => p.activo === true));
    } catch (err) {
      console.error("Error al cargar datos:", err);
      // Fallback a los datos estáticos si hay error (opcional, pero mejor mostrar error)
      error("Error de conexión", "No se pudieron cargar los datos desde el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Estados para el modal de gestión de franja horaria
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ dia: string, hora: number, fecha: string } | null>(null);
  const [slotSearchTerm, setSlotSearchTerm] = useState("");
  const [slotFilterEstado, setSlotFilterEstado] = useState("all");
  const [activeTab, setActiveTab] = useState<'lista' | 'crear' | 'detalle'>('lista');
  const [selectedCita, setSelectedCita] = useState<any>(null);

  // Estados para formulario de nueva cita
  const [nuevaCita, setNuevaCita] = useState({
    clienteId: 0,
    cliente: '',
    telefono: '',
    servicioId: null as number | null,
    paqueteId: null as number | null,
    servicio: '',
    barberoId: 0,
    barbero: '',
    fecha: '',
    hora: '',
    duracion: 60,
    precio: 0,
    estado: 'Pendiente',
    notas: ''
  });

  // Estados para confirmaciones
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [citaToDelete, setCitaToDelete] = useState<any>(null);

  // Funciones auxiliares para el calendario
  const getCurrentWeekDays = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (currentWeek * 7));
    return diasSemana.map((dia, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return {
        dia,
        fecha: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        fechaCompleta: date.toISOString().split('T')[0]
      };
    });
  };

  const getCitasPorDia = (dia: string) => {
    const today = new Date();
    const currentWeekStart = new Date();
    currentWeekStart.setDate(today.getDate() + (currentWeek * 7));

    const dayIndex = diasSemana.indexOf(dia);
    const targetDate = new Date(currentWeekStart);
    targetDate.setDate(currentWeekStart.getDate() + dayIndex);

    const targetDateString = targetDate.toISOString().split('T')[0];

    return citas.filter(cita => cita.fecha === targetDateString);
  };

  // Obtener citas específicas para una hora y día
  const getCitasEnSlot = (dia: string, hora: number) => {
    const citasDelDia = getCitasPorDia(dia);
    return citasDelDia.filter(cita => {
      const horaSplit = cita.hora.split(':');
      const horaInicio = parseInt(horaSplit[0] || '0');
      // minutosInicio no se usa actualmente para el cálculo de bloques de hora plana


      const horaFin = horaInicio + Math.ceil(cita.duracion / 60);
      return horaInicio <= hora && hora < horaFin;
    }).filter(cita => {
      // Aplicar filtros de búsqueda
      const matchesSearch = cita.clienteNombre.toLowerCase().includes(slotSearchTerm.toLowerCase()) ||
        cita.telefono.includes(slotSearchTerm) ||
        cita.servicioNombre.toLowerCase().includes(slotSearchTerm.toLowerCase());
      const matchesEstado = slotFilterEstado === "all" || cita.estado === slotFilterEstado;
      return matchesSearch && matchesEstado;
    });
  };

  const getCitaColor = (estado: string) => {
    switch (estado) {
      case 'Confirmada': return '#d8b081';
      case 'En Proceso': return '#22C55E';
      case 'Completada': return '#3B82F6';
      case 'Cancelada': return '#EF4444';
      case 'Pendiente': return '#d8b081';
      default: return '#d8b081';
    }
  };

  const getEstadoInfo = (estado: string) => {
    const estadoInfo = estados.find(e => e.value === estado);
    return estadoInfo || { value: estado, label: estado, color: "bg-gray-medium" };
  };

  // Manejar clic en celda del calendario
  const handleSlotClick = (dia: string, hora: number) => {
    const weekDays = getCurrentWeekDays();
    const dayInfo = weekDays.find(d => d.dia === dia);

    setSelectedSlot({
      dia,
      hora,
      fecha: dayInfo?.fechaCompleta || ''
    });

    // Preparar formulario para nueva cita
    const horaString = hora.toString().padStart(2, '0') + ':00';
    setNuevaCita({
      clienteId: 0,
      cliente: '',
      telefono: '',
      servicioId: null,
      paqueteId: null,
      servicio: '',
      barberoId: 0,
      barbero: '',
      fecha: dayInfo?.fechaCompleta || '',
      hora: horaString,
      duracion: 60,
      precio: 0,
      estado: 'Pendiente',
      notas: ''
    });

    setActiveTab('lista');
    setSlotSearchTerm("");
    setSlotFilterEstado("all");
    setIsSlotModalOpen(true);
  };

  // Manejar selección de servicio o paquete
  const handleItemChange = (value: string) => {
    if (value.startsWith('p-')) {
      // Es un paquete
      const id = parseInt(value.replace('p-', ''));
      const paquete = paquetesList.find(p => p.id === id);
      setNuevaCita({
        ...nuevaCita,
        paqueteId: id,
        servicioId: null,
        servicio: paquete ? paquete.nombre : '',
        precio: paquete ? paquete.precio : 0,
        duracion: paquete ? paquete.duracion : 60
      });
    } else {
      // Es un servicio
      const id = parseInt(value);
      const servicio = serviciosList.find(s => s.id === id);
      setNuevaCita({
        ...nuevaCita,
        servicioId: id,
        paqueteId: null,
        servicio: servicio ? servicio.nombre : '',
        precio: servicio ? servicio.precio : 0,
        duracion: servicio ? (servicio.duracion || 60) : 60
      });
    }
  };

  // Crear nueva cita
  const handleCreateCita = async () => {
    if (!nuevaCita.clienteId || (!nuevaCita.servicioId && !nuevaCita.paqueteId) || !nuevaCita.barberoId) {
      error("Campos obligatorios faltantes", "Por favor selecciona un cliente, un servicio/paquete y un barbero.");
      return;
    }

    try {
      const created = await agendamientoService.createAgendamiento({
        clienteId: nuevaCita.clienteId,
        barberoId: nuevaCita.barberoId,
        servicioId: nuevaCita.servicioId,
        paqueteId: nuevaCita.paqueteId,
        fecha: nuevaCita.fecha,
        hora: nuevaCita.hora,
        duracion: nuevaCita.duracion,
        precio: nuevaCita.precio,
        estado: nuevaCita.estado,
        notas: nuevaCita.notas
      });

      setCitas([...citas, created]);
      setNuevaCita({
        clienteId: 0,
        cliente: '',
        telefono: '',
        servicioId: null,
        paqueteId: null,
        servicio: '',
        barberoId: 0,
        barbero: '',
        fecha: selectedSlot?.fecha || '',
        hora: selectedSlot?.hora.toString().padStart(2, '0') + ':00' || '',
        duracion: 60,
        precio: 0,
        estado: 'Pendiente',
        notas: ''
      });

      success("¡Cita creada exitosamente!", `La cita ha sido registrada.`);
      setActiveTab('lista');
    } catch (err) {
      error("Error al crear cita", "No se pudo conectar con el servidor.");
    }
  };

  // Editar cita
  const handleEditCita = (cita: any) => {
    setSelectedCita(cita);
    setNuevaCita({
      clienteId: cita.clienteId,
      cliente: cita.clienteNombre,
      telefono: cita.clienteTelefono || '',
      servicioId: cita.servicioId,
      paqueteId: cita.paqueteId,
      servicio: cita.servicioNombre || cita.paqueteNombre || '',
      barberoId: cita.barberoId,
      barbero: cita.barberoNombre,
      fecha: cita.fecha,
      hora: cita.hora,
      duracion: cita.duracion,
      precio: cita.precio,
      estado: cita.estado,
      notas: cita.notas
    });
    setActiveTab('crear');
  };

  // Actualizar cita
  const handleUpdateCita = async () => {
    if (!nuevaCita.clienteId || (!nuevaCita.servicioId && !nuevaCita.paqueteId) || !nuevaCita.barberoId) {
      error("Campos obligatorios faltantes", "Por favor selecciona un cliente, servicio/paquete y un barbero.");
      return;
    }

    try {
      await agendamientoService.updateAgendamiento(selectedCita.id, {
        clienteId: nuevaCita.clienteId,
        barberoId: nuevaCita.barberoId,
        servicioId: nuevaCita.servicioId,
        paqueteId: nuevaCita.paqueteId,
        fecha: nuevaCita.fecha,
        hora: nuevaCita.hora,
        duracion: nuevaCita.duracion,
        precio: nuevaCita.precio,
        estado: nuevaCita.estado,
        notas: nuevaCita.notas
      });

      // Refrescamos todos los datos para asegurar que los nombres y detalles sean correctos
      await fetchData();

      success("¡Cita actualizada exitosamente!", `Los cambios han sido guardados correctamente.`);
      setSelectedCita(null);
      setActiveTab('lista');
    } catch (err) {
      console.error("Error al actualizar:", err);
      error("Error al actualizar", "No se pudieron guardar los cambios en el servidor.");
    }
  };

  // Eliminar cita
  const handleDeleteCita = (cita: any) => {
    console.log("Iniciando eliminación de cita:", cita);
    setCitaToDelete(cita);
    setIsSlotModalOpen(false); // Cerramos el modal de la franja para evitar conflictos de capas
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCita = async () => {
    console.log("LLAMANDO A confirmDeleteCita - Cita ID:", citaToDelete?.id);
    if (citaToDelete) {
      try {
        console.log("Ejecutando agendamientoService.deleteAgendamiento físico...");
        await agendamientoService.deleteAgendamiento(citaToDelete.id);
        console.log("Eliminación física exitosa en el servidor");

        // Refrescamos todos los datos desde el servidor para asegurar sincronización total
        await fetchData();

        setIsDeleteDialogOpen(false);
        setCitaToDelete(null);
        success("¡Cita eliminada!", `La cita ha sido eliminada permanentemente del sistema.`);
      } catch (err: any) {
        console.error("ERROR CRÍTICO AL ELIMINAR:", err);
        error("Error al eliminar", err.message || "No se pudo realizar la operación.");
      }
    } else {
      console.warn("No hay cita seleccionada para eliminar (citaToDelete es null)");
    }
  };

  // Cambiar estado de cita
  const handleChangeEstado = async (citaId: number, nuevoEstado: string) => {
    try {
      await agendamientoService.updateAgendamientoStatus(citaId, nuevoEstado);
      setCitas(citas.map(cita =>
        cita.id === citaId ? { ...cita, estado: nuevoEstado } : cita
      ));
      success("Estado actualizado", "El estado de la cita ha sido modificado.");
    } catch (err) {
      error("Error al actualizar estado", "No se pudieron guardar los cambios.");
    }
  };

  // Ver detalle de cita
  const handleViewDetail = (cita: any) => {
    setSelectedCita(cita);
    setActiveTab('detalle');
  };

  // Stats para el dashboard
  const totalCitas = citas.length;
  const citasActivas = citas.filter(c => c.estado !== 'Cancelada').length;
  const citasHoy = citas.filter(c => c.fecha === new Date().toISOString().split('T')[0]).length;

  return (
    <>
      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-orange-primary text-xl animate-pulse">Cargando datos...</div>
          </div>
        )}

        {/* Stats Cards */}
        <div style={{ display: 'none' }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="elegante-card text-center">
            <Calendar className="w-8 h-8 text-orange-primary mx-auto mb-2" />
            <h4 className="text-2xl font-bold text-white-primary mb-1">{totalCitas}</h4>
            <p className="text-gray-lightest text-sm">Total Citas</p>
          </div>
          <div className="elegante-card text-center">
            <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h4 className="text-2xl font-bold text-white-primary mb-1">{citasActivas}</h4>
            <p className="text-gray-lightest text-sm">Citas Activas</p>
          </div>
          <div className="elegante-card text-center">
            <User className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h4 className="text-2xl font-bold text-white-primary mb-1">{citasHoy}</h4>
            <p className="text-gray-lightest text-sm">Citas Hoy</p>
          </div>
        </div>

        {/* Navegación de Semana */}
        <div className="elegante-card mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentWeek(currentWeek - 1)}
              className="elegante-button-secondary p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-white-primary">
              Semana {currentWeek === 0 ? 'Actual' :
                currentWeek > 0 ? `+${currentWeek}` : currentWeek}
            </h3>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentWeek(0)}
                className="elegante-button-secondary text-sm"
              >
                Hoy
              </button>
              <button
                onClick={() => setCurrentWeek(currentWeek + 1)}
                className="elegante-button-secondary p-2"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendario Semanal */}
        <div className="elegante-card">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Header de días */}
              <div className="grid grid-cols-8 gap-1 mb-4 border-b border-gray-dark pb-4">
                <div className="text-center">
                  <span className="text-sm font-semibold text-gray-light">Horas</span>
                </div>
                {getCurrentWeekDays().map(({ dia, fecha }) => (
                  <div key={dia} className="text-center">
                    <h4 className="font-semibold text-white-primary">{dia}</h4>
                    <p className="text-xs text-gray-lightest">{fecha}</p>
                    <div className="text-xs text-orange-primary mt-1">
                      {getCitasPorDia(dia).length} citas
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid de horarios */}
              <div className="relative">
                {horasDelDia.map((hora) => (
                  <div key={hora} className="grid grid-cols-8 gap-1 h-16 border-b border-gray-dark">
                    <div className="flex items-center justify-center text-sm text-gray-light">
                      {hora}:00
                    </div>
                    {diasSemana.map((dia) => {
                      const citasEnSlot = getCitasEnSlot(dia, hora);

                      return (
                        <div
                          key={`${dia}-${hora}`}
                          className="relative rounded border transition-all duration-200 bg-gray-darker border-gray-dark hover:bg-gray-dark hover:border-orange-primary/50 cursor-pointer group"
                          onClick={() => handleSlotClick(dia, hora)}
                          title={`Gestionar citas de ${dia} a las ${hora}:00`}
                        >
                          {/* Indicador de citas */}
                          {citasEnSlot.length > 0 && (
                            <div className="absolute top-1 right-1 bg-orange-primary text-black-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                              {citasEnSlot.length}
                            </div>
                          )}

                          {/* Overlay hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="text-center">
                              <MoreHorizontal className="w-6 h-6 text-orange-primary mx-auto mb-1" />
                              <span className="text-xs text-orange-primary">Gestionar</span>
                            </div>
                          </div>

                          {/* Vista previa de citas */}
                          <div className="p-1 space-y-1 max-h-14 overflow-hidden">
                            {citasEnSlot.slice(0, 2).map((cita) => (
                              <div
                                key={cita.id}
                                className="text-xs p-1 rounded truncate"
                                style={{
                                  backgroundColor: getCitaColor(cita.estado) + '40',
                                  color: getCitaColor(cita.estado),
                                  border: `1px solid ${getCitaColor(cita.estado)}`
                                }}
                              >
                                {cita.clienteNombre}
                              </div>
                            ))}
                            {citasEnSlot.length > 2 && (
                              <div className="text-xs text-gray-light text-center">
                                +{citasEnSlot.length - 2} más
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Gestión de Franja Horaria */}
      <Dialog open={isSlotModalOpen} onOpenChange={setIsSlotModalOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark w-[95vw] max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-dark pb-4">
            <DialogTitle className="text-white-primary text-2xl flex items-center gap-3">
              <Clock className="w-7 h-7 text-orange-primary" />
              {selectedSlot && `${selectedSlot.dia} - ${selectedSlot.hora}:00`}
            </DialogTitle>
            <DialogDescription className="text-gray-lightest text-lg">
              Gestiona todas las citas para esta franja horaria
            </DialogDescription>
          </DialogHeader>

          {/* Tabs de navegación */}
          <div className="flex border-b border-gray-dark mb-6">
            <button
              onClick={() => setActiveTab('lista')}
              className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'lista'
                ? 'border-orange-primary text-orange-primary'
                : 'border-transparent text-gray-lightest hover:text-white-primary'
                }`}
            >
              Lista de Citas
            </button>
            <button
              onClick={() => {
                setActiveTab('crear');
                if (!selectedCita) {
                  setNuevaCita({
                    cliente: '',
                    telefono: '',
                    servicio: '',
                    barbero: '',
                    fecha: selectedSlot?.fecha || '',
                    hora: selectedSlot?.hora.toString().padStart(2, '0') + ':00' || '',
                    duracion: 60,
                    precio: 0,
                    estado: 'Pendiente',
                    notas: ''
                  });
                }
              }}
              className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'crear'
                ? 'border-orange-primary text-orange-primary'
                : 'border-transparent text-gray-lightest hover:text-white-primary'
                }`}
            >
              {selectedCita ? 'Editar Cita' : 'Nueva Cita'}
            </button>
            {activeTab === 'detalle' && selectedCita && (
              <button
                onClick={() => setActiveTab('detalle')}
                className="px-6 py-3 border-b-2 border-orange-primary text-orange-primary"
              >
                Detalle de Cita
              </button>
            )}
          </div>

          {/* Contenido según tab activo */}
          {activeTab === 'lista' && (
            <div className="space-y-6">
              {/* Filtros y búsqueda */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                  <Input
                    placeholder="Buscar por cliente, teléfono o servicio..."
                    value={slotSearchTerm}
                    onChange={(e) => setSlotSearchTerm(e.target.value)}
                    className="elegante-input pl-11"
                  />
                </div>

                <Select value={slotFilterEstado} onValueChange={setSlotFilterEstado}>
                  <SelectTrigger className="w-48 elegante-input">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-darkest border-gray-dark">
                    <SelectItem value="all" className="text-white-primary">Todos</SelectItem>
                    {estados.map((estado) => (
                      <SelectItem key={estado.value} value={estado.value} className="text-white-primary">
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de citas */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedSlot && getCitasEnSlot(selectedSlot.dia, selectedSlot.hora).map((cita) => (
                  <div key={cita.id} className="bg-gray-darker border border-gray-dark rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getCitaColor(cita.estado) }}
                        />
                        <h4 className="font-semibold text-white-primary">{cita.clienteNombre}</h4>
                        <div className={`elegante-tag ${getEstadoInfo(cita.estado).color} text-white text-xs`}>
                          {getEstadoInfo(cita.estado).label}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(cita);
                          }}
                          className="p-2 rounded bg-blue-600/20 hover:bg-blue-600/30 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCita(cita);
                          }}
                          className="p-2 rounded bg-orange-primary/20 hover:bg-orange-primary/30 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-orange-primary" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Click en icono Eliminar (Trash2)");
                            handleDeleteCita(cita);
                          }}
                          className="p-2 rounded bg-red-600/20 hover:bg-red-600/30 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>

                        {/* Cambio rápido de estado */}
                        <Select value={cita.estado} onValueChange={(value) => handleChangeEstado(cita.id, value)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-darkest border-gray-dark">
                            {estados.map((estado) => (
                              <SelectItem key={estado.value} value={estado.value} className="text-white-primary text-xs">
                                {estado.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-lightest">
                      <div>
                        <span className="text-gray-light">Servicio:</span> {cita.servicioNombre}
                      </div>
                      <div>
                        <span className="text-gray-light">Barbero:</span> {cita.barberoNombre}
                      </div>
                      <div>
                        <span className="text-gray-light">Hora:</span> {cita.hora} ({cita.duracion}min)
                      </div>
                      <div>
                        <span className="text-gray-light">Precio:</span> {formatearPrecio(cita.precio)}
                      </div>
                    </div>

                    {cita.notas && (
                      <div className="mt-2 text-sm text-gray-lightest">
                        <span className="text-gray-light">Notas:</span> {cita.notas}
                      </div>
                    )}
                  </div>
                ))}

                {selectedSlot && getCitasEnSlot(selectedSlot.dia, selectedSlot.hora).length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-medium mx-auto mb-4" />
                    <p className="text-gray-lightest">No hay citas para esta franja horaria</p>
                    <button
                      onClick={() => setActiveTab('crear')}
                      className="elegante-button-primary mt-4"
                    >

                      Crear Cita
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'crear' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información del Cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white-primary">Información del Cliente</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white-primary mb-2">Cliente</Label>
                      <Select
                        value={nuevaCita.clienteId.toString()}
                        onValueChange={(value) => {
                          const id = parseInt(value);
                          const clienteSeleccionado = clientesList.find(c => c.id === id);
                          setNuevaCita({
                            ...nuevaCita,
                            clienteId: id,
                            cliente: clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}` : '',
                            telefono: clienteSeleccionado ? clienteSeleccionado.telefono : ''
                          });
                        }}
                      >
                        <SelectTrigger className="elegante-input">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-darkest border-gray-dark">
                          {clientesList.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id.toString()} className="text-white-primary">
                              {cliente.nombre} {cliente.apellido}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white-primary mb-2">Teléfono</Label>
                      <Input
                        value={nuevaCita.telefono}
                        onChange={(e) => setNuevaCita({ ...nuevaCita, telefono: e.target.value })}
                        placeholder="+57 300 123 4567"
                        className="elegante-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Detalles del Servicio */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white-primary">Detalles del Servicio</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white-primary mb-2">Servicio</Label>
                      <Select
                        value={nuevaCita.paqueteId ? `p-${nuevaCita.paqueteId}` : (nuevaCita.servicioId?.toString() || "")}
                        onValueChange={handleItemChange}
                      >
                        <SelectTrigger className="elegante-input">
                          <SelectValue placeholder="Seleccionar servicio o paquete" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-darkest border-gray-dark max-h-80 overflow-y-auto">
                          <div className="px-2 py-1.5 text-xs font-semibold text-orange-primary/70 uppercase tracking-wider">Servicios</div>
                          {serviciosList.map((servicio) => (
                            <SelectItem key={servicio.id} value={servicio.id.toString()} className="text-white-primary">
                              {servicio.nombre} - {formatearPrecio(servicio.precio)}
                            </SelectItem>
                          ))}

                          {paquetesList.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 mt-2 text-xs font-semibold text-orange-primary/70 uppercase tracking-wider">Paquetes Especiales</div>
                              {paquetesList.map((paquete) => (
                                <SelectItem key={`p-${paquete.id}`} value={`p-${paquete.id}`} className="text-white-primary">
                                  🎁 {paquete.nombre} - {formatearPrecio(paquete.precio)}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white-primary mb-2">Barbero</Label>
                      <Select
                        value={nuevaCita.barberoId.toString()}
                        onValueChange={(value) => {
                          const id = parseInt(value);
                          const barbero = barberosList.find(b => b.id === id);
                          setNuevaCita({
                            ...nuevaCita,
                            barberoId: id,
                            barbero: barbero ? `${barbero.nombres || barbero.nombre} ${barbero.apellidos || barbero.apellido || ''}` : ''
                          });
                        }}
                      >
                        <SelectTrigger className="elegante-input">
                          <SelectValue placeholder="Seleccionar barbero" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-darkest border-gray-dark">
                          {barberosList.map((barbero) => (
                            <SelectItem key={barbero.id} value={barbero.id.toString()} className="text-white-primary">
                              {barbero.nombres || barbero.nombre} {barbero.apellidos || barbero.apellido || ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Programación */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white-primary">Programación</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-white-primary  mb-2">Fecha</Label>
                      <Input
                        type="date"
                        value={nuevaCita.fecha}
                        onChange={(e) => setNuevaCita({ ...nuevaCita, fecha: e.target.value })}
                        className="elegante-input"
                      />
                    </div>
                    <div>
                      <Label className="text-white-primary mb-2">Hora</Label>
                      <Input
                        type="time"
                        value={nuevaCita.hora}
                        onChange={(e) => setNuevaCita({ ...nuevaCita, hora: e.target.value })}
                        className="elegante-input"
                      />
                    </div>
                    <div>
                      <Label className="text-white-primary mb-2">Duración (min)</Label>
                      <Input
                        type="number"
                        value={nuevaCita.duracion}
                        onChange={(e) => setNuevaCita({ ...nuevaCita, duracion: parseInt(e.target.value) })}
                        className="elegante-input"
                        step="15"
                        min="15"
                        max="180"
                      />
                    </div>
                  </div>
                </div>

                {/* Precio y Estado */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white-primary">Precio y Estado</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white-primary mb-2">Precio (COP)</Label>
                      <Input
                        type="number"
                        value={nuevaCita.precio}
                        onChange={(e) => setNuevaCita({ ...nuevaCita, precio: parseFloat(e.target.value) })}
                        className="elegante-input"
                        step="1000"
                      />
                    </div>
                    <div>
                      <Label className="text-white-primary mb-2">Estado</Label>
                      <Select value={nuevaCita.estado} onValueChange={(value) => setNuevaCita({ ...nuevaCita, estado: value })}>
                        <SelectTrigger className="elegante-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-darkest border-gray-dark">
                          {estados.map((estado) => (
                            <SelectItem key={estado.value} value={estado.value} className="text-white-primary">
                              {estado.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <Label className="text-white-primary mb-2">Notas Adicionales</Label>
                <Textarea
                  value={nuevaCita.notas}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, notas: e.target.value })}
                  placeholder="Comentarios especiales sobre la cita..."
                  className="elegante-input min-h-[50px]"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-dark">
                <button
                  onClick={() => {
                    setActiveTab('lista');
                    setSelectedCita(null);
                  }}
                  className="elegante-button-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={selectedCita ? handleUpdateCita : handleCreateCita}
                  className="elegante-button-primary"
                  disabled={!nuevaCita.cliente || !nuevaCita.servicio || !nuevaCita.barbero}
                >
                  {selectedCita ? 'Actualizar' : 'Crear'} Cita
                </button>
              </div>
            </div>
          )}

          {activeTab === 'detalle' && selectedCita && (
            <div className="space-y-6">
              <div className="bg-gray-darker border border-gray-dark rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white-primary">{selectedCita.clienteNombre}</h3>
                  <div className={`elegante-tag ${getEstadoInfo(selectedCita.estado).color} text-white`}>
                    {getEstadoInfo(selectedCita.estado).label}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-light mb-1">Información del Cliente</h4>
                      <p className="text-white-primary">{selectedCita.clienteNombre}</p>
                      <p className="text-gray-lightest text-sm">{selectedCita.telefono}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-light mb-1">Servicio</h4>
                      <p className="text-white-primary">{selectedCita.servicioNombre}</p>
                      <p className="text-orange-primary font-semibold">{formatearPrecio(selectedCita.precio)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-light mb-1">Programación</h4>
                      <p className="text-white-primary">{selectedCita.fecha}</p>
                      <p className="text-gray-lightest">{selectedCita.hora} - {selectedCita.duracion} minutos</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-light mb-1">Barbero Asignado</h4>
                      <p className="text-white-primary">{selectedCita.barberoNombre}</p>
                    </div>
                  </div>
                </div>

                {selectedCita.notas && (
                  <div className="mt-6 pt-4 border-t border-gray-dark">
                    <h4 className="text-sm font-semibold text-gray-light mb-2">Notas Especiales</h4>
                    <p className="text-gray-lightest">{selectedCita.notas}</p>
                  </div>
                )}

                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-dark">
                  <button
                    onClick={() => setActiveTab('lista')}
                    className="elegante-button-secondary"
                  >
                    Volver a Lista
                  </button>
                  <button
                    onClick={() => handleEditCita(selectedCita)}
                    className="elegante-button-primary"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Cita
                  </button>
                  <button
                    onClick={() => handleDeleteCita(selectedCita)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-all"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Cita
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer del modal */}

        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-darkest border border-orange-primary">
          <AlertDialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <AlertDialogTitle className="text-white-primary">
                Confirmar Eliminación
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-lightest">
              ¿Estás seguro de que deseas eliminar la cita de {citaToDelete?.clienteNombre}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="elegante-button-secondary"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCitaToDelete(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white border-none"
              onClick={() => {
                console.log("Botón ELIMINAR del Dialog presionado");
                confirmDeleteCita();
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertContainer />
    </>
  );
}