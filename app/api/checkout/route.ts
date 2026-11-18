import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE = "https://nexuspag.com";

const VALOR_MIN_CENTAVOS = 500;
const VALOR_MAX_CENTAVOS = 10000;

export async function POST(req: Request) {
  try {
    const { nome, email, documento, telefone, valor, fbc, fbp } = await req.json();

    if (!nome || !email || !documento || !telefone || !valor) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
    }

    const centavos = Math.round(Number(valor) * 100);

    if (centavos < VALOR_MIN_CENTAVOS || centavos > VALOR_MAX_CENTAVOS) {
      return NextResponse.json(
        { error: "Valor deve estar entre R$ 5 e R$ 100." },
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

    const resposta = await fetch(`${BASE}/api/pix/create`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": (process.env.NEXUSPAG_API_KEY || "").trim(),
      },
      body: JSON.stringify({
        amount: centavos / 100,
        description: `Doacao Lar Esperanca - ${nome}`,
        external_id: externalId,
        webhook_url: `${siteUrl}/api/webhook`,
        expiration: 1800,
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

    const tx = dados?.transaction ?? dados;

    const txId = tx?.id ?? tx?.txid;
    const qrCode = tx?.qr_code_base64 ?? null;
    const qrTexto = tx?.pix_copia_cola ?? null;

    if (!txId) {
      console.error("Resposta sem ID:", JSON.stringify(dados));
      return NextResponse.json({ error: "Resposta inesperada do provedor." }, { status: 502 });
    }

    await getSupabaseAdmin().from("doacoes").insert({
      tx_id: String(txId),
      external_id: externalId,
      nome,
      email,
      documento: doc,
      telefone: tel,
      valor_centavos: centavos,
      status: "pending",
      metodo: "pix",
      qr_code: qrCode,
      qr_code_texto: qrTexto,
      fbc: fbc || null,
      fbp: fbp || null,
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
