import { useState } from "react";
import { Calendar, Clock, User, Scissors, ChevronLeft, ChevronRight, Edit, Trash2, Plus, AlertTriangle, CheckCircle, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useCustomAlert } from "../ui/custom-alert";

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const horasDelDia = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 AM a 9:00 PM

// Barberos disponibles
const barberos = [
  { id: "1", nombre: "Miguel Rodriguez", especialidad: "Corte Clásico y Barba" },
  { id: "2", nombre: "Sofia Martinez", especialidad: "Cortes Modernos y Tinturado" },
  { id: "3", nombre: "Carlos Mendoza", especialidad: "Barba y Bigote" },
];

// Servicios disponibles
const servicios = [
  { id: "1", nombre: "Corte de Cabello", precio: 35000, duracion: 45 },
  { id: "2", nombre: "Arreglo de Barba", precio: 20000, duracion: 30 },
  { id: "3", nombre: "Corte + Barba", precio: 50000, duracion: 60 },
  { id: "4", nombre: "Tinturado", precio: 55000, duracion: 90 },
  { id: "5", nombre: "Paquete Premium", precio: 80000, duracion: 120 },
];

// Función para obtener fechas dinámicas
const getHoy = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getManana = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const getPasadoManana = () => {
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  return dayAfter.toISOString().split('T')[0];
};

// Datos de citas del cliente actual (simulación)
const citasClienteData = [
  {
    id: 1,
    cliente: "Juan Pérez", // Cliente actual (autenticado)
    telefono: "+57 300 123 4567",
    servicio: "Corte + Barba",
    barbero: "Miguel Rodriguez",
    fecha: getHoy(),
    hora: "10:00",
    duracion: 60,
    precio: 50000,
    estado: "confirmada",
    notas: "Corte degradado"
  },
  {
    id: 2,
    cliente: "Juan Pérez",
    telefono: "+57 300 123 4567",
    servicio: "Corte de Cabello",
    barbero: "Sofia Martinez",
    fecha: getManana(),
    hora: "14:00",
    duracion: 45,
    precio: 35000,
    estado: "pendiente",
    notas: ""
  },
  {
    id: 3,
    cliente: "Juan Pérez",
    telefono: "+57 300 123 4567",
    servicio: "Arreglo de Barba",
    barbero: "Carlos Mendoza",
    fecha: getPasadoManana(),
    hora: "11:00",
    duracion: 30,
    precio: 20000,
    estado: "confirmada",
    notas: ""
  }
];

const estados = [
  { value: "pendiente", label: "Pendiente", color: "bg-orange-primary" },
  { value: "confirmada", label: "Confirmada", color: "bg-orange-primary text-black-primary" },
  { value: "en-curso", label: "En Curso", color: "bg-green-600" },
  { value: "completada", label: "Completada", color: "bg-blue-600" },
  { value: "cancelada", label: "Cancelada", color: "bg-red-600" }
];

// Función para formatear precios
const formatearPrecio = (precio: number): string => {
  const precioEntero = Math.round(precio);
  return `$ ${precioEntero.toLocaleString('es-CO')}`;
};

