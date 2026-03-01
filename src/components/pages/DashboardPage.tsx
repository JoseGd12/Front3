import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Calendar, DollarSign, Users, Scissors, Package, Clock, Download, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line, LegendType } from "recharts";
import { useThemeColors } from "../utils/themeColors";

const metrics = [
  {
    title: "Ventas Hoy",
    value: "$2,847",
    change: "+18.2%",
    icon: DollarSign,
    iconColor: "text-primary-gold",
    isPositive: true
  },
  {
    title: "Citas Agendadas",
    value: "23",
    change: "+12.5%",
    icon: Calendar,
    iconColor: "text-secondary-gold",
    isPositive: true
  },
  {
    title: "Clientes Atendidos",
    value: "18",
    change: "+8.3%",
    icon: Users,
    iconColor: "text-primary-gold",
    isPositive: true
  },
  {
    title: "Servicios Realizados",
    value: "31",
    change: "+15.7%",
    icon: Scissors,
    iconColor: "text-gray-lightest",
    isPositive: true
  },
];

const ventasComparativasPorPeriodo = {
  semanal: {
    productos: [
      { nombre: "Pomada Hair Wax", monto: 680000, cantidad: 42 },
      { nombre: "Shampoo Premium", monto: 520000, cantidad: 35 },
      { nombre: "Aceite de Barba", monto: 740000, cantidad: 48 },
      { nombre: "Cera Modeladora", monto: 410000, cantidad: 29 }
    ],
    servicios: [
      { nombre: "Corte + Barba", monto: 1280000, cantidad: 64 },
      { nombre: "Afeitado Clásico", monto: 820000, cantidad: 55 },
      { nombre: "Corte Dama", monto: 1090000, cantidad: 36 },
      { nombre: "Trat. Capilar", monto: 950000, cantidad: 22 }
    ],
  },
  mensual: {
    productos: [
      { nombre: "Pomada Hair Wax", monto: 2850000, cantidad: 185 },
      { nombre: "Shampoo Premium", monto: 2440000, cantidad: 160 },
      { nombre: "Aceite de Barba", monto: 3150000, cantidad: 210 },
      { nombre: "Cera Modeladora", monto: 1980000, cantidad: 135 }
    ],
    servicios: [
      { nombre: "Corte + Barba", monto: 5400000, cantidad: 270 },
      { nombre: "Afeitado Clásico", monto: 3200000, cantidad: 215 },
      { nombre: "Corte Dama", monto: 3800000, cantidad: 125 },
      { nombre: "Trat. Capilar", monto: 2960000, cantidad: 70 }
    ],
  },
  anual: {
    productos: [
      { nombre: "Pomada Hair Wax", monto: 35800000, cantidad: 2300 },
      { nombre: "Shampoo Premium", monto: 33200000, cantidad: 2180 },
      { nombre: "Aceite de Barba", monto: 40200000, cantidad: 2680 },
      { nombre: "Cera Modeladora", monto: 26100000, cantidad: 1820 }
    ],
    servicios: [
      { nombre: "Corte + Barba", monto: 68200000, cantidad: 3410 },
      { nombre: "Afeitado Clásico", monto: 41500000, cantidad: 2790 },
      { nombre: "Corte Dama", monto: 47800000, cantidad: 1570 },
      { nombre: "Trat. Capilar", monto: 36500000, cantidad: 870 }
    ],
  },
} as const;

const ingresosHistoricosPorPeriodo: Record<
  PeriodoClave,
  Array<{ label: string; ingresos: number; productos: number; servicios: number }>
> = {
  semanal: [
    { label: "Lun", ingresos: 920000, productos: 320000, servicios: 600000 },
    { label: "Mar", ingresos: 870000, productos: 275000, servicios: 595000 },
    { label: "Mié", ingresos: 940000, productos: 310000, servicios: 630000 },
    { label: "Jue", ingresos: 1020000, productos: 365000, servicios: 655000 },
    { label: "Vie", ingresos: 1160000, productos: 400000, servicios: 760000 },
    { label: "Sáb", ingresos: 1230000, productos: 430000, servicios: 800000 },
    { label: "Dom", ingresos: 870000, productos: 270000, servicios: 600000 },
  ],
  mensual: [
    { label: "Semana 1", ingresos: 3200000, productos: 980000, servicios: 2220000 },
    { label: "Semana 2", ingresos: 3350000, productos: 1010000, servicios: 2340000 },
    { label: "Semana 3", ingresos: 3480000, productos: 1060000, servicios: 2420000 },
    { label: "Semana 4", ingresos: 3620000, productos: 1100000, servicios: 2520000 },
  ],
  anual: [
    { label: "Ene", ingresos: 41000000, productos: 14500000, servicios: 26500000 },
    { label: "Feb", ingresos: 43000000, productos: 15000000, servicios: 28000000 },
    { label: "Mar", ingresos: 45000000, productos: 15500000, servicios: 29500000 },
    { label: "Abr", ingresos: 47000000, productos: 16000000, servicios: 31000000 },
    { label: "May", ingresos: 48500000, productos: 16300000, servicios: 32200000 },
    { label: "Jun", ingresos: 50000000, productos: 16800000, servicios: 33200000 },
  ],
};

