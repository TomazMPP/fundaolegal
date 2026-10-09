import type { ReactNode } from "react";
import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import TabelaParlamentares, { camposParlamentares, type Coluna } from "@/components/total/TabelaParlamentares";
import { fmtExtenso, fmtInt } from "@/lib/format";
import type { SP } from "@/lib/params";
import { refIPCA, type Parlamentar } from "@/lib/total/data";
import { base, rankingParlamentares, type OrdemParl } from "@/lib/total/ranking";

/** Esqueleto comum aos rankings de parlamentares (geral, salários, benefícios). */
export default async function PaginaParlamentares({
  sp,
  titulo,
  intro,
  padrao,
  colunas,
  soma,
  rotuloSoma,
  nota,
}: {
  sp: SP;
  titulo: string;
  intro: ReactNode;
  padrao: OrdemParl;
  colunas: (n: boolean) => Coluna[];
  soma: (p: Parlamentar, n: boolean) => number;
  rotuloSoma: string;
  nota: ReactNode;
}) {
  const b = await base();
  const { lista, ordem, dir, n } = rankingParlamentares(sp, padrao);
  const total = lista.reduce((s, p) => s + soma(p, n), 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-3">
        <h1 className="font-serif text-[44px] leading-[1.05] font-medium tracking-tight sm:text-[52px]">{titulo}</h1>
        <p className="text-lg leading-relaxed text-fg-2">{intro}</p>
      </div>

      <div className="rounded-[18px] border border-line bg-panel p-5">
        <Suspense>
          <FilterBar busca="Nome do parlamentar" campos={camposParlamentares()} />
        </Suspense>
      </div>

      <p className="text-fg-2">
        <b className="font-semibold text-fg">
          {fmtInt(lista.length)} {lista.length === 1 ? "parlamentar" : "parlamentares"}
        </b>
        , somando <b className="font-semibold text-fg">{fmtExtenso(total)}</b> {rotuloSoma}
        {n ? ", em valores da época." : `, em valores corrigidos pelo IPCA até ${refIPCA()}.`}
      </p>

      <TabelaParlamentares lista={lista} colunas={colunas(n)} sp={sp} ordem={ordem} dir={dir} base={b} />

      <div className="max-w-3xl border-t border-line pt-6 text-sm text-fg-3">{nota}</div>
    </div>
  );
}
