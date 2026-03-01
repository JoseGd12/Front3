import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Package2 } from "lucide-react";
import { formatCurrency, getEstadoColor, getCantidadColor } from "./utils";

interface DetalleEntregaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entrega: any;
}

export function DetalleEntregaDialog({ isOpen, onOpenChange, entrega }: DetalleEntregaDialogProps) {
  if (!entrega) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="elegante-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white-primary">Detalles de la Entrega</DialogTitle>
          <DialogDescription className="text-gray-lightest">
            Información completa de la entrega {entrega.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-gray-darker">
              <Package2 className="w-8 h-8 text-orange-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white-primary">{entrega.id}</h3>
              <p className="text-gray-lightest">Entrega recibida de Nativos</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white-primary mb-2">Información General</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-lightest">Fecha:</span>
                    <span className="text-white-primary">{entrega.fecha}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-lightest">Proveedor:</span>
                    <span className="text-white-primary font-semibold">Nativos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-lightest">Responsable:</span>
                    <span className="text-white-primary">{entrega.responsableRecepcion}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-lightest">Estado:</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(entrega.estado)}`}>
                      {entrega.estado}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white-primary mb-2">Detalles de Entrega</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-lightest">Cantidad total:</span>
                    <span className={`font-semibold ${getCantidadColor(entrega.cantidadRecibida)}`}>
                      {entrega.cantidadRecibida} unidades
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-lightest">Total:</span>
                    <span className="text-primary-orange font-bold">${formatCurrency(entrega.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white-primary">Insumos Recibidos</h4>
            <div className="bg-gray-darker p-4 rounded-lg">
              <p className="text-white-primary">{entrega.productos}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-6">
          <button
            onClick={() => onOpenChange(false)}
            className="elegante-button-primary"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}