import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Barrinha } from "@/components/charts";
import FilterBar from "@/components/FilterBar";
import { campoAno, camposRecorte, campoTipo } from "@/lib/campos";
import { partidos } from "@/lib/data";
import { fmtBRL, fmtBRLc, fmtExtenso, fmtInt, fmtPct, titulo } from "@/lib/format";
import { lerFiltros, qs, type SP } from "@/lib/params";

export const metadata: Metadata = { title: "Partidos" };

export default async function Partidos({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = lerFiltros(sp);
  const lista = partidos({ ...f, partido: undefined }).sort((a, b) => b.valor - a.valor);
  const max = Math.max(...lista.map((p) => p.valor), 1);
  const lider = lista[0];
  const campos = [
    { ...campoAno(), opcoes: campoAno().opcoes.map((o) => ({ ...o, l: o.l.replace(" · parcial", " (parcial)") })) },
    campoTipo,
    ...camposRecorte().filter((c) => c.nome !== "partido"),
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-3">
        <h1 className="font-serif text-[44px] leading-[1.05] font-medium tracking-tight sm:text-[52px]">Partidos</h1>
        <p className="text-lg leading-relaxed text-fg-2">
          Quanto as candidaturas de cada partido gastaram com advogados e contadores, quanto disso foi dinheiro público e
          quantos escritórios diferentes dividiram esse mercado.
          {lider &&
            ` ${f.ano ? `Em ${f.ano}` : "Desde 2018"}, quem mais gastou foi o ${lider.chave}, com ${fmtExtenso(lider.valor)}.`}
        </p>
      </div>

      <div className="rounded-[18px] border border-line bg-panel p-5">
        <Suspense>
          <FilterBar campos={campos} />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-[18px] border border-line bg-panel">
        <table className="tnum w-full min-w-[960px] text-sm">
          <thead className="border-b border-line text-left text-xs text-fg-3">
            <tr>
              <th className="px-5 py-3.5 font-normal">Partido</th>
              <th className="px-3 py-3.5 font-normal">Contratado</th>
              <th className="px-3 py-3.5 text-right font-normal">Dinheiro público</th>
              <th className="px-3 py-3.5 text-right font-normal">Candidaturas</th>
              <th className="px-3 py-3.5 text-right font-normal">Média</th>
              <th className="px-3 py-3.5 text-right font-normal">Escritórios</th>
              <th className="px-5 py-3.5 font-normal">Maior fornecedor</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.chave} className="border-b border-line last:border-0 hover:bg-hover">
                <td className="px-5 py-3.5 font-medium">
                  <Link href={`/${qs(sp, { partido: p.chave })}`} className="hover:text-ouro">
                    {p.chave}
                  </Link>
                </td>
                <td className="w-60 px-3 py-3.5">
                  <span className="flex items-center gap-3">
                    <Barrinha frac={p.valor / max} />
                    <span className="w-[72px] text-right">{fmtBRLc(p.valor)}</span>
                  </span>
                </td>
                <td className="px-3 py-3.5 text-right whitespace-nowrap">
                  <span className="text-ouro">{fmtBRLc(p.fefc + p.fp)}</span>{" "}
                  <span className="text-[13px] text-fg-3">{fmtPct((p.fefc + p.fp) / p.valor)}</span>
                </td>
                <td className="px-3 py-3.5 text-right">{fmtInt(p.candidatos)}</td>
                <td className="px-3 py-3.5 text-right text-fg-2">{fmtBRL(p.valor / p.candidatos)}</td>
                <td className="px-3 py-3.5 text-right">
                  <Link href={`/escritorios${qs(sp, { partido: p.chave })}`} className="hover:text-ouro">
                    {fmtInt(p.escritorios)}
                  </Link>
                </td>
                <td className="max-w-72 px-5 py-3.5">
                  {p.top && (
                    <Link
                      href={`/escritorios/${p.top.id}${f.ano ? `?ano=${f.ano}` : ""}`}
                      className="block truncate hover:text-ouro"
                      title={p.top.nome}
                    >
                      {titulo(p.top.nome)} <span className="text-[13px] text-fg-3">{fmtBRLc(p.top.valor)}</span>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="max-w-3xl border-t border-line pt-6 text-sm text-fg-3">
        As siglas aparecem como registradas no TSE em cada eleição, então fusões como DEM e PSL, que formaram o União,
        não são unificadas. Candidaturas e médias incluem profissionais autônomos; a coluna de escritórios conta só
        empresas com CNPJ.
      </p>
    </div>
  );
}
