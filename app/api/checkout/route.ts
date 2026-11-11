import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE = "https://api.nexuspag.com/api/v1";

const VALORES_PERMITIDOS = [500, 1000, 2500, 5000, 10000, 25000, 50000];

export async function POST(req: Request) {
  try {
    const { nome, email, documento, telefone, valor } = await req.json();

    if (!nome || !email || !documento || !telefone || !valor) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
    }

    const centavos = Math.round(Number(valor) * 100);

    if (!VALORES_PERMITIDOS.includes(centavos)) {
      return NextResponse.json(
        { error: "Valor não disponível para doação." },
        { status: 400 }
      );
    }

    const doc = String(documento).replace(/\D/g, "");
    const tel = String(telefone).replace(/\D/g, "");

    if (doc.length !== 11 && doc.length !== 14) {
      return NextResponse.json({ error: "CPF ou CNPJ inválido." }, { status: 400 });
    }

    if (tel.length < 10 || tel.length > 11) {
      return NextResponse.json({ error: "Telefone inválido." }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const externalId = `lar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const resposta = await fetch(`${BASE}/pix/create`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Bearer ${process.env.NEXUSPAG_API_KEY}`,
      },
      body: JSON.stringify({
        amount: centavos,
        description: `Doacao Lar Esperanca - R$ ${(centavos / 100).toFixed(2)}`,
        external_id: externalId,
        webhook_url: `${siteUrl}/api/webhook`,
        expiration: 1800,
        customer: {
          name: nome,
          email,
          document: doc,
          phone: tel,
        },
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("NexusPag erro:", JSON.stringify(dados));
      return NextResponse.json(
        {
          error:
            dados?.message ||
            dados?.error ||
            `Falha na NexusPag (HTTP ${resposta.status}).`,
        },
        { status: 502 }
      );
    }

    const tx = dados?.data ?? dados;
    const txId = tx?.id ?? tx?.transaction_id ?? tx?.txid;
    const qrCode = tx?.qr_code ?? tx?.qrcode ?? tx?.pix?.qr_code ?? null;
    const qrTexto =
      tx?.qr_code_text ?? tx?.copy_paste ?? tx?.emv ?? tx?.pix?.qr_code_text ?? null;

    if (!txId) {
      console.error("Resposta sem ID:", JSON.stringify(dados));
      return NextResponse.json({ error: "Resposta inesperada do provedor." }, { status: 502 });
    }

    await getSupabaseAdmin().from("doacoes").insert({
      tx_id: String(txId),
      nome,
      email,
      documento: doc,
      telefone: tel,
      valor_centavos: centavos,
      status: "pending",
      metodo: "pix",
      qr_code: qrCode,
      qr_code_texto: qrTexto,
    });

    return NextResponse.json({
      txId: String(txId),
      qrCode,
      qrCodeTexto: qrTexto,
      valor: centavos / 100,
    });
  } catch (erro) {
    console.error("Erro no checkout:", erro);
    return NextResponse.json({ error: "Erro interno ao processar a doação." }, { status: 500 });
  }
}
