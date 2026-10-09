import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FaixaNumeros, Numero, Painel, Titulo } from "@/components/charts";
import { anos, nomeBonito } from "@/components/total/TabelaParlamentares";
import { fmtBRL, fmtBRLc, fmtExtenso, fmtInt, titulo } from "@/lib/format";
import {
  ANO_PARCIAL,
  detalhe,
  parlamentar,
  recebedor,
  refIPCA,
  rotuloCasas,
  totalParlamentar,
  type Candidatura,
  type Parlamentar,
  type Recebedor,
} from "@/lib/total/data";
import { base, fatorAno } from "@/lib/total/ranking";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const nome = parlamentar(id)?.nome ?? (id.startsWith("c") ? recebedor(id)?.nome : undefined);
  return { title: nome ? nomeBonito(nome) : "Político não encontrado" };
}

const dataBR = (s: string) => s.split("-").reverse().join("/");
const local = (c: Candidatura) =>
  c.uf === "BR" ? "Nacional" : c.ue.length > 2 && c.ue !== c.uf ? `${titulo(c.ue)}, ${c.uf}` : c.uf;

const RUBRICAS = [
  { k: 1, rotulo: "Salário", cor: "bg-fg-2" },
  { k: 2, rotulo: "Ajuda de custo", cor: "bg-fg-4" },
  { k: 3, rotulo: "Cota parlamentar", cor: "bg-ocre" },
  { k: 4, rotulo: "Fundão", cor: "bg-ouro" },
] as const;

/** Colunas empilhadas por ano (valores corrigidos). */
function SerieAnual({ anos: dados }: { anos: [number, number, number, number, number][] }) {
  // anos sem nenhum valor (fora do mandato) aparecem vazios, para o eixo ser contínuo
  const porAno = new Map(dados.map((l) => [l[0], l]));
  const linhas: [number, number, number, number, number][] = [];
  for (let a = dados[0][0]; a <= dados[dados.length - 1][0]; a++) linhas.push(porAno.get(a) ?? [a, 0, 0, 0, 0]);
  const max = Math.max(...linhas.map((l) => l[1] + l[2] + l[3] + l[4]), 1);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-48 items-end gap-[3px]" role="img" aria-label="Valores recebidos por ano">
        {linhas.map((l) => {
          const soma = l[1] + l[2] + l[3] + l[4];
          return (
            <div key={l[0]} className="tip group flex h-full min-w-0 flex-1 flex-col justify-end" tabIndex={0}>
              <span className="tip-box tnum">
                {l[0]}: {fmtBRL(soma)}
              </span>
              <div className="flex flex-col-reverse overflow-hidden rounded-t-[3px] group-hover:opacity-80" style={{ height: `${(100 * soma) / max}%` }}>
                {RUBRICAS.map((r) => (l[r.k] > 0 ? <div key={r.k} className={r.cor} style={{ height: `${(100 * l[r.k]) / soma}%` }} /> : null))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="tnum flex justify-between text-xs text-fg-3">
        <span>{linhas[0][0]}</span>
        <span>{linhas[linhas.length - 1][0]}</span>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-fg-2">
        {RUBRICAS.map((r) => (
          <li key={r.k} className="flex items-center gap-2">
            <span className={`size-2.5 rounded-[3px] ${r.cor}`} aria-hidden="true" />
            {r.rotulo}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabelaCandidaturas({ cands }: { cands: Candidatura[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="tnum w-full min-w-[640px] text-sm">
        <thead className="text-left text-xs text-fg-3">
          <tr className="border-b border-line">
            <th className="py-2.5 pr-4 font-normal">Eleição</th>
            <th className="py-2.5 pr-4 font-normal">Cargo</th>
            <th className="py-2.5 pr-4 font-normal">Local</th>
            <th className="py-2.5 pr-4 font-normal">Partido</th>
            <th className="py-2.5 pr-4 text-right font-normal">FEFC</th>
            <th className="py-2.5 pr-4 text-right font-normal">Fundo Partidário</th>
            <th className="py-2.5 text-right font-normal">Corrigido</th>
          </tr>
        </thead>
        <tbody>
          {[...cands].reverse().map((c) => (
            <tr key={`${c.ano}-${c.cargo}`} className="border-b border-line last:border-0">
              <td className="py-3 pr-4">
                {c.ano}
                {c.ano === ANO_PARCIAL && <span className="text-fg-3"> · parcial</span>}
              </td>
              <td className="py-3 pr-4">
                {titulo(c.cargo)}
                {c.eleito && <span className="ml-2 rounded-full border border-ouro/40 px-2 py-px text-[11px] text-ouro">eleito</span>}
              </td>
              <td className="py-3 pr-4 text-fg-2">{local(c)}</td>
              <td className="py-3 pr-4 text-fg-2">{c.partido}</td>
              <td className="py-3 pr-4 text-right">{fmtBRLc(c.fefc)}</td>
              <td className="py-3 pr-4 text-right">{fmtBRLc(c.fp)}</td>
              <td className="py-3 text-right font-medium">{fmtBRLc((c.fefc + c.fp) * fatorAno(c.ano))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PerfilParlamentar({ p, b }: { p: Parlamentar; b: string }) {
  const d = detalhe(p.id);
  const r = d?.fundao_id ? recebedor(d.fundao_id) : undefined;
  const total = totalParlamentar(p);
  const mesesComValor = (p.dias - p.dias_sem_valor) / 30.44;
  const periodos = d?.periodos ?? [];

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <Link href={`${b}/ranking`} className="text-sm text-fg-3 hover:text-fg">
          ← Ranking geral
        </Link>
        <div className="flex flex-wrap items-center gap-6">
          {p.foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.foto} alt="" className="size-24 rounded-full bg-panel-2 object-cover" />
          )}
          <div className="flex flex-col gap-2">
            <p className="chapeu">
              {rotuloCasas(p)} · {[p.partido, p.uf].filter(Boolean).join("-")}
              {p.atual ? " · em exercício" : ""}
            </p>
            <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-tight sm:text-[52px]">{nomeBonito(p.nome)}</h1>
          </div>
        </div>
        <p className="max-w-[720px] text-lg leading-relaxed text-fg-2">
          Em {anos(p.dias)} de mandato, recebeu <span className="text-ouro">{fmtExtenso(total)}</span> de dinheiro público,
          em valores de {refIPCA()}
          {p.salario > 0 && mesesComValor >= 1 && (
            <>
              . Só de salário, foram em média {fmtBRL(p.salario / mesesComValor)} por mês, já corrigidos
            </>
          )}
          .
        </p>
      </section>

      <FaixaNumeros>
        <Numero rotulo="Salário com 13º (desde 1995)" valor={fmtBRLc(p.salario)} nota={`${fmtBRLc(p.salario_n)} em valores da época`} />
        <Numero rotulo="Cota parlamentar (desde 2008)" valor={fmtBRLc(p.cota)} nota={`${fmtBRLc(p.cota_n)} em valores da época`} />
        <Numero rotulo="Ajuda de custo (estimada)" valor={fmtBRLc(p.ajuda)} nota={`${fmtBRLc(p.ajuda_n)} em valores da época`} />
        <Numero
          rotulo="Fundão nas campanhas (desde 2018)"
          valor={fmtBRLc(p.fundao)}
          destaque
          nota={p.ligado_tse ? `${fmtBRLc(p.fundao_n)} em valores da época` : "Não identificado nos dados do TSE"}
        />
      </FaixaNumeros>

      {d?.anos && d.anos.length > 1 && (
        <Painel>
          <div className="flex flex-col gap-6">
            <Titulo tamanho="sm" sub={`Valores corrigidos pelo IPCA até ${refIPCA()}. Passe o mouse para ver o total do ano.`}>
              Ano a ano
            </Titulo>
            <SerieAnual anos={d.anos} />
          </div>
        </Painel>
      )}

      <div className="grid gap-6">
        <Painel>
          <div className="flex flex-col gap-5">
            <Titulo tamanho="sm" sub={`${fmtInt(p.dias)} dias em exercício`}>
              Mandatos
            </Titulo>
            <ul className="tnum grid text-sm md:grid-cols-2 md:gap-x-12">
              {[...periodos].reverse().map(([casa, ini, fim, uf, est]) => (
                <li key={`${casa}${ini}`} className="flex flex-wrap justify-between gap-x-4 border-b border-line py-2.5 last:border-0">
                  <span>
                    {casa === "senado" ? "Senado" : "Câmara"} · {uf}
                  </span>
                  <span className="text-fg-2">
                    {dataBR(ini)} a {p.atual && fim === periodos[periodos.length - 1][2] ? "hoje" : dataBR(fim)}
                    {est === "1" && <span className="text-fg-3"> · estimado</span>}
                  </span>
                </li>
              ))}
            </ul>
            {periodos.some((x) => x[4] === "1") && (
              <p className="text-[13px] text-fg-3">
                &ldquo;Estimado&rdquo;: a Câmara não registra entradas e saídas antes de 2003, então o período conta a
                legislatura inteira.
              </p>
            )}
          </div>
        </Painel>
        <Painel>
          <div className="flex flex-col gap-5">
            <Titulo tamanho="sm" sub="Repasses do partido à campanha, de 2018 em diante">
              Fundão nas campanhas
            </Titulo>
            {r ? (
              <TabelaCandidaturas cands={r.candidaturas} />
            ) : (
              <p className="text-sm text-fg-2">
                {p.ligado_tse
                  ? "Não recebeu FEFC nem Fundo Partidário como candidato desde 2018."
                  : "Não foi possível ligar este parlamentar às candidaturas do TSE (sem CPF ou nome único)."}
              </p>
            )}
          </div>
        </Painel>
      </div>
    </div>
  );
}

function PerfilCandidato({ r, b }: { r: Recebedor; b: string }) {
  const nominal = r.fefc + r.fp;
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <Link href={`${b}/fundao`} className="text-sm text-fg-3 hover:text-fg">
          ← Ranking do fundão
        </Link>
        <div className="flex flex-col gap-2">
          <p className="chapeu">
            {titulo(r.cargo)} · {r.partido} · {r.uf === "BR" ? "Nacional" : r.uf}
          </p>
          <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-tight sm:text-[52px]">{nomeBonito(r.nome)}</h1>
        </div>
        <p className="max-w-[720px] text-lg leading-relaxed text-fg-2">
          Recebeu do partido <span className="text-ouro">{fmtExtenso(r.corrigido)}</span> do fundão em{" "}
          {r.candidaturas.length === 1 ? "uma campanha" : `${r.candidaturas.length} campanhas`}, em valores corrigidos até{" "}
          {refIPCA()} ({fmtExtenso(nominal)} em valores da época).
        </p>
      </section>
      <FaixaNumeros>
        <Numero rotulo="Fundo Eleitoral (FEFC)" valor={fmtBRLc(r.fefc)} nota="valores da época" destaque />
        <Numero rotulo="Fundo Partidário" valor={fmtBRLc(r.fp)} nota="valores da época" />
        <Numero rotulo="Total corrigido" valor={fmtBRLc(r.corrigido)} nota={`IPCA até ${refIPCA()}`} />
        <Numero rotulo="Eleito" valor={r.candidaturas.filter((c) => c.eleito).length ? "Sim" : "Não"} nota={`${r.candidaturas.filter((c) => c.eleito).length} de ${r.candidaturas.length} eleições com fundão`} />
      </FaixaNumeros>
      <Painel>
        <div className="flex flex-col gap-5">
          <Titulo tamanho="sm" sub="Repasses do partido à campanha">
            Campanhas
          </Titulo>
          <TabelaCandidaturas cands={r.candidaturas} />
        </div>
      </Painel>
    </div>
  );
}

export default async function Politico({ params }: Params) {
  const { id } = await params;
  const b = await base();
  const p = parlamentar(id);
  if (p) return <PerfilParlamentar p={p} b={b} />;
  if (!id.startsWith("c")) notFound();
  const r = recebedor(id);
  if (!r) notFound();
  if (r.parlamentar) redirect(`${b}/politico/${r.parlamentar}`);
  return <PerfilCandidato r={r} b={b} />;
}
