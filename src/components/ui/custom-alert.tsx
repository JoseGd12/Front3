import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, X, Info, AlertCircle, Trash2, Edit, Plus } from "lucide-react";

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'created' | 'edited' | 'deleted';

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  type: AlertType;
  title: string;
  message?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const alertIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  created: Plus,
  edited: Edit,
  deleted: Trash2,
};

const alertStyles = {
  success: {
    iconColor: "text-green-400",
    borderColor: "border-green-400",
    bgColor: "bg-green-400/10"
  },
  error: {
    iconColor: "text-red-400",
    borderColor: "border-red-400",
    bgColor: "bg-red-400/10"
  },
  warning: {
    iconColor: "text-orange-secondary",
    borderColor: "border-orange-secondary",
    bgColor: "bg-orange-secondary/10"
  },
  info: {
    iconColor: "text-blue-400",
    borderColor: "border-blue-400",
    bgColor: "bg-blue-400/10"
  },
  created: {
    iconColor: "text-orange-primary",
    borderColor: "border-orange-primary",
    bgColor: "bg-orange-primary/10"
  },
  edited: {
    iconColor: "text-orange-primary",
    borderColor: "border-orange-primary",
    bgColor: "bg-orange-primary/10"
  },
  deleted: {
    iconColor: "text-red-400",
    borderColor: "border-red-400",
    bgColor: "bg-red-400/10"
  }
};

export function CustomAlert({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoClose = true,
  autoCloseDelay = 4000
}: CustomAlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!isOpen) return null;

  const Icon = alertIcons[type];
  const styles = alertStyles[type];

  return (
    <div
      className={`fixed inset-0 z-alert flex items-center justify-center p-4 transition-all duration-200 ${isVisible ? 'bg-black-primary/80 backdrop-blur-sm' : 'bg-black-primary/0'
        }`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      style={{ pointerEvents: 'all' }}
    >
      <div
        className={`relative max-w-md w-full transition-all duration-200 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`elegante-card ${styles.bgColor} border-2 ${styles.borderColor} relative`}>
          {/* Botón de cerrar */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-darker transition-colors"
          >
            <X className="w-4 h-4 text-gray-lighter" />
          </button>

          {/* Contenido */}
          <div className="pr-8">
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 mt-0.5`}>
                <Icon className={`w-6 h-6 ${styles.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white-primary font-semibold text-base mb-1">
                  {title}
                </h3>
                {message && (
                  <p className="text-gray-lightest text-sm leading-relaxed">
                    {message}
                  </p>
                )}
              </div>
            </div>

            {/* Botón de acción */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClose}
                className="elegante-button-primary px-4 py-2 text-sm"
              >
                Entendido
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Hook para manejar alertas
export function useCustomAlert() {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: AlertType;
    title: string;
    message?: string;
    autoClose?: boolean;
    autoCloseDelay?: number;
  }>>([]);

  const showAlert = (
    type: AlertType,
    title: string,
    message?: string,
    options?: {
      autoClose?: boolean;
      autoCloseDelay?: number;
    }
  ) => {
    const id = Date.now().toString();
    const alert = {
      id,
      type,
      title,
      message,
      autoClose: options?.autoClose ?? true,
      autoCloseDelay: options?.autoCloseDelay ?? 4000,
    };

    setAlerts(prev => [alert, ...prev]);

    // Auto-remove si autoClose está habilitado
    if (alert.autoClose) {
      setTimeout(() => {
        removeAlert(id);
      }, alert.autoCloseDelay);
    }

    return id;
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const success = (title: string, message?: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) =>
    showAlert('success', title, message, options);

  const error = (title: string, message?: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) =>
    showAlert('error', title, message, options);

  const warning = (title: string, message?: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) =>
    showAlert('warning', title, message, options);

  const info = (title: string, message?: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) =>
    showAlert('info', title, message, options);

  const created = (title: string, message?: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) =>
    showAlert('created', title, message, options);

  const edited = (title: string, message?: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) =>
    showAlert('edited', title, message, options);

  const deleted = (title: string, message?: string, options?: { autoClose?: boolean; autoCloseDelay?: number }) =>
    showAlert('deleted', title, message, options);

  const AlertContainer = () => (
    <>
      {alerts.map((alert) => (
        <CustomAlert
          key={alert.id}
          isOpen={true}
          onClose={() => removeAlert(alert.id)}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          autoClose={alert.autoClose}
          autoCloseDelay={alert.autoCloseDelay}
        />
      ))}
    </>
  );

  return {
    success,
    error,
    warning,
    info,
    created,
    edited,
    deleted,
    AlertContainer,
  };
}