import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { toast, ToastT } from "sonner";
import React from "react";

type ToastKind = "success" | "error" | "warning" | "info" | "loading";

const icons: Record<ToastKind, React.ComponentType<any>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Info,
};

const colors: Record<ToastKind, { icon: string; border: string; bg: string; title: string; text: string }> = {
  success: { icon: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10", title: "text-white-primary", text: "text-gray-lightest" },
  error: { icon: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10", title: "text-white-primary", text: "text-gray-lightest" },
  warning: { icon: "text-orange-secondary", border: "border-orange-secondary/30", bg: "bg-orange-secondary/10", title: "text-white-primary", text: "text-gray-lightest" },
  info: { icon: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", title: "text-white-primary", text: "text-gray-lightest" },
  loading: { icon: "text-gray-300", border: "border-gray-500/30", bg: "bg-gray-500/10", title: "text-white-primary", text: "text-gray-lightest" },
};

function DarkToast({
  id,
  kind,
  title,
  message,
  duration,
}: {
  id: string | number;
  kind: ToastKind;
  title?: string;
  message?: string;
  duration?: number;
}) {
  const Icon = icons[kind];
  const c = colors[kind];
  return (
    <div
      className={`relative w-96 max-w-[92vw] p-4 border ${c.border} rounded-xl shadow-md`}
      style={{ pointerEvents: "all", background: "#1a1919" }}
      data-alert-container="true"
      onPointerDownCapture={(e) => { e.stopPropagation(); }}
      onMouseDownCapture={(e) => { e.stopPropagation(); }}
      onClick={(e) => { e.stopPropagation(); }}
    >
      <button
        onClick={() => toast.dismiss(id)}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-darker transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4 text-gray-lighter" />
      </button>
      <div className="pr-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={`w-6 h-6 ${c.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            {title ? <h3 className={`font-semibold text-base mb-1 ${c.title}`}>{title}</h3> : null}
            {message ? <p className={`text-sm leading-relaxed ${c.text}`}>{message}</p> : null}
            {!title && !message ? <div className={`h-1.5 mt-1 rounded bg-gray-700 overflow-hidden`} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

let patched = false;
const lastToastByKey = new Map<string, { id: any; time: number }>();

export function patchSonnerToasts() {
  if (patched) return;
  patched = true;

  const make = (kind: ToastKind) => {
    return (title?: string, opts?: { description?: string; duration?: number }) => {
      const message = opts?.description;
      const duration = typeof opts?.duration === "number" ? opts.duration : 8000;
      const key = [kind, title || "", message || ""].join("|");
      const now = Date.now();
      const prev = lastToastByKey.get(key);
      if (prev && now - prev.time < 250) {
        return prev.id;
      }
      if (prev) {
        try { toast.dismiss(prev.id); } catch {}
      }
      const id = (toast as any).custom(
        (tid: any) => <DarkToast id={tid} kind={kind} title={title} message={message} duration={duration} />,
        { duration } as ToastT
      );
      lastToastByKey.set(key, { id, time: now });
      return id;
    };
  };

  const original = { ...toast };
  (toast as any).error = make("error");
  (toast as any).success = make("success");
  (toast as any).warning = make("warning");
  (toast as any).info = make("info");
  (toast as any).loading = (message?: string, opts?: { duration?: number }) => {
    const duration = typeof opts?.duration === "number" ? opts.duration : 8000;
    const key = ["loading", message || ""].join("|");
    const now = Date.now();
    const prev = lastToastByKey.get(key);
    if (prev && now - prev.time < 250) {
      return prev.id;
    }
    if (prev) {
      try { toast.dismiss(prev.id); } catch {}
    }
    const id = (toast as any).custom(
      (tid: any) => <DarkToast id={tid} kind="loading" title={message} />,
      { duration: duration } as ToastT
    );
    lastToastByKey.set(key, { id, time: now });
    return id;
  };
  (toast as any).dismissAll = () => original.dismiss();
}
