import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE = "https://nexuspag.com";

export async function GET(
  _req: Request,
  { params }: { params: { txId: string } }
) {
  const txId = params.txId;

  if (!txId) {
    return NextResponse.json({ error: "txId ausente." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: registro, error } = await supabase
    .from("doacoes")
    .select("tx_id, status, valor_centavos, external_id")
    .eq("tx_id", txId)
    .maybeSingle();

  if (error || !registro) {
    return NextResponse.json({ error: "Doação não encontrada." }, { status: 404 });
  }

  if (registro.status === "paid") {
    return NextResponse.json({
      status: "paid",
      valor: registro.valor_centavos / 100,
    });
  }

  if (["expired", "cancelled", "failed"].includes(registro.status)) {
    return NextResponse.json({
      status: registro.status,
      valor: registro.valor_centavos / 100,
    });
  }

  try {
    const r = await fetch(`${BASE}/api/pix/${registro.external_id || txId}`, {
      headers: {
        accept: "application/json",
        "x-api-key": (process.env.NEXUSPAG_API_KEY || "").trim(),
      },
      cache: "no-store",
    });

    if (r.ok) {
      const d = await r.json();
      const statusNexus = d?.status;

      if (statusNexus === "paid") {
        await supabase
          .from("doacoes")
          .update({ status: "paid", pago_em: new Date().toISOString() })
          .eq("tx_id", txId);

        return NextResponse.json({
          status: "paid",
          valor: registro.valor_centavos / 100,
        });
      }

      if (["expired", "cancelled"].includes(statusNexus)) {
        await supabase
          .from("doacoes")
          .update({ status: statusNexus })
          .eq("tx_id", txId);

        return NextResponse.json({
          status: statusNexus,
          valor: registro.valor_centavos / 100,
        });
      }
    }
  } catch {
    /* mantém pending e tenta de novo no próximo ciclo */
  }

  return NextResponse.json({
    status: "pending",
    valor: registro.valor_centavos / 100,
  });
}
