import { useState, useEffect } from 'react';

// Utilidad para obtener colores del tema actual
export function getThemeColors() {
  // Obtener el tema actual del documento
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  
  if (theme === 'light') {
    return {
      primary: '#5D4037',      // Café oscuro (reemplaza naranja)
      primaryHover: '#6D4C41',
      primaryDark: '#4E342E',
      accent: '#5D4037',       // Café oscuro (reemplaza dorado)
      accentAlt: '#4E342E',
      gold: '#5D4037',         // Café oscuro (reemplaza #FFD700)
      goldAlt: '#4E342E',      // Café oscuro (reemplaza #FFC107)
      orange: '#5D4037',       // Café oscuro (reemplaza #E3931C)
      orangeAlt: '#6D4C41',    // Café medio (reemplaza #F5A642)
    };
  }
  
  // Tema oscuro (predeterminado)
  return {
    primary: '#d8b081',        // Color secundario nuevo
    primaryHover: '#d8b081',
    primaryDark: '#c4a06d',
    accent: '#d8b081',         // Color secundario nuevo
    accentAlt: '#d8b081',
    gold: '#d8b081',
    goldAlt: '#d8b081',
    orange: '#d8b081',
    orangeAlt: '#d8b081',
  };
}

// Hook para usar en componentes React con reactividad
export function useThemeColors() {
  const [colors, setColors] = useState(getThemeColors());

  useEffect(() => {
    const updateColors = () => {
      setColors(getThemeColors());
    };

    // Escuchar cambios en el atributo data-theme
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}
