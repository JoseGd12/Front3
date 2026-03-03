import React, { useState, useMemo } from 'react';
import { Package, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from "./utils";

interface ImageRendererProps {
    url?: string | null;
    alt?: string;
    className?: string;
}

/**
 * Componente unificado para renderizar imágenes de productos, servicios, clientes, etc.
 * Maneja automáticamente URLs externas, Base64, rutas locales y legacy a través del proxy.
 */
const ImageRenderer = ({ url, alt = "Imagen", className }: ImageRendererProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const candidates = useMemo(() => {
        if (!url) return [];

        const trimmed = String(url).trim();
        if (!trimmed) return [];

        const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
        let apiOrigin: string | null = null;
        if (envBase && /^https?:\/\//i.test(envBase)) {
            try {
                apiOrigin = new URL(envBase).origin;
            } catch {}
        }
        if (!apiOrigin) {
            apiOrigin = 'http://edwisbarbers.somee.com';
        }

        const out: string[] = [];

        if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) {
            try {
                const u = new URL(trimmed);
                const host = u.hostname.toLowerCase();
                const isLocal =
                    host === 'localhost' ||
                    host.startsWith('127.') ||
                    host.startsWith('10.') ||
                    host.startsWith('192.168.');
                if (isLocal) {
                    out.push(apiOrigin + u.pathname + u.search + u.hash);
                } else {
                    out.push(trimmed);
                }
            } catch {}
            if (out.length === 0) out.push(trimmed);
            return out;
        }

        if (trimmed.startsWith('/') || trimmed.startsWith('assets/')) {
            const pathWithSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
            if (pathWithSlash.startsWith('/assets/')) {
                if (import.meta.env?.DEV) return pathWithSlash;
                out.push(apiOrigin + pathWithSlash, pathWithSlash);
                return out;
            }
            if (!import.meta.env?.DEV) {
                out.push(apiOrigin + pathWithSlash);
            }
            out.push(pathWithSlash);
            return out;
        }

        if (!trimmed.includes('/')) {
            const p = `/assets/images/${trimmed}`;
            if (import.meta.env?.DEV) {
                out.push(
                    p,
                    `/Images/${trimmed}`,
                    `/images/${trimmed}`,
                    `/api/Images/${trimmed}`,
                    `/api/Images/file/${trimmed}`
                );
                return out;
            }
            out.push(
                apiOrigin + p,
                p,
                `${apiOrigin}/Images/${trimmed}`,
                `${apiOrigin}/images/${trimmed}`,
                `${apiOrigin}/api/Images/${trimmed}`,
                `${apiOrigin}/api/Images/file/${trimmed}`
            );
            return out;
        }

        const normalized = `/${trimmed.replace(/^\/+/, '')}`;
        if (!import.meta.env?.DEV) {
            out.push(apiOrigin + normalized);
        }
        out.push(normalized);
        return out;
    }, [url]);

    const [srcIndex, setSrcIndex] = useState(0);
    const normalizedUrl = candidates[srcIndex] ?? null;

    const handleLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleError = () => {
        if (srcIndex < candidates.length - 1) {
            setSrcIndex(srcIndex + 1);
            return;
        }
        setLoading(false);
        setError(true);
        console.error('❌ Error al cargar imagen:', normalizedUrl);
    };

    // Renderizar placeholder si no hay URL o si hubo un error
    if (!normalizedUrl || error) {
        return (
            <div className={cn(
                "flex flex-col items-center justify-center bg-gray-dark/40 border border-gray-dark/30 rounded-lg overflow-hidden shrink-0 aspect-square",
                className,
                error ? "border-red-500/20" : ""
            )}>
                <div className="flex flex-col items-center gap-1.5 opacity-40">
                    {error ? (
                        <ImageIcon className="w-5 h-5 text-red-400/60" />
                    ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                    )}
                    {!error && <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-500">Sin imagen</span>}
                    {error && <span className="text-[9px] uppercase tracking-wider font-semibold text-red-400/60">Error</span>}
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "relative overflow-hidden bg-gray-dark/20 border border-gray-dark/30 rounded-lg flex items-center justify-center shrink-0 aspect-square",
            className
        )}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-dark/40 z-10">
                    <Loader2 className="w-4 h-4 text-orange-primary/60 animate-spin" />
                </div>
            )}

            <img
                src={normalizedUrl}
                alt={alt}
                loading="lazy"
                onLoad={handleLoad}
                onError={handleError}
                className={cn(
                    "w-full h-full object-cover transition-all duration-300",
                    loading ? "opacity-0 scale-95" : "opacity-100 scale-100"
                )}
            />
        </div>
    );
};

export default React.memo(ImageRenderer);