const citasHoy = [
  { id: 1, cliente: "Carlos Mendez", servicio: "Corte + Barba", precio: 85000, hora: "09:00", barbero: "Miguel", estado: "confirmada" },
  { id: 2, cliente: "Ana García", servicio: "Corte Dama", precio: 65000, hora: "10:30", barbero: "Sofia", estado: "en-curso" },
  { id: 3, cliente: "José Torres", servicio: "Afeitado Clásico", precio: 45000, hora: "11:00", barbero: "Miguel", estado: "pendiente" },
  { id: 4, cliente: "María López", servicio: "Tratamiento Capilar", precio: 110000, hora: "12:00", barbero: "Sofia", estado: "confirmada" },
  { id: 5, cliente: "Roberto Silva", servicio: "Corte + Barba", precio: 85000, hora: "14:30", barbero: "Miguel", estado: "pendiente" },
];

const ventasRecientes = [
  { id: 1, producto: "Pomada Hair Wax", cantidad: 3, precioUnit: 45000, cliente: "Carlos Mendez" },
  { id: 2, producto: "Shampoo Premium", cantidad: 2, precioUnit: 38000, cliente: "Ana García" },
  { id: 3, producto: "Aceite de Barba", cantidad: 5, precioUnit: 52000, cliente: "José Torres" },
  { id: 4, producto: "Cera Modeladora", cantidad: 2, precioUnit: 36000, cliente: "María López" },
  { id: 5, producto: "Gel Fijador", cantidad: 4, precioUnit: 30000, cliente: "Roberto Silva" },
  { id: 6, producto: "Shampoo Premium", cantidad: 3, precioUnit: 38000, cliente: "Laura Duarte" },
  { id: 7, producto: "Pomada Hair Wax", cantidad: 1, precioUnit: 45000, cliente: "Tatiana Ruiz" },
];

const inventarioBajo = [
  { producto: "Shampoo Premium", stock: 3, minimo: 10, categoria: "Cuidado Capilar" },
  { producto: "Cuchillas de Afeitar", stock: 8, minimo: 20, categoria: "Herramientas" },
  { producto: "Toallas Desechables", stock: 15, minimo: 50, categoria: "Suministros" },
];

type PeriodoClave = keyof typeof ventasComparativasPorPeriodo;

const formatCurrencyValue = (amount: number) =>
  amount.toLocaleString("es-CO", { minimumFractionDigits: 0 });

const formatAxisValue = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".0", "")} M`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)} mil`;
  }
  return value.toLocaleString("es-CO");
};

const periodoLabels: Record<PeriodoClave, string> = {
  semanal: "Semana",
  mensual: "Mes",
  anual: "Año",
};

