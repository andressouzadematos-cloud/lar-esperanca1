"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trackMeta } from "@/lib/meta-client";

const LINK_PRODUTO = process.env.NEXT_PUBLIC_LINK_PRODUTO_BRINQUEDOS || "#";

function PaginaObrigado() {
  const params = useSearchParams();
  const txId = params.get("tx") || "";
  const valorParam = Number(params.get("valor")) || 0;
  const [valor, setValor] = useState(valorParam);

  useEffect(() => {
    if (!txId) return;

    let cancelado = false;

    async function confirmar() {
      try {
        const r = await fetch(`/api/status/${txId}`);
        const d = await r.json();

        if (cancelado) return;

        const valorFinal = Number(d.valor) || valorParam;
        setValor(valorFinal);

        if (d.status === "paid") {
          trackMeta(
            "Purchase",
            {
              value: valorFinal,
              currency: "BRL",
              content_name: "Doação Lar Esperança",
              content_type: "product",
              num_items: 1,
              order_id: txId,
            },
            `purchase-${txId}`
          );
        }
      } catch {
        /* silencioso */
      }
    }

    confirmar();

    return () => {
      cancelado = true;
    };
  }, [txId, valorParam]);

  function abrirProduto() {
    trackMeta("ViewContent", {
      content_name: "Brinquedos com materiais descartáveis",
      content_type: "product",
      currency: "BRL",
      value: 19.9,
    });

    window.open(LINK_PRODUTO, "_blank");
  }

  const valorFormatado = valor.toFixed(2).replace(".", ",");

  return (
    <main className="min-h-screen bg-[#F0FDF4] text-[#14211A]">
      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-center px-5 py-5">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-green-600">
              <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
            </svg>
            <span className="text-lg font-extrabold tracking-tight text-green-900">
              Lar Esperança
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-12 w-12 text-green-600"
          >
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight text-green-900 md:text-5xl">
          Você acabou de mudar o Natal de uma criança
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-gray-700">
          Não é força de expressão. Neste momento, existe uma criança de 2 a 14 anos no Lar
          Esperança que vai dormir sabendo que alguém, em algum lugar, pensou nela.
        </p>

        <div className="mt-10 rounded-2xl border border-green-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Sua doação confirmada
          </p>
          <p className="mt-2 text-4xl font-black text-green-900">R$ {valorFormatado}</p>
          <p className="mt-3 text-sm text-gray-500">
            Comprovante enviado para o seu e-mail. Guarde com carinho.
          </p>
        </div>

        <p className="mt-10 text-lg leading-relaxed text-gray-700">
          Muitas dessas crianças chegaram ao Lar sem nada além da roupa do corpo. Algumas nunca
          receberam um presente com o próprio nome escrito. Este ano, vão receber.
        </p>

        <p className="mt-6 text-lg leading-relaxed text-gray-700">
          E o que você fez hoje não termina aqui.
        </p>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-5">
          <div className="rounded-3xl border-2 border-green-200 bg-[#F0FDF4] p-8 md:p-10">
            <span className="inline-block rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              Uma última coisa
            </span>

            <h2 className="mt-5 text-2xl font-black leading-tight tracking-tight text-green-900 md:text-3xl">
              E se você pudesse fazer um brinquedo com o que ia para o lixo?
            </h2>

            <p className="mt-5 leading-relaxed text-gray-700">
              Garrafa PET, rolo de papel, tampinha, caixa de leite. Coisas que você joga fora
              todos os dias podem virar um brinquedo que uma criança nunca teve.
            </p>

            <p className="mt-4 leading-relaxed text-gray-700">
              Criamos um guia com mais de 30 brinquedos que você monta em casa, com material
              descartável, em menos de 30 minutos. Serve para o seu filho, para o seu sobrinho —
              e serve para qualquer criança do Brasil que hoje não tem nada.
            </p>

            <div className="mt-6 space-y-2">
              <p className="flex items-start gap-2 text-sm font-semibold text-green-900">
                <span className="text-green-600">✓</span>
                Mais de 30 brinquedos passo a passo, com foto de cada etapa
              </p>
              <p className="flex items-start gap-2 text-sm font-semibold text-green-900">
                <span className="text-green-600">✓</span>
                Materiais que você já tem em casa — custo zero
              </p>
              <p className="flex items-start gap-2 text-sm font-semibold text-green-900">
                <span className="text-green-600">✓</span>
                Acesso imediato, para sempre
              </p>
            </div>

            <div className="mt-8 flex items-baseline gap-3">
              <span className="text-4xl font-black text-green-900">R$ 19,90</span>
              <span className="text-sm font-semibold text-gray-500">pagamento único</span>
            </div>

            <button
              onClick={abrirProduto}
              className="mt-6 w-full rounded-full bg-green-600 px-8 py-5 text-lg font-extrabold text-white shadow-lg transition hover:bg-green-700"
            >
              Quero o guia de brinquedos
            </button>

            <p className="mt-4 text-center text-xs text-gray-500">
              Pagamento por PIX. Acesso liberado na hora.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <p className="text-lg leading-relaxed text-gray-700">
          Obrigado por não passar indiferente. O Lar Esperança existe há 23 anos porque existem
          pessoas como você.
        </p>

        <a
          href="/"
          className="mt-8 inline-block rounded-full border-2 border-green-600 px-8 py-4 font-bold text-green-700 transition hover:bg-green-600 hover:text-white"
        >
          Voltar ao início
        </a>
      </section>

      <footer className="bg-[#052E16] py-10">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="text-sm font-extrabold text-white">Lar Esperança</p>
          <p className="mt-1 text-xs text-green-200">CNPJ 71.745.186/0001-56</p>
        </div>
      </footer>
    </main>
  );
}

export default function Obrigado() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0FDF4]" />}>
      <PaginaObrigado />
    </Suspense>
  );
}
