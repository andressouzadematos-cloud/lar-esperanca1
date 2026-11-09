import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: { txId: string } }
) {
  const { data } = await supabaseAdmin
    .from("doacoes")
    .select("status, valor_centavos")
    .eq("tx_id", params.txId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ status: "nao_encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    status: data.status,
    valor: data.valor_centavos / 100,
  });
}
