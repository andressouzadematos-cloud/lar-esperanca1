import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const evento = req.headers.get("X-Webhook-Event") || "";
    const payload = await req.json();

    const tx = payload?.transaction;
    const txId = tx?.id;

    if (!txId) return NextResponse.json({ ok: true });

    const mapa: Record<string, string> = {
      "EVENT:CHARGE_PAID": "paid",
      "EVENT:CHARGE_EXPIRED": "expired",
      "EVENT:CHARGE_REFUND": "refunded",
      "EVENT:CHARGE_CHARGEBACK": "chargeback",
      "EVENT:CHARGE_PRE_CHARGEBACK": "pre_chargeback",
      "EVENT:CHARGE_IN_DISPUTE": "in_dispute",
    };

    const status = mapa[evento] || tx?.status || "processing";

    const atualizacao: Record<string, unknown> = {
      status,
      atualizado_em: new Date().toISOString(),
    };

    if (status === "paid") {
      atualizacao.pago_em = tx?.paid_at || new Date().toISOString();
    }

    await supabaseAdmin.from("doacoes").update(atualizacao).eq("tx_id", txId);

    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error("Erro no webhook:", erro);
    return NextResponse.json({ ok: true });
  }
}
