import { useState } from "react";
import { Search, Eye, Calendar, DollarSign, User, Package, Scissors } from "lucide-react";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../ui/dialog";

// Función para formatear moneda colombiana
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-CO');
};

// Datos de ejemplo del historial de ventas del cliente
const ventasCliente = [
  {
    id: "VNT001",
    fecha: "15-11-2024",
    servicios: "Corte, Barba",
    productos: "Cera, Perfume",
    subtotal: 92437,
    iva: 17563,
    descuento: 0,
    total: 110000,
    barbero: "Miguel Rodriguez",
    estado: "Completada",
    metodoPago: "Tarjeta",
    productosDetalle: [
      { id: "PROD003", nombre: "Cera para Cabello", cantidad: 1, precio: 25000 },
      { id: "PROD004", nombre: "Perfume Masculino", cantidad: 1, precio: 120000 }
    ],
    serviciosDetalle: [
      { id: "SERV001", nombre: "Corte de Cabello", precio: 35000 },
      { id: "SERV002", nombre: "Arreglo de Barba", precio: 20000 }
    ]
  },
  {
    id: "VNT002",
    fecha: "28-10-2024",
    servicios: "Paquete Premium",
    productos: "Ninguno",
    subtotal: 67227,
    iva: 12773,
    descuento: 0,
    total: 80000,
    barbero: "Sofia Martinez",
    estado: "Completada",
    metodoPago: "Efectivo",
    productosDetalle: [],
    serviciosDetalle: [
      { id: "SERV004", nombre: "Paquete Premium Completo", precio: 80000 }
    ]
  },
  {
    id: "VNT003",
    fecha: "10-10-2024",
    servicios: "Corte, Tinturado",
    productos: "Champú Premium",
    subtotal: 71429,
    iva: 13571,
    descuento: 0,
    total: 85000,
    barbero: "Miguel Rodriguez",
    estado: "Completada",
    metodoPago: "Transferencia",
    productosDetalle: [
      { id: "PROD001", nombre: "Champú Premium Kerastase", cantidad: 1, precio: 45000 }
    ],
    serviciosDetalle: [
      { id: "SERV001", nombre: "Corte de Cabello", precio: 35000 },
      { id: "SERV005", nombre: "Tinturado", precio: 30000 }
    ]
  },
  {
    id: "VNT004",
    fecha: "25-09-2024",
    servicios: "Corte",
    productos: "Aceite de Barba",
    subtotal: 42017,
    iva: 7983,
    descuento: 0,
    total: 50000,
    barbero: "Carlos Mendoza",
    estado: "Completada",
    metodoPago: "Tarjeta",
    productosDetalle: [
      { id: "PROD008", nombre: "Aceite de Barba Premium", cantidad: 1, precio: 32000 }
    ],
    serviciosDetalle: [
      { id: "SERV001", nombre: "Corte de Cabello", precio: 35000 }
    ]
  },
  {
    id: "VNT005",
    fecha: "12-09-2024",
    servicios: "Barba, Cejas",
    productos: "Ninguno",
    subtotal: 29412,
    iva: 5588,
    descuento: 0,
    total: 35000,
    barbero: "Sofia Martinez",
    estado: "Completada",
    metodoPago: "Efectivo",
    productosDetalle: [],
    serviciosDetalle: [
      { id: "SERV002", nombre: "Arreglo de Barba", precio: 20000 },
      { id: "SERV003", nombre: "Arreglo de Cejas", precio: 15000 }
    ]
  }
];

