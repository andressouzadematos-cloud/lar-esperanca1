import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

type PayloadNexus = {
  event?: string;
  type?: string;
  status?: string;
  data?: {
    id?: string;
    txid?: string;
    transaction_id?: string;
    status?: string;
    paid_at?: string;
  };
  transaction?: {
    id?: string;
    txid?: string;
    status?: string;
    paid_at?: string;
  };
};

function extrairTxId(payload: PayloadNexus): string | null {
  return (
    payload?.data?.id ||
    payload?.data?.txid ||
    payload?.data?.transaction_id ||
    payload?.transaction?.id ||
    payload?.transaction?.txid ||
    null
  );
}

function extrairStatus(payload: PayloadNexus): string | null {
  return payload?.data?.status || payload?.transaction?.status || payload?.status || null;
}

function assinaturaValida(corpoBruto: string, assinatura: string | null): boolean {
  const segredo = process.env.NEXUSPAG_WEBHOOK_SECRET;

  if (!segredo) {
    console.error("NEXUSPAG_WEBHOOK_SECRET não configurado.");
    return false;
  }

  if (!assinatura) {
    console.error("Requisição sem header de assinatura.");
    return false;
  }

  const esperado = createHmac("sha256", segredo).update(corpoBruto).digest("hex");
  const recebido = assinatura.replace(/^sha256=/, "").trim();

  if (recebido.length !== esperado.length) return false;

  try {
    return timingSafeEqual(Buffer.from(recebido, "hex"), Buffer.from(esperado, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const corpoBruto = await req.text();

    const assinatura =
      req.headers.get("x-nexuspag-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-webhook-signature");

    if (!assinaturaValida(corpoBruto, assinatura)) {
      console.error("Webhook com assinatura inválida.");
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    let payload: PayloadNexus;

    try {
      payload = JSON.parse(corpoBruto);
    } catch {
      console.error("Webhook com JSON inválido.");
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const txId = extrairTxId(payload);
    const status = extrairStatus(payload);
    const evento = payload?.event || payload?.type || "";

    console.log("Webhook Nexus recebido:", { txId, status, evento });

    if (!txId) {
      return NextResponse.json({ ok: true });
    }

    const statusNormalizado = String(status || "").toLowerCase();

    const pago = [
      "paid",
      "approved",
      "completed",
      "confirmed",
      "succeeded",
      "pago",
      "aprovado",
    ].includes(statusNormalizado);

    const falhou = [
      "failed",
      "refused",
      "canceled",
      "cancelled",
      "expired",
      "rejected",
    ].includes(statusNormalizado);

    const reembolsado = ["refunded", "chargeback", "in_dispute", "pre_chargeback"].includes(
      statusNormalizado
    );

    const novoStatus = pago
      ? "paid"
      : falhou
        ? statusNormalizado === "expired"
          ? "expired"
          : "failed"
        : reembolsado
          ? statusNormalizado
          : "processing";

    const supabase = getSupabaseAdmin();

    const { data: doacao, error: erroBusca } = await supabase
      .from("doacoes")
      .select("tx_id, status")
      .eq("tx_id", txId)
      .maybeSingle();

    if (erroBusca) {
      console.error("Erro ao buscar doação:", JSON.stringify(erroBusca));
      return NextResponse.json({ error: "Erro ao buscar doação." }, { status: 500 });
    }

    if (!doacao) {
      console.error("Doação não encontrada para txId:", txId);
      return NextResponse.json({ ok: true, aviso: "Doação não encontrada." });
    }

    if (doacao.status === "paid" && novoStatus === "paid") {
      console.log("Doação já estava paga, ignorando duplicata:", txId);
      return NextResponse.json({ ok: true, duplicado: true });
    }

    const atualizacao: Record<string, unknown> = {
      status: novoStatus,
      atualizado_em: new Date().toISOString(),
    };

    if (novoStatus === "paid") {
      atualizacao.pago_em =
        payload?.data?.paid_at || payload?.transaction?.paid_at || new Date().toISOString();
    }

    const { error: erroUpdate } = await supabase
      .from("doacoes")
      .update(atualizacao)
      .eq("tx_id", txId);

    if (erroUpdate) {
      console.error("Erro ao atualizar doação:", JSON.stringify(erroUpdate));
      return NextResponse.json({ error: "Erro ao atualizar doação." }, { status: 500 });
    }

    console.log("Doação atualizada:", { txId, de: doacao.status, para: novoStatus });

    return NextResponse.json({ ok: true, status: novoStatus });
  } catch (erro) {
    console.error("Erro no webhook:", erro);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, rota: "webhook" }, { status: 200 });
}
