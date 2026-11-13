import { createHash } from "crypto";

const GRAPH_VERSION = "v21.0";

function hash(valor: string): string {
  return createHash("sha256").update(valor.trim().toLowerCase()).digest("hex");
}

function normalizarTelefone(tel: string): string {
  const digitos = tel.replace(/\D/g, "");
  return digitos.startsWith("55") ? digitos : `55${digitos}`;
}

export type EventoMeta = {
  eventName: string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: "website" | "offline" | "system_generated";
  userData: {
    email?: string;
    telefone?: string;
    nome?: string;
    documento?: string;
    ip?: string;
    userAgent?: string;
    fbc?: string;
    fbp?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentIds?: string[];
    contentType?: string;
    numItems?: number;
    orderId?: string;
  };
};

export async function enviarEventoMeta(evento: EventoMeta): Promise<boolean> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;

  if (!pixelId || !token) {
    console.error("META_PIXEL_ID ou META_CAPI_TOKEN não configurados.");
    return false;
  }

  const userData: Record<string, unknown> = {};

  if (evento.userData.email) userData.em = [hash(evento.userData.email)];
  if (evento.userData.telefone) userData.ph = [hash(normalizarTelefone(evento.userData.telefone))];
  if (evento.userData.nome) {
    const partes = evento.userData.nome.trim().split(/\s+/);
    userData.fn = [hash(partes[0])];
    if (partes.length > 1) userData.ln = [hash(partes[partes.length - 1])];
  }
  if (evento.userData.documento) {
    const doc = evento.userData.documento.replace(/\D/g, "");
    userData[doc.length === 11 ? "cpf" : "cnpj"] = [hash(doc)];
  }
  if (evento.userData.ip) userData.client_ip_address = evento.userData.ip;
  if (evento.userData.userAgent) userData.client_user_agent = evento.userData.userAgent;
  if (evento.userData.fbc) userData.fbc = evento.userData.fbc;
  if (evento.userData.fbp) userData.fbp = evento.userData.fbp;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: evento.eventName,
        event_time: evento.eventTime || Math.floor(Date.now() / 1000),
        event_id: evento.eventId,
        event_source_url: evento.eventSourceUrl,
        action_source: evento.actionSource || "website",
        user_data: userData,
        custom_data: evento.customData,
      },
    ],
  };

  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  try {
    const resposta = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Meta CAPI erro:", JSON.stringify(dados));
      return false;
    }

    console.log("Meta CAPI ok:", evento.eventName, evento.eventId, dados?.events_received);
    return true;
  } catch (erro) {
    console.error("Exceção ao enviar evento Meta:", erro);
    return false;
  }
}
