import { User, getIdTokenResult } from 'firebase/auth';

/**
 * Verifica si el usuario actual cumple o no las reglas de contraseñas.
 * Retorna: 'OK' (Válida), 'FIRST_LOGIN' (Temporal), 'EXPIRED' (+90 días)
 */
export const checkPasswordPolicy = async (user: User | null): Promise<'OK' | 'FIRST_LOGIN' | 'EXPIRED' | null> => {
    if (!user) return null;

    // IMPORTANTE: el true fuerza a que Firebase refresque el token
    // si el backend recién cambió los claims, los vemos inmediatamente.
    const tokenResult = await getIdTokenResult(user, true);
    const claims = tokenResult.claims;

    // 1. ¿Es Primer Login (contraseña obligatoria temporal)?
    if (claims.requiresPasswordChange) {
        return 'FIRST_LOGIN';
    }

    // 2. ¿Han pasado más de 90 días desde el último cambio?
    if (claims.passwordUpdatedAt) {
        const lastUpdateStr = claims.passwordUpdatedAt as string;
        const lastUpdateEpoch = parseInt(lastUpdateStr, 10);

        // Convertir Epoch de Unix (backend devuelve segundos) a objeto Date de JS
        const lastUpdateDate = new Date(lastUpdateEpoch * 1000);

        // Días de diferencia
        const daysPassed = (Date.now() - lastUpdateDate.getTime()) / (1000 * 3600 * 24);

        if (daysPassed > 90) {
            return 'EXPIRED';
        }
    }

    return 'OK'; // Si llegó aquí, todo está bien
};
