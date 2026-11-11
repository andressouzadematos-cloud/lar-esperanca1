import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { txId: string } }) {
  try {
    const txId = String(params.txId || "").trim();

    if (!txId) {
      return NextResponse.json({ status: "nao_encontrado" }, { status: 404 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("doacoes")
      .select("status, valor_centavos")
      .eq("tx_id", txId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao consultar status:", JSON.stringify(error));
      return NextResponse.json({ status: "erro" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ status: "nao_encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      status: data.status,
      valor: data.valor_centavos / 100,
    });
  } catch (erro) {
    console.error("Erro na rota de status:", erro);
    return NextResponse.json({ status: "erro" }, { status: 500 });
  }
}
