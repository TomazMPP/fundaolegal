import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import { campoAno, camposRecorte, campoTipo } from "@/lib/campos";
import { TIPOS } from "@/lib/data";
import { fmtBRLc, fmtCNPJ, fmtInt, fmtPct, titulo } from "@/lib/format";
import { qs, type SP } from "@/lib/params";
import { ranking, type Ordem } from "@/lib/ranking";

export const metadata: Metadata = { title: "Escritórios" };

const POR_PAGINA = 50;

const faixasMin = [
  { v: "", l: "Qualquer" },
  { v: "5", l: "5 ou mais" },
  { v: "10", l: "10 ou mais" },
  { v: "20", l: "20 ou mais" },
  { v: "50", l: "50 ou mais" },
  { v: "100", l: "100 ou mais" },
];

function Th({
  k,
  children,
  sp,
  ordem,
  dir,
  alinhar = "right",
}: {
  k: Ordem;
  children: React.ReactNode;
  sp: SP;
  ordem: Ordem;
  dir: "asc" | "desc";
  alinhar?: "left" | "right";
}) {
  const ativo = ordem === k;
  const prox = ativo && dir === "desc" ? "asc" : "desc";
  return (
    <th className={`px-3 py-2 font-normal whitespace-nowrap ${alinhar === "right" ? "text-right" : "text-left"}`}>
      <Link
        href={qs(sp, { ordem: k, dir: prox === "desc" ? undefined : "asc", pagina: undefined })}
        className={`hover:text-ink ${ativo ? "font-medium text-ink" : ""}`}
        scroll={false}
      >
        {children}
        {ativo ? (dir === "desc" ? " ↓" : " ↑") : ""}
      </Link>
    </th>
  );
}

export default async function Escritorios({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { f, lista, ordem, dir, max } = ranking(sp);
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const linhas = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const soma = lista.reduce(
    (s, e) => ({ valor: s.valor + e.valor, publico: s.publico + e.fefc + e.fp, cand: s.cand + e.candidaturas }),
    { valor: 0, publico: 0, cand: 0 },
  );
  const campos = [
    campoAno(),
    campoTipo,
    ...camposRecorte(),
    { nome: "min", rotulo: "Candidaturas atendidas", opcoes: faixasMin },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Escritórios</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-2">
          Todo CNPJ que vendeu serviço jurídico ou contábil a candidaturas. Filtre, ordene e baixe — o link
          da página guarda o recorte.
        </p>
      </div>

      <Suspense>
        <FilterBar campos={campos} busca="Nome, CNPJ ou cidade" />
      </Suspense>

      <div className="flex flex-wrap items-baseline justify-between gap-3 text-sm">
        <p className="text-ink-2">
          <b className="font-semibold text-ink">{fmtInt(lista.length)} escritórios</b> · {fmtInt(soma.cand)}{" "}
          candidaturas · {fmtBRLc(soma.valor)} contratados, {fmtBRLc(soma.publico)} de dinheiro público
          {Number.isFinite(max) && <> · faixa até {max} candidaturas</>}
        </p>
        <a href={`/api/escritorios${qs(sp, { pagina: undefined })}`} className="text-accent-ink hover:underline">
          Baixar CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="w-10 px-3 py-2 text-right font-normal">#</th>
              <Th sp={sp} ordem={ordem} dir={dir} k="nome" alinhar="left">Escritório</Th>
              <th className="px-3 py-2 text-left font-normal">Eleições</th>
              <Th sp={sp} ordem={ordem} dir={dir} k="candidaturas">Candidaturas</Th>
              <Th sp={sp} ordem={ordem} dir={dir} k="partidos">Partidos</Th>
              <Th sp={sp} ordem={ordem} dir={dir} k="ues">Municípios/UFs</Th>
              <Th sp={sp} ordem={ordem} dir={dir} k="valor">Contratado</Th>
              <Th sp={sp} ordem={ordem} dir={dir} k="publico">Dinheiro público</Th>
              <Th sp={sp} ordem={ordem} dir={dir} k="ticket">Média/cand.</Th>
            </tr>
          </thead>
          <tbody className="tnum">
            {linhas.map((e, i) => (
              <tr key={e.firma} className="border-b border-line last:border-0 hover:bg-hover">
                <td className="px-3 py-2.5 text-right text-xs text-muted">{(pagina - 1) * POR_PAGINA + i + 1}</td>
                <td className="max-w-[340px] px-3 py-2.5">
                  <Link
                    href={`/escritorios/${e.firma}${f.ano ? `?ano=${f.ano}` : ""}`}
                    className="block truncate font-medium hover:underline"
                    title={e.nome}
                  >
                    {titulo(e.nome)}
                  </Link>
                  <span className="text-xs text-muted">
                    {TIPOS[e.tipo]} · {fmtCNPJ(e.cnpj)}
                    {e.uf_sede && ` · ${e.municipio_sede ? titulo(e.municipio_sede) + "/" : ""}${e.uf_sede}`}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-ink-2">{e.anos.join(", ")}</td>
                <td className="px-3 py-2.5 text-right font-medium">{fmtInt(e.candidaturas)}</td>
                <td className="px-3 py-2.5 text-right">{e.partidos}</td>
                <td className="px-3 py-2.5 text-right">
                  {e.ues}
                  <span className="text-muted">/{e.ufs}</span>
                </td>
                <td className="px-3 py-2.5 text-right">{fmtBRLc(e.valor)}</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  {fmtBRLc(e.fefc + e.fp)} <span className="text-xs text-muted">{fmtPct((e.fefc + e.fp) / e.valor)}</span>
                </td>
                <td className="px-3 py-2.5 text-right">{fmtBRLc(e.ticket)}</td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-ink-2">
                  Nenhum escritório nesse recorte.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginas > 1 && (
        <nav className="flex items-center justify-between text-sm text-ink-2">
          <span>
            Página {pagina} de {paginas}
          </span>
          <div className="flex gap-4">
            {pagina > 1 && (
              <Link href={qs(sp, { pagina: pagina - 1 })} className="hover:text-ink">
                ← Anterior
              </Link>
            )}
            {pagina < paginas && (
              <Link href={qs(sp, { pagina: pagina + 1 })} className="hover:text-ink">
                Próxima →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