export function ClienteMisCitasPageCalendar() {
  const { success, error, AlertContainer } = useCustomAlert();
  const [citas, setCitas] = useState(citasClienteData);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [citaToDelete, setCitaToDelete] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [citaConfirmada, setCitaConfirmada] = useState<any>(null);
  const [nuevaCita, setNuevaCita] = useState({
    barbero: "",
    servicio: "",
    fecha: "",
    hora: "",
    notas: ""
  });
  const [editandoCita, setEditandoCita] = useState<any>(null);
  const [citaEditada, setCitaEditada] = useState({
    barbero: "",
    servicio: "",
    fecha: "",
    hora: "",
    notas: ""
  });

  // Funciones auxiliares para el calendario
  const getCurrentWeekDays = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (currentWeek * 7));
    return diasSemana.map((dia, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return {
        dia,
        fecha: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
      };
    });
  };

  const getCitasPorDia = (fecha: string) => {
    return citas.filter(cita => cita.fecha === fecha);
  };

  const getCitaDuration = (duracion: number) => {
    return (duracion / 60) * 64; // 64px por hora
  };

  const getCitaColor = (estado: string) => {
    switch (estado) {
      case 'confirmada': return '#d8b081';
      case 'en-curso': return '#22C55E';
      case 'completada': return '#3B82F6';
      case 'cancelada': return '#EF4444';
      case 'pendiente': return '#d8b081';
      default: return '#d8b081';
    }
  };

  const handleViewDetail = (cita: any) => {
    setSelectedCita(cita);
    setIsDetailDialogOpen(true);
  };

  const handleDeleteCita = (cita: any) => {
    setCitaToDelete(cita);
    setIsDeleteDialogOpen(true);
  };

  // Manejar clic en celda vacía para crear nueva cita
  const handleCeldaClick = (fecha: string, hora: number) => {
    const horaString = `${hora.toString().padStart(2, '0')}:00`;

    // Verificar si ya hay una cita en esa hora
    const citaExistente = citas.find(c =>
      c.fecha === fecha && parseInt(c.hora.split(':')[0]) === hora
    );

    if (citaExistente) {
      // Si hay una cita, abrir el detalle
      handleViewDetail(citaExistente);
      return;
    }

    // Si no hay cita, abrir formulario de creación
    setNuevaCita({
      barbero: "",
      servicio: "",
      fecha: fecha,
      hora: horaString,
      notas: ""
    });
    setIsCreateDialogOpen(true);
  };

  // Verificar si una hora está ocupada para un barbero específico
  const isHoraOcupadaPorBarbero = (fecha: string, hora: number, barberoId: string, duracionServicio: number = 0) => {
    if (!barberoId) return false;

    const horaString = `${hora.toString().padStart(2, '0')}:00`;

    return citas.some(cita => {
      // Buscar barbero por nombre (ya que las citas tienen nombre, no ID)
      const barbero = barberos.find(b => b.id === barberoId);
      if (!barbero || cita.barbero !== barbero.nombre || cita.fecha !== fecha) return false;

      const citaHora = parseInt(cita.hora.split(':')[0]);
      const citaFin = citaHora + Math.ceil(cita.duracion / 60);
      const nuevaFin = hora + Math.ceil(duracionServicio / 60);

      // Verificar si hay superposición
      return (hora < citaFin && nuevaFin > citaHora);
    });
  };

  // Crear nueva cita
  const handleCreateCita = () => {
    if (!nuevaCita.barbero || !nuevaCita.servicio || !nuevaCita.fecha || !nuevaCita.hora) {
      error("Campos requeridos", "Por favor completa todos los campos obligatorios.");
      return;
    }

    const selectedService = servicios.find(s => s.id === nuevaCita.servicio);
    const selectedBarberoData = barberos.find(b => b.id === nuevaCita.barbero);
    const hora = parseInt(nuevaCita.hora.split(':')[0]);

    // Verificar disponibilidad
    if (isHoraOcupadaPorBarbero(nuevaCita.fecha, hora, nuevaCita.barbero, selectedService?.duracion || 0)) {
      error("Hora no disponible", `${selectedBarberoData?.nombre} ya tiene una cita en este horario.`);
      return;
    }

    // Crear la nueva cita
    const nuevaCitaCompleta = {
      id: citas.length + 1,
      cliente: "Juan Pérez", // Cliente actual autenticado
      telefono: "+57 300 123 4567",
      servicio: selectedService?.nombre || "",
      barbero: selectedBarberoData?.nombre || "",
      fecha: nuevaCita.fecha,
      hora: nuevaCita.hora,
      duracion: selectedService?.duracion || 60,
      precio: selectedService?.precio || 0,
      estado: "pendiente",
      notas: nuevaCita.notas
    };

    setCitas([...citas, nuevaCitaCompleta]);

    // Preparar información para el alert de éxito
    setCitaConfirmada({
      barbero: selectedBarberoData?.nombre || "Barbero",
      barberoEspecialidad: selectedBarberoData?.especialidad || "",
      servicio: selectedService?.nombre || "Servicio",
      precio: selectedService?.precio || 0,
      duracion: selectedService?.duracion || 0,
      fecha: nuevaCita.fecha,
      hora: nuevaCita.hora,
      notas: nuevaCita.notas
    });

    // Cerrar dialog y mostrar confirmación
    setIsCreateDialogOpen(false);
    setShowSuccessAlert(true);

    // Reset form
    setNuevaCita({
      barbero: "",
      servicio: "",
      fecha: "",
      hora: "",
      notas: ""
    });
  };

  const confirmDeleteCita = () => {
    if (citaToDelete) {
      setCitas(citas.filter(cita => cita.id !== citaToDelete.id));
      setIsDeleteDialogOpen(false);
      setCitaToDelete(null);
      success("¡Cita cancelada exitosamente!", `Tu cita del ${citaToDelete.fecha} a las ${citaToDelete.hora} ha sido cancelada.`);
    }
  };

  // Abrir modal de edición de cita
  const handleEditCita = (cita: any) => {
    // Obtener el ID del barbero
    const barberoData = barberos.find(b => b.nombre === cita.barbero);
    const servicioData = servicios.find(s => s.nombre === cita.servicio);

    setEditandoCita(cita);
    setCitaEditada({
      barbero: barberoData?.id || "",
      servicio: servicioData?.id || "",
      fecha: cita.fecha,
      hora: cita.hora,
      notas: cita.notas || ""
    });
    setIsDetailDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  // Actualizar cita existente
  const handleUpdateCita = () => {
    if (!citaEditada.barbero || !citaEditada.servicio || !citaEditada.fecha || !citaEditada.hora) {
      error("Campos requeridos", "Por favor completa todos los campos obligatorios.");
      return;
    }

    const selectedService = servicios.find(s => s.id === citaEditada.servicio);
    const selectedBarberoData = barberos.find(b => b.id === citaEditada.barbero);
    const hora = parseInt(citaEditada.hora.split(':')[0]);

    // Verificar disponibilidad (excluyendo la cita actual)
    const citasSinActual = citas.filter(c => c.id !== editandoCita.id);
    const horaOcupada = citasSinActual.some(cita => {
      const barbero = barberos.find(b => b.id === citaEditada.barbero);
      if (!barbero || cita.barbero !== barbero.nombre || cita.fecha !== citaEditada.fecha) return false;

      const citaHora = parseInt(cita.hora.split(':')[0]);
      const citaFin = citaHora + Math.ceil(cita.duracion / 60);
      const nuevaFin = hora + Math.ceil((selectedService?.duracion || 0) / 60);

      return (hora < citaFin && nuevaFin > citaHora);
    });

    if (horaOcupada) {
      error("Hora no disponible", `${selectedBarberoData?.nombre} ya tiene una cita en este horario.`);
      return;
    }

    // Actualizar la cita
    const citaActualizada = {
      ...editandoCita,
      servicio: selectedService?.nombre || "",
      barbero: selectedBarberoData?.nombre || "",
      fecha: citaEditada.fecha,
      hora: citaEditada.hora,
      duracion: selectedService?.duracion || 60,
      precio: selectedService?.precio || 0,
      notas: citaEditada.notas
    };

    setCitas(citas.map(c => c.id === editandoCita.id ? citaActualizada : c));
    setIsEditDialogOpen(false);
    setEditandoCita(null);
    setCitaEditada({
      barbero: "",
      servicio: "",
      fecha: "",
      hora: "",
      notas: ""
    });

    success("¡Cita actualizada exitosamente!", `Tu cita ha sido modificada correctamente.`);
  };

  const getEstadoInfo = (estado: string) => {
    const estadoInfo = estados.find(e => e.value === estado);
    return estadoInfo || { value: estado, label: estado, color: "bg-gray-medium" };
  };

  const weekDays = getCurrentWeekDays();

  return (
    <>
      <AlertContainer />

      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white-primary">Mis Citas Agendadas</h1>
            <p className="text-sm text-gray-lightest mt-1">
              Visualiza y gestiona todas tus citas programadas
            </p>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Navegación de semana */}
          <div className="elegante-card">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentWeek(currentWeek - 1)}
                className="p-2 rounded-lg bg-gray-medium hover:bg-gray-dark border border-gray-dark transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white-primary" />
              </button>

              <div className="text-center">
                <h2 className="text-white-primary">
                  {currentWeek === 0 ? 'Semana Actual' : `Semana ${currentWeek > 0 ? '+' : ''}${currentWeek}`}
                </h2>
                <p className="text-sm text-gray-lightest">
                  {weekDays[0].displayDate} - {weekDays[6].displayDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentWeek(0)}
                  className="px-3 py-2 rounded-lg bg-gray-medium hover:bg-gray-dark border border-gray-dark transition-colors text-sm text-white-primary"
                >
                  Hoy
                </button>
                <button
                  onClick={() => setCurrentWeek(currentWeek + 1)}
                  className="p-2 rounded-lg bg-gray-medium hover:bg-gray-dark border border-gray-dark transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white-primary" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendario semanal estilo Google */}
          <div className="elegante-card overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Header de días */}
              <div className="grid grid-cols-8 border-b border-gray-dark">
                <div className="p-4 border-r border-gray-dark sticky left-0 bg-[#1F1F1F] z-10">
                  <span className="text-gray-lightest">Hora</span>
                </div>
                {weekDays.map((day, index) => (
                  <div key={index} className="p-4 text-center border-r border-gray-dark last:border-r-0">
                    <div className="text-white-primary">{day.dia}</div>
                    <div className="text-sm text-gray-lightest">{day.displayDate}</div>
                  </div>
                ))}
              </div>

              {/* Grid de horas */}
              <div className="relative">
                {horasDelDia.map((hora) => (
                  <div key={hora} className="grid grid-cols-8 border-b border-gray-dark last:border-b-0">
                    {/* Columna de hora */}
                    <div className="p-4 border-r border-gray-dark flex items-start sticky left-0 bg-[#1F1F1F] z-10 min-h-[80px]">
                      <span className="text-gray-lightest text-sm">
                        {hora.toString().padStart(2, '0')}:00
                      </span>
                    </div>

                    {/* Columnas de días */}
                    {weekDays.map((day, dayIndex) => {
                      const citasDelDia = getCitasPorDia(day.fecha);
                      const citasEnHora = citasDelDia.filter(cita => {
                        const citaHora = parseInt(cita.hora.split(':')[0]);
                        return citaHora === hora;
                      });

                      return (
                        <div
                          key={dayIndex}
                          className="border-r border-gray-dark last:border-r-0 min-h-[80px] relative bg-gray-darker/30 hover:bg-gray-darker/50 transition-colors p-2 cursor-pointer group"
                          onClick={() => handleCeldaClick(day.fecha, hora)}
                        >
                          {citasEnHora.length > 0 ? (
                            <div className="space-y-1">
                              {citasEnHora.map((cita) => (
                                <div
                                  key={cita.id}
                                  className="rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg border-l-4"
                                  style={{
                                    backgroundColor: `${getCitaColor(cita.estado)}20`,
                                    borderLeftColor: getCitaColor(cita.estado)
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetail(cita);
                                  }}
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="flex-1">
                                      <p className="text-white-primary text-sm truncate">
                                        {cita.servicio}
                                      </p>
                                      <p className="text-xs text-gray-lightest truncate mt-1">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {cita.hora} - {cita.duracion} min
                                      </p>
                                      <p className="text-xs text-gray-lightest truncate">
                                        <User className="w-3 h-3 inline mr-1" />
                                        {cita.barbero}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded ${getEstadoInfo(cita.estado).color}`}
                                    >
                                      {getEstadoInfo(cita.estado).label}
                                    </span>
                                    <span className="text-xs text-orange-primary">
                                      {formatearPrecio(cita.precio)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex flex-col items-center gap-1">
                                <Plus className="w-5 h-5 text-orange-primary" />
                                <span className="text-xs text-gray-light">Agendar</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="elegante-card">
            <h3 className="text-white-primary mb-3">Estados de las citas</h3>
            <div className="flex flex-wrap gap-4">
              {estados.map((estado) => (
                <div key={estado.value} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${estado.color}`}></div>
                  <span className="text-sm text-gray-lightest">{estado.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Dialog de detalle de cita */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-primary" />
              Detalles de la Cita
            </DialogTitle>
            <DialogDescription className="text-gray-lightest">
              Información completa de tu cita agendada
            </DialogDescription>
          </DialogHeader>

          {selectedCita && (
            <div className="space-y-6 py-4">
              {/* Estado */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-darker border border-gray-dark">
                <span className="text-gray-lightest">Estado de la cita:</span>
                <span className={`px-3 py-1 rounded ${getEstadoInfo(selectedCita.estado).color}`}>
                  {getEstadoInfo(selectedCita.estado).label}
                </span>
              </div>

              {/* Información del servicio */}
              <div className="elegante-card">
                <h3 className="text-white-primary mb-4 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-orange-primary" />
                  Servicio
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-lightest">Servicio:</span>
                    <span className="text-white-primary">{selectedCita.servicio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-lightest">Duración:</span>
                    <span className="text-white-primary">{selectedCita.duracion} minutos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-lightest">Precio:</span>
                    <span className="text-orange-primary">{formatearPrecio(selectedCita.precio)}</span>
                  </div>
                </div>
              </div>

              {/* Información de fecha y hora */}
              <div className="elegante-card">
                <h3 className="text-white-primary mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-primary" />
                  Fecha y Hora
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-lightest">Fecha:</span>
                    <span className="text-white-primary">
                      {new Date(selectedCita.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-lightest">Hora:</span>
                    <span className="text-white-primary">{selectedCita.hora}</span>
                  </div>
                </div>
              </div>

              {/* Información del barbero */}
              <div className="elegante-card">
                <h3 className="text-white-primary mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-primary" />
                  Barbero
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-lightest">Barbero asignado:</span>
                    <span className="text-white-primary">{selectedCita.barbero}</span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedCita.notas && (
                <div className="elegante-card">
                  <h3 className="text-white-primary mb-4">Notas</h3>
                  <p className="text-gray-lightest">{selectedCita.notas}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="elegante-button-secondary flex-1"
                >
                  Cerrar
                </button>
                {selectedCita.estado !== 'completada' && selectedCita.estado !== 'cancelada' && (
                  <button
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleDeleteCita(selectedCita);
                    }}
                    className="elegante-button-primary bg-red-600 hover:bg-red-700 flex-1"
                  >
                    Cancelar Cita
                  </button>
                )}
                {selectedCita.estado !== 'completada' && selectedCita.estado !== 'cancelada' && (
                  <button
                    onClick={() => handleEditCita(selectedCita)}
                    className="elegante-button-primary bg-blue-600 hover:bg-blue-700 flex-1"
                  >
                    Editar Cita
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="elegante-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              ¿Cancelar esta cita?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-lightest">
              {citaToDelete && (
                <div className="mt-4 space-y-2">
                  <p>Estás a punto de cancelar la siguiente cita:</p>
                  <div className="elegante-card mt-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-lightest">Servicio:</span>
                        <span className="text-white-primary">{citaToDelete.servicio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-lightest">Fecha:</span>
                        <span className="text-white-primary">{citaToDelete.fecha}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-lightest">Hora:</span>
                        <span className="text-white-primary">{citaToDelete.hora}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-lightest">Barbero:</span>
                        <span className="text-white-primary">{citaToDelete.barbero}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm mt-3">Esta acción no se puede deshacer.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsDeleteDialogOpen(false)}
              className="elegante-button-secondary"
            >
              No, mantener cita
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCita}
              className="elegante-button-primary bg-red-600 hover:bg-red-700"
            >
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para crear nueva cita */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white-primary flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-primary" />
              Agendar Nueva Cita
            </DialogTitle>
            <DialogDescription className="text-gray-lightest">
              Completa la información para agendar tu cita
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Fecha y Hora (prellenados) */}
            <div className="elegante-card">
              <h3 className="text-white-primary mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-primary" />
                Fecha y Hora Seleccionadas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-lightest">Fecha:</span>
                  <span className="text-white-primary">
                    {nuevaCita.fecha && new Date(nuevaCita.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-lightest">Hora:</span>
                  <span className="text-white-primary">{nuevaCita.hora}</span>
                </div>
              </div>
            </div>

            {/* Selección de Barbero */}
            <div className="space-y-2">
              <Label className="text-white-primary flex items-center gap-2">
                <User className="w-4 h-4 text-orange-primary" />
                Barbero *
              </Label>
              <Select value={nuevaCita.barbero} onValueChange={(value) => setNuevaCita({ ...nuevaCita, barbero: value })}>
                <SelectTrigger className="elegante-input">
                  <SelectValue placeholder="Selecciona un barbero" />
                </SelectTrigger>
                <SelectContent className="bg-gray-darkest border-gray-dark">
                  {barberos.map((barbero) => (
                    <SelectItem key={barbero.id} value={barbero.id} className="text-white-primary">
                      <div>
                        <div>{barbero.nombre}</div>
                        <div className="text-xs text-gray-lightest">{barbero.especialidad}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selección de Servicio */}
            <div className="space-y-2">
              <Label className="text-white-primary flex items-center gap-2">
                <Scissors className="w-4 h-4 text-orange-primary" />
                Servicio *
              </Label>
              <Select
                value={nuevaCita.servicio}
                onValueChange={(value) => setNuevaCita({ ...nuevaCita, servicio: value })}
              >
                <SelectTrigger className="elegante-input">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent className="bg-gray-darkest border-gray-dark">
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id} className="text-white-primary">
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <div>{servicio.nombre}</div>
                          <div className="text-xs text-gray-lightest">{servicio.duracion} min</div>
                        </div>
                        <div className="text-orange-primary ml-4">
                          {formatearPrecio(servicio.precio)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Precio (automático) */}
            {nuevaCita.servicio && (
              <div className="elegante-card">
                <div className="flex justify-between items-center">
                  <span className="text-gray-lightest">Precio del servicio:</span>
                  <span className="text-orange-primary">
                    {formatearPrecio(servicios.find(s => s.id === nuevaCita.servicio)?.precio || 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Notas Adicionales */}
            <div className="space-y-2">
              <Label className="text-white-primary">
                Notas Adicionales (Opcional)
              </Label>
              <textarea
                value={nuevaCita.notas}
                onChange={(e) => setNuevaCita({ ...nuevaCita, notas: e.target.value })}
                className="elegante-input min-h-[100px] resize-none"
                placeholder="Especifica alguna preferencia o comentario..."
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="elegante-button-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCita}
                disabled={!nuevaCita.barbero || !nuevaCita.servicio}
                className="elegante-button-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Cita
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar cita */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white-primary flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-primary" />
              Editar Cita
            </DialogTitle>
            <DialogDescription className="text-gray-lightest">
              Completa la información para editar tu cita
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Fecha y Hora (prellenados) */}
            <div className="elegante-card">
              <h3 className="text-white-primary mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-primary" />
                Fecha y Hora Seleccionadas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-lightest">Fecha:</span>
                  <span className="text-white-primary">
                    {citaEditada.fecha && new Date(citaEditada.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-lightest">Hora:</span>
                  <span className="text-white-primary">{citaEditada.hora}</span>
                </div>
              </div>
            </div>

            {/* Selección de Barbero */}
            <div className="space-y-2">
              <Label className="text-white-primary flex items-center gap-2">
                <User className="w-4 h-4 text-orange-primary" />
                Barbero *
              </Label>
              <Select value={citaEditada.barbero} onValueChange={(value) => setCitaEditada({ ...citaEditada, barbero: value })}>
                <SelectTrigger className="elegante-input">
                  <SelectValue placeholder="Selecciona un barbero" />
                </SelectTrigger>
                <SelectContent className="bg-gray-darkest border-gray-dark">
                  {barberos.map((barbero) => (
                    <SelectItem key={barbero.id} value={barbero.id} className="text-white-primary">
                      <div>
                        <div>{barbero.nombre}</div>
                        <div className="text-xs text-gray-lightest">{barbero.especialidad}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selección de Servicio */}
            <div className="space-y-2">
              <Label className="text-white-primary flex items-center gap-2">
                <Scissors className="w-4 h-4 text-orange-primary" />
                Servicio *
              </Label>
              <Select
                value={citaEditada.servicio}
                onValueChange={(value) => setCitaEditada({ ...citaEditada, servicio: value })}
              >
                <SelectTrigger className="elegante-input">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent className="bg-gray-darkest border-gray-dark">
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id} className="text-white-primary">
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <div>{servicio.nombre}</div>
                          <div className="text-xs text-gray-lightest">{servicio.duracion} min</div>
                        </div>
                        <div className="text-orange-primary ml-4">
                          {formatearPrecio(servicio.precio)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Precio (automático) */}
            {citaEditada.servicio && (
              <div className="elegante-card">
                <div className="flex justify-between items-center">
                  <span className="text-gray-lightest">Precio del servicio:</span>
                  <span className="text-orange-primary">
                    {formatearPrecio(servicios.find(s => s.id === citaEditada.servicio)?.precio || 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Notas Adicionales */}
            <div className="space-y-2">
              <Label className="text-white-primary">
                Notas Adicionales (Opcional)
              </Label>
              <textarea
                value={citaEditada.notas}
                onChange={(e) => setCitaEditada({ ...citaEditada, notas: e.target.value })}
                className="elegante-input min-h-[100px] resize-none"
                placeholder="Especifica alguna preferencia o comentario..."
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="elegante-button-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateCita}
                disabled={!citaEditada.barbero || !citaEditada.servicio}
                className="elegante-button-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Actualizar Cita
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Confirmación Exitosa */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent className="elegante-card max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white-primary flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600/20 border border-green-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>¡Cita Agendada Exitosamente!</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-lightest">
              {citaConfirmada && (
                <div className="space-y-4 mt-4">
                  {/* Mensaje de éxito */}
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                    <p className="text-white-primary text-center mb-1">
                      Tu cita ha sido registrada correctamente
                    </p>
                    <p className="text-gray-lightest text-sm text-center">
                      Recibirás un recordatorio antes de tu cita
                    </p>
                  </div>

                  {/* Detalles de la cita */}
                  <div className="bg-gray-darker border border-gray-dark rounded-lg p-5">
                    <h4 className="text-white-primary mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-primary" />
                      Detalles de tu Cita
                    </h4>

                    <div className="space-y-3">
                      {/* Fecha y Hora */}
                      <div className="flex items-start justify-between pb-3 border-b border-gray-dark">
                        <div className="flex-1">
                          <p className="text-xs text-gray-lightest uppercase tracking-wide mb-1">Fecha y Hora</p>
                          <p className="text-white-primary">
                            {new Date(citaConfirmada.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-orange-primary mt-1">
                            {citaConfirmada.hora} ({citaConfirmada.duracion} min)
                          </p>
                        </div>
                        <Clock className="w-5 h-5 text-gray-light mt-1" />
                      </div>

                      {/* Barbero */}
                      <div className="flex items-start justify-between pb-3 border-b border-gray-dark">
                        <div className="flex-1">
                          <p className="text-xs text-gray-lightest uppercase tracking-wide mb-1">Barbero</p>
                          <p className="text-white-primary">{citaConfirmada.barbero}</p>
                          <p className="text-gray-lightest text-sm">{citaConfirmada.barberoEspecialidad}</p>
                        </div>
                        <User className="w-5 h-5 text-gray-light mt-1" />
                      </div>

                      {/* Servicio */}
                      <div className="flex items-start justify-between pb-3 border-b border-gray-dark">
                        <div className="flex-1">
                          <p className="text-xs text-gray-lightest uppercase tracking-wide mb-1">Servicio</p>
                          <p className="text-white-primary">{citaConfirmada.servicio}</p>
                        </div>
                        <Scissors className="w-5 h-5 text-gray-light mt-1" />
                      </div>

                      {/* Precio */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-lightest uppercase tracking-wide mb-1">Precio Total</p>
                          <p className="text-orange-primary text-xl">
                            {formatearPrecio(citaConfirmada.precio)}
                          </p>
                        </div>
                      </div>

                      {/* Notas si existen */}
                      {citaConfirmada.notas && (
                        <div className="pt-3 border-t border-gray-dark">
                          <p className="text-xs text-gray-lightest uppercase tracking-wide mb-1">Notas</p>
                          <p className="text-white-primary text-sm">{citaConfirmada.notas}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recordatorio */}
                  <div className="bg-orange-primary/10 border border-orange-primary/30 rounded-lg p-3">
                    <p className="text-orange-primary text-sm text-center">
                      💡 Por favor llega 5 minutos antes de tu cita
                    </p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccessAlert(false);
                setCitaConfirmada(null);
              }}
              className="elegante-button-primary w-full"
            >
              Perfecto, entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}