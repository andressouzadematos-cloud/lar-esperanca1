import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BASE = "https://api.invictuspayv2.com.br/api/v1";

export async function POST(req: Request) {
  try {
    const { nome, email, documento, telefone, valor } = await req.json();

    if (!nome || !email || !documento || !telefone || !valor) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
    }

    const centavos = Math.round(Number(valor) * 100);

    if (centavos < 500) {
      return NextResponse.json({ error: "O valor mínimo é R$ 5,00." }, { status: 400 });
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

    const resposta = await fetch(`${BASE}/transactions`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "X-Api-Key": process.env.INVICTUSPAY_API_KEY!,
      },
      body: JSON.stringify({
        amount: centavos,
        paymentMethod: "pix",
        customer: { name: nome, email, document: doc, phone: tel },
        items: [
  {
    offer_hash: process.env.INVICTUSPAY_OFFER_HASH!,
    quantity: 1,
    amount: centavos,
  },
],
            description: "Doação Campanha de Natal - Lar Esperança",
            quantity: 1,
            amount: centavos,
          },
        ],
        pix: { expirationInSeconds: 1800 },
        postbackUrl: `${siteUrl}/api/webhook`,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
  console.error("InvictusPay erro:", JSON.stringify(dados));
  return NextResponse.json(
    {
      error:
        dados?.message ||
        dados?.error ||
        `Falha na InvictusPay (HTTP ${resposta.status}).`,
    },
    { status: 502 }
  );
}

    const tx = dados?.data ?? dados;
    const txId = tx?.id ?? tx?.transaction?.id;
    const qrCode = tx?.pix?.qr_code ?? tx?.pix?.qrcode ?? tx?.qr_code ?? null;
    const qrTexto =
      tx?.pix?.qr_code_text ?? tx?.pix?.emv ?? tx?.pix?.copy_paste ?? tx?.qr_code_text ?? null;

    if (!txId) {
      console.error("Resposta sem ID:", dados);
      return NextResponse.json({ error: "Resposta inesperada do provedor." }, { status: 502 });
    }

    await supabaseAdmin.from("doacoes").insert({
      tx_id: txId,
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

    return NextResponse.json({ txId, qrCode, qrCodeTexto: qrTexto, valor: centavos / 100 });
  } catch (erro) {
    console.error("Erro no checkout:", erro);
    return NextResponse.json({ error: "Erro interno ao processar a doação." }, { status: 500 });
  }
}
