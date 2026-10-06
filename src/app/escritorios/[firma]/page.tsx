import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarList, BarraFontes, Card, Legenda, Stat } from "@/components/charts";
import { ANOS, TIPOS, escritorio, type Vinculo } from "@/lib/data";
import { fmtBRL, fmtBRLc, fmtCNPJ, fmtInt, fmtPct, titulo } from "@/lib/format";
import { qs, type SP } from "@/lib/params";

const POR_PAGINA = 100;

export async function generateMetadata({ params }: { params: Promise<{ firma: string }> }): Promise<Metadata> {
  const e = escritorio((await params).firma);
  return { title: e ? titulo(e.resumo.nome) : "Escritório não encontrado" };
}

function contar<K extends keyof Vinculo>(vs: Vinculo[], k: K) {
  const m = new Map<string, { n: number; valor: number }>();
  for (const v of vs) {
    const c = String(v[k]);
    const g = m.get(c) ?? { n: 0, valor: 0 };
    g.n++;
    g.valor += v.valor;
    m.set(c, g);
  }
  return [...m].map(([chave, g]) => ({ chave, ...g })).sort((a, b) => b.n - a.n || b.valor - a.valor);
}

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

  const anoSel = ANOS.includes(Number(sp.ano) as never) && r.anos.includes(Number(sp.ano)) ? Number(sp.ano) : undefined;
  const vs = anoSel ? todos.filter((v) => v.ano === anoSel) : todos;
  const soma = vs.reduce(
    (s, v) => ({ valor: s.valor + v.valor, fefc: s.fefc + v.fefc, fp: s.fp + v.fp, outros: s.outros + v.outros }),
    { valor: 0, fefc: 0, fp: 0, outros: 0 },
  );
  const publico = soma.fefc + soma.fp;
  const partidos = contar(vs, "partido");
  const cargos = contar(vs, "cargo");
  const ues = contar(
    vs.map((v) => ({ ...v, ue: v.ue.length === 2 || v.ue === v.uf ? v.ue : `${titulo(v.ue)}/${v.uf}` })),
    "ue",
  );

  const porAno = r.anos.map((ano) => {
    const a = todos.filter((v) => v.ano === ano);
    const valor = a.reduce((s, v) => s + v.valor, 0);
    return {
      ano,
      n: a.length,
      partidos: new Set(a.map((v) => v.partido)).size,
      valor,
      publico: a.reduce((s, v) => s + v.fefc + v.fp, 0),
    };
  });

  const ordenados = [...vs].sort((a, b) => b.valor - a.valor);
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const paginas = Math.ceil(ordenados.length / POR_PAGINA);
  const linhas = ordenados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/escritorios" className="text-sm text-ink-2 hover:text-ink">
        ← Escritórios
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo(r.nome)}</h1>
        <p className="tnum text-sm text-ink-2">
          {TIPOS[r.tipo]} · CNPJ {fmtCNPJ(r.cnpj)}
          {r.uf_sede && ` · ${r.municipio_sede ? titulo(r.municipio_sede) + "/" : ""}${r.uf_sede}`}
        </p>
        <p className="max-w-3xl text-[15px] leading-relaxed text-ink-2">
          {anoSel ? `Em ${anoSel}` : `Entre ${r.anos[0]} e ${r.anos.at(-1)}`}, atendeu{" "}
          <b className="font-semibold text-ink">{fmtInt(vs.length)} candidaturas</b> de {partidos.length}{" "}
          {partidos.length === 1 ? "partido" : "partidos"} em {ues.length}{" "}
          {ues.length === 1 ? "localidade" : "localidades"}, somando {fmtBRL(soma.valor)} contratados —{" "}
          {fmtBRLc(publico)} ({fmtPct(publico / soma.valor)}) pagos com fundo eleitoral ou partidário.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1 text-sm">
        {[undefined, ...r.anos].map((a) => {
          const ativo = a === anoSel;
          return (
            <Link
              key={a ?? "todas"}
              href={a ? `?ano=${a}` : "?"}
              scroll={false}
              className={`rounded-md px-3 py-1.5 ${ativo ? "bg-ink text-page" : "text-ink-2 hover:bg-hover hover:text-ink"}`}
            >
              {a ?? "Todas"}
            </Link>
          );
        })}
      </nav>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat rotulo="Contratado" valor={fmtBRLc(soma.valor)} />
        <Stat rotulo="Dinheiro público" valor={fmtBRLc(publico)} detalhe={`${fmtPct(publico / soma.valor)} do contratado`} />
        <Stat rotulo="Candidaturas" valor={fmtInt(vs.length)} detalhe={`${partidos.length} partidos`} />
        <Stat rotulo="Média por candidatura" valor={fmtBRL(soma.valor / vs.length)} />
      </section>

      <div>
        <BarraFontes d={soma} />
        <div className="mt-2">
          <Legenda />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card titulo="Partidos" sub="Candidaturas atendidas por partido.">
          <BarList
            formato={fmtInt}
            itens={partidos.slice(0, 15).map((p) => ({
              chave: p.chave,
              rotulo: p.chave,
              valor: p.n,
              direita: (
                <>
                  {fmtInt(p.n)} <span className="text-muted">· {fmtBRLc(p.valor)}</span>
                </>
              ),
            }))}
          />
        </Card>
        <Card titulo="Onde" sub="Candidaturas por município (eleição municipal) ou UF.">
          <BarList
            formato={fmtInt}
            itens={ues.slice(0, 15).map((u) => ({
              chave: u.chave,
              rotulo: u.chave,
              valor: u.n,
              direita: (
                <>
                  {fmtInt(u.n)} <span className="text-muted">· {fmtBRLc(u.valor)}</span>
                </>
              ),
            }))}
          />
          {ues.length > 15 && <p className="mt-2 text-xs text-muted">+ {ues.length - 15} localidades</p>}
        </Card>
        <div className="flex flex-col gap-4">
          <Card titulo="Cargos">
            <BarList
              formato={fmtInt}
              itens={cargos.map((c) => ({ chave: c.chave, rotulo: c.chave, valor: c.n }))}
            />
          </Card>
          <Card titulo="Por eleição">
            <table className="tnum w-full text-sm">
              <tbody>
                {porAno.map((a) => (
                  <tr key={a.ano} className="border-b border-line last:border-0">
                    <td className="py-1.5">{a.ano}</td>
                    <td className="py-1.5 text-right">{fmtInt(a.n)} cand.</td>
                    <td className="py-1.5 text-right">{fmtBRLc(a.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      <Card
        titulo={`Candidaturas atendidas${anoSel ? ` em ${anoSel}` : ""}`}
        sub="Valor contratado por candidatura, do maior para o menor, e quanto veio de dinheiro público."
        acao={
          <a href={`/api/escritorios/${firma}${anoSel ? `?ano=${anoSel}` : ""}`} className="text-accent-ink hover:underline">
            Baixar CSV
          </a>
        }
      >
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-5 py-2 text-left font-normal">Candidatura</th>
                {!anoSel && <th className="px-3 py-2 text-left font-normal">Eleição</th>}
                <th className="px-3 py-2 text-left font-normal">Partido</th>
                <th className="px-3 py-2 text-left font-normal">Cargo · local</th>
                <th className="px-3 py-2 text-right font-normal">Contratado</th>
                <th className="px-5 py-2 text-right font-normal">Fundo eleitoral + partidário</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {linhas.map((v, i) => (
                <tr key={i} className="border-b border-line last:border-0 hover:bg-hover">
                  <td className="px-5 py-2">
                    {titulo(v.candidato)}
                    {v.tipo !== r.tipo && r.tipo === "ambos" && (
                      <span className="ml-2 text-xs text-muted">{TIPOS[v.tipo]}</span>
                    )}
                  </td>
                  {!anoSel && <td className="px-3 py-2 text-ink-2">{v.ano}</td>}
                  <td className="px-3 py-2">{v.partido}</td>
                  <td className="px-3 py-2 text-ink-2">
                    {v.cargo} · {v.ue.length > 2 && v.ue !== v.uf ? `${titulo(v.ue)}/` : ""}
                    {v.uf}
                  </td>
                  <td className="px-3 py-2 text-right">{fmtBRL(v.valor)}</td>
                  <td className="px-5 py-2 text-right">
                    {fmtBRL(v.fefc + v.fp)}{" "}
                    <span className="inline-block w-9 text-xs text-muted">{fmtPct((v.fefc + v.fp) / v.valor)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginas > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-ink-2">
            <span>
              {fmtInt((pagina - 1) * POR_PAGINA + 1)}–{fmtInt(Math.min(pagina * POR_PAGINA, ordenados.length))} de{" "}
              {fmtInt(ordenados.length)}
            </span>
            <div className="flex gap-4">
              {pagina > 1 && (
                <Link href={qs(sp, { pagina: pagina - 1 })} scroll={false} className="hover:text-ink">
                  ← Anterior
                </Link>
              )}
              {pagina < paginas && (
                <Link href={qs(sp, { pagina: pagina + 1 })} scroll={false} className="hover:text-ink">
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>

      <p className="text-xs leading-relaxed text-muted">
        Dados declarados pelas próprias candidaturas ao TSE. Contratar advogado e contador em campanha é legal (o
        contador é obrigatório) e estes valores não indicam irregularidade. Nomes de candidaturas e valores são
        públicos por lei.
      </p>
    </div>
  );
}
