const WEBHOOK_URL: string | undefined = (import.meta as any).env?.VITE_NOTIFY_WEBHOOK_URL;
const EMAIL_TO: string | undefined = (import.meta as any).env?.VITE_NOTIFY_EMAIL_TO;

type EntityType = 'usuario' | 'cliente' | 'barbero';

export async function notifyEntityCreated(type: EntityType, data: Record<string, any>): Promise<void> {
  try {
    if (!WEBHOOK_URL) return;
    const payload = {
      type,
      to: EMAIL_TO || undefined,
      subject: `Nuevo ${type} creado`,
      data
    };
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // Silencioso
  }
}
