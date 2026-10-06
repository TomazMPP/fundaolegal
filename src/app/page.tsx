import Link from "next/link";
import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import { BarList, BarraCelula, BarraFontes, Card, Legenda, SerieAnos, Stat } from "@/components/charts";
import { campoAno, camposRecorte, campoTipo } from "@/lib/campos";
import { ANOS, ANO_PARCIAL, TIPOS, concentracao, escritorios, totais, totaisPor } from "@/lib/data";
import { fmtBRL, fmtBRLc, fmtDelta, fmtInt, fmtPct, titulo } from "@/lib/format";
import { lerFiltros, qs, type SP } from "@/lib/params";

export default async function Panorama({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = lerFiltros(sp);
  const t = totais(f);
  const firmas = escritorios(f);
  const pjValor = firmas.reduce((s, e) => s + e.valor, 0);
  const publico = t.fefc + t.fp;

  // comparação com a eleição equivalente anterior (municipal x municipal, geral x geral)
  const anoAnt = f.ano && f.ano - 4 > ANO_PARCIAL ? f.ano - 4 : undefined;
  const ant = anoAnt ? totais({ ...f, ano: anoAnt }) : undefined;
  const firmasAnt = anoAnt ? escritorios({ ...f, ano: anoAnt }).length : undefined;
  const vs = anoAnt ? `vs ${anoAnt}` : "";
  const delta = (a: number, b?: number) => {
    const d = fmtDelta(a, b);
    return d ? { texto: d.texto, rotulo: vs } : null;
  };

  const serie = totaisPor("ano", { ...f, ano: undefined })
    .map((s) => ({ ano: Number(s.chave), valor: s.valor, fefc: s.fefc, fp: s.fp }))
    .sort((a, b) => a.ano - b.ano);

  const faixas = concentracao(firmas);
  const grandes = faixas.filter((x) => x.min >= 20);
  const grandesN = grandes.reduce((s, x) => s + x.escritorios, 0);
  const grandesCand = grandes.reduce((s, x) => s + x.candidaturas, 0);
  const grandesValor = grandes.reduce((s, x) => s + x.valor, 0);
  const maxFaixa = Math.max(...faixas.map((x) => x.valor), 1);

  const top = [...firmas].sort((a, b) => b.candidaturas - a.candidaturas).slice(0, 10);
  const porUF = totaisPor("uf", f)
    .filter((u) => u.chave.length === 2)
    .sort((a, b) => b.valor - a.valor);
  const porPartido = totaisPor("partido", f).sort((a, b) => b.valor - a.valor);
  const porCargo = totaisPor("cargo", f).sort((a, b) => b.valor - a.valor);

  const recorte = [
    f.ano ? `Eleições ${f.ano % 4 === 0 ? "municipais" : "gerais"} ${f.ano}` : "Eleições 2018–2024",
    f.tipo ? TIPOS[f.tipo].toLowerCase() : "advocacia e contabilidade",
    f.uf,
    f.partido,
    f.cargo,
  ]
    .filter(Boolean)
    .join(" · ");

  const vazio = t.valor === 0;

  return (
    <div className="flex flex-col gap-8">
      <Suspense>
        <FilterBar campos={[campoAno(), campoTipo, ...camposRecorte()]} />
      </Suspense>

      {vazio ? (
        <p className="rounded-lg border border-line bg-surface p-8 text-sm text-ink-2">
          Nenhuma despesa jurídica ou contábil encontrada para esse recorte. Tente outra eleição ou remova
          um filtro.
        </p>
      ) : (
        <>
          {/* Hero: o número que importa, com contexto */}
          <section className="flex flex-col gap-4">
            <p className="text-sm text-muted">{recorte}</p>
            <h1 className="max-w-4xl text-3xl leading-tight font-semibold tracking-tight sm:text-[44px] sm:leading-[1.1]">
              {fmtBRLc(publico)} de dinheiro público pagaram advogados e contadores de campanha
            </h1>
            <p className="max-w-3xl text-[15px] leading-relaxed text-ink-2">
              São {fmtPct(publico / t.valor)} dos {fmtBRLc(t.valor)} contratados por{" "}
              {fmtInt(t.candidatos)} candidaturas — em média {fmtBRL(t.valor / t.candidatos)} por candidatura.
              {f.ano === ANO_PARCIAL && (
                <> Em 2018 só há dados de escritórios (PJ) identificados pelo CNAE; a série é parcial.</>
              )}
            </p>
            <div className="max-w-3xl">
              <BarraFontes d={t} />
              <div className="mt-2">
                <Legenda />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat rotulo="Total contratado" valor={fmtBRLc(t.valor)} delta={delta(t.valor, ant?.valor)} />
            <Stat
              rotulo="Candidaturas atendidas"
              valor={fmtInt(t.candidatos)}
              delta={delta(t.candidatos, ant?.candidatos)}
            />
            <Stat
              rotulo="Escritórios (CNPJ)"
              valor={fmtInt(firmas.length)}
              delta={delta(firmas.length, firmasAnt)}
              detalhe={
                t.valor_pf > 0 ? <span className="block">+ {fmtBRLc(t.valor_pf)} a profissionais pessoa física</span> : null
              }
            />
            <Stat
              rotulo="Média por candidatura"
              valor={fmtBRL(t.valor / t.candidatos)}
              delta={ant ? delta(t.valor / t.candidatos, ant.valor / ant.candidatos) : null}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card
              className="lg:col-span-3"
              titulo="Poucos escritórios, muitas campanhas"
              sub={
                grandesN > 0 ? (
                  <>
                    <b className="font-semibold text-ink">{fmtInt(grandesN)} escritórios</b> atenderam 20 ou mais
                    candidaturas cada — juntos, {fmtInt(grandesCand)} candidaturas e {fmtBRLc(grandesValor)} (
                    {fmtPct(grandesValor / pjValor)} do faturado por escritórios).
                  </>
                ) : (
                  "Distribuição dos escritórios pelo número de candidaturas que atenderam."
                )
              }
            >
              <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="pb-2 font-normal">Candidaturas por escritório</th>
                    <th className="pb-2 text-right font-normal">Escritórios</th>
                    <th className="pb-2 text-right font-normal">Candidaturas</th>
                    <th className="pb-2 pl-6 font-normal">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {faixas.map((x) => (
                    <tr key={x.rotulo} className="border-b border-line last:border-0">
                      <td className="py-2">
                        <Link
                          href={`/escritorios${qs(sp, { min: x.min, max: Number.isFinite(x.max) ? x.max : undefined })}`}
                          className="hover:underline"
                        >
                          {x.rotulo}
                        </Link>
                      </td>
                      <td className="py-2 text-right">{fmtInt(x.escritorios)}</td>
                      <td className="py-2 text-right">{fmtInt(x.candidaturas)}</td>
                      <td className="py-2 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <BarraCelula frac={x.valor / maxFaixa} />
                          </div>
                          <span className="w-20 text-right text-ink-2">{fmtBRLc(x.valor)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </Card>

            <Card
              className="lg:col-span-2"
              titulo="Por eleição"
              sub="Total contratado, por fonte do pagamento. Eleições municipais (2020, 2024) têm muito mais candidaturas."
            >
              <SerieAnos dados={serie} destaque={f.ano} parcial={ANO_PARCIAL} />
              <div className="mt-3">
                <Legenda />
              </div>
              <p className="mt-2 text-[11px] text-muted">* 2018: só escritórios PJ identificados por CNAE.</p>
            </Card>
          </div>

          <Card
            titulo="Escritórios com mais candidaturas"
            sub="Número de candidaturas atendidas no recorte. Clique para ver clientes, partidos e valores."
            acao={
              <Link
                href={`/escritorios${qs(sp, { ordem: "candidaturas" })}`}
                className="text-accent-ink hover:underline"
              >
                Ranking completo →
              </Link>
            }
          >
            <BarList
              formato={fmtInt}
              itens={top.map((e) => ({
                chave: e.firma,
                href: `/escritorios/${e.firma}${f.ano ? `?ano=${f.ano}` : ""}`,
                valor: e.candidaturas,
                rotulo: (
                  <>
                    {titulo(e.nome)}{" "}
                    <span className="text-xs text-muted">
                      {TIPOS[e.tipo]}
                      {e.uf_sede && ` · ${e.municipio_sede ? titulo(e.municipio_sede) + "/" : ""}${e.uf_sede}`}
                    </span>
                  </>
                ),
                direita: (
                  <>
                    <b className="font-medium text-ink">{fmtInt(e.candidaturas)}</b> cand. · {fmtBRLc(e.valor)} ·{" "}
                    {e.partidos} partidos
                  </>
                ),
              }))}
            />
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card titulo="Por UF" sub="Total contratado e média por candidatura.">
              <BarList
                itens={porUF.map((u) => ({
                  chave: u.chave,
                  href: `/${qs(sp, { uf: u.chave })}`,
                  valor: u.valor,
                  rotulo: u.chave,
                  direita: (
                    <>
                      {fmtBRLc(u.valor)} <span className="text-muted">· {fmtBRLc(u.valor / u.candidatos)}/cand.</span>
                    </>
                  ),
                }))}
              />
            </Card>
            <Card
              titulo="Por partido"
              sub="Total contratado pelas candidaturas do partido."
              acao={
                <Link href={`/partidos${qs(sp, {})}`} className="text-accent-ink hover:underline">
                  Detalhar →
                </Link>
              }
            >
              <BarList
                itens={porPartido.slice(0, 15).map((p) => ({
                  chave: p.chave,
                  href: `/${qs(sp, { partido: p.chave })}`,
                  valor: p.valor,
                  rotulo: p.chave,
                  direita: (
                    <>
                      {fmtBRLc(p.valor)} <span className="text-muted">· {fmtPct((p.fefc + p.fp) / p.valor)} público</span>
                    </>
                  ),
                }))}
              />
            </Card>
            <Card titulo="Por cargo" sub="Total contratado e média por candidatura.">
              <BarList
                itens={porCargo.map((c) => ({
                  chave: c.chave,
                  href: `/${qs(sp, { cargo: c.chave })}`,
                  valor: c.valor,
                  rotulo: c.chave,
                  direita: (
                    <>
                      {fmtBRLc(c.valor)} <span className="text-muted">· {fmtBRLc(c.valor / c.candidatos)}/cand.</span>
                    </>
                  ),
                }))}
              />
            </Card>
          </div>
        </>
      )}
      <p className="text-xs text-muted">
        Eleições disponíveis: {ANOS.join(", ")}. Valores contratados declarados pelas candidaturas ao TSE; a fonte
        (fundo eleitoral, Fundo Partidário ou outros) é rateada pelo que foi efetivamente pago.
      </p>
    </div>
  );
}