export function DashboardPage() {
  // Hook para colores temáticos que se actualiza automáticamente
  const colors = useThemeColors();
  const [periodoIngresos, setPeriodoIngresos] = useState<PeriodoClave>("mensual");
  const [showResumenPeriodos, setShowResumenPeriodos] = useState(true);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "confirmada": return "bg-primary text-black-primary";
      case "en-curso": return "bg-green-600 text-white";
      case "pendiente": return "bg-grey-medium text-white";
      default: return "bg-gray-medium text-white";
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "confirmada": return "Confirmada";
      case "en-curso": return "En Curso";
      case "pendiente": return "Pendiente";
      default: return estado;
    }
  };

  const generateDailyReportPDF = () => {
    // Crear el contenido HTML del reporte
    const reportContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Diario - Elite Barbershop</title>
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
          }
          
          .subtitle {
            font-size: 16px;
            color: #aaaaaa;
            margin-bottom: 15px;
          }
          
          .date {
            font-size: 14px;
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
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }
          
          .metric-card {
            background: #f8f9fa;
            border: 2px solid #d8b081;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }
          
          .metric-title {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
          }
          
          .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
          }
          
          .metric-change {
            font-size: 12px;
            color: #28a745;
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
          
          .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .status-confirmada {
            background: #d8b081;
            color: #000;
          }
          
          .status-en-curso {
            background: #28a745;
            color: #fff;
          }
          
          .status-pendiente {
            background: #ffc107;
            color: #000;
          }
          
          .inventory-alert {
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
          }
          
          .inventory-alert h4 {
            color: #e53e3e;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .inventory-details {
            font-size: 12px;
            color: #666;
          }
          
          .footer {
            background: #1a1a1a;
            color: #aaa;
            text-align: center;
            padding: 20px;
            margin-top: 40px;
            font-size: 12px;
          }
          
          .highlight {
            color: #d8b081;
            font-weight: bold;
          }
          
          .two-column {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          @media print {
            body {
              background: #fff;
            }
            .header {
              background: #000 !important;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">✂️ EDWINS BARBER</div>
          <div class="subtitle">Reporte Diario de Operaciones</div>
          <div class="date">${new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</div>
        </div>
        
        <div class="container">
          <!-- Métricas Principales -->
          <div class="section">
            <h2 class="section-title">📊 Métricas Principales</h2>
            <div class="metrics-grid">
              ${metrics.map(metric => `
                <div class="metric-card">
                  <div class="metric-title">${metric.title}</div>
                  <div class="metric-value">${metric.value}</div>
                  <div class="metric-change">${metric.change}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="two-column">
            <!-- Citas del Día -->
            <div class="section">
              <h2 class="section-title">📅 Citas del Día</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Hora</th>
                    <th>Barbero</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${citasHoy.map(cita => `
                    <tr>
                      <td>${cita.cliente}</td>
                      <td>${cita.servicio}</td>
                      <td>${cita.hora}</td>
                      <td>${cita.barbero}</td>
                      <td>
                        <span class="status-badge status-${cita.estado}">
                          ${getEstadoTexto(cita.estado)}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <!-- Inventario Bajo -->
            <div class="section">
              <h2 class="section-title">⚠️ Inventario Bajo</h2>
              ${inventarioBajo.map(item => `
                <div class="inventory-alert">
                  <h4>${item.producto}</h4>
                  <div class="inventory-details">
                    <strong>Stock:</strong> ${item.stock} unidades<br>
                    <strong>Mínimo:</strong> ${item.minimo} unidades<br>
                    <strong>Categoría:</strong> ${item.categoria}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Ventas Recientes -->
          <div class="section">
            <h2 class="section-title">💰 Ventas de Productos</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cliente</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${ventasRecientes.map(venta => `
                  <tr>
                    <td>${venta.producto}</td>
                    <td>${venta.cliente}</td>
                    <td>${venta.cantidad}</td>
                    <td class="highlight">$${formatCurrencyValue(venta.cantidad * venta.precioUnit)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Resumen del Día -->
          <div class="section">
            <h2 class="section-title">📋 Resumen del Día</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #E3931C;">
              <p><strong>Total de Citas:</strong> ${citasHoy.length} citas programadas</p>
              <p><strong>Citas Completadas:</strong> ${citasHoy.filter(c => c.estado === 'en-curso').length} en curso</p>
              <p><strong>Citas Pendientes:</strong> ${citasHoy.filter(c => c.estado === 'pendiente').length} por atender</p>
              <p><strong>Productos con Stock Bajo:</strong> ${inventarioBajo.length} requieren restock</p>
              <p><strong>Ventas de Productos:</strong> ${ventasRecientes.length} transacciones realizadas</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
          <p><strong class="highlight">EDWINS BARBER</strong> - Sistema de Gestión Integral</p>
        </div>
      </body>
      </html>
    `;

    // Crear un blob con el contenido HTML
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Crear un enlace temporal para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Diario_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // También abrir en nueva ventana para imprimir como PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();

      // Esperar a que se cargue y luego mostrar el diálogo de impresión
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  const datosPeriodoSeleccionado = ventasComparativasPorPeriodo[periodoIngresos];

  type ItemComparativa = {
    grupo: "Productos" | "Servicios";
    groupLabel: string;
    nombre: string;
    monto: number;
    cantidad: number;
    esSeparador?: false;
  } | {
    grupo: "Separador";
    groupLabel: "";
    nombre: " ";
    monto: 0;
    cantidad: 0;
    esSeparador: true;
  };

  const comparativaIngresos: ItemComparativa[] = useMemo(() => {
    const productos = datosPeriodoSeleccionado.productos.map((item, idx) => ({
      grupo: "Productos" as const,
      groupLabel: idx === 0 ? "Productos" : "",
      nombre: item.nombre,
      monto: item.monto,
      cantidad: item.cantidad,
    }));
    const servicios = datosPeriodoSeleccionado.servicios.map((item, idx) => ({
      grupo: "Servicios" as const,
      groupLabel: idx === 0 ? "Servicios" : "",
      nombre: item.nombre,
      monto: item.monto,
      cantidad: item.cantidad,
    }));
    return [
      ...productos,
      { grupo: "Separador", groupLabel: "", nombre: " ", monto: 0, cantidad: 0, esSeparador: true } as const,
      ...servicios,
    ];
  }, [datosPeriodoSeleccionado]);

  const totalProductos = datosPeriodoSeleccionado.productos.reduce((acc, item) => acc + item.monto, 0);
  const totalServicios = datosPeriodoSeleccionado.servicios.reduce((acc, item) => acc + item.monto, 0);
  const totalGeneralIngresos = totalProductos + totalServicios;
  const participacionProductos = totalGeneralIngresos ? (totalProductos / totalGeneralIngresos) * 100 : 0;
  const participacionServicios = totalGeneralIngresos ? (totalServicios / totalGeneralIngresos) * 100 : 0;

  const ventasPorProducto = useMemo(() => {
    const mapa = new Map<string, { producto: string; unidades: number; ingresos: number }>();
    ventasRecientes.forEach(venta => {
      const ingreso = venta.cantidad * venta.precioUnit;
      if (!mapa.has(venta.producto)) {
        mapa.set(venta.producto, { producto: venta.producto, unidades: 0, ingresos: 0 });
      }
      const registro = mapa.get(venta.producto)!;
      registro.unidades += venta.cantidad;
      registro.ingresos += ingreso;
    });
    return Array.from(mapa.values()).sort((a, b) => b.ingresos - a.ingresos);
  }, []);

  const totalIngresosRecientes = ventasPorProducto.reduce((acc, item) => acc + item.ingresos, 0);
  const renderIngresosTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0]?.payload;
    if (!item || item.esSeparador) return null;
    return (
      <div
        className="rounded-2xl border px-4 py-3 min-w-[220px]"
        style={{
          borderColor: item.grupo === "Productos" ? colors.gold : "#3b6473",
          backgroundColor: item.grupo === "Productos" ? "#241c13" : "#121528",
        }}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-gray-lightest mb-1">{item.grupo}</p>
        <p className="text-base font-semibold text-white-primary">{item.nombre}</p>
        <div className="mt-3 text-sm text-gray-lightest space-y-1">
          <div className="flex justify-between">
            <span>Unidades:</span>
            <span className="text-white-primary font-semibold">{item.cantidad}</span>
          </div>
          <div className="flex justify-between">
            <span>Ingresos:</span>
            <span
              className={`font-semibold ${item.grupo === "Productos" ? "text-orange-primary" : "text-blue-300"
                }`}
            >
              ${formatCurrencyValue(item.monto)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const ingresosTotalesPorPeriodo = useMemo(() => {
    const periodos: PeriodoClave[] = ["semanal", "mensual", "anual"];
    return periodos.map((periodo) => {
      const datos = ventasComparativasPorPeriodo[periodo];
      const productos = datos.productos.reduce((total, item) => total + item.monto, 0);
      const servicios = datos.servicios.reduce((total, item) => total + item.monto, 0);
      return {
        periodo,
        label: periodoLabels[periodo],
        ingresos: productos + servicios,
        productos,
        servicios
      };
    });
  }, []);

  const renderIngresosTotalesTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const punto = payload[0]?.payload;
    if (!punto) return null;
    return (
      <div className="rounded-2xl border border-gray-dark bg-black/90 px-4 py-3 min-w-[220px] space-y-1">
        <p className="text-sm text-white-primary font-semibold">{punto.label}</p>
        <p className="text-xs text-gray-lightest">Ingresos totales del periodo</p>
        <p className="text-xl text-orange-primary font-bold">${formatCurrencyValue(punto.ingresos)}</p>
        <div className="text-xs text-gray-lightest">
          <p>Productos: ${formatCurrencyValue(punto.productos)}</p>
          <p>Servicios: ${formatCurrencyValue(punto.servicios)}</p>
        </div>
      </div>
    );
  };

  const legendPayload = useMemo(
    () => [
      {
        value: "Ingresos totales",
        type: "line" as LegendType,
        color: "#22c55e",
      },
    ],
    []
  );
  const [periodoPrincipal, setPeriodoPrincipal] = useState<PeriodoClave>("mensual");
  const dataGraficaPrincipal = ingresosHistoricosPorPeriodo[periodoPrincipal];

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white-primary mb-2">Dashboard</h1>
            <p className="text-gray-lightest font-medium">Vista general de Elite Barbershop</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="elegante-tag-gold">
              Hoy: {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <button
              onClick={generateDailyReportPDF}
              className="elegante-button-primary gap-2 flex items-center hover:scale-105 transition-transform"
              title="Generar y descargar reporte diario en PDF"
            >
              <Download className="w-4 h-4" />
              Reporte Diario
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        {/* Indicadores resumidos */}
        <section className="max-w-6xl mt-5  mx-auto" style={{ marginTop: '10px', marginBottom: '50px' }}>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white-primary mb-2">Indicadores del Día</h3>
            <p className="text-gray-lightest font-medium">
              Estado rápido de ventas, citas, clientes y servicios.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {metrics.map(metric => {
              const Icon = metric.icon;
              return (
                <div key={metric.title} className="rounded-2xl border border-gray-dark bg-gray-darkest p-5 flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-sm text-gray-lightest uppercase tracking-[0.2em]">{metric.title}</p>
                    <p className="text-3xl font-bold text-white-primary mt-2">{metric.value}</p>
                    <span className={`text-sm font-semibold ${metric.isPositive ? "text-green-400" : "text-red-400"}`}>
                      {metric.change}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-black/40 border border-gray-dark flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <hr />
        <br />
        {/* Gráfica comparativa y KPIs */}
        <section className="max-w-6xl mx-auto w-full grid gap-8 xl:grid-cols-[2.2fr_1fr] items-start"
          style={{ marginBottom: '50px' }}>
          <div className="elegante-card">
            <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-gray-dark">
              <div className="flex-1 min-w-[220px]">
                <h4 className="text-lg font-bold text-white-primary mb-1">Ingresos Productos vs Servicios</h4>
                <p className="text-sm text-gray-lightest">
                  Comparativa por {periodoLabels[periodoIngresos].toLowerCase()} (monto y unidades vendidas)
                </p>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <Badge className="bg-orange-primary/10 text-orange-primary border border-orange-primary/40">
                  {participacionServicios >= participacionProductos ? "Servicios" : "Productos"} dominan ({Math.max(participacionServicios, participacionProductos).toFixed(1)}%)
                </Badge>
                <div className="flex items-center rounded-full border border-gray-dark overflow-hidden">
                  {(["semanal", "mensual", "anual"] as PeriodoClave[]).map((periodo) => (
                    <button
                      key={periodo}
                      onClick={() => setPeriodoIngresos(periodo)}
                      className={`px-4 py-1.5 text-sm font-medium transition-colors ${periodoIngresos === periodo
                        ? "bg-orange-primary text-black-primary"
                        : "text-gray-lightest hover:bg-white/5"
                        }`}
                    >
                      {periodoLabels[periodo]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-6" style={{ height: "360px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparativaIngresos}
                  barCategoryGap={60}
                  barGap={0}
                  margin={{ top: 20, right: 20, left: 0, bottom: 30 }}
                >
                  <defs>
                    <linearGradient id="productosGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.gold} stopOpacity={1} />
                      <stop offset="100%" stopColor={colors.goldAlt} stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="serviciosGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={1} />
                      <stop offset="100%" stopColor={colors.primaryDark} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis
                    dataKey="nombre"
                    interval={0}
                    tickLine={false}
                    axisLine={{ stroke: '#3a3a3a' }}
                    height={30}
                    tickFormatter={(_value, index) => {
                      const item = comparativaIngresos[index];
                      if (!item || item.esSeparador) return "";
                      return index === 0
                        ? "Productos"
                        : item.groupLabel === "Servicios"
                          ? "Servicios"
                          : "";
                    }}
                  />
                  <YAxis
                    stroke="#888888"
                    tickFormatter={(value) => formatAxisValue(value as number)}
                    tick={{ fill: '#888888', fontSize: 12 }}
                    axisLine={{ stroke: '#3a3a3a' }}
                  />
                  <Tooltip
                    cursor={{ fill: `${colors.primary}20` }}
                    content={renderIngresosTooltip}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 0, paddingBottom: 12 }}
                    formatter={(value) => (
                      <span className="text-sm text-gray-lightest">
                        {value === "Productos" ? "Productos" : "Servicios"}
                      </span>
                    )}
                    payload={[
                      { value: "Productos", type: "square", color: colors.gold },
                      { value: "Servicios", type: "square", color: "#3b6473" },
                    ]}
                  />
                  <Bar
                    dataKey="monto"
                    radius={[12, 12, 0, 0]}
                    maxBarSize={48}
                  >
                    {comparativaIngresos.map((entry, index) =>
                      entry.esSeparador ? (
                        <Cell key={`sep-${index}`} fill="transparent" />
                      ) : (
                        <Cell
                          key={`cell-${entry.nombre}-${index}`}
                          fill={
                            entry.grupo === "Productos"
                              ? "url(#productosGradient)"
                              : "#3b6473"
                          }
                          stroke={entry.grupo === "Productos" ? colors.goldAlt : "#3b6473"}
                          strokeWidth={entry.grupo === "Productos" ? 0 : 1.2}
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <hr />
        </section>


        {/* Sección Principal */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Citas de Hoy */}
            <div className="elegante-card">
              <div className="pb-6">
                <h3 className="text-xl font-bold text-white-primary mb-2">Citas de Hoy</h3>
                <p className="text-gray-lightest font-medium">
                  {citasHoy.length} citas programadas
                </p>
              </div>
              <div className="space-y-3">
                {citasHoy.map((cita) => (
                  <div key={cita.id} className="p-4 rounded-xl bg-gray-medium border border-gray-dark hover:bg-gray-dark transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gold-primary flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-black-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-white-primary">{cita.servicio}</h4>
                            <span className="text-xs text-orange-primary font-semibold bg-orange-primary/10 px-2 py-0.5 rounded-full">
                              ${formatCurrencyValue(cita.precio)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-lightest flex flex-wrap gap-4">
                            <span>
                              Cliente: <span className="font-medium text-white-primary">{cita.cliente}</span>
                            </span>
                            <span>
                              Barbero: <span className="font-medium text-white-primary">{cita.barbero}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-bold text-primary-gold block">{cita.hora}</span>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getEstadoColor(cita.estado)}`}>
                          {getEstadoTexto(cita.estado)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventario Bajo */}
            <div className="elegante-card">
              <div className="pb-6">
                <h3 className="text-xl font-bold text-white-primary mb-2">Inventario Bajo</h3>
                <p className="text-gray-lightest font-medium">
                  Productos que necesitan restock
                </p>
              </div>
              <div className="space-y-3">
                {inventarioBajo.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-red-900/20 border border-red-600/30 flex items-center justify-between gap-4 text-sm text-gray-lightest"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                        <Package className="w-4 h-4 text-red-300" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white-primary">{item.producto}</span>
                        <span className="text-xs text-red-300 uppercase tracking-[0.3em]">{item.categoria}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-red-400 font-semibold">Stock: {item.stock}</span>
                      <span className="text-gray-lightest">Min: {item.minimo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>


        <hr />
        {/* Bloque de rendimiento */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
          style={{ marginTop: '40px' }}>
          {/* Ventas recientes */}
          <div className="elegante-card">
            <div className="pb-6 border-b border-gray-dark">
              <h3 className="text-xl font-bold text-white-primary mb-2">Ventas recientes por producto</h3>
              <p className="text-gray-lightest text-sm">
                Muestra los ingresos y unidades que aportó cada producto en las últimas ventas registradas.
              </p>
            </div>
            <div className="pt-6" style={{ height: "360px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasPorProducto} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="producto" stroke="#888" tick={{ fill: '#ccc', fontSize: 12 }} />
                  <YAxis
                    stroke="#888"
                    tickFormatter={(value) => `$${formatAxisValue(value as number)}`}
                    tick={{ fill: '#ccc', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff10" }}
                    contentStyle={{ backgroundColor: "#0b0b0b", border: `1px solid ${colors.primary}` }}
                    formatter={(value: any, _name: any, props: any) => [
                      `$${formatCurrencyValue(value as number)} • ${props.payload.unidades} uds`,
                      props.payload.producto
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" radius={[12, 12, 0, 0]} fill="url(#productosGradient)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowResumenPeriodos(!showResumenPeriodos)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-dark bg-gray-darker/40 hover:bg-gray-darker transition-colors mb-3"
              >
                <span className="text-sm font-semibold text-white-primary">Resumen por Periodos</span>
                {showResumenPeriodos ? (
                  <ChevronUp className="w-4 h-4 text-gray-lightest" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-lightest" />
                )}
              </button>
              {showResumenPeriodos && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ingresosTotalesPorPeriodo.map((item) => (
                    <div key={`ventas-${item.periodo}-summary`} className="rounded-2xl border border-gray-dark bg-gray-darker/60 p-3">
                      <p className="text-xs text-gray-lightest uppercase tracking-[0.3em]">{item.label}</p>
                      <p className="text-xl font-bold text-white-primary mt-1">${formatCurrencyValue(item.ingresos)}</p>
                      <p className="text-xs text-gray-lightest mt-1">
                        Productos: <span className="font-semibold text-orange-primary">${formatCurrencyValue(item.productos)}</span>
                      </p>
                      <p className="text-xs text-gray-lightest">
                        Servicios: <span className="font-semibold text-blue-300">${formatCurrencyValue(item.servicios)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ingresos totales del negocio */}
          <div className="elegante-card">
            <div className="pb-6 border-b border-gray-dark">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white-primary mb-1">Ingresos totales del negocio</h3>
                  <p className="text-gray-lightest text-sm">
                    Evolución por periodo seleccionado combinando productos y servicios.
                  </p>
                </div>
                <div className="flex items-center rounded-full border border-gray-dark overflow-hidden">
                  {(["semanal", "mensual", "anual"] as PeriodoClave[]).map(
                    (periodo) => (
                      <button
                        key={periodo}
                        onClick={() => setPeriodoPrincipal(periodo)}
                        className={`px-4 py-1.5 text-sm font-medium transition-colors ${periodoPrincipal === periodo
                          ? "bg-orange-primary text-black-primary"
                          : "text-gray-lightest hover:bg-white/5"
                          }`}
                      >
                        {periodoLabels[periodo]}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="pt-6" style={{ height: "340px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dataGraficaPrincipal}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#292929" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#888"
                    tick={{ fill: "#ccc", fontSize: 13 }}
                    axisLine={{ stroke: "#333" }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#888"
                    tickFormatter={(value) => formatAxisValue(value as number)}
                    tick={{ fill: "#ccc", fontSize: 12 }}
                    axisLine={{ stroke: "#333" }}
                  />
                  <Tooltip content={renderIngresosTotalesTooltip} cursor={{ fill: `${colors.primary}20` }} />
                  <Legend
                    wrapperStyle={{ marginTop: 0, marginBottom: 0 }}
                    payload={legendPayload}
                  />
                  <Line
                    dataKey="ingresos"
                    stroke="#22c55e"
                    strokeWidth={4}
                    dot={{ r: 6, fill: "#22c55e" }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: "#16a34a" }}
                    name="Ingresos totales"
                    isAnimationActive
                    animationDuration={200}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowResumenPeriodos(!showResumenPeriodos)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-dark bg-gray-darker/40 hover:bg-gray-darker transition-colors mb-3"
              >
                <span className="text-sm font-semibold text-white-primary">Resumen por Periodos</span>
                {showResumenPeriodos ? (
                  <ChevronUp className="w-4 h-4 text-gray-lightest" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-lightest" />
                )}
              </button>
              {showResumenPeriodos && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ingresosTotalesPorPeriodo.map((item) => (
                    <div key={`${item.periodo}-summary`} className="rounded-2xl border border-gray-dark bg-gray-darker/60 p-3">
                      <p className="text-xs text-gray-lightest uppercase tracking-[0.3em]">{item.label}</p>
                      <p className="text-xl font-bold text-white-primary mt-1">${formatCurrencyValue(item.ingresos)}</p>
                      <p className="text-xs text-gray-lightest mt-1">
                        Productos: <span className="font-semibold text-orange-primary">${formatCurrencyValue(item.productos)}</span>
                      </p>
                      <p className="text-xs text-gray-lightest">
                        Servicios: <span className="font-semibold text-blue-300">${formatCurrencyValue(item.servicios)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}