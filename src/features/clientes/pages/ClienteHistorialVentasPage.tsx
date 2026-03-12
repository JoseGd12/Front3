import { useState, useEffect } from "react";
import { Search, Eye, Calendar, DollarSign, User, Package, Scissors, Loader2 } from "lucide-react";
import { Input } from "../../../shared/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../shared/components/ui/dialog";
import { useAuth } from "../../../shared/contexts/AuthContext";
import { ventaService, type Venta } from "../../ventas/services/ventaService";
import { clientesService } from "../services/clientesService";

// Función para formatear moneda colombiana
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-CO');
};

export function ClienteHistorialVentasPage() {
  const { user } = useAuth();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    fetchVentas();
  }, [user]);

  const fetchVentas = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      // 1. Obtener perfil de cliente para tener su ID numérico
      const allClientes = await clientesService.getClientes();
      const cliente = allClientes.find(c => (c.correo || '').toLowerCase() === user.email.toLowerCase());
      
      if (cliente) {
        const data = await ventaService.getVentasByClienteId(Number(cliente.id));
        setVentas(data);
      }
    } catch (err) {
      console.error("Error fetching client sales:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVentas = ventas.filter(venta =>
    venta.numeroVenta.toString().includes(searchTerm) ||
    venta.servicios.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.barbero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = async (venta: Venta) => {
    setSelectedVenta(venta);
    setIsDetailDialogOpen(true);
    setIsLoadingDetail(true);
    try {
      const fullVenta = await ventaService.getVentaById(venta.id);
      if (fullVenta) {
        setSelectedVenta(fullVenta);
      }
    } catch (err) {
      console.error("Error fetching full sale details:", err);
      // Fallback: keep the partial data from the list
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Completada": return "bg-green-600 text-white";
      case "Anulada": return "bg-red-600 text-white";
      case "Pendiente": return "bg-orange-secondary text-white";
      default: return "bg-gray-medium text-white";
    }
  };

  const getMetodoPagoColor = (metodo: string) => {
    switch (metodo) {
      case "Efectivo": return "text-green-400";
      case "Tarjeta": return "text-blue-400";
      case "Transferencia": return "text-purple-400";
      default: return "text-gray-lightest";
    }
  };

  const totalGastado = ventas.filter(v => v.estado !== 'Anulada').reduce((sum, venta) => sum + (venta.total || 0), 0);
  const visitasCompletadas = ventas.filter(v => v.estado === "Completada").length;

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white-primary">Mi Historial de Compras</h1>
            <p className="text-sm text-gray-lightest mt-1">Revisa todas tus visitas y servicios anteriores</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-gray-darker px-4 py-2 rounded-lg border border-gray-dark">
                <p className="text-[10px] text-gray-lightest uppercase font-bold tracking-wider">Total Invertido</p>
                <p className="text-orange-primary font-bold text-lg">${formatCurrency(totalGastado)}</p>
            </div>
            <div className="bg-gray-darker px-4 py-2 rounded-lg border border-gray-dark">
                <p className="text-[10px] text-gray-lightest uppercase font-bold tracking-wider">Visitas</p>
                <p className="text-white-primary font-bold text-lg">{visitasCompletadas}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        {/* Search and Table */}
        <div className="elegante-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white-primary">Mis Compras</h2>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-lightest w-4 h-4" />
              <Input
                placeholder="Buscar por servicio, barbero o número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="elegante-input pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-orange-primary animate-spin mb-4" />
                    <p className="text-gray-lightest">Cargando tu historial...</p>
                </div>
            ) : (
                <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-dark">
                    <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">N° Venta</th>
                    <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Fecha</th>
                    <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Servicios</th>
                    <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Barbero</th>
                    <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Total</th>
                    <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Pago</th>
                    <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Estado</th>
                    <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredVentas.map((venta) => (
                    <tr key={venta.id} className="border-b border-gray-dark hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs text-orange-primary">
                        #{venta.numeroVenta}
                        </td>
                        <td className="py-4 px-4">
                        <span className="text-gray-lightest text-sm">{new Date(venta.fecha).toLocaleDateString()}</span>
                        </td>
                        <td className="py-4 px-4">
                        <div className="max-w-xs">
                            {venta.servicios && venta.servicios !== "Sin servicios" ? (
                                <span className="text-white-primary text-sm line-clamp-1">{venta.servicios}</span>
                            ) : (
                                <span className="text-gray-lightest text-xs italic">Venta de productos</span>
                            )}
                            {venta.productos && venta.productos !== "Sin productos" && (
                            <div className="text-[10px] text-orange-primary/80 mt-1 truncate">
                                <Package className="w-3 h-3 inline mr-1" />
                                {venta.productos}
                            </div>
                            )}
                        </div>
                        </td>
                        <td className="py-4 px-4">
                        <span className="text-gray-lightest text-sm">{venta.barbero}</span>
                        </td>
                        <td className="py-4 px-4 text-sm font-bold text-white-primary">
                        ${formatCurrency(venta.total)}
                        </td>
                        <td className="py-4 px-4">
                        <span className={`text-xs font-medium ${getMetodoPagoColor(venta.metodoPago)}`}>{venta.metodoPago}</span>
                        </td>
                        <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getEstadoColor(venta.estado)}`}>
                            {venta.estado}
                        </span>
                        </td>
                        <td className="py-4 px-4">
                        <button
                            onClick={() => handleViewDetails(venta)}
                            className="text-orange-primary hover:text-orange-secondary p-2 rounded-lg hover:bg-gray-darker transition-colors"
                            title="Ver detalles"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
          </div>

          {!isLoading && filteredVentas.length === 0 && (
            <div className="text-center py-20 bg-gray-darker/30 rounded-xl mt-4 border border-dashed border-gray-dark">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-dark" />
                <h3 className="text-white-primary font-bold">No hay compras registradas</h3>
                <p className="text-gray-lightest text-sm mt-1">Cuando realices servicios o compres productos, aparecerán aquí.</p>
            </div>
          )}
        </div>

        {/* Modal de Detalles */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl bg-gray-darkest border-gray-dark text-white-primary">
            {selectedVenta && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                    <span className="p-2 bg-orange-primary/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-orange-primary" />
                    </span>
                    Ticket de Venta #{selectedVenta.numeroVenta}
                  </DialogTitle>
                  <DialogDescription className="text-gray-lightest">
                    Generado el {new Date(selectedVenta.fecha).toLocaleString()}
                  </DialogDescription>
                </DialogHeader>

                {isLoadingDetail ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-orange-primary animate-spin mb-4" />
                        <p className="text-sm text-gray-lightest">Obteniendo detalles del ticket...</p>
                    </div>
                ) : (
                <div className="space-y-6 py-4">
                  {/* Resumen Superior */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-darker p-3 rounded-xl border border-gray-dark">
                        <p className="text-[10px] text-gray-lightest uppercase font-bold mb-1">Barbero que atendió</p>
                        <p className="text-sm font-medium flex items-center gap-2 text-white-primary">
                            <User className="w-3.5 h-3.5 text-orange-primary" />
                            {selectedVenta.barbero}
                        </p>
                    </div>
                    <div className="bg-gray-darker p-3 rounded-xl border border-gray-dark">
                        <p className="text-[10px] text-gray-lightest uppercase font-bold mb-1">Método de Pago</p>
                        <p className="text-sm font-medium flex items-center gap-2 text-white-primary">
                            <DollarSign className="w-3.5 h-3.5 text-orange-primary" />
                            {selectedVenta.metodoPago}
                        </p>
                    </div>
                  </div>

                  {/* Detalle de Servicios */}
                  {selectedVenta.serviciosDetalle.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-orange-primary uppercase tracking-widest flex items-center gap-2">
                            <Scissors className="w-3 h-3" />
                            Servicios Realizados
                        </h4>
                        <div className="space-y-2">
                            {selectedVenta.serviciosDetalle.map((s: any) => (
                            <div key={s.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                <span className="text-sm font-medium text-white-primary">{s.nombre}</span>
                                <span className="text-sm font-bold text-white-primary">${formatCurrency(s.precio)}</span>
                            </div>
                            ))}
                        </div>
                    </div>
                  )}

                  {/* Si no hay serviciosDetalle pero hay el string servicios, mostrar un fallback informativo */}
                  {selectedVenta.serviciosDetalle.length === 0 && selectedVenta.servicios && selectedVenta.servicios !== "Sin servicios" && (
                     <div className="space-y-3">
                        <h4 className="text-xs font-bold text-orange-primary uppercase tracking-widest flex items-center gap-2">
                            <Scissors className="w-3 h-3" />
                            Servicios Realizados
                        </h4>
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                            <p className="text-sm text-white-primary">{selectedVenta.servicios}</p>
                        </div>
                     </div>
                  )}

                  {/* Detalle de Productos */}
                  {selectedVenta.productosDetalle.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-orange-primary uppercase tracking-widest flex items-center gap-2">
                            <Package className="w-3 h-3" />
                            Productos Adquiridos
                        </h4>
                        <div className="space-y-2">
                            {selectedVenta.productosDetalle.map((p: any) => (
                            <div key={p.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white-primary">{p.nombre}</span>
                                    <span className="text-[10px] text-gray-lightest">Cant: {p.cantidad} x ${formatCurrency(p.precio)}</span>
                                </div>
                                <span className="text-sm font-bold text-white-primary">${formatCurrency(p.cantidad * p.precio)}</span>
                            </div>
                            ))}
                        </div>
                    </div>
                  )}

                  {/* Si no hay productosDetalle pero hay el string productos, mostrar fallback */}
                  {selectedVenta.productosDetalle.length === 0 && selectedVenta.productos && selectedVenta.productos !== "Sin productos" && (
                     <div className="space-y-3">
                        <h4 className="text-xs font-bold text-orange-primary uppercase tracking-widest flex items-center gap-2">
                            <Package className="w-3 h-3" />
                            Productos Adquiridos
                        </h4>
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                            <p className="text-sm text-white-primary">{selectedVenta.productos}</p>
                        </div>
                     </div>
                  )}

                  {/* Footer Totales */}
                  <div className="mt-8 pt-6 border-t border-gray-dark">
                    <div className="space-y-2 max-w-xs ml-auto">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-lightest font-medium">Subtotal</span>
                            <span className="text-white-primary font-bold">${formatCurrency(selectedVenta.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-lightest font-medium">IVA (19%)</span>
                            <span className="text-white-primary font-bold">${formatCurrency(selectedVenta.iva)}</span>
                        </div>
                        {selectedVenta.descuento > 0 && (
                            <div className="flex justify-between text-sm text-red-500 font-bold">
                                <span>Descuento</span>
                                <span>-${formatCurrency(selectedVenta.descuento)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-dark">
                            <span className="text-lg font-bold text-white-primary">Total</span>
                            <span className="text-2xl font-black text-orange-primary">${formatCurrency(selectedVenta.total)}</span>
                        </div>
                    </div>
                  </div>
                </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
