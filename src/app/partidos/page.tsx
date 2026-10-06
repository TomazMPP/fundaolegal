import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BarraCelula } from "@/components/charts";
import FilterBar from "@/components/FilterBar";
import { campoAno, camposRecorte, campoTipo } from "@/lib/campos";
import { partidos } from "@/lib/data";
import { fmtBRL, fmtBRLc, fmtInt, fmtPct, titulo } from "@/lib/format";
import { lerFiltros, qs, type SP } from "@/lib/params";

export const metadata: Metadata = { title: "Partidos" };

export default async function Partidos({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = lerFiltros(sp);
  const lista = partidos({ ...f, partido: undefined }).sort((a, b) => b.valor - a.valor);
  const max = Math.max(...lista.map((p) => p.valor), 1);
  const campos = [campoAno(), campoTipo, ...camposRecorte().filter((c) => c.nome !== "partido")];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Partidos</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-2">
          Quanto as candidaturas de cada partido gastaram com advogados e contadores, quanto disso foi dinheiro
          público e quantos escritórios diferentes dividiram esse mercado.
        </p>
      </div>
      <Suspense>
        <FilterBar campos={campos} />
      </Suspense>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="px-4 py-2 text-left font-normal">Partido</th>
              <th className="px-3 py-2 text-left font-normal">Contratado</th>
              <th className="px-3 py-2 text-right font-normal">Dinheiro público</th>
              <th className="px-3 py-2 text-right font-normal">Candidaturas</th>
              <th className="px-3 py-2 text-right font-normal">Média/cand.</th>
              <th className="px-3 py-2 text-right font-normal">Escritórios</th>
              <th className="px-4 py-2 text-left font-normal">Maior fornecedor</th>
            </tr>
          </thead>
          <tbody className="tnum">
            {lista.map((p) => (
              <tr key={p.chave} className="border-b border-line last:border-0 hover:bg-hover">
                <td className="px-4 py-2.5 font-medium">
                  <Link href={`/${qs(sp, { partido: p.chave })}`} className="hover:underline">
                    {p.chave}
                  </Link>
                </td>
                <td className="w-56 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <BarraCelula frac={p.valor / max} />
                    </div>
                    <span className="w-16 text-right">{fmtBRLc(p.valor)}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  {fmtBRLc(p.fefc + p.fp)} <span className="text-xs text-muted">{fmtPct((p.fefc + p.fp) / p.valor)}</span>
                </td>
                <td className="px-3 py-2.5 text-right">{fmtInt(p.candidatos)}</td>
                <td className="px-3 py-2.5 text-right">{fmtBRL(p.valor / p.candidatos)}</td>
                <td className="px-3 py-2.5 text-right">
                  <Link href={`/escritorios${qs(sp, { partido: p.chave })}`} className="hover:underline">
                    {fmtInt(p.escritorios)}
                  </Link>
                </td>
                <td className="max-w-64 px-4 py-2.5">
                  {p.top && (
                    <Link
                      href={`/escritorios/${p.top.id}${f.ano ? `?ano=${f.ano}` : ""}`}
                      className="block truncate hover:underline"
                      title={p.top.nome}
                    >
                      {titulo(p.top.nome)} <span className="text-xs text-muted">{fmtBRLc(p.top.valor)}</span>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Siglas como aparecem no TSE em cada eleição (fusões, como DEM + PSL → União, não são unificadas).
        Candidaturas e médias incluem profissionais pessoa física; escritórios contam só CNPJs.
      </p>
    </div>
  );
}