export function ClienteHistorialVentasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenta, setSelectedVenta] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const filteredVentas = ventasCliente.filter(venta =>
    venta.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.servicios.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.barbero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (venta: any) => {
    setSelectedVenta(venta);
    setIsDetailDialogOpen(true);
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

  const totalGastado = ventasCliente.reduce((sum, venta) => sum + venta.total, 0);
  const visitasCompletadas = ventasCliente.filter(v => v.estado === "Completada").length;

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Mi Historial de Compras</h1>
            <p className="text-sm text-gray-lightest mt-1">Revisa todas tus visitas y servicios anteriores</p>
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
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-dark">
                  <th className="text-left py-3 px-4 text-gray-lightest font-medium text-sm">Número</th>
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
                  <tr key={venta.id} className="border-b border-gray-dark hover:bg-gray-darkest transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-white-primary font-medium">{venta.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-lightest">{venta.fecha}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span className="text-white-primary">{venta.servicios}</span>
                        {venta.productos !== "Ninguno" && (
                          <div className="text-xs text-gray-lightest mt-1">+ {venta.productos}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-lightest">{venta.barbero}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-orange-primary font-medium">${formatCurrency(venta.total)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={getMetodoPagoColor(venta.metodoPago)}>{venta.metodoPago}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(venta.estado)}`}>
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
          </div>

          {filteredVentas.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-lightest mb-4">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron compras que coincidan con tu búsqueda.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Detalles */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl bg-gray-darkest border-gray-dark">
            {selectedVenta && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white-primary">
                    Detalle de Compra - {selectedVenta.id}
                  </DialogTitle>
                  <DialogDescription className="text-gray-lightest">
                    Información completa de tu transacción
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* Información básica */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-primary" />
                        Fecha
                      </label>
                      <div className="elegante-input bg-gray-medium text-gray-lightest">
                        {selectedVenta.fecha}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-white-primary flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-primary" />
                        Barbero
                      </label>
                      <div className="elegante-input bg-gray-medium text-gray-lightest">
                        {selectedVenta.barbero}
                      </div>
                    </div>
                  </div>

                  {/* Servicios */}
                  <div className="space-y-4">
                    <label className="text-white-primary flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-orange-primary" />
                      Servicios Realizados
                    </label>
                    {selectedVenta.serviciosDetalle.map((servicio: any, index: number) => (
                      <div key={index} className="bg-gray-darker p-3 rounded-lg border border-gray-dark">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-white-primary font-medium">{servicio.nombre}</span>
                          </div>
                          <div className="text-orange-primary font-medium">
                            ${formatCurrency(servicio.precio)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Productos */}
                  <div className="space-y-4">
                    <label className="text-white-primary flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-primary" />
                      Productos Comprados
                    </label>
                    {selectedVenta.productosDetalle.length > 0 ? (
                      selectedVenta.productosDetalle.map((producto: any, index: number) => (
                        <div key={index} className="bg-gray-darker p-3 rounded-lg border border-gray-dark">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-white-primary font-medium">{producto.nombre}</span>
                              <div className="text-gray-lightest text-sm">
                                Cantidad: {producto.cantidad} × ${formatCurrency(producto.precio)}
                              </div>
                            </div>
                            <div className="text-orange-primary font-medium">
                              ${formatCurrency(producto.cantidad * producto.precio)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-darker p-3 rounded-lg border border-gray-dark text-center">
                        <span className="text-gray-lightest">No se compraron productos</span>
                      </div>
                    )}
                  </div>

                  {/* Resumen de Totales */}
                  <div className="bg-gray-darker p-4 rounded-lg border border-gray-dark">
                    <h4 className="text-white-primary mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-orange-primary" />
                      Resumen de Totales
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-lightest">Subtotal:</span>
                        <span className="text-white-primary font-medium">${formatCurrency(selectedVenta.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-lightest">IVA (19%):</span>
                        <span className="text-white-primary font-medium">${formatCurrency(selectedVenta.iva)}</span>
                      </div>
                      {selectedVenta.descuento > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-lightest">Descuento:</span>
                          <span className="text-red-400 font-medium">-${formatCurrency(selectedVenta.descuento)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-dark pt-3">
                        <div className="flex justify-between text-lg">
                          <span className="text-white-primary font-bold">Total Pagado:</span>
                          <span className="text-orange-primary font-bold">${formatCurrency(selectedVenta.total)}</span>
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