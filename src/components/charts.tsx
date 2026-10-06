import Link from "next/link";
import type { ReactNode } from "react";
import { fmtBRL, fmtBRLc, fmtPct } from "@/lib/format";

/* ---------------- Blocos de página ---------------- */

export function Painel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-[18px] border border-line bg-panel p-5 sm:p-8 ${className}`}>{children}</section>;
}

export function Titulo({
  chapeu,
  children,
  sub,
  tamanho = "md",
  acao,
}: {
  chapeu?: string;
  children: ReactNode;
  sub?: ReactNode;
  tamanho?: "sm" | "md";
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-3xl flex-col gap-2">
        {chapeu && <span className="chapeu">{chapeu}</span>}
        <h2
          className={`font-serif font-medium tracking-tight text-fg ${
            tamanho === "md" ? "text-[28px] leading-[1.15] sm:text-[32px]" : "text-2xl leading-tight"
          }`}
        >
          {children}
        </h2>
        {sub && <p className={tamanho === "md" ? "text-fg-2" : "text-[13px] text-fg-3"}>{sub}</p>}
      </div>
      {acao}
    </div>
  );
}

export function BotaoContorno({ href, children, download }: { href: string; children: ReactNode; download?: boolean }) {
  const cls =
    "inline-flex min-h-11 items-center gap-2 rounded-full border border-ouro/40 px-[18px] text-sm text-ouro hover:border-ouro hover:text-ouro-claro";
  return download ? (
    <a href={href} className={cls}>
      <IconeBaixar />
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function IconeBaixar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

/* ---------------- Números ---------------- */

export function FaixaNumeros({ children }: { children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 border-y border-line sm:grid-cols-2 lg:grid-cols-4">{children}</section>
  );
}

export function Numero({
  rotulo,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  valor: ReactNode;
  nota?: ReactNode;
  destaque?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-line py-6 pr-6 not-last:border-b sm:not-last:border-b-0">
      <span className="text-[13px] text-fg-3">{rotulo}</span>
      <span className={`font-serif text-[40px] leading-[1.1] font-medium tracking-tight ${destaque ? "text-ouro" : ""}`}>
        {valor}
      </span>
      {nota && <span className="text-[13px] text-fg-2">{nota}</span>}
    </div>
  );
}

/* ---------------- Origem do dinheiro (parte do todo, 3 segmentos) ---------------- */

type Fontes = { valor: number; fefc: number; fp: number };

const FONTES = [
  { k: "fefc", rotulo: "Fundo eleitoral (FEFC)", cor: "bg-ouro" },
  { k: "fp", rotulo: "Fundo Partidário", cor: "bg-ocre" },
  { k: "outros", rotulo: "Doações, recursos próprios ou ainda sem pagamento", cor: "bg-resto" },
] as const;

export function OrigemDinheiro({ d, titulo }: { d: Fontes; titulo: ReactNode }) {
  const partes = { fefc: d.fefc, fp: d.fp, outros: Math.max(d.valor - d.fefc - d.fp, 0) };
  const total = d.valor || 1;
  return (
    <div className="flex flex-col gap-[18px] rounded-[18px] border border-line bg-panel p-6 sm:p-7">
      <p className="text-[13px] text-fg-3">{titulo}</p>
      <div className="flex h-3.5 gap-[3px]">
        {FONTES.map((f) =>
          partes[f.k] > 0 ? (
            <div
              key={f.k}
              className={`${f.cor} first:rounded-l last:rounded-r`}
              style={{ width: `${(100 * partes[f.k]) / total}%` }}
            />
          ) : null,
        )}
      </div>
      <ul className="flex flex-col">
        {FONTES.map((f) => (
          <li key={f.k} className="flex items-baseline gap-3 border-b border-line py-3 last:border-0">
            <span className={`size-2.5 shrink-0 rounded-[3px] ${f.cor}`} aria-hidden="true" />
            <span className="flex-1">{f.rotulo}</span>
            <span className="tnum font-medium">{fmtBRLc(partes[f.k])}</span>
            <span className="tnum w-11 text-right text-fg-3">{fmtPct(partes[f.k] / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Série por eleição: colunas, dinheiro público em dourado ---------------- */

export type PontoSerie = { ano: number; valor: number; publico: number; nota?: string };

export function SerieEleicoes({
  dados,
  destaque,
  parciais = [],
  altura = 230,
}: {
  dados: PontoSerie[];
  destaque?: number;
  parciais?: number[];
  altura?: number;
}) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3 border-b border-line-2" style={{ height: altura + 44 }}>
        {dados.map((d) => {
          const parcial = parciais.includes(d.ano);
          const apagado = destaque !== undefined && d.ano !== destaque;
          return (
            <div
              key={d.ano}
              tabIndex={0}
              className="tip flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 outline-none"
            >
              <span className={`tnum text-[11px] whitespace-nowrap sm:text-[13px] ${apagado ? "text-fg-3" : "font-medium text-fg"}`}>{fmtBRLc(d.valor)}</span>
              <div className="flex w-6 flex-col gap-[2px] sm:w-9" style={{ height: (altura * d.valor) / max }}>
                <div
                  className={`rounded-t ${parcial ? "hachura" : "bg-resto"}`}
                  style={{ flexGrow: Math.max(d.valor - d.publico, 0) }}
                />
                <div className={`bg-ouro ${parcial ? "opacity-75" : ""}`} style={{ flexGrow: d.publico }} />
              </div>
              <span className="tip-box">
                <b>{d.ano}</b>: {fmtBRL(d.valor)} contratados, {fmtBRL(d.publico)} em dinheiro público
              </span>
            </div>
          );
        })}
      </div>
      <div className="-mt-1 flex justify-between gap-3">
        {dados.map((d) => (
          <div key={d.ano} className="flex min-w-0 flex-1 flex-col text-center">
            <span className={`tnum text-sm ${destaque === d.ano ? "font-semibold text-fg" : ""}`}>{d.ano}</span>
            <span className="text-xs text-fg-3">{d.nota ?? (parciais.includes(d.ano) ? "parcial" : d.ano % 4 === 0 ? "municipal" : "geral")}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-2">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-ouro" aria-hidden="true" />
          Dinheiro público (fundo eleitoral e partidário)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-resto" aria-hidden="true" />
          Outras fontes
        </span>
        {parciais.some((p) => dados.some((d) => d.ano === p)) && (
          <span className="inline-flex items-center gap-2">
            <span className="hachura size-2.5 rounded-[3px]" aria-hidden="true" />
            Dados incompletos
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------------- Listas com barra (uma série) ---------------- */

export type ItemLista = {
  chave: string;
  nome: ReactNode;
  valor: number;
  texto: ReactNode;
  extra?: ReactNode;
  href?: string;
};

export function ListaBarras({ itens, cor = "bg-fg-2" }: { itens: ItemLista[]; cor?: string }) {
  const max = Math.max(...itens.map((i) => i.valor), 1);
  return (
    <ul className="flex flex-col gap-1">
      {itens.map((it) => {
        const corpo = (
          <>
            <div className="tnum flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span>{it.nome}</span>
              <span className="ml-auto text-fg-2">
                {it.texto} {it.extra && <span className="text-fg-3">{it.extra}</span>}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-[3px] bg-fg/5">
              <div className={`h-full rounded-[3px] ${cor}`} style={{ width: `${Math.max((100 * it.valor) / max, 0.5)}%` }} />
            </div>
          </>
        );
        return (
          <li key={it.chave}>
            {it.href ? (
              <Link href={it.href} className="-mx-2 block rounded-lg px-2 py-1.5 hover:bg-hover">
                {corpo}
              </Link>
            ) : (
              <div className="py-1.5">{corpo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Barrinha({ frac, ouro, largura = "flex-1" }: { frac: number; ouro?: boolean; largura?: string }) {
  return (
    <span className={`block h-2 overflow-hidden rounded bg-fg/5 ${largura}`}>
      <span
        className={`block h-full rounded ${ouro ? "bg-ouro" : "bg-fg-4"}`}
        style={{ width: `${Math.max(frac * 100, frac > 0 ? 1 : 0)}%` }}
      />
    </span>
  );
}

/* ---------------- Paginação ---------------- */

export function Paginacao({
  inicio,
  fim,
  total,
  anterior,
  proxima,
}: {
  inicio: number;
  fim: number;
  total: string;
  anterior?: string;
  proxima?: string;
}) {
  const cls = "inline-flex min-h-11 items-center rounded-full border border-line-2 px-4";
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 text-sm text-fg-3" aria-label="Paginação">
      <span className="tnum">
        Mostrando {inicio.toLocaleString("pt-BR")} a {fim.toLocaleString("pt-BR")} de {total}
      </span>
      <span className="flex gap-2">
        {anterior ? (
          <Link href={anterior} scroll={false} className={`${cls} text-fg hover:border-fg-3`}>
            Anterior
          </Link>
        ) : (
          <span className={`${cls} text-fg-4`} aria-disabled="true">
            Anterior
          </span>
        )}
        {proxima ? (
          <Link href={proxima} scroll={false} className={`${cls} text-fg hover:border-fg-3`}>
            Próxima página
          </Link>
        ) : (
          <span className={`${cls} text-fg-4`} aria-disabled="true">
            Próxima página
          </span>
        )}
      </span>
    </nav>
  );
}
