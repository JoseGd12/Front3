import { useEffect, useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Calendar, DollarSign, Users, Scissors, Package, Clock, Download, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line, LegendType } from "recharts";
import { useThemeColors } from "../utils/themeColors";
import { ventaService, type Venta } from "../../services/ventaService";
import { agendamientoService, type Agendamiento } from "../../services/agendamientoService";
import { insumosService, type Insumo } from "../../services/insumosService";

type PeriodoClave = "semanal" | "mensual" | "anual";

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
  const colors = useThemeColors();
  const [periodoIngresos, setPeriodoIngresos] = useState<PeriodoClave>("mensual");
  const [showResumenPeriodos, setShowResumenPeriodos] = useState(true);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [agendamientos, setAgendamientos] = useState<Agendamiento[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      ventaService.getVentas().catch(() => []),
      agendamientoService.getAgendamientos().catch(() => []),
      insumosService.getInsumos().catch(() => [])
    ]).then(([v, a, i]) => {
      if (!isMounted) return;
      setVentas(Array.isArray(v) ? v : []);
      setAgendamientos(Array.isArray(a) ? a : []);
      setInsumos(Array.isArray(i) ? i : []);
    }).catch(() => {
      if (!isMounted) return;
    });
    return () => { isMounted = false; };
  }, []);

  const today = new Date();
  const isSameDay = (d: Date, b: Date) =>
    d.getFullYear() === b.getFullYear() && d.getMonth() === b.getMonth() && d.getDate() === b.getDate();

  const ventasHoy = useMemo(() => {
    return ventas.filter(v => {
      const dt = new Date(v.fecha);
      return isSameDay(dt, today);
    });
  }, [ventas]);

  const citasHoy = useMemo(() => {
    const hoy = today;
    return agendamientos
      .filter(c => {
        if (!c.fecha) return false;
        const [y, m, d] = c.fecha.split('-').map(Number);
        if (!y || !m || !d) return false;
        const dt = new Date(y, (m - 1), d);
        return isSameDay(dt, hoy);
      })
      .map(c => ({
        id: c.id,
        cliente: c.clienteNombre,
        servicio: c.servicioNombre || (c.paqueteNombre || "Servicio"),
        precio: Number(c.precio || 0),
        hora: c.hora || "",
        barbero: c.barberoNombre,
        estado: (c.estado || "").toString().toLowerCase()
      }));
  }, [agendamientos]);

  const inventarioBajo = useMemo(() => {
    return insumos
      .filter(p => typeof p.stock === "number" && typeof p.minimo === "number" && p.stock < p.minimo)
      .map(p => ({
        producto: p.nombre,
        stock: p.stock,
        minimo: p.minimo,
        categoria: p.categoria
      }));
  }, [insumos]);

  const totalVentasHoy = useMemo(() => ventasHoy.reduce((acc, v) => acc + (Number(v.total) || 0), 0), [ventasHoy]);
  const clientesAtendidosHoy = useMemo(() => {
    const setIds = new Set<string | number>();
    ventasHoy.forEach(v => {
      const id = v.clienteId ?? v.cliente;
      if (id !== undefined && id !== null && id !== '') setIds.add(id as any);
    });
    return setIds.size;
  }, [ventasHoy]);
  const serviciosRealizadosHoy = useMemo(() => {
    return ventasHoy.reduce((acc, v) => {
      const det = Array.isArray(v.serviciosDetalle) ? v.serviciosDetalle : [];
      return acc + det.reduce((s, d) => s + (Number(d.cantidad || 1)), 0);
    }, 0);
  }, [ventasHoy]);

  const metrics = useMemo(() => {
    return [
      {
        title: "Ventas Hoy",
        value: `$${formatCurrencyValue(totalVentasHoy)}`,
        change: "",
        icon: DollarSign,
        iconColor: "text-primary-gold",
        isPositive: true
      },
      {
        title: "Citas Agendadas",
        value: `${citasHoy.length}`,
        change: "",
        icon: Calendar,
        iconColor: "text-secondary-gold",
        isPositive: true
      },
      {
        title: "Clientes Atendidos",
        value: `${clientesAtendidosHoy}`,
        change: "",
        icon: Users,
        iconColor: "text-primary-gold",
        isPositive: true
      },
      {
        title: "Servicios Realizados",
        value: `${serviciosRealizadosHoy}`,
        change: "",
        icon: Scissors,
        iconColor: "text-gray-lightest",
        isPositive: true
      }
    ];
  }, [totalVentasHoy, citasHoy.length, clientesAtendidosHoy, serviciosRealizadosHoy]);

  const ventasComparativasPorPeriodo = useMemo(() => {
    const withinDays = (v: Venta, days: number) => {
      const dt = new Date(v.fecha);
      const start = new Date(today);
      start.setDate(start.getDate() - (days - 1));
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return dt >= start && dt <= end;
    };
    const aggregate = (subset: Venta[]) => {
      const prod = new Map<string, { nombre: string; monto: number; cantidad: number }>();
      const serv = new Map<string, { nombre: string; monto: number; cantidad: number }>();
      subset.forEach(v => {
        const pd = Array.isArray(v.productosDetalle) ? v.productosDetalle : [];
        const sd = Array.isArray(v.serviciosDetalle) ? v.serviciosDetalle : [];
        pd.forEach(d => {
          const n = d.nombre || "Producto";
          const m = Number(d.precio || 0) * Number(d.cantidad || 1);
          const e = prod.get(n) || { nombre: n, monto: 0, cantidad: 0 };
          e.monto += m;
          e.cantidad += Number(d.cantidad || 1);
          prod.set(n, e);
        });
        sd.forEach(d => {
          const n = d.nombre || "Servicio";
          const m = Number(d.precio || 0) * Number(d.cantidad || 1);
          const e = serv.get(n) || { nombre: n, monto: 0, cantidad: 0 };
          e.monto += m;
          e.cantidad += Number(d.cantidad || 1);
          serv.set(n, e);
        });
      });
      const topN = (arr: { nombre: string; monto: number; cantidad: number }[]) =>
        arr.sort((a, b) => b.monto - a.monto).slice(0, 4);
      return {
        productos: topN(Array.from(prod.values())),
        servicios: topN(Array.from(serv.values()))
      };
    };
    const semanal = aggregate(ventas.filter(v => withinDays(v, 7)));
    const mensual = aggregate(ventas.filter(v => withinDays(v, 30)));
    const anual = aggregate(ventas.filter(v => withinDays(v, 365)));
    return { semanal, mensual, anual } as const;
  }, [ventas]);

  const ingresosHistoricosPorPeriodo = useMemo(() => {
    const dayNames: string[] = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const sumBuckets = (buckets: { key: string; ventas: Venta[] }[]) => {
      return buckets.map(b => {
        let productos = 0;
        let servicios = 0;
        b.ventas.forEach(v => {
          const pd = Array.isArray(v.productosDetalle) ? v.productosDetalle : [];
          const sd = Array.isArray(v.serviciosDetalle) ? v.serviciosDetalle : [];
          productos += pd.reduce((s, d) => s + (Number(d.precio || 0) * Number(d.cantidad || 1)), 0);
          servicios += sd.reduce((s, d) => s + (Number(d.precio || 0) * Number(d.cantidad || 1)), 0);
        });
        return { label: b.key, ingresos: productos + servicios, productos, servicios };
      });
    };
    const semanalBuckets: { key: string; ventas: Venta[] }[] = (() => {
      const arr: { key: string; ventas: Venta[] }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const label: string = dayNames[d.getDay()] ?? "";
        arr.push({
          key: label,
          ventas: ventas.filter(v => isSameDay(new Date(v.fecha), d))
        });
      }
      return arr;
    })();
    const mensualBuckets: { key: string; ventas: Venta[] }[] = (() => {
      const arr: { key: string; ventas: Venta[] }[] = [];
      for (let i = 3; i >= 0; i--) {
        const start = new Date(today);
        start.setDate(start.getDate() - (i + 1) * 7);
        const end = new Date(today);
        end.setDate(end.getDate() - i * 7);
        const label = `Semana ${4 - i}`;
        arr.push({
          key: label,
          ventas: ventas.filter(v => {
            const dt = new Date(v.fecha);
            return dt >= start && dt <= end;
          })
        });
      }
      return arr;
    })();
    const monthNames: string[] = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const anualBuckets: { key: string; ventas: Venta[] }[] = (() => {
      const arr: { key: string; ventas: Venta[] }[] = [];
      for (let i = 5; i >= 0; i--) {
        const ref = new Date(today.getFullYear(), today.getMonth(), 1);
        ref.setMonth(ref.getMonth() - i);
        const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
        const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
        const label: string = monthNames[ref.getMonth()] ?? "";
        arr.push({
          key: label,
          ventas: ventas.filter(v => {
            const dt = new Date(v.fecha);
            return dt >= start && dt <= end;
          })
        });
      }
      return arr;
    })();
    return {
      semanal: sumBuckets(semanalBuckets),
      mensual: sumBuckets(mensualBuckets),
      anual: sumBuckets(anualBuckets)
    } as Record<PeriodoClave, Array<{ label: string; ingresos: number; productos: number; servicios: number }>>;
  }, [ventas]);

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
    const ventasRecientesData = (() => {
      const rows: { producto: string; cliente: string; cantidad: number; precioUnit: number }[] = [];
      const ordenadas = [...ventas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 20);
      ordenadas.forEach(v => {
        const cliente = v.cliente;
        const det = Array.isArray(v.productosDetalle) ? v.productosDetalle : [];
        det.forEach(d => {
          rows.push({
            producto: d.nombre || "Producto",
            cliente: typeof cliente === "string" ? cliente : "",
            cantidad: Number(d.cantidad || 1),
            precioUnit: Number(d.precio || 0)
          });
        });
      });
      return rows;
    })();
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
                ${ventasRecientesData.map(venta => `
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
              <p><strong>Ventas de Productos:</strong> ${ventasRecientesData.length} transacciones realizadas</p>
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
    const ordenadas = [...ventas].sort((a, b) => {
      const da = new Date(a.fecha).getTime();
      const db = new Date(b.fecha).getTime();
      return db - da;
    }).slice(0, 30);
    ordenadas.forEach(v => {
      const detalles = Array.isArray(v.productosDetalle) ? v.productosDetalle : [];
      detalles.forEach(d => {
        const nombre = d.nombre || "Producto";
        const unidades = Number(d.cantidad || 1);
        const ingreso = Number(d.precio || 0) * unidades;
        const actual = mapa.get(nombre) || { producto: nombre, unidades: 0, ingresos: 0 };
        actual.unidades += unidades;
        actual.ingresos += ingreso;
        mapa.set(nombre, actual);
      });
    });
    return Array.from(mapa.values()).sort((a, b) => b.ingresos - a.ingresos);
  }, [ventas]);

  // removed unused totalIngresosRecientes
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
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Dashboard</h1>
            <p className="text-sm text-gray-lightest mt-1">Vista general del sistema</p>
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
        <section className="mt-5 mb-12">
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
        <section className="w-full grid gap-8 xl:grid-cols-[2.2fr_1fr] items-start mb-12">
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
        <div className="mb-10">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
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
