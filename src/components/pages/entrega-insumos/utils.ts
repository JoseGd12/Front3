// Función para formatear moneda colombiana con puntos para separar miles
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-CO');
};

// Función para generar fecha automática
export const generateCurrentDate = () => {
  return new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Completada": return "bg-green-600 text-white";
    case "Pendiente": return "bg-orange-secondary text-white";
    case "Anulada": return "bg-red-600 text-white";
    default: return "bg-gray-medium text-white";
  }
};

export const getCantidadColor = (cantidad: number) => {
  if (cantidad >= 25) return "text-green-400";
  if (cantidad >= 10) return "text-blue-400";
  return "text-gray-lightest";
};

export const getMetodoPagoColor = (metodo: string) => {
  switch (metodo) {
    case "Efectivo": return "text-green-400";
    case "Tarjeta": return "text-blue-400";
    case "Transferencia": return "text-purple-400";
    default: return "text-gray-lightest";
  }
};

export const calcularTotalEntrega = (productos: Array<{ precio: number, cantidad: number }>) => {
  if (!productos || !Array.isArray(productos)) {
    return 0;
  }
  return productos.reduce((total, producto) =>
    total + (producto.precio * producto.cantidad), 0
  );
};

export const generateEntregaNumber = (totalEntregas: number) => {
  return `ENT${String(totalEntregas + 1).padStart(3, '0')}`;
};