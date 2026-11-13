declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMeta(
  evento: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", evento, params, eventId ? { eventID: eventId } : undefined);
}
