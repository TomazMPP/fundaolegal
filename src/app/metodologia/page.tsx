import type { Metadata } from "next";

export const metadata: Metadata = { title: "Metodologia" };

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-8 mb-2 text-[15px] font-semibold tracking-tight">{children}</h2>
);

export default function Metodologia() {
  return (
    <article className="max-w-2xl text-[15px] leading-relaxed text-ink-2 [&_b]:font-semibold [&_b]:text-ink [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Metodologia</h1>
      <p className="mt-3">
        Tudo aqui vem das prestações de contas que as próprias candidaturas entregam ao TSE. Nenhum dado foi
        estimado ou inventado; o código que gera os números está no repositório (<code>pipeline/</code>).
      </p>

      <H>Fonte</H>
      <ul>
        <li>
          Portal de Dados Abertos do TSE — <i>Prestação de contas eleitorais: candidatos</i>, eleições 2018,
          2020, 2022 e 2024 (arquivos <code>despesas_contratadas</code> e <code>despesas_pagas</code>).
        </li>
        <li>Sem raspagem nem dados privados: são arquivos públicos para download.</li>
      </ul>

      <H>O que conta como serviço jurídico ou contábil</H>
      <ul>
        <li>
          Despesas na categoria <b>“Serviços advocatícios”</b> ou <b>“Serviços contábeis”</b> — criadas pela Lei
          13.877/2019, que também tirou esses gastos do limite de gastos de campanha.
        </li>
        <li>
          Mais qualquer despesa com fornecedor <b>pessoa jurídica de CNAE 6911-7</b> (atividades jurídicas) ou{" "}
          <b>6920-6</b> (contabilidade), mesmo em outra categoria.
        </li>
        <li>
          <b>2018 é parcial:</b> a categoria ainda não existia, então só aparecem escritórios identificados pelo
          CNAE. Não compare 2018 diretamente com as demais eleições.
        </li>
      </ul>

      <H>Escritórios e profissionais pessoa física</H>
      <ul>
        <li>
          Escritórios são agrupados pela <b>raiz do CNPJ</b> (8 primeiros dígitos), juntando matriz e filiais.
        </li>
        <li>
          Pagamentos a <b>pessoas físicas</b> (advogados e contadores autônomos) entram nos totais, mas não são
          listados individualmente.
        </li>
      </ul>

      <H>Dinheiro público</H>
      <ul>
        <li>
          “Dinheiro público” = <b>Fundo Especial de Financiamento de Campanha (FEFC, o “fundão”)</b> +{" "}
          <b>Fundo Partidário</b>.
        </li>
        <li>
          O TSE informa o fornecedor na despesa <i>contratada</i> e a fonte do recurso na despesa <i>paga</i>. Uma
          mesma despesa pode ser dividida entre candidaturas, então o valor contratado é a base e a fonte é
          distribuída na proporção do que foi efetivamente pago. Despesas sem pagamento registrado (cerca de 1–6%)
          aparecem só no total contratado.
        </li>
      </ul>

      <H>Contagens</H>
      <ul>
        <li>
          <b>Candidatura</b> = um candidato numa eleição. Quem concorreu em 2020 e 2024 conta duas vezes no
          acumulado.
        </li>
        <li>
          <b>Média por candidatura</b> = total contratado ÷ candidaturas que contrataram o serviço (não ÷ todas
          as candidaturas).
        </li>
        <li>Partidos aparecem com a sigla registrada em cada eleição.</li>
      </ul>

      <H>O que estes dados não dizem</H>
      <p>
        Contratar advogado e contador é legal, e o contador é obrigatório na prestação de contas. Atender muitas
        campanhas também não é ilegal. Os números mostram <b>quanto</b>, <b>para quem</b> e <b>com que
        concentração</b> o dinheiro foi gasto — não provam irregularidade de nenhum escritório ou candidatura.
        Correções: os dados são do TSE; erros de declaração devem ser corrigidos na origem.
      </p>
    </article>
  );
}
