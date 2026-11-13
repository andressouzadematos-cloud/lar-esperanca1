declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type ParamsMeta = Record<string, unknown>;

export function trackMeta(
  evento: string,
  params?: ParamsMeta,
  eventId?: string
): void {
  if (typeof window === "undefined") return;

  if (typeof window.fbq !== "function") {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[meta] Pixel não disponível. Evento ignorado: ${evento}`);
    }
    return;
  }

  try {
    window.fbq("track", evento, params ?? {}, eventId ? { eventID: eventId } : undefined);
  } catch (erro) {
    console.error(`[meta] Falha ao disparar ${evento}:`, erro);
  }
}

export function trackMetaCustom(
  evento: string,
  params?: ParamsMeta,
  eventId?: string
): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  try {
    window.fbq("trackCustom", evento, params ?? {}, eventId ? { eventID: eventId } : undefined);
  } catch (erro) {
    console.error(`[meta] Falha ao disparar custom ${evento}:`, erro);
  }
}

export function gerarEventId(prefixo: string): string {
  const aleatorio =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefixo}-${aleatorio}`;
}

export function capturarFbclid(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");

  if (!fbclid) return;

  try {
    localStorage.setItem("fbclid", fbclid);
    localStorage.setItem("fbclid_ts", String(Date.now()));
  } catch {
    // localStorage bloqueado
  }
}

export function obterFbc(): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const fbclid = localStorage.getItem("fbclid");
    const ts = localStorage.getItem("fbclid_ts");
    if (!fbclid || !ts) return undefined;

    const idade = Date.now() - Number(ts);
    if (idade > 7 * 24 * 60 * 60 * 1000) return undefined;

    return `fb.1.${ts}.${fbclid}`;
  } catch {
    return undefined;
  }
}

export function obterFbp(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/);
  return match ? match[1] : undefined;
}
