import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Barrinha, Paginacao } from "@/components/charts";
import FilterBar from "@/components/FilterBar";
import { campoValores, nomeBonito } from "@/components/total/TabelaParlamentares";
import { fmtBRLc, fmtExtenso, fmtInt, titulo } from "@/lib/format";
import { qs, type SP } from "@/lib/params";
import { ANO_PARCIAL, ANOS_FUNDAO, opcoesFundao, refIPCA } from "@/lib/total/data";
import { base, rankingFundao } from "@/lib/total/ranking";

export const metadata: Metadata = { title: "Fundão" };

const POR_PAGINA = 50;
const COLUNAS = "grid-cols-[56px_minmax(240px,3fr)_150px_120px_190px]";

const cargoBonito = (c: string) => titulo(c).replace("Deputado ", "Dep. ");

export default async function Fundao({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const b = await base();
  const { lista, ano, n, dir } = rankingFundao(sp);
  const o = opcoesFundao();
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const linhas = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const max = Math.max(...lista.slice(0, 1).map((r) => r.valor), ...linhas.map((r) => r.valor), 1);
  const total = lista.reduce((s, r) => s + r.valor, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-3">
        <h1 className="font-serif text-[44px] leading-[1.05] font-medium tracking-tight sm:text-[52px]">Fundão</h1>
        <p className="text-lg leading-relaxed text-fg-2">
          Todos os candidatos, de vereador a presidente, que receberam do partido dinheiro do Fundo Eleitoral (FEFC) ou do
          Fundo Partidário para a campanha, desde 2018.
        </p>
      </div>

      <div className="rounded-[18px] border border-line bg-panel p-5">
        <Suspense>
          <FilterBar
            busca="Nome de urna"
            campos={[
              {
                nome: "ano",
                rotulo: "Eleição",
                opcoes: [
                  { v: "", l: "Todas" },
                  ...[...ANOS_FUNDAO].reverse().map((a) => ({ v: String(a), l: a === ANO_PARCIAL ? `${a} (parcial)` : String(a) })),
                ],
              },
              { nome: "cargo", rotulo: "Cargo", opcoes: [{ v: "", l: "Todos" }, ...o.cargos.map((c) => ({ v: c, l: titulo(c) }))] },
              { nome: "uf", rotulo: "Estado", opcoes: [{ v: "", l: "Todos" }, ...o.ufs.map((u) => ({ v: u, l: u === "BR" ? "Nacional" : u }))] },
              { nome: "partido", rotulo: "Partido", opcoes: [{ v: "", l: "Todos" }, ...o.partidos.map((p) => ({ v: p, l: p }))] },
              {
                nome: "eleito",
                rotulo: "Resultado",
                forma: "pilulas",
                opcoes: [
                  { v: "", l: "Todos os candidatos" },
                  { v: "1", l: "Só eleitos" },
                ],
              },
              campoValores,
            ]}
          />
        </Suspense>
      </div>

      <p className="text-fg-2">
        <b className="font-semibold text-fg">
          {fmtInt(lista.length)} {lista.length === 1 ? "pessoa" : "pessoas"}
        </b>{" "}
        receberam <b className="font-semibold text-fg">{fmtExtenso(total)}</b> do fundão
        {ano ? ` em ${ano}` : " desde 2018"}
        {!n ? `, em valores corrigidos pelo IPCA até ${refIPCA()}.` : ", em valores da época."}
        {ano === ANO_PARCIAL && " A prestação de contas de 2026 ainda não terminou: os números vão crescer."}
      </p>

      <div className="overflow-x-auto rounded-[18px] border border-line bg-panel">
        <div className="min-w-[820px]">
          <div className={`grid ${COLUNAS} gap-4 border-b border-line px-5 py-3.5 text-xs text-fg-3`}>
            <span>#</span>
            <span>Candidato</span>
            <span>Último cargo disputado</span>
            <span className="text-right">Eleições</span>
            <Link href={qs(sp, { dir: dir === "desc" ? "asc" : undefined, pagina: undefined }) || "?"} scroll={false} className="text-right font-medium text-fg hover:text-fg">
              Fundão recebido {dir === "desc" ? "↓" : "↑"}
            </Link>
          </div>
          {linhas.map((r, i) => {
            const ult = r.recorte[r.recorte.length - 1];
            return (
              <Link
                key={r.id}
                href={`${b}/politico/${r.parlamentar ?? r.id}`}
                className={`tnum grid ${COLUNAS} items-center gap-4 border-b border-line px-5 py-3.5 last:border-0 hover:bg-hover`}
              >
                <span className="text-fg-3">{fmtInt((pagina - 1) * POR_PAGINA + i + 1)}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">
                    {nomeBonito(r.nome)}
                    {r.recorte.some((c) => c.eleito) && (
                      <span className="ml-2 rounded-full border border-ouro/40 px-2 py-px align-middle text-[11px] text-ouro">eleito</span>
                    )}
                  </span>
                  <span className="truncate text-[13px] text-fg-3">
                    {ult.partido} · {ult.uf === "BR" ? "Nacional" : `${titulo(ult.ue)}${ult.ue.length > 2 && ult.ue !== ult.uf ? `, ${ult.uf}` : ""}`}
                  </span>
                </span>
                <span className="truncate text-fg-2">
                  {cargoBonito(ult.cargo)} ({ult.ano})
                </span>
                <span className="text-right text-fg-2">{r.recorte.map((c) => `’${String(c.ano).slice(2)}`).join(", ")}</span>
                <span className="flex items-center justify-end gap-2.5">
                  <Barrinha frac={r.valor / max} ouro largura="w-12" />
                  <b className="font-semibold">{fmtBRLc(r.valor)}</b>
                </span>
              </Link>
            );
          })}
          {linhas.length === 0 && (
            <p className="px-5 py-12 text-center text-fg-2">Ninguém nesse recorte. Tente remover um filtro.</p>
          )}
        </div>
      </div>

      {lista.length > 0 && (
        <Paginacao
          inicio={(pagina - 1) * POR_PAGINA + 1}
          fim={Math.min(pagina * POR_PAGINA, lista.length)}
          total={fmtInt(lista.length)}
          anterior={pagina > 1 ? qs(sp, { pagina: pagina - 1 }) || "?" : undefined}
          proxima={pagina < paginas ? qs(sp, { pagina: pagina + 1 }) : undefined}
        />
      )}

      <p className="max-w-3xl border-t border-line pt-6 text-sm text-fg-3">
        Conta o que o partido repassou à candidatura, em dinheiro ou em bens e serviços (material de campanha pago pelo
        partido, por exemplo). Repasses de um candidato para outro ficam de fora, para o mesmo real não aparecer duas
        vezes. A mesma pessoa em eleições diferentes é reconhecida pelo título de eleitor. Antes de 2018 não existia o
        Fundo Eleitoral.
      </p>
    </div>
  );
}
