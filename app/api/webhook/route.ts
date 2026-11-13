import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { enviarEventoMeta } from "@/lib/meta-capi";

function assinaturaValida(corpoBruto: string, header: string | null): boolean {
  const segredo = process.env.NEXUSPAG_WEBHOOK_SECRET;
  if (!segredo || !header) return false;

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
  if (Math.abs(agora - Number(timestamp)) > 300) return false;

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
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    const payload = JSON.parse(corpoBruto);
    const txId = payload?.transaction_id || payload?.txid;
    const status = payload?.status;

    if (!txId) return NextResponse.json({ ok: true });

    const mapa: Record<string, string> = {
      "payment.confirmed": "paid",
      "pix.payment.confirmed": "paid",
    };

    const novoStatus = mapa[evento] || status || "processing";
    const supabase = getSupabaseAdmin();

    const { data: pedido } = await supabase
      .from("pedidos")
      .select("tx_id, status, nome, email, documento, telefone, valor_centavos, kit, quantidade")
      .eq("tx_id", String(txId))
      .maybeSingle();

    if (!pedido) {
      console.error("Pedido não encontrado:", txId);
      return NextResponse.json({ ok: true });
    }

    if (pedido.status === "paid" && novoStatus === "paid") {
      return NextResponse.json({ ok: true, duplicado: true });
    }

    const atualizacao: Record<string, unknown> = {
      status: novoStatus,
      atualizado_em: new Date().toISOString(),
    };

    if (novoStatus === "paid") {
      atualizacao.pago_em = payload?.paid_at || new Date().toISOString();
    }

    await supabase.from("pedidos").update(atualizacao).eq("tx_id", String(txId));

    if (novoStatus === "paid") {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        undefined;

      const userAgent = req.headers.get("user-agent") || undefined;

      await enviarEventoMeta({
        eventName: "Purchase",
        eventId: `purchase-${txId}`,
        eventSourceUrl: process.env.NEXT_PUBLIC_SITE_URL,
        actionSource: "website",
        userData: {
          email: pedido.email,
          telefone: pedido.telefone,
          nome: pedido.nome,
          documento: pedido.documento,
          ip,
          userAgent,
        },
        customData: {
          value: pedido.valor_centavos / 100,
          currency: "BRL",
          contentName: pedido.kit || "Doação",
          contentType: "product",
          numItems: pedido.quantidade || 1,
          orderId: String(txId),
        },
      });
    }

    return NextResponse.json({ ok: true, status: novoStatus });
  } catch (erro) {
    console.error("Erro no webhook:", erro);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, rota: "webhook" }, { status: 200 });
}
