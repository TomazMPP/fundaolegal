import { BotaoContorno, FaixaNumeros, ListaBarras, Numero, Painel, Titulo, type ItemLista } from "@/components/charts";
import { nomeBonito } from "@/components/total/TabelaParlamentares";
import { fmtBRLc, fmtExtenso, fmtInt, titulo } from "@/lib/format";
import { ANO_PARCIAL, meta, parlamentares, recebedores, refIPCA, type Parlamentar } from "@/lib/total/data";
import { base } from "@/lib/total/ranking";

function top(lista: Parlamentar[], valor: (p: Parlamentar) => number, b: string): ItemLista[] {
  return [...lista]
    .sort((x, y) => valor(y) - valor(x))
    .slice(0, 10)
    .map((p) => ({
      chave: p.id,
      nome: (
        <>
          {nomeBonito(p.nome)}{" "}
          <span className="text-fg-3">
            {[p.partido, p.uf].filter(Boolean).join("-")}
          </span>
        </>
      ),
      valor: valor(p),
      texto: fmtBRLc(valor(p)),
      href: `${b}/politico/${p.id}`,
    }));
}

function Bloco({ chapeu, titulo: t, sub, itens, href, cor }: {
  chapeu: string;
  titulo: string;
  sub: string;
  itens: ItemLista[];
  href: string;
  cor?: string;
}) {
  return (
    <Painel>
      <div className="flex h-full flex-col gap-6">
        <Titulo chapeu={chapeu} tamanho="sm" sub={sub}>
          {t}
        </Titulo>
        <ListaBarras itens={itens} cor={cor} />
        <div className="mt-auto">
          <BotaoContorno href={href}>Ver ranking completo</BotaoContorno>
        </div>
      </div>
    </Painel>
  );
}

export default async function PanoramaTotal() {
  const b = await base();
  const ps = parlamentares();
  const m = meta();
  const soma = (f: (p: Parlamentar) => number) => ps.reduce((s, p) => s + f(p), 0);
  const salario = soma((p) => p.salario);
  const beneficios = soma((p) => p.cota + p.ajuda);
  const fundaoTodos = m.fundao_anos.reduce((s, a) => s + a.corrigido, 0);
  const pessoasFundao = recebedores().length;
  const comValor = ps.filter((p) => p.salario > 0).length;

  const topFundao: ItemLista[] = recebedores()
    .slice(0, 10)
    .map((r) => ({
      chave: r.id,
      nome: (
        <>
          {nomeBonito(r.nome)} <span className="text-fg-3">{titulo(r.cargo)}</span>
        </>
      ),
      valor: r.corrigido,
      texto: fmtBRLc(r.corrigido),
      href: `${b}/politico/${r.parlamentar ?? r.id}`,
    }));

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col gap-5">
        <p className="flex items-center gap-2.5 text-[13px] text-fg-2">
          <span className="size-2 rounded-full bg-ouro" aria-hidden="true" />
          Congresso desde 1995 · fundão eleitoral desde 2018 · valores corrigidos até {refIPCA()}
        </p>
        <h1 className="max-w-[980px] font-serif text-[40px] leading-[1.06] font-medium tracking-tight sm:text-[52px] lg:text-[56px] lg:leading-[1.04]">
          Deputados federais e senadores receberam <span className="text-ouro">{fmtExtenso(salario + beneficios)}</span> em
          salários e benefícios. Candidatos receberam mais <span className="text-ouro">{fmtExtenso(fundaoTodos)}</span> do
          fundão.
        </h1>
        <p className="max-w-[700px] text-lg leading-relaxed text-fg-2">
          Somamos, para cada político, o que ele custou em dinheiro público: o salário de cada mês no mandato, a cota
          parlamentar reembolsada nota por nota, a ajuda de custo e o dinheiro do Fundo Eleitoral e do Fundo Partidário
          que recebeu do partido para fazer campanha.
        </p>
      </section>

      <FaixaNumeros>
        <Numero rotulo="Salários de parlamentares" valor={fmtBRLc(salario)} nota={`${fmtInt(comValor)} deputados e senadores desde 1995`} />
        <Numero rotulo="Cota parlamentar e ajuda de custo" valor={fmtBRLc(beneficios)} nota="cota desde 2008" />
        <Numero rotulo="Fundão recebido por candidatos" valor={fmtBRLc(fundaoTodos)} nota={`${fmtInt(pessoasFundao)} pessoas, de 2018 a 2026`} destaque />
        <Numero rotulo="Parlamentares no ranking" valor={fmtInt(ps.length)} nota="desde a Constituinte de 1987" />
      </FaixaNumeros>

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloco
          chapeu="Ranking geral"
          titulo="Quem mais recebeu, somando tudo"
          sub="Salário, benefícios e fundão das próprias campanhas"
          itens={top(ps, (p) => p.salario + p.ajuda + p.cota + p.fundao, b)}
          href={`${b}/ranking`}
          cor="bg-ouro"
        />
        <Bloco
          chapeu="Salários"
          titulo="Maiores salários acumulados"
          sub="Subsídio com 13º, pelo tempo em exercício"
          itens={top(ps, (p) => p.salario, b)}
          href={`${b}/salarios`}
        />
        <Bloco
          chapeu="Benefícios"
          titulo="Quem mais usou a cota e a ajuda de custo"
          sub="Cota parlamentar reembolsada e ajuda de custo estimada"
          itens={top(ps, (p) => p.cota + p.ajuda, b)}
          href={`${b}/beneficios`}
          cor="bg-ocre"
        />
        <Bloco
          chapeu="Fundão"
          titulo="Quem mais recebeu do fundão"
          sub="Todos os candidatos, de vereador a presidente"
          itens={topFundao}
          href={`${b}/fundao`}
          cor="bg-ouro"
        />
      </div>

      <Painel>
        <div className="flex flex-col gap-6">
          <Titulo chapeu="Fundão por eleição" tamanho="sm" sub="FEFC e Fundo Partidário repassados por partidos a candidatos, em valores da época">
            O fundão mais que dobrou desde 2018
          </Titulo>
          <ListaBarras
            cor="bg-ouro"
            itens={m.fundao_anos.map((a) => ({
              chave: String(a.ano),
              nome: (
                <>
                  {a.ano} <span className="text-fg-3">{a.ano % 4 === 0 ? "municipal" : "geral"}{a.ano === ANO_PARCIAL ? ", parcial" : ""}</span>
                </>
              ),
              valor: a.fefc + a.fp,
              texto: fmtBRLc(a.fefc + a.fp),
              extra: `· ${fmtInt(a.pessoas)} candidatos`,
              href: `${b}/fundao?ano=${a.ano}`,
            }))}
          />
        </div>
      </Painel>
    </div>
  );
}
