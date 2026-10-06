import Link from "next/link";
import { Suspense } from "react";
import {
  Barrinha,
  BotaoContorno,
  FaixaNumeros,
  ListaBarras,
  Numero,
  OrigemDinheiro,
  Painel,
  SerieEleicoes,
  Titulo,
} from "@/components/charts";
import FilterBar, { SeletorEleicao } from "@/components/FilterBar";
import { campoAno, camposRecorte, campoTipo } from "@/lib/campos";
import {
  ANOS,
  ATUALIZADO_EM,
  PARCIAIS,
  TIPOS,
  concentracao,
  escritorios,
  totais,
  totaisPor,
  type Filtros,
} from "@/lib/data";
import { fmtBRL, fmtBRLc, fmtComparacao, fmtExtenso, fmtInt, fmtPct, titulo } from "@/lib/format";
import { lerFiltros, qs, type SP } from "@/lib/params";

const ANO_ATUAL = ANOS[ANOS.length - 1];

function sujeito(f: Filtros) {
  if (f.tipo === "adv") return "Advogados de campanha";
  if (f.tipo === "cont") return "Contadores de campanha";
  return "Advogados e contadores de campanha";
}

function chapeu(f: Filtros) {
  const partes = [
    f.ano
      ? `Eleições ${f.ano % 4 === 0 ? "municipais" : "gerais"} de ${f.ano}${
          f.ano === ANO_ATUAL && PARCIAIS[f.ano] ? ", apuração preliminar" : PARCIAIS[f.ano] ? ", dados parciais" : ""
        }`
      : "Todas as eleições, de 2018 a 2026",
    f.uf,
    f.partido,
    f.cargo,
  ];
  return partes.filter(Boolean).join(" · ");
}

