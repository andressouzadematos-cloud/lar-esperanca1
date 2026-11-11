import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

function assinaturaValida(corpoBruto: string, header: string | null): boolean {
  const segredo = process.env.NEXUSPAG_WEBHOOK_SECRET;

  if (!segredo) {
    console.error("NEXUSPAG_WEBHOOK_SECRET não configurado.");
    return false;
  }

  if (!header) {
    console.error("Requisição sem header de assinatura.");
    return false;
  }

  const partes = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    })
  );

  const timestamp = partes["t"];
  const recebido = partes["v1"];

  if (!timestamp || !recebido) return false;

  const agora = Math.floor(Date.now() / 1000);
  if (Math.abs(agora - Number(timestamp)) > 300) {
    console.error("Timestamp do webhook fora da janela de tolerância.");
    return false;
  }

  const esperado = createHmac("sha256", segredo)
    .update(`${timestamp}.${corpoBruto}`)
    .digest("hex");

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
    const evento = req.headers.get("X-Webhook-Event") || "";

    const assinatura = req.headers.get("X-Webhook-Signature");

    if (!assinaturaValida(corpoBruto, assinatura)) {
      console.error("Webhook com assinatura inválida.");
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    const payload = JSON.parse(corpoBruto);

    const txId = payload?.transaction_id || payload?.txid;
    const status = payload?.status;

    console.log("Webhook Nexus recebido:", { evento, txId, status });

    if (!txId) return NextResponse.json({ ok: true });

    const mapa: Record<string, string> = {
      "payment.confirmed": "paid",
      "pix.payment.confirmed": "paid",
    };

    const novoStatus = mapa[evento] || status || "processing";

    const supabase = getSupabaseAdmin();

    const { data: doacao } = await supabase
      .from("doacoes")
      .select("tx_id, status")
      .eq("tx_id", String(txId))
      .maybeSingle();

    if (!doacao) {
      console.error("Doação não encontrada para txId:", txId);
      return NextResponse.json({ ok: true });
    }

    if (doacao.status === "paid" && novoStatus === "paid") {
      return NextResponse.json({ ok: true, duplicado: true });
    }

    const atualizacao: Record<string, unknown> = {
      status: novoStatus,
      atualizado_em: new Date().toISOString(),
    };

    if (novoStatus === "paid") {
      atualizacao.pago_em = payload?.paid_at || new Date().toISOString();
    }

    await supabase.from("doacoes").update(atualizacao).eq("tx_id", String(txId));

    return NextResponse.json({ ok: true, status: novoStatus });
  } catch (erro) {
    console.error("Erro no webhook:", erro);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, rota: "webhook" }, { status: 200 });
}
