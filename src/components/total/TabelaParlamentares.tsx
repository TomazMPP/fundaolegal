import Link from "next/link";
import type { ReactNode } from "react";
import { Barrinha, Paginacao } from "@/components/charts";
import type { Campo } from "@/components/FilterBar";
import { fmtInt, titulo } from "@/lib/format";
import { qs, type SP } from "@/lib/params";
import { opcoesParlamentares, rotuloCasas, type Parlamentar } from "@/lib/total/data";
import type { OrdemParl } from "@/lib/total/ranking";

export const POR_PAGINA = 50;

/** Nome como veio da fonte, mas sem CAIXA ALTA (cadastros antigos da Câmara). */
export const nomeBonito = (s: string) => (s === s.toUpperCase() ? titulo(s) : s);

export const anos = (dias: number) => {
  const a = dias / 365.25;
  return a < 1 ? `${Math.max(1, Math.round(dias / 30.44))} meses` : `${a.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} anos`;
};

export const campoValores: Campo = {
  nome: "valores",
  rotulo: "Valores",
  forma: "pilulas",
  opcoes: [
    { v: "", l: "Corrigidos pela inflação" },
    { v: "nominal", l: "Da época, sem correção" },
  ],
};

export function camposParlamentares(): Campo[] {
  const o = opcoesParlamentares();
  return [
    {
      nome: "casa",
      rotulo: "Casa",
      opcoes: [
        { v: "", l: "Câmara e Senado" },
        { v: "camara", l: "Câmara" },
        { v: "senado", l: "Senado" },
      ],
    },
    {
      nome: "situacao",
      rotulo: "Situação",
      opcoes: [
        { v: "", l: "Todos" },
        { v: "atual", l: "Em exercício" },
        { v: "ex", l: "Ex-parlamentares" },
      ],
    },
    { nome: "uf", rotulo: "Estado", opcoes: [{ v: "", l: "Todos" }, ...o.ufs.map((u) => ({ v: u, l: u }))] },
    { nome: "partido", rotulo: "Partido atual ou último", opcoes: [{ v: "", l: "Todos" }, ...o.partidos.map((p) => ({ v: p, l: p }))] },
    campoValores,
  ];
}

export type Coluna = {
  k: OrdemParl;
  rotulo: string;
  valor: (p: Parlamentar) => ReactNode;
  /** coluna principal: ganha barrinha dourada */
  barra?: (p: Parlamentar) => number;
};

function Cabecalho({ k, children, sp, ordem, dir, alinhar = "right" }: {
  k: OrdemParl;
  children: ReactNode;
  sp: SP;
  ordem: OrdemParl;
  dir: "asc" | "desc";
  alinhar?: "left" | "right";
}) {
  const ativo = ordem === k;
  const prox = ativo && dir === "desc" ? "asc" : "desc";
  return (
    <Link
      href={qs(sp, { ordem: k, dir: prox === "desc" ? undefined : "asc", pagina: undefined }) || "?"}
      scroll={false}
      className={`whitespace-nowrap hover:text-fg ${alinhar === "right" ? "text-right" : ""} ${ativo ? "font-medium text-fg" : ""}`}
    >
      {children}
      {ativo ? (dir === "desc" ? " ↓" : " ↑") : ""}
    </Link>
  );
}

export default function TabelaParlamentares({
  lista,
  colunas,
  sp,
  ordem,
  dir,
  base,
}: {
  lista: Parlamentar[];
  colunas: Coluna[];
  sp: SP;
  ordem: OrdemParl;
  dir: "asc" | "desc";
  base: string;
}) {
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const linhas = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const grid = { gridTemplateColumns: `48px minmax(220px,3fr) 110px ${colunas.map((c) => (c.barra ? "190px" : "130px")).join(" ")}` };
  const principal = colunas.find((c) => c.barra);
  const max = principal ? Math.max(...lista.map((p) => principal.barra!(p)), 1) : 1;

  return (
    <>
      <div className="overflow-x-auto rounded-[18px] border border-line bg-panel">
        <div className="min-w-[860px]">
          <div className="grid gap-4 border-b border-line px-5 py-3.5 text-xs text-fg-3" style={grid}>
            <span>#</span>
            <Cabecalho k="nome" sp={sp} ordem={ordem} dir={dir} alinhar="left">
              Parlamentar
            </Cabecalho>
            <Cabecalho k="dias" sp={sp} ordem={ordem} dir={dir}>
              Mandato
            </Cabecalho>
            {colunas.map((c) => (
              <Cabecalho key={c.k} k={c.k} sp={sp} ordem={ordem} dir={dir}>
                {c.rotulo}
              </Cabecalho>
            ))}
          </div>
          {linhas.map((p, i) => (
            <Link
              key={p.id}
              href={`${base}/politico/${p.id}`}
              className="tnum grid items-center gap-4 border-b border-line px-5 py-3.5 last:border-0 hover:bg-hover"
              style={grid}
            >
              <span className="text-fg-3">{(pagina - 1) * POR_PAGINA + i + 1}</span>
              <span className="flex min-w-0 items-center gap-3">
                {p.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.foto} alt="" loading="lazy" className="size-9 shrink-0 rounded-full bg-panel-2 object-cover" />
                ) : (
                  <span className="size-9 shrink-0 rounded-full bg-panel-2" aria-hidden="true" />
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{nomeBonito(p.nome)}</span>
                  <span className="truncate text-[13px] text-fg-3">
                    {rotuloCasas(p)}
                    {(p.partido || p.uf) && ` · ${[p.partido, p.uf].filter(Boolean).join("-")}`}
                    {p.atual && " · em exercício"}
                  </span>
                </span>
              </span>
              <span className="text-right text-fg-2" title={`${fmtInt(p.dias)} dias em exercício`}>
                {anos(p.dias)}
              </span>
              {colunas.map((c) =>
                c.barra ? (
                  <span key={c.k} className="flex items-center justify-end gap-2.5">
                    <Barrinha frac={c.barra(p) / max} ouro largura="w-12" />
                    <b className="font-semibold">{c.valor(p)}</b>
                  </span>
                ) : (
                  <span key={c.k} className="text-right text-fg-2">
                    {c.valor(p)}
                  </span>
                ),
              )}
            </Link>
          ))}
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
    </>
  );
}
