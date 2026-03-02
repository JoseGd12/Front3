// Utilidades para generar reportes en Excel
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: 'currency' | 'date' | 'text' | 'number';
}

export interface ExcelData {
  [key: string]: any;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  type: 'daily' | 'weekly' | 'monthly' | 'annual';
}

// Función para formatear moneda colombiana
export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('es-CO')}`;
};

// Función para formatear fecha
export const formatDate = (dateString: string): string => {
  return dateString;
};

// Función para convertir datos a formato CSV
export const dataToCSV = (data: ExcelData[], columns: ExcelColumn[]): string => {
  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key] || '';
      
      // Aplicar formato según el tipo
      switch (col.format) {
        case 'currency':
          value = typeof value === 'number' ? formatCurrency(value) : value;
          break;
        case 'date':
          value = typeof value === 'string' ? formatDate(value) : value;
          break;
        case 'number':
          value = typeof value === 'number' ? value.toString() : value;
          break;
        default:
          value = value.toString();
      }
      
      // Escapar comillas en CSV
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  }).join('\n');
  
  return `${headers}\n${rows}`;
};

// Función para descargar archivo CSV
export const downloadCSV = (data: ExcelData[], columns: ExcelColumn[], filename: string): void => {
  const csv = dataToCSV(data, columns);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Función para filtrar datos por rango de fechas
export const filterDataByDateRange = (
  data: ExcelData[], 
  dateField: string, 
  dateRange: DateRange
): ExcelData[] => {
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);
  
  return data.filter(item => {
    const itemDate = parseDate(item[dateField]);
    return itemDate >= startDate && itemDate <= endDate;
  });
};

// Función para parsear fecha en formato dd-mm-yyyy
export const parseDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Función para obtener rangos de fecha predefinidos
export const getDateRanges = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  
  // Formato dd-mm-yyyy
  const formatDateString = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  return {
    daily: {
      startDate: formatDateString(today),
      endDate: formatDateString(today),
      type: 'daily' as const
    },
    weekly: {
      startDate: formatDateString(new Date(currentYear, currentMonth, currentDay - 7)),
      endDate: formatDateString(today),
      type: 'weekly' as const
    },
    monthly: {
      startDate: formatDateString(new Date(currentYear, currentMonth, 1)),
      endDate: formatDateString(new Date(currentYear, currentMonth + 1, 0)),
      type: 'monthly' as const
    },
    annual: {
      startDate: formatDateString(new Date(currentYear, 0, 1)),
      endDate: formatDateString(new Date(currentYear, 11, 31)),
      type: 'annual' as const
    }
  };
};

// Función para generar nombre de archivo con fecha
export const generateFilename = (baseName: string, dateRange: DateRange): string => {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  let rangeText = '';
  
  switch (dateRange.type) {
    case 'daily':
      rangeText = `Diario_${dateRange.startDate.replace(/-/g, '')}`;
      break;
    case 'weekly':
      rangeText = `Semanal_${dateRange.startDate.replace(/-/g, '')}_${dateRange.endDate.replace(/-/g, '')}`;
      break;
    case 'monthly':
      rangeText = `Mensual_${dateRange.startDate.replace(/-/g, '').slice(2, 6)}`;
      break;
    case 'annual':
      rangeText = `Anual_${dateRange.startDate.slice(-4)}`;
      break;
  }
  
  return `${baseName}_${rangeText}_${timestamp}.csv`;
};