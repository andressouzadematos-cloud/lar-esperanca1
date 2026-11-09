"use client";

import { useState } from "react";

const VALORES = [25, 50, 100, 250, 500];

const CARDS = [
  {
    titulo: "Comida na mesa",
    descricao: "R$ 50 garante uma cesta básica completa para uma criança por uma semana.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
        <path d="M3 11h18M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M6 11v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titulo: "Brinquedo novo",
    descricao: "R$ 100 coloca um presente embrulhado embaixo da árvore com o nome dela.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
        <rect x="3" y="8" width="18" height="13" rx="1" />
        <path d="M3 12h18M12 8v13M12 8s-2-5-5-5a2.5 2.5 0 0 0 0 5M12 8s2-5 5-5a2.5 2.5 0 0 1 0 5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titulo: "Natal completo",
    descricao: "R$ 250 cobre ceia, presente e roupa nova para uma criança.",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
        <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const FAQ = [
  {
    pergunta: "Para onde vai o dinheiro doado?",
    resposta:
      "100% dos valores são usados na compra de alimentos, brinquedos e itens de Natal. A prestação de contas é publicada no site após a campanha.",
  },
  {
    pergunta: "Posso doar qualquer valor?",
    resposta: "Sim. Qualquer valor ajuda. R$ 25 já compra um brinquedo.",
  },
  {
    pergunta: "Recebo comprovante?",
    resposta: "Sim, o comprovante chega por e-mail imediatamente após o pagamento.",
  },
  {
    pergunta: "Até quando posso doar?",
    resposta: "A campanha vai até 20 de dezembro de 2026.",
  },
];

export default function Home() {
  const [valor, setValor] = useState(50);
  const [outro, setOutro] = useState("");
  const [aberto, setAberto] = useState<number | null>(0);

  const valorFinal = outro ? Number(outro) || 0 : valor;

  function doar() {
    alert(`Redirecionando para o pagamento de R$ ${valorFinal}...`);
  }

  return (
    <main className="min-h-screen bg-[#F0FDF4] text-[#14211A]">
      <header className="sticky top-0 z-50 border-b border-green-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-green-600">
              <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
            </svg>
            <span className="text-lg font-extrabold tracking-tight text-green-900">
              Lar Esperança
            </span>
          </div>
          <button
            onClick={doar}
            className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
          >
            Doar agora
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#052E16]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#052E16]/95 via-[#052E16]/90 to-[#052E16]/75 md:bg-gradient-to-r md:from-[#052E16]/95 md:via-[#052E16]/88 md:to-green-600/40" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <span className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-900">
              Campanha de Natal 2026
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.55)] md:text-6xl">
              Neste Natal, 112 crianças contam com você
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-white/95 [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
              Ajude a garantir comida na mesa e um brinquedo novo para cada criança do Lar
              Esperança. Toda doação, de qualquer valor, vira um prato cheio e um sorriso no Natal.
            </p>
            <button
              onClick={doar}
              className="mt-9 rounded-full bg-green-600 px-11 py-5 text-lg font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition hover:bg-green-700"
            >
              Quero ajudar agora
            </button>
          </div>

          <div className="rounded-3xl bg-white/95 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Arrecadado até agora
            </p>
            <p className="mt-2 text-4xl font-black text-green-900">R$ 18.420</p>
            <p className="mt-1 text-sm text-gray-500">de R$ 45.000 de meta</p>

            <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-green-100">
              <div className="h-full rounded-full bg-green-600" style={{ width: "41%" }} />
            </div>
            <p className="mt-2 text-right text-sm font-bold text-green-700">41%</p>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
              <span className="text-sm font-semibold text-gray-600">247 pessoas já doaram</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                Faltam 12 dias
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-3xl font-black tracking-tight text-green-900 md:text-4xl">
          O que sua doação faz
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.titulo}
              className="rounded-2xl border border-green-100 bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-green-600">
                {c.icone}
              </div>
              <h3 className="mt-5 text-xl font-bold text-green-900">{c.titulo}</h3>
              <p className="mt-2 leading-relaxed text-gray-600">{c.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-black tracking-tight text-green-900 md:text-4xl">
            Escolha quanto doar
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {VALORES.map((v) => (
              <button
                key={v}
                onClick={() => {
                  setValor(v);
                  setOutro("");
                }}
                className={`rounded-xl border-2 px-7 py-4 text-lg font-bold transition ${
                  valor === v && !outro
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-green-600"
                }`}
              >
                R$ {v}
              </button>
            ))}
            <input
              type="number"
              placeholder="Outro valor"
              value={outro}
              onChange={(e) => setOutro(e.target.value)}
              className="w-40 rounded-xl border-2 border-gray-200 px-5 py-4 text-lg font-bold text-gray-700 outline-none focus:border-green-600"
            />
          </div>

          <button
            onClick={doar}
            className="mt-10 w-full rounded-full bg-green-600 px-10 py-5 text-lg font-extrabold text-white shadow-lg transition hover:bg-green-700 md:w-auto"
          >
            Doar R$ {valorFinal} agora
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <img
            src="/historia.png"
            alt="Retrato de uma criança atendida pelo Lar Esperança"
            loading="lazy"
            className="h-[420px] w-full rounded-3xl object-cover shadow-xl"
          />
          <div>
            <h2 className="text-3xl font-black tracking-tight text-green-900 md:text-4xl">
              A história
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#14211A]">
              O Lar Esperança existe há 23 anos e abriga 112 crianças de 2 a 14 anos. Muitas
              chegaram sem nada além da roupa do corpo. Neste Natal, queremos que cada uma delas
              tenha o mesmo que qualquer criança merece: uma ceia farta, um presente com o próprio
              nome e a certeza de que alguém se importa.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-green-900 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 text-center md:grid-cols-4">
          {[
            ["112", "crianças atendidas"],
            ["23", "anos de história"],
            ["100%", "dos valores vão para o lar"],
            ["247", "doadores este mês"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="text-5xl font-black text-white">{n}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-green-200">
                {l}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="text-center text-3xl font-black tracking-tight text-green-900 md:text-4xl">
          Perguntas frequentes
        </h2>
        <div className="mt-10 space-y-3">
          {FAQ.map((item, i) => (
            <div
              key={item.pergunta}
              className={`overflow-hidden rounded-xl border bg-white transition ${
                aberto === i ? "border-l-4 border-l-green-600 border-green-100" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => setAberto(aberto === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-bold text-green-900">{item.pergunta}</span>
                <span className="text-2xl font-bold text-green-600">
                  {aberto === i ? "−" : "+"}
                </span>
              </button>
              {aberto === i && (
                <p className="px-6 pb-5 leading-relaxed text-gray-600">{item.resposta}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-green-600 py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
            Faltam 12 dias. 112 crianças esperam.
          </h2>
          <button
            onClick={doar}
            className="mt-10 rounded-full bg-white px-12 py-5 text-lg font-extrabold text-green-700 shadow-lg transition hover:bg-green-50"
          >
            Doar agora
          </button>
        </div>
      </section>

      <footer className="bg-[#052E16] py-14">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <p className="text-lg font-extrabold text-white">Lar Esperança</p>
          <p className="mt-2 text-sm text-green-200">CNPJ 71.745.186/0001-56</p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm font-semibold text-green-200">
            <a href="#" className="hover:text-white">Transparência</a>
            <a href="#" className="hover:text-white">Contato</a>
            <a href="#" className="hover:text-white">Política de Privacidade</a>
          </div>
          <p className="mt-8 text-xs text-green-300/70">
            Feito com carinho para o Lar Esperança
          </p>
        </div>
      </footer>
    </main>
  );
}
