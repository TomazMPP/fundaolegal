import Link from "next/link";
import type { ReactNode } from "react";
import { fmtBRL, fmtBRLc, fmtInt, fmtPct } from "@/lib/format";

/* ---------------- Stat tile ---------------- */

export function Stat({
  rotulo,
  valor,
  detalhe,
  delta,
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  delta?: { texto: string; rotulo: string } | null;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4">
      <div className="text-xs text-muted">{rotulo}</div>
      <div className="text-2xl font-semibold tracking-tight">{valor}</div>
      {(detalhe || delta) && (
        <div className="text-xs text-ink-2">
          {delta && (
            <span className="mr-1.5 font-medium text-ink">
              {delta.texto} <span className="font-normal text-muted">{delta.rotulo}</span>
            </span>
          )}
          {detalhe}
        </div>
      )}
    </div>
  );
}

/* ---------------- Composição por fonte (part-to-whole, 3 segmentos) ---------------- */

export const FONTES = [
  { k: "fefc", rotulo: "Fundo eleitoral (FEFC)", cor: "bg-fefc" },
  { k: "fp", rotulo: "Fundo Partidário", cor: "bg-fp" },
  { k: "outros", rotulo: "Outros recursos ou sem pagamento registrado", cor: "bg-outros" },
] as const;

type Fontes = { valor: number; fefc: number; fp: number };

/** "Outros" = tudo que não veio de fundo público, incluindo o que não tem pagamento registrado. */
const partes = (d: Fontes) => ({ fefc: d.fefc, fp: d.fp, outros: Math.max(d.valor - d.fefc - d.fp, 0) });

export function Legenda() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {FONTES.map((f) => (
        <span key={f.k} className="inline-flex items-center gap-1.5">
          <span className={`size-2.5 rounded-sm ${f.cor}`} />
          {f.rotulo}
        </span>
      ))}
    </div>
  );
}

export function BarraFontes({ d: bruto }: { d: Fontes }) {
  const d = partes(bruto);
  const total = bruto.valor || 1;
  return (
    <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded">
      {FONTES.map((f) =>
        d[f.k] > 0 ? (
          <div
            key={f.k}
            tabIndex={0}
            className={`tip h-full ${f.cor} first:rounded-l last:rounded-r`}
            style={{ width: `${(100 * d[f.k]) / total}%` }}
          >
            <span className="tip-box">
              {f.rotulo}: {fmtBRL(d[f.k])} ({fmtPct(d[f.k] / total)})
            </span>
          </div>
        ) : null,
      )}
    </div>
  );
}

/* ---------------- Série por eleição: colunas empilhadas por fonte ---------------- */

export function SerieAnos({
  dados,
  destaque,
  parciais = [],
}: {
  dados: ({ ano: number } & Fontes)[];
  destaque?: number;
  parciais?: number[];
}) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const passo = max > 500e6 ? 250e6 : max > 200e6 ? 100e6 : 50e6;
  const topo = Math.ceil(max / passo) * passo;
  const ticks = Array.from({ length: topo / passo + 1 }, (_, i) => i * passo);
  const H = 180;
  return (
    <div>
      <div className="relative" style={{ height: H + 24 }}>
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute right-0 left-14 border-t border-line"
            style={{ bottom: 24 + (t / topo) * H }}
          >
            <span className="tnum absolute -top-2 -left-14 w-12 text-right text-[11px] text-muted">
              {fmtBRLc(t).replace(",0", "")}
            </span>
          </div>
        ))}
        <div className="absolute right-0 bottom-6 left-14 flex h-[180px] items-end justify-around">
          {dados.map((bruto) => {
            const d = { ano: bruto.ano, ...partes(bruto) };
            const total = bruto.valor;
            return (
              <div
                key={d.ano}
                tabIndex={0}
                className={`tip flex h-full w-16 flex-col items-center justify-end outline-none ${
                  destaque && d.ano !== destaque ? "opacity-45" : ""
                }`}
              >
                <span className="tnum mb-1 text-[11px] font-medium text-ink">{fmtBRLc(total)}</span>
                <div className="flex w-6 flex-col-reverse gap-[2px]" style={{ height: (total / topo) * H }}>
                  {FONTES.map((f, i) =>
                    d[f.k] > 0 ? (
                      <div
                        key={f.k}
                        className={`${f.cor} w-full ${i === 2 || (i === 1 && !d.outros) ? "rounded-t" : ""}`}
                        style={{ flexGrow: d[f.k] }}
                      />
                    ) : null,
                  )}
                </div>
                <span className="tip-box">
                  <b>{d.ano}</b> · {fmtBRL(total)}
                  <br />
                  FEFC {fmtBRLc(d.fefc)} · FP {fmtBRLc(d.fp)} · Outros {fmtBRLc(d.outros)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="absolute right-0 bottom-0 left-14 flex justify-around">
          {dados.map((d) => (
            <span key={d.ano} className="tnum w-16 text-center text-xs text-ink-2">
              {d.ano}
              {parciais.includes(d.ano) ? "*" : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Lista de barras horizontais (uma série) ---------------- */

export type ItemBarra = {
  chave: string;
  rotulo: ReactNode;
  valor: number;
  href?: string;
  dica?: string;
  direita?: ReactNode;
};

export function BarList({
  itens,
  formato = fmtBRLc,
  max,
}: {
  itens: ItemBarra[];
  formato?: (v: number) => string;
  max?: number;
}) {
  const m = max ?? Math.max(...itens.map((i) => i.valor), 1);
  return (
    <ul className="flex flex-col">
      {itens.map((it) => {
        const conteudo = (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="min-w-0">{it.rotulo}</span>
              <span className="tnum ml-auto text-ink-2">
                {it.direita ?? formato(it.valor)}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full">
              <div className="h-full rounded-r bg-bar" style={{ width: `${Math.max((100 * it.valor) / m, 0.5)}%` }} />
            </div>
          </>
        );
        const cls = "-mx-2 block rounded-md px-2 py-1.5";
        return (
          <li key={it.chave} title={it.dica}>
            {it.href ? (
              <Link href={it.href} className={`${cls} hover:bg-hover`}>
                {conteudo}
              </Link>
            ) : (
              <div className={cls}>{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- Barra inline para células de tabela ---------------- */

export function BarraCelula({ frac }: { frac: number }) {
  return (
    <div className="h-1.5 w-full min-w-16 rounded-r bg-transparent">
      <div className="h-full rounded-r bg-bar" style={{ width: `${Math.max(frac * 100, frac > 0 ? 1 : 0)}%` }} />
    </div>
  );
}

export function Card({
  titulo,
  sub,
  acao,
  children,
  className = "",
}: {
  titulo: string;
  sub?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-lg border border-line bg-surface p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">{titulo}</h2>
          {sub && <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{sub}</p>}
        </div>
        {acao && <div className="shrink-0 text-xs">{acao}</div>}
      </div>
      {children}
    </section>
  );
}

export const n = fmtInt;
