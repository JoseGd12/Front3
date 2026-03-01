import { useState, useEffect } from "react";
import { Search, Eye, Calendar, DollarSign, RotateCcw, Package } from "lucide-react";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { devolucionService } from "../../services/devolucionService";

// Función para formatear moneda colombiana
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-CO');
};

// Datos de ejemplo del historial de devoluciones del cliente
const devolucionesClienteMock = [
  {
    id: "DEV001",
    ventaId: "VNT001",
    fecha: "20-11-2024",
    motivo: "Producto defectuoso",
    descripcion: "La cera para cabello llegó con la tapa rota y producto derramado",
    items: [
      { tipo: "producto", nombre: "Cera para Cabello Premium", cantidad: 1, precio: 25000, devuelto: 25000 }
    ],
    totalDevuelto: 25000,
    estado: "Procesada",
    metodoPago: "Tarjeta",
    fechaProceso: "21-11-2024",
    barbero: "Miguel Rodriguez"
  }
];
// Ocultar el mock de la exportación para evitar confusiones
console.log(devolucionesClienteMock.length);


export function ClienteHistorialDevolucionesPage() {
  const { user } = useAuth();
  const [devoluciones, setDevoluciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevolucion, setSelectedDevolucion] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDevoluciones();
    }
  }, [user]);

  const loadDevoluciones = async () => {
    setIsLoading(true);
    try {
      const allDevs = await devolucionService.getDevoluciones();
      // Filtrar por el cliente actual
      const myDevs = allDevs.filter(d => String(d.clienteId) === user?.id);

      const formattedDevs = myDevs.map(d => ({
        id: `DEV${String(d.id).padStart(3, '0')}`,
        ventaId: `VEN${String(d.ventaId).padStart(3, '0')}`,
        fecha: d.fecha ? new Date(d.fecha).toLocaleDateString('es-CO') : '',
        motivo: d.motivo,
        descripcion: d.observaciones || 'Sin descripción adicional',
        items: [
          { tipo: "producto", nombre: d.productoNombre, cantidad: d.cantidad, devuelto: d.monto }
        ],
        totalDevuelto: d.monto,
        estado: d.estado === 'Activo' ? 'Procesada' : 'Rechazada',
        metodoPago: 'N/A', // O extraer de la venta si se desea
        fechaProceso: d.fecha ? new Date(d.fecha).toLocaleDateString('es-CO') : '',
        barbero: d.responsableNombre
      }));

      setDevoluciones(formattedDevs);
    } catch (error) {
      toast.error("Error al cargar tu historial de devoluciones");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDevoluciones = devoluciones.filter(devolucion =>
    devolucion.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    devolucion.ventaId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    devolucion.motivo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (devolucion: any) => {
    setSelectedDevolucion(devolucion);
    setIsDetailDialogOpen(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Procesada": return "bg-green-600 text-white";
      case "Rechazada": return "bg-red-600 text-white";
      case "Pendiente": return "bg-orange-secondary text-white";
      case "En Revisión": return "bg-blue-600 text-white";
      default: return "bg-gray-medium text-white";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "Procesada": return "✓";
      case "Rechazada": return "✗";
      case "Pendiente": return "⏳";
      case "En Revisión": return "👁";
      default: return "?";
    }
  };

  const totalDevuelto = devoluciones
    .filter(d => d.estado === "Procesada")
    .reduce((sum, devolucion) => sum + devolucion.totalDevuelto, 0);

  const devolucionesProcesadas = devoluciones.filter(d => d.estado === "Procesada").length;
  const devolucionesRechazadas = devoluciones.filter(d => d.estado === "Rechazada").length;

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Mi Historial de Devoluciones</h1>
            <p className="text-sm text-gray-lightest mt-1">Revisa todas tus solicitudes de devolución y reembolsos</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="elegante-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center text-green-500">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-lightest text-sm">Total Reembolsado</p>
                <h3 className="text-2xl font-bold text-white-primary">${formatCurrency(totalDevuelto)}</h3>
              </div>
            </div>
          </div>
          <div className="elegante-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-lightest text-sm">Solicitudes Procesadas</p>
                <h3 className="text-2xl font-bold text-white-primary">{devolucionesProcesadas}</h3>
              </div>
            </div>
          </div>
          <div className="elegante-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center text-red-500">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-lightest text-sm">Solicitudes Rechazadas</p>
                <h3 className="text-2xl font-bold text-white-primary">{devolucionesRechazadas}</h3>
              </div>
            </div>
          </div>
        </div>
        {/* Search and Table */}
        <div className="elegante-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white-primary">Mis Solicitudes de Devolución</h2>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-lightest w-4 h-4" />
              <Input
                placeholder="Buscar por número, venta o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="elegante-input pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-dark">
                  <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Devolución</th>
                  <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Venta Original</th>
                  <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Fecha</th>
                  <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Motivo</th>
                  <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Monto</th>
                  <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Estado</th>
                  <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-lightest italic">
                      Cargando tu historial de devoluciones...
                    </td>
                  </tr>
                ) : filteredDevoluciones.length > 0 ? (
                  filteredDevoluciones.map((devolucion) => (
                    <tr key={devolucion.id} className="border-b border-gray-dark hover:bg-gray-darkest transition-colors">
                      <td className="py-4 px-4">
                        <span className="text-white-primary font-medium">{devolucion.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-orange-primary font-medium">{devolucion.ventaId}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-lightest">{devolucion.fecha}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <span className="text-white-primary">{devolucion.motivo}</span>
                          <div className="text-xs text-gray-lightest mt-1 max-w-xs truncate">
                            {devolucion.descripcion}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${devolucion.estado === 'Procesada' ? 'text-green-400' : 'text-gray-lightest'}`}>
                          ${formatCurrency(devolucion.totalDevuelto)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(devolucion.estado)}`}>
                            {getEstadoIcon(devolucion.estado)} {devolucion.estado}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleViewDetails(devolucion)}
                          className="text-orange-primary hover:text-orange-secondary p-2 rounded-lg hover:bg-gray-darker transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-lightest italic">
                      No tienes devoluciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredDevoluciones.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-lightest mb-4">
                <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron devoluciones que coincidan con tu búsqueda.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Detalles */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl bg-gray-darkest border-gray-dark">
            {selectedDevolucion && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white-primary">
                    Detalle de Devolución - {selectedDevolucion.id}
                  </DialogTitle>
                  <DialogDescription className="text-gray-lightest">
                    Información completa de tu solicitud de devolución
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* Información básica */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-primary" />
                        Fecha de Solicitud
                      </label>
                      <div className="elegante-input bg-gray-medium text-gray-lightest">
                        {selectedDevolucion.fecha}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-white-primary flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-primary" />
                        Venta Original
                      </label>
                      <div className="elegante-input bg-gray-medium text-orange-primary font-medium">
                        {selectedDevolucion.ventaId}
                      </div>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="space-y-2">
                    <label className="text-white-primary">Estado de la Devolución</label>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-2 rounded-lg text-sm ${getEstadoColor(selectedDevolucion.estado)}`}>
                        {getEstadoIcon(selectedDevolucion.estado)} {selectedDevolucion.estado}
                      </span>
                      {selectedDevolucion.fechaProceso && (
                        <span className="text-gray-lightest text-sm">
                          Procesada el {selectedDevolucion.fechaProceso}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Motivo y Descripción */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-white-primary font-medium">Motivo de la Devolución</label>
                      <div className="mt-2 p-3 bg-gray-darker rounded-lg border border-gray-dark">
                        <p className="text-white-primary">{selectedDevolucion.motivo}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-white-primary font-medium">Descripción Detallada</label>
                      <div className="mt-2 p-3 bg-gray-darker rounded-lg border border-gray-dark">
                        <p className="text-gray-lightest">{selectedDevolucion.descripcion}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items Devueltos */}
                  <div className="space-y-4">
                    <label className="text-white-primary flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-orange-primary" />
                      Items Devueltos
                    </label>
                    {selectedDevolucion.items.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-darker p-3 rounded-lg border border-gray-dark">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-white-primary font-medium">{item.nombre}</span>
                            <div className="text-gray-lightest text-sm mt-1">
                              {item.tipo === 'producto' ? 'Producto' : 'Servicio'} •
                              Cantidad: {item.cantidad} •
                              Precio original: ${formatCurrency(item.precio)}
                            </div>
                          </div>
                          <div className="text-orange-primary font-medium">
                            ${formatCurrency(item.devuelto)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Motivo de Rechazo (si aplica) */}
                  {selectedDevolucion.estado === "Rechazada" && selectedDevolucion.motivoRechazo && (
                    <div className="space-y-2">
                      <label className="text-white-primary font-medium text-red-400">Motivo de Rechazo</label>
                      <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                        <p className="text-red-300">{selectedDevolucion.motivoRechazo}</p>
                      </div>
                    </div>
                  )}

                  {/* Resumen Total */}
                  <div className="bg-gray-darker p-4 rounded-lg border border-gray-dark">
                    <h4 className="text-white-primary mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-orange-primary" />
                      Resumen de la Devolución
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-lightest">Barbero responsable:</span>
                        <span className="text-white-primary font-medium">{selectedDevolucion.barbero}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-lightest">Método de pago original:</span>
                        <span className="text-white-primary font-medium">{selectedDevolucion.metodoPago}</span>
                      </div>
                      <div className="border-t border-gray-dark pt-3">
                        <div className="flex justify-between text-lg">
                          <span className="text-white-primary font-bold">
                            {selectedDevolucion.estado === 'Procesada' ? 'Monto Devuelto:' : 'Monto Solicitado:'}
                          </span>
                          <span className={`font-bold ${selectedDevolucion.estado === 'Procesada' ? 'text-green-400' : 'text-orange-primary'
                            }`}>
                            ${formatCurrency(selectedDevolucion.totalDevuelto)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}