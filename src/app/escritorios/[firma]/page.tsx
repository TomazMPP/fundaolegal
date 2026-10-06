import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BotaoContorno,
  FaixaNumeros,
  ListaBarras,
  Numero,
  Paginacao,
  Painel,
  SerieEleicoes,
  Titulo,
} from "@/components/charts";
import { ANOS, PARCIAIS, TIPOS, escritorio, escritorios, totais, type Vinculo } from "@/lib/data";
import { UFS, fmtBRL, fmtBRLc, fmtCNPJ, fmtExtenso, fmtInt, fmtPct, titulo } from "@/lib/format";
import { qs, type SP } from "@/lib/params";

const POR_PAGINA = 100;
const ANO_ATUAL = ANOS[ANOS.length - 1];

export async function generateMetadata({ params }: { params: Promise<{ firma: string }> }): Promise<Metadata> {
  const e = escritorio((await params).firma);
  return { title: e ? titulo(e.resumo.nome) : "Escritório não encontrado" };
}

function contar(vs: Vinculo[], chave: (v: Vinculo) => string) {
  const m = new Map<string, { n: number; valor: number }>();
  for (const v of vs) {
    const k = chave(v);
    const g = m.get(k) ?? { n: 0, valor: 0 };
    g.n++;
    g.valor += v.valor;
    m.set(k, g);
  }
  return [...m].map(([nome, g]) => ({ nome, ...g })).sort((a, b) => b.n - a.n || b.valor - a.valor);
}

const local = (v: Vinculo) => (v.uf === "BR" ? "Nacional" : v.ue.length > 2 && v.ue !== v.uf && !UFS[v.ue] && v.ue !== (UFS[v.uf] ?? "").toUpperCase() ? `${titulo(v.ue)}, ${v.uf}` : UFS[v.uf] ?? v.uf);
const cargoMin = (c: string) => c.charAt(0) + c.slice(1).toLowerCase();

export default async function Escritorio({
  params,
  searchParams,
}: {
  params: Promise<{ firma: string }>;
  searchParams: Promise<SP>;
}) {
  const { firma } = await params;
  const sp = await searchParams;
  const e = escritorio(firma);
  if (!e) notFound();
  const { resumo: r, vinculos: todos } = e;

  const anoSel = r.anos.includes(Number(sp.ano)) ? Number(sp.ano) : undefined;
  const vs = anoSel ? todos.filter((v) => v.ano === anoSel) : todos;
  const soma = vs.reduce(
    (s, v) => ({ valor: s.valor + v.valor, publico: s.publico + v.fefc + v.fp }),
    { valor: 0, publico: 0 },
  );
  const frac = soma.publico / soma.valor;
  const media = soma.valor / vs.length;
  const emAndamento = anoSel === ANO_ATUAL && Boolean(PARCIAIS[anoSel]);

  const partidos = contar(vs, (v) => v.partido);
  const locais = contar(vs, local);
  const cargos = contar(vs, (v) => cargoMin(v.cargo));
  const estados = contar(vs, (v) => v.uf);

  // posição no ranking de valor entre escritórios do mesmo recorte
  const rankLista = escritorios({ ano: anoSel }).sort((a, b) => b.valor - a.valor);
  const posicao = rankLista.findIndex((x) => x.firma === firma) + 1;
  const nacional = totais({ ano: anoSel });

  const historico = r.anos.map((ano) => {
    const a = todos.filter((v) => v.ano === ano);
    return {
      ano,
      valor: a.reduce((s, v) => s + v.valor, 0),
      publico: a.reduce((s, v) => s + v.fefc + v.fp, 0),
      nota: `${fmtInt(a.length)} cand.`,
    };
  });

  const ordenados = [...vs].sort((a, b) => b.valor - a.valor);
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const paginas = Math.ceil(ordenados.length / POR_PAGINA);
  const linhas = ordenados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const ondeFrase =
    estados.length === 1
      ? `, todas em ${UFS[estados[0].nome] ?? estados[0].nome}`
      : estados[0].n / vs.length >= 0.9
        ? `, quase todas em ${UFS[estados[0].nome] ?? estados[0].nome}`
        : ` em ${estados.length} estados`;
  const publicoFrase =
    soma.publico === 0
      ? "Nenhuma parte desse valor foi paga com dinheiro público."
      : frac > 0.5
        ? `Mais da metade desse valor, ${fmtExtenso(soma.publico)}, saiu de fundo eleitoral ou partidário.`
        : `Desse valor, ${fmtExtenso(soma.publico)} (${fmtPct(frac)}) saiu de fundo eleitoral ou partidário.`;

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-5">
        <Link href="/escritorios" className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-fg-3 hover:text-fg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Todos os escritórios
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-fg-3">
          <span className="rounded-full border border-line-2 px-3 py-1 text-fg-2">{TIPOS[r.tipo]}</span>
          <span className="tnum">CNPJ {fmtCNPJ(r.cnpj)}</span>
          {r.uf_sede && <span>Sede em {r.municipio_sede ? `${titulo(r.municipio_sede)}, ${r.uf_sede}` : UFS[r.uf_sede]}</span>}
          <span>
            {r.anos.length === ANOS.length
              ? "Atuou em todas as eleições desde 2018"
              : r.anos.length === 1
                ? `Atuou só na eleição de ${r.anos[0]}`
                : `Atuou em ${r.anos.length} eleições desde ${r.anos[0]}`}
          </span>
        </div>
        <h1 className="max-w-[980px] font-serif text-[40px] leading-[1.05] font-medium tracking-tight sm:text-[56px]">
          {titulo(r.nome)}
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-fg-2">
          {anoSel ? `Em ${anoSel}` : `Entre ${r.anos[0]} e ${r.anos.at(-1)}`}, atendeu{" "}
          <b className="font-semibold text-fg">
            {fmtInt(vs.length)} {vs.length === 1 ? "candidatura" : "candidaturas"}
          </b>{" "}
          de {partidos.length} {partidos.length === 1 ? "partido" : "partidos"}
          {ondeFrase}, e {emAndamento ? "já soma" : "somou"}{" "}
          <b className="font-semibold text-fg">{fmtExtenso(soma.valor)}</b> contratados. {publicoFrase}
        </p>
      </div>

      <nav className="inline-flex flex-wrap gap-1 self-start rounded-full border border-line bg-panel p-1" aria-label="Eleição">
        {[undefined, ...[...r.anos].reverse()].map((a) => {
          const ativo = a === anoSel;
          return (
            <Link
              key={a ?? "todas"}
              href={a ? `?ano=${a}` : "?"}
              scroll={false}
              aria-current={ativo ? "page" : undefined}
              className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm ${ativo ? "bg-fg font-medium text-bg" : "text-fg-2 hover:text-fg"}`}
            >
              {a ?? "Todas"}
            </Link>
          );
        })}
      </nav>

      <FaixaNumeros>
        <Numero
          rotulo={anoSel ? `Contratado em ${anoSel}` : "Contratado desde 2018"}
          valor={fmtBRLc(soma.valor)}
          nota={
            posicao === 1
              ? "O maior valor entre todos os escritórios"
              : posicao > 0
                ? `${fmtInt(posicao)}º maior valor entre ${fmtInt(rankLista.length)} escritórios`
                : null
          }
        />
        <Numero rotulo="Dinheiro público" valor={fmtBRLc(soma.publico)} destaque nota={`${fmtPct(frac)} do contratado`} />
        <Numero
          rotulo="Candidaturas"
          valor={fmtInt(vs.length)}
          nota={cargos
            .slice(0, 2)
            .map((c) => `${fmtInt(c.n)} para ${c.nome.toLowerCase()}`)
            .join(", ")}
        />
        <Numero
          rotulo="Média por candidatura"
          valor={fmtBRL(media)}
          nota={nacional.candidatos ? `A média no país é ${fmtBRL(nacional.valor / nacional.candidatos)}` : null}
        />
      </FaixaNumeros>

      <div className="grid gap-6 lg:grid-cols-3">
        <Painel className="flex flex-col gap-5">
          <Titulo tamanho="sm" sub="Valor contratado por eleição">
            Histórico
          </Titulo>
          <SerieEleicoes dados={historico} destaque={anoSel} parciais={Object.keys(PARCIAIS).map(Number)} altura={170} />
        </Painel>
        <Painel className="flex flex-col gap-5">
          <Titulo tamanho="sm" sub={`Candidaturas atendidas${anoSel ? ` em ${anoSel}` : ""} e valor contratado`}>
            {partidos.length === 1 ? "Clientes de 1 partido" : `Clientes de ${partidos.length} partidos`}
          </Titulo>
          <ListaBarras
            itens={partidos.slice(0, 10).map((p) => ({
              chave: p.nome,
              nome: p.nome,
              valor: p.n,
              texto: fmtInt(p.n),
              extra: `· ${fmtBRLc(p.valor)}`,
            }))}
          />
          {partidos.length > 10 && <p className="text-[13px] text-fg-3">Mais {partidos.length - 10} partidos na tabela abaixo.</p>}
        </Painel>
        <Painel className="flex flex-col gap-5">
          <Titulo tamanho="sm" sub={`Candidaturas atendidas${anoSel ? ` em ${anoSel}` : ""}`}>
            Onde e para qual cargo
          </Titulo>
          <ul className="tnum flex flex-col">
            {locais.slice(0, 6).map((l) => (
              <li key={l.nome} className="flex justify-between gap-3 border-b border-line py-3 last:border-0">
                <span>{l.nome}</span>
                <b className="font-semibold">{fmtInt(l.n)}</b>
              </li>
            ))}
            {locais.length > 6 && <li className="pt-2 text-[13px] text-fg-3">Mais {fmtInt(locais.length - 6)} locais</li>}
          </ul>
          <ul className="tnum flex flex-col">
            {cargos.map((c) => (
              <li key={c.nome} className="flex justify-between gap-3 border-b border-line py-3 last:border-0">
                <span>{c.nome}</span>
                <b className="font-semibold">{fmtInt(c.n)}</b>
              </li>
            ))}
          </ul>
        </Painel>
      </div>

      <section className="flex flex-col gap-5">
        <Titulo
          sub="Do maior para o menor valor contratado"
          acao={
            <BotaoContorno href={`/api/escritorios/${firma}${anoSel ? `?ano=${anoSel}` : ""}`} download>
              Baixar planilha (CSV)
            </BotaoContorno>
          }
        >
          Candidaturas atendidas{anoSel ? ` em ${anoSel}` : ""}
        </Titulo>
        <div className="overflow-x-auto rounded-[18px] border border-line bg-panel">
          <table className="tnum w-full min-w-[820px] text-sm">
            <thead className="border-b border-line text-left text-xs text-fg-3">
              <tr>
                <th className="px-5 py-3.5 font-normal">Candidatura</th>
                {!anoSel && <th className="px-3 py-3.5 font-normal">Eleição</th>}
                <th className="px-3 py-3.5 font-normal">Partido</th>
                <th className="px-3 py-3.5 font-normal">Cargo e local</th>
                <th className="px-3 py-3.5 text-right font-normal">Contratado</th>
                <th className="px-5 py-3.5 text-right font-normal">Fundo eleitoral ou partidário</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((v, i) => {
                const pub = v.fefc + v.fp;
                return (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-hover">
                    <td className="px-5 py-3.5 font-medium">
                      {titulo(v.candidato)}
                      {r.tipo === "ambos" && <span className="ml-2 text-xs font-normal text-fg-3">{TIPOS[v.tipo]}</span>}
                    </td>
                    {!anoSel && <td className="px-3 py-3.5 text-fg-2">{v.ano}</td>}
                    <td className="px-3 py-3.5 text-fg-2">{v.partido}</td>
                    <td className="px-3 py-3.5 text-fg-2">
                      {cargoMin(v.cargo)}, {local(v)}
                    </td>
                    <td className="px-3 py-3.5 text-right">{fmtBRL(v.valor)}</td>
                    <td className={`px-5 py-3.5 text-right ${pub > 0 ? "text-ouro" : "text-fg-3"}`}>
                      {pub > 0 ? fmtBRL(pub) : "Nada"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {paginas > 1 && (
          <Paginacao
            inicio={(pagina - 1) * POR_PAGINA + 1}
            fim={Math.min(pagina * POR_PAGINA, ordenados.length)}
            total={fmtInt(ordenados.length)}
            anterior={pagina > 1 ? qs(sp, { pagina: pagina - 1 }) || "?" : undefined}
            proxima={pagina < paginas ? qs(sp, { pagina: pagina + 1 }) : undefined}
          />
        )}
      </section>

      <p className="max-w-3xl border-t border-line pt-6 text-sm text-fg-3">
        Valores declarados pelas próprias candidaturas ao TSE. Contratar advogado ou contador para a campanha é legal, e
        estes números não indicam irregularidade do escritório nem das candidaturas. Nomes de candidatos e valores de
        campanha são públicos por lei.
      </p>
    </div>
  );
}
