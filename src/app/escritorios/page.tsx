import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Barrinha, BotaoContorno, Paginacao } from "@/components/charts";
import FilterBar from "@/components/FilterBar";
import { campoAno, camposRecorte, campoTipo } from "@/lib/campos";
import { TIPOS } from "@/lib/data";
import { fmtBRLc, fmtCNPJ, fmtExtenso, fmtInt, fmtPct, titulo } from "@/lib/format";
import { qs, type SP } from "@/lib/params";
import { ranking, type Ordem } from "@/lib/ranking";

export const metadata: Metadata = { title: "Escritórios" };

const POR_PAGINA = 50;

const faixasMin = [
  { v: "", l: "Qualquer número" },
  { v: "5", l: "5 ou mais" },
  { v: "20", l: "20 ou mais" },
  { v: "50", l: "50 ou mais" },
  { v: "100", l: "100 ou mais" },
];

const COLUNAS = "grid-cols-[48px_minmax(0,3fr)_130px_80px_80px_120px_150px_110px]";

function Cabecalho({
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
    <Link
      href={qs(sp, { ordem: k, dir: prox === "desc" ? undefined : "asc", pagina: undefined })}
      scroll={false}
      className={`whitespace-nowrap hover:text-fg ${alinhar === "right" ? "text-right" : ""} ${ativo ? "font-medium text-fg" : ""}`}
    >
      {children}
      {ativo ? (dir === "desc" ? " ↓" : " ↑") : ""}
    </Link>
  );
}

export default async function Escritorios({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { f, lista, ordem, dir, min, max } = ranking(sp);
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const linhas = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const maxCand = Math.max(...lista.map((e) => e.candidaturas), 1);
  const soma = lista.reduce(
    (s, e) => ({ valor: s.valor + e.valor, publico: s.publico + e.fefc + e.fp, cand: s.cand + e.candidaturas }),
    { valor: 0, publico: 0, cand: 0 },
  );
  const H = (p: Omit<Parameters<typeof Cabecalho>[0], "sp" | "ordem" | "dir">) => (
    <Cabecalho sp={sp} ordem={ordem} dir={dir} {...p} />
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-3">
        <h1 className="font-serif text-[44px] leading-[1.05] font-medium tracking-tight sm:text-[52px]">Escritórios</h1>
        <p className="text-lg leading-relaxed text-fg-2">
          Todas as empresas que venderam serviço jurídico ou contábil para campanhas. Filtre, ordene e compartilhe: o
          endereço da página guarda o recorte escolhido.
        </p>
      </div>

      <div className="rounded-[18px] border border-line bg-panel p-5">
        <Suspense>
          <FilterBar
            busca="Nome, CNPJ ou cidade"
            campos={[
              { ...campoAno(), opcoes: campoAno().opcoes.map((o) => ({ ...o, l: o.l.replace(" · parcial", " (parcial)") })) },
              campoTipo,
              ...camposRecorte(),
              { nome: "min", rotulo: "Clientes por escritório", opcoes: faixasMin, forma: "pilulas" },
            ]}
          />
        </Suspense>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-fg-2">
          <b className="font-semibold text-fg">
            {fmtInt(lista.length)} {lista.length === 1 ? "escritório" : "escritórios"}
          </b>{" "}
          com <b className="font-semibold text-fg">{fmtInt(soma.cand)}</b> candidaturas atendidas, somando{" "}
          <b className="font-semibold text-fg">{fmtExtenso(soma.valor)}</b> contratados, dos quais{" "}
          {fmtExtenso(soma.publico)} em dinheiro público.
          {Number.isFinite(max) && ` Mostrando quem tem de ${min} a ${max} clientes.`}
        </p>
        <BotaoContorno href={`/api/escritorios${qs(sp, { pagina: undefined })}`} download>
          Baixar planilha (CSV)
        </BotaoContorno>
      </div>

      <div className="overflow-x-auto rounded-[18px] border border-line bg-panel">
        <div className="min-w-[980px]">
          <div className={`grid ${COLUNAS} gap-4 border-b border-line px-5 py-3.5 text-xs text-fg-3`}>
            <span>#</span>
            {H({ k: "nome", alinhar: "left", children: "Escritório" })}
            {H({ k: "candidaturas", children: "Candidaturas" })}
            {H({ k: "partidos", children: "Partidos" })}
            {H({ k: "ues", children: "Locais" })}
            {H({ k: "valor", children: "Contratado" })}
            {H({ k: "publico", children: "Dinheiro público" })}
            {H({ k: "ticket", children: "Média" })}
          </div>
          {linhas.map((e, i) => (
            <Link
              key={e.firma}
              href={`/escritorios/${e.firma}${f.ano ? `?ano=${f.ano}` : ""}`}
              className={`tnum grid ${COLUNAS} items-center gap-4 border-b border-line px-5 py-4 last:border-0 hover:bg-hover`}
            >
              <span className="text-fg-3">{(pagina - 1) * POR_PAGINA + i + 1}</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium" title={e.nome}>
                  {titulo(e.nome)}
                </span>
                <span className="truncate text-[13px] text-fg-3">
                  {TIPOS[e.tipo]} · CNPJ {fmtCNPJ(e.cnpj)}
                  {e.uf_sede && ` · ${e.municipio_sede ? titulo(e.municipio_sede) + ", " : ""}${e.uf_sede}`}
                </span>
              </span>
              <span className="flex items-center justify-end gap-2.5">
                <Barrinha frac={e.candidaturas / maxCand} ouro largura="w-12" />
                <b className="min-w-8 text-right font-semibold">{fmtInt(e.candidaturas)}</b>
              </span>
              <span className="text-right">{e.partidos}</span>
              <span className="text-right" title={`${e.ues} localidades em ${e.ufs} estados`}>
                {e.ues}
              </span>
              <span className="text-right">{fmtBRLc(e.valor)}</span>
              <span className="text-right whitespace-nowrap">
                {fmtBRLc(e.fefc + e.fp)}{" "}
                <span className="text-[13px] text-fg-3">{fmtPct((e.fefc + e.fp) / e.valor)}</span>
              </span>
              <span className="text-right text-fg-2">{fmtBRLc(e.ticket)}</span>
            </Link>
          ))}
          {linhas.length === 0 && (
            <p className="px-5 py-12 text-center text-fg-2">Nenhum escritório nesse recorte. Tente remover um filtro.</p>
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
        Só aparecem empresas com CNPJ, agrupadas pela raiz do CNPJ para juntar matriz e filiais. Advogados e contadores
        autônomos entram nos totais do panorama, mas não são listados pelo nome. &ldquo;Locais&rdquo; conta municípios em
        eleições municipais e estados em eleições gerais.
      </p>
    </div>
  );
}
