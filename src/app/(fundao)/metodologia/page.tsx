import type { Metadata } from "next";

export const metadata: Metadata = { title: "Metodologia" };

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-line pt-8 md:grid-cols-[240px_1fr] md:gap-12">
      <h2 className="font-serif text-2xl leading-tight font-medium text-fg">{titulo}</h2>
      <div className="flex flex-col gap-3 text-[16px] leading-relaxed text-fg-2 [&_b]:font-semibold [&_b]:text-fg [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export default function Metodologia() {
  return (
    <article className="flex max-w-[960px] flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-[44px] leading-[1.05] font-medium tracking-tight sm:text-[52px]">Metodologia</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-fg-2">
          Todos os números vêm das prestações de contas que as próprias candidaturas entregam ao TSE. Nada foi estimado,
          e o código que gera cada número está público no repositório do projeto, na pasta <code>pipeline</code>.
        </p>
      </div>

      <Bloco titulo="Fonte">
        <p>
          Portal de Dados Abertos do TSE, conjunto <i>Prestação de contas eleitorais: candidatos</i>, eleições de 2018,
          2020, 2022, 2024 e 2026. Usamos os arquivos de despesas contratadas e de despesas pagas. São arquivos públicos,
          baixados sem raspagem nem dados privados.
        </p>
      </Bloco>

      <Bloco titulo="O que entra na conta">
        <ul>
          <li>
            Despesas nas categorias <b>Serviços advocatícios</b> e <b>Serviços contábeis</b>. Elas foram criadas pela Lei
            13.877/2019, que também deixou esses gastos de fora do limite de gastos de campanha.
          </li>
          <li>
            Qualquer despesa paga a uma empresa cujo código de atividade (CNAE) seja <b>6911-7</b>, atividades jurídicas,
            ou <b>6920-6</b>, contabilidade, mesmo que registrada em outra categoria.
          </li>
        </ul>
      </Bloco>

      <Bloco titulo="Eleições incompletas">
        <ul>
          <li>
            <b>2018 é parcial.</b> A categoria ainda não existia, então só aparecem escritórios identificados pelo código
            de atividade. Não compare 2018 diretamente com as outras eleições.
          </li>
          <li>
            <b>2026 é preliminar.</b> O arquivo do TSE traz as prestações parciais e os relatórios entregues durante a
            campanha. Os números vão crescer até a prestação final, 30 dias depois da eleição.
          </li>
        </ul>
      </Bloco>

      <Bloco titulo="Escritórios e autônomos">
        <ul>
          <li>Escritórios são agrupados pela raiz do CNPJ, os oito primeiros dígitos, o que junta matriz e filiais.</li>
          <li>
            Pagamentos a advogados e contadores pessoa física entram nos totais, mas não são listados pelo nome nem pelo
            CPF.
          </li>
        </ul>
      </Bloco>

      <Bloco titulo="Dinheiro público">
        <p>
          Chamamos de dinheiro público a soma do <b>Fundo Especial de Financiamento de Campanha</b>, o fundo eleitoral
          conhecido como fundão, e do <b>Fundo Partidário</b>.
        </p>
        <p>
          O TSE informa o fornecedor na despesa contratada e a origem do dinheiro na despesa paga. Como uma mesma despesa
          pode ser dividida entre várias candidaturas, usamos o valor contratado como base e distribuímos a origem na
          proporção do que foi efetivamente pago. Despesas ainda sem pagamento registrado, entre 1% e 6% do total
          conforme a eleição, aparecem só no valor contratado.
        </p>
      </Bloco>

      <Bloco titulo="Como contamos">
        <ul>
          <li>
            <b>Candidatura</b> é uma pessoa em uma eleição. Quem concorreu em 2020 e em 2024 conta duas vezes no
            acumulado.
          </li>
          <li>
            <b>Média por candidatura</b> divide o total contratado pelas candidaturas que contrataram o serviço, e não por
            todas as candidaturas da eleição.
          </li>
          <li>Os partidos aparecem com a sigla registrada em cada eleição.</li>
        </ul>
      </Bloco>

      <Bloco titulo="O que os dados não dizem">
        <p>
          Contratar advogado e contador é legal, e o contador é obrigatório na prestação de contas. Atender muitas
          campanhas também não é ilegal. Os números mostram <b>quanto</b> foi gasto, <b>com quem</b> e{" "}
          <b>com que concentração</b>, sem provar irregularidade de nenhum escritório ou candidatura.
        </p>
        <p>Erros de declaração precisam ser corrigidos na origem, junto ao TSE.</p>
      </Bloco>
    </article>
  );
}
