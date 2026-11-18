import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

function validarAssinatura(bodyCru: string, header: string | null, segredo: string) {
  if (!header) return false;

  const partes = header.split(",").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const t = partes["t"];
  const v1 = partes["v1"];

  if (!t || !v1) return false;

  const esperado = crypto
    .createHmac("sha256", segredo)
    .update(`${t}.${bodyCru}`)
    .digest("hex");

  const a = Buffer.from(esperado, "utf8");
  const b = Buffer.from(v1, "utf8");

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const bodyCru = await req.text();
  const assinatura = req.headers.get("x-webhook-signature");
  const segredo = (process.env.NEXUSPAG_WEBHOOK_SECRET || "").trim();

  if (segredo && !validarAssinatura(bodyCru, assinatura, segredo)) {
    console.error("[webhook] assinatura inválida");
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyCru);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const txId = payload?.transaction_id || payload?.id;
  const status = payload?.status;

  if (!txId) {
    return NextResponse.json({ error: "Sem transaction_id." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: registro } = await supabase
    .from("doacoes")
    .select("id, status, valor_centavos, fbc, fbp, email, telefone, nome")
    .eq("tx_id", String(txId))
    .maybeSingle();

  if (!registro) {
    console.error("[webhook] doação não encontrada:", txId);
    return NextResponse.json({ ok: true });
  }

  if (registro.status === "paid") {
    return NextResponse.json({ ok: true });
  }

  if (status !== "paid") {
    await supabase
      .from("doacoes")
      .update({ status: status || "pending", atualizado_em: new Date().toISOString() })
      .eq("tx_id", String(txId));

    return NextResponse.json({ ok: true });
  }

  await supabase
    .from("doacoes")
    .update({
      status: "paid",
      pago_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("tx_id", String(txId));

  const valor = registro.valor_centavos / 100;
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;

  if (pixelId && token) {
    const evento = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: `purchase-${txId}`,
          action_source: "website",
          event_source_url: `${process.env.NEXT_PUBLIC_SITE_URL}/obrigado?tx=${txId}`,
          user_data: {
            em: [crypto.createHash("sha256").update(String(registro.email).toLowerCase().trim()).digest("hex")],
            ph: [crypto.createHash("sha256").update(String(registro.telefone).replace(/\D/g, "")).digest("hex")],
            ...(registro.fbc ? { fbc: registro.fbc } : {}),
            ...(registro.fbp ? { fbp: registro.fbp } : {}),
          },
          custom_data: {
            currency: "BRL",
            value: valor,
            content_name: "Doação Lar Esperança",
            content_type: "product",
            order_id: String(txId),
          },
        },
      ],
    };

    try {
      const r = await fetch(
        `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(evento),
        }
      );

      if (!r.ok) {
        console.error("[webhook] CAPI falhou:", await r.text());
      }
    } catch (e) {
      console.error("[webhook] CAPI erro:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