export default async function Panorama({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = lerFiltros(sp);
  const t = totais(f);
  const firmas = escritorios(f);
  const valorPJ = firmas.reduce((s, e) => s + e.valor, 0);
  const publico = t.fefc + t.fp;
  const media = t.candidatos ? t.valor / t.candidatos : 0;
  const emAndamento = f.ano === ANO_ATUAL && Boolean(PARCIAIS[f.ano]);

  // compara com a eleição equivalente anterior (municipal com municipal, geral com geral)
  const anoAnt =
    f.ano && ANOS.includes((f.ano - 4) as never) && !PARCIAIS[f.ano - 4] && !PARCIAIS[f.ano] ? f.ano - 4 : undefined;
  const ant = anoAnt ? totais({ ...f, ano: anoAnt }) : undefined;
  const firmasAnt = anoAnt ? escritorios({ ...f, ano: anoAnt }).length : undefined;
  // num ano em andamento, a referência útil é a média final da eleição anterior do mesmo tipo
  const ref = emAndamento ? totais({ ...f, ano: f.ano! - 4 }) : undefined;

  const serie = totaisPor("ano", { ...f, ano: undefined })
    .map((s) => ({ ano: Number(s.chave), valor: s.valor, publico: s.fefc + s.fp }))
    .sort((a, b) => a.ano - b.ano);
  const maiorAno = serie.reduce((m, s) => (s.valor > m.valor ? s : m), serie[0] ?? { ano: 0, valor: 0, publico: 0 });

  const faixas = concentracao(firmas);
  const grandes = faixas.filter((x) => x.min >= 20);
  const grandesN = grandes.reduce((s, x) => s + x.escritorios, 0);
  const grandesCand = grandes.reduce((s, x) => s + x.candidaturas, 0);
  const grandesValor = grandes.reduce((s, x) => s + x.valor, 0);
  const maxFaixa = Math.max(...faixas.map((x) => x.valor), 1);

  const top = [...firmas].sort((a, b) => b.candidaturas - a.candidaturas || b.valor - a.valor).slice(0, 10);
  const maxTop = top[0]?.candidaturas ?? 1;
  const porUF = totaisPor("uf", f).sort((a, b) => b.valor - a.valor);
  const porPartido = totaisPor("partido", f).sort((a, b) => b.valor - a.valor);
  const porCargo = totaisPor("cargo", f).sort((a, b) => b.valor - a.valor);
  const perfil = (id: string) => `/escritorios/${id}${f.ano ? `?ano=${f.ano}` : ""}`;

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <Suspense>
          <SeletorEleicao campo={campoAno()} />
          <FilterBar campos={[campoTipo, ...camposRecorte()]} />
        </Suspense>
      </div>

      {t.valor === 0 ? (
        <Painel>
          <Titulo tamanho="sm" sub="Tente outra eleição ou remova um dos filtros.">
            Nenhuma despesa jurídica ou contábil encontrada nesse recorte
          </Titulo>
        </Painel>
      ) : (
        <>
          <section className="grid items-end gap-x-16 gap-y-10 lg:grid-cols-[1.45fr_1fr]">
            <div className="flex flex-col gap-5">
              <p className="flex items-center gap-2.5 text-[13px] text-fg-2">
                <span className="size-2 rounded-full bg-ouro" aria-hidden="true" />
                {chapeu(f)}
              </p>
              <h1 className="font-serif text-[40px] leading-[1.06] font-medium tracking-tight sm:text-[52px] lg:text-[56px] lg:leading-[1.04]">
                {sujeito(f)} {emAndamento ? "já receberam" : "receberam"}{" "}
                <span className="text-ouro">{fmtExtenso(publico)}</span> em dinheiro público
                {f.ano ? "." : " desde 2018."}
              </h1>
              <p className="max-w-[620px] text-lg leading-relaxed text-fg-2">
                É o que {fmtInt(t.candidatos)} candidaturas declararam ao TSE{emAndamento ? " até agora" : ""}. No
                total, elas contrataram {fmtExtenso(t.valor)} nesses serviços, e cada uma gastou em média{" "}
                {fmtBRL(media)}.{f.ano && PARCIAIS[f.ano] ? ` ${PARCIAIS[f.ano]}` : ""}
              </p>
            </div>
            <OrigemDinheiro d={t} titulo={<>De onde saiu o dinheiro dos {fmtExtenso(t.valor)} contratados</>} />
          </section>

          <FaixaNumeros>
            <Numero
              rotulo="Total contratado"
              valor={fmtBRLc(t.valor)}
              nota={fmtComparacao(t.valor, ant?.valor, anoAnt) ?? (emAndamento ? `Até ${ATUALIZADO_EM}` : "Soma das contratações declaradas")}
            />
            <Numero
              rotulo="Candidaturas atendidas"
              valor={fmtInt(t.candidatos)}
              nota={fmtComparacao(t.candidatos, ant?.candidatos, anoAnt) ?? "Que contrataram ao menos um dos serviços"}
            />
            <Numero
              rotulo="Escritórios com CNPJ"
              valor={fmtInt(firmas.length)}
              nota={
                t.valor_pf > 0
                  ? `Mais ${fmtBRLc(t.valor_pf)} pagos a profissionais autônomos`
                  : fmtComparacao(firmas.length, firmasAnt, anoAnt)
              }
            />
            <Numero
              rotulo="Média por candidatura"
              valor={fmtBRL(media)}
              nota={
                ref && ref.candidatos
                  ? `Em ${f.ano! - 4}, a média final foi ${fmtBRL(ref.valor / ref.candidatos)}`
                  : ant && ant.candidatos
                    ? `Em ${anoAnt}, foi ${fmtBRL(ant.valor / ant.candidatos)}`
                    : null
              }
            />
          </FaixaNumeros>

          <div className="grid gap-6 lg:grid-cols-2">
            <Painel className="flex flex-col gap-6">
              <Titulo
                chapeu="Concentração"
                sub={
                  grandesN > 0 ? (
                    <>
                      Juntos, eles cuidam de {fmtInt(grandesCand)} candidaturas e faturaram {fmtExtenso(grandesValor)},
                      ou {fmtPct(grandesValor / valorPJ)} do que foi pago a escritórios. A maioria tem poucos clientes,
                      mas o volume se acumula em poucos nomes.
                    </>
                  ) : (
                    "Neste recorte, nenhum escritório chegou a 20 clientes."
                  )
                }
              >
                {grandesN > 0
                  ? `${fmtInt(grandesN)} ${grandesN === 1 ? "escritório atende" : "escritórios atendem"} 20 campanhas ou mais cada um`
                  : "A maioria dos escritórios atende poucas campanhas"}
              </Titulo>
              <div className="overflow-x-auto">
                <table className="tnum w-full min-w-[440px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-fg-3">
                      <th className="pb-2.5 font-normal">Clientes por escritório</th>
                      <th className="pb-2.5 text-right font-normal">Escritórios</th>
                      <th className="pb-2.5 text-right font-normal">Candidaturas</th>
                      <th className="pb-2.5 pl-6 font-normal">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faixas.map((x) => {
                      const grande = x.min >= 20;
                      return (
                        <tr key={x.rotulo} className="border-b border-line last:border-0">
                          <td className="py-3">
                            <Link
                              href={`/escritorios${qs(sp, { min: x.min, max: Number.isFinite(x.max) ? x.max : undefined })}`}
                              className={grande ? "font-medium text-ouro hover:text-ouro-claro" : "text-fg hover:underline"}
                            >
                              {x.rotulo}
                            </Link>
                          </td>
                          <td className="py-3 text-right">{fmtInt(x.escritorios)}</td>
                          <td className="py-3 text-right">{fmtInt(x.candidaturas)}</td>
                          <td className="py-3 pl-6">
                            <span className="flex items-center gap-3">
                              <Barrinha frac={x.valor / maxFaixa} ouro={grande} />
                              <span className="w-[72px] text-right text-fg-2">{fmtBRLc(x.valor)}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Painel>

            <Painel className="flex flex-col gap-6">
              <Titulo
                chapeu="Por eleição"
                sub="Eleições municipais têm dez vezes mais candidaturas que as gerais. A parte em dourado foi paga com fundo eleitoral ou partidário."
              >
                Em {maiorAno.ano}, o gasto chegou a {fmtExtenso(maiorAno.valor)}
              </Titulo>
              <SerieEleicoes dados={serie} destaque={f.ano} parciais={Object.keys(PARCIAIS).map(Number)} />
            </Painel>
          </div>

          <section className="flex flex-col gap-5">
            <Titulo
              chapeu="Quem mais atende"
              acao={<BotaoContorno href={`/escritorios${qs(sp, { ordem: "candidaturas" })}`}>Ver todos os {fmtInt(firmas.length)} escritórios</BotaoContorno>}
            >
              Os dez escritórios com mais candidaturas {f.ano ? `em ${f.ano}` : "desde 2018"}
            </Titulo>
            <ol className="flex flex-col border-t border-line">
              {top.map((e, i) => (
                <li key={e.firma}>
                  <Link
                    href={perfil(e.firma)}
                    className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line py-4 hover:bg-hover sm:grid-cols-[40px_minmax(0,3fr)_minmax(0,2fr)_140px_110px] sm:gap-x-5"
                  >
                    <span className="font-serif text-xl text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{titulo(e.nome)}</span>
                      <span className="text-[13px] text-fg-3">
                        {TIPOS[e.tipo]} · {e.partidos} {e.partidos === 1 ? "partido" : "partidos"}
                        {e.ufs > 3 ? ` em ${e.ufs} estados` : ""}
                      </span>
                    </span>
                    <span className="hidden sm:block">
                      <Barrinha frac={e.candidaturas / maxTop} ouro largura="w-full" />
                    </span>
                    <span className="tnum text-right">
                      <b className="font-semibold">{fmtInt(e.candidaturas)}</b>{" "}
                      <span className="text-fg-3 sm:hidden">cand.</span>
                      <span className="hidden text-fg-3 sm:inline">candidaturas</span>
                    </span>
                    <span className="tnum col-start-2 text-fg-2 sm:col-start-auto sm:text-right">{fmtBRLc(e.valor)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <Painel className="flex flex-col gap-4">
              <Titulo tamanho="sm" sub="Total contratado e média por candidatura">
                Por estado
              </Titulo>
              <ListaBarras
                itens={porUF.slice(0, 10).map((u) => ({
                  chave: u.chave,
                  nome: u.chave === "BR" ? "Nacional" : u.chave,
                  valor: u.valor,
                  texto: fmtBRLc(u.valor),
                  extra: `· ${fmtBRLc(u.valor / u.candidatos)}`,
                  href: `/${qs(sp, { uf: u.chave })}`,
                }))}
              />
            </Painel>
            <Painel className="flex flex-col gap-4">
              <Titulo
                tamanho="sm"
                sub="Total contratado e parcela paga com dinheiro público"
                acao={
                  <Link href={`/partidos${qs(sp, {})}`} className="text-sm text-ouro hover:text-ouro-claro">
                    Ver todos
                  </Link>
                }
              >
                Por partido
              </Titulo>
              <ListaBarras
                itens={porPartido.slice(0, 10).map((p) => ({
                  chave: p.chave,
                  nome: p.chave,
                  valor: p.valor,
                  texto: fmtBRLc(p.valor),
                  extra: `· ${fmtPct((p.fefc + p.fp) / p.valor)} público`,
                  href: `/${qs(sp, { partido: p.chave })}`,
                }))}
              />
            </Painel>
            <Painel className="flex flex-col gap-4">
              <Titulo tamanho="sm" sub="Total contratado e média por candidatura">
                Por cargo
              </Titulo>
              <ListaBarras
                itens={porCargo.map((c) => ({
                  chave: c.chave,
                  nome: c.chave,
                  valor: c.valor,
                  texto: fmtBRLc(c.valor),
                  extra: `· ${fmtBRLc(c.valor / c.candidatos)}`,
                  href: `/${qs(sp, { cargo: c.chave })}`,
                }))}
              />
            </Painel>
          </div>
        </>
      )}
    </div>
  );
}
