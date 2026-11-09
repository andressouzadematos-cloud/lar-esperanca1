"use client";

import { useState } from "react";

const VALORES = [25, 50, 100, 250, 500];

export default function Doar() {
  const [valor, setValor] = useState(50);
  const [outro, setOutro] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [pix, setPix] = useState<{
    txId: string;
    qrCode: string | null;
    qrCodeTexto: string | null;
    valor: number;
  } | null>(null);
  const [status, setStatus] = useState("pending");
  const [copiado, setCopiado] = useState(false);

  const valorFinal = outro ? Number(outro) || 0 : valor;

  async function gerarPix(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          documento,
          telefone,
          valor: valorFinal,
        }),
      });

      const dados = await r.json();

      if (!r.ok) {
        setErro(dados.error || "Não foi possível gerar o PIX.");
        return;
      }

      setPix(dados);
      setStatus("pending");
      iniciarPolling(dados.txId);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function iniciarPolling(txId: string) {
    const intervalo = setInterval(async () => {
      try {
        const r = await fetch(`/api/status/${txId}`);
        const d = await r.json();
        setStatus(d.status);
        if (d.status === "paid" || d.status === "expired" || d.status === "failed") {
          clearInterval(intervalo);
        }
      } catch {
        /* segue tentando */
      }
    }, 4000);

    setTimeout(() => clearInterval(intervalo), 30 * 60 * 1000);
  }

  async function copiar() {
    if (!pix?.qrCodeTexto) return;
    await navigator.clipboard.writeText(pix.qrCodeTexto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  if (pix && status === "paid") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F0FDF4] px-5">
        <div className="max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-10 w-10 text-green-600">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-black text-green-900">Doação confirmada!</h1>
          <p className="mt-3 text-gray-600">
            Obrigado por ajudar. Seu presente de R$ {pix.valor.toFixed(2).replace(".", ",")} vai
            chegar a uma criança do Lar Esperança.
          </p>
          <a
            href="/"
            className="mt-8 inline-block rounded-full bg-green-600 px-8 py-4 font-bold text-white transition hover:bg-green-700"
          >
            Voltar ao início
          </a>
        </div>
      </main>
    );
  }

  if (pix) {
    return (
      <main className="min-h-screen bg-[#F0FDF4] px-5 py-16">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-center text-2xl font-black text-green-900">
            Pague com PIX
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Doação de R$ {pix.valor.toFixed(2).replace(".", ",")}
          </p>

          {pix.qrCode && (
            <img
              src={pix.qrCode.startsWith("data:") ? pix.qrCode : `data:image/png;base64,${pix.qrCode}`}
              alt="QR Code do PIX"
              className="mx-auto mt-6 h-56 w-56 rounded-xl border border-gray-100"
            />
          )}

          {pix.qrCodeTexto && (
            <>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                PIX copia e cola
              </p>
              <textarea
                readOnly
                value={pix.qrCodeTexto}
                className="mt-2 h-24 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600"
              />
              <button
                onClick={copiar}
                className="mt-3 w-full rounded-full bg-green-600 py-4 font-bold text-white transition hover:bg-green-700"
              >
                {copiado ? "Copiado!" : "Copiar código PIX"}
              </button>
            </>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
            <span className="text-sm font-semibold text-green-800">
              Aguardando confirmação do pagamento...
            </span>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            O código expira em 30 minutos. Esta página atualiza sozinha.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F0FDF4] px-5 py-16">
      <div className="mx-auto max-w-md">
        <a href="/" className="text-sm font-semibold text-green-700 hover:underline">
          ← Voltar
        </a>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-green-900">
          Faça sua doação
        </h1>
        <p className="mt-2 text-gray-600">
          Pagamento por PIX. Confirmação em segundos.
        </p>

        <form onSubmit={gerarPix} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-bold text-green-900">Valor da doação</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VALORES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setValor(v);
                    setOutro("");
                  }}
                  className={`rounded-lg border-2 px-4 py-2.5 text-sm font-bold transition ${
                    valor === v && !outro
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-green-600"
                  }`}
                >
                  R$ {v}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Outro valor"
              value={outro}
              onChange={(e) => setOutro(e.target.value)}
              className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3 font-bold text-gray-700 outline-none focus:border-green-600"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-green-900">Nome completo</label>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-700 outline-none focus:border-green-600"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-green-900">E-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-700 outline-none focus:border-green-600"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-green-900">CPF</label>
            <input
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-700 outline-none focus:border-green-600"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-green-900">Telefone com DDD</label>
            <input
              required
              inputMode="tel"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-2 w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-700 outline-none focus:border-green-600"
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-full bg-green-600 py-5 text-lg font-extrabold text-white shadow-lg transition hover:bg-green-700 disabled:opacity-60"
          >
            {carregando
              ? "Gerando PIX..."
              : `Doar R$ ${valorFinal.toFixed(2).replace(".", ",")}`}
          </button>

          <p className="text-center text-xs text-gray-400">
            Seus dados são usados apenas para emitir o comprovante.
          </p>
        </form>
      </div>
    </main>
  );
}
