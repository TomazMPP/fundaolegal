import type { Metadata } from "next";
import { fmtBRL } from "@/lib/format";
import { refIPCA } from "@/lib/total/data";

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

const SUBSIDIOS: [string, number, string][] = [
  ["fev/1995", 8000, "Decreto Legislativo 7/1995"],
  ["jan/2002", 8280, "Ato da Mesa 105/2002 (revisão geral de 3,5%)"],
  ["fev/2003", 12720, "Decreto Legislativo 444/2002 (Câmara: R$ 12.847,20, com +1% do Ato da Mesa 29/2003)"],
  ["abr/2007", 16512.09, "Decreto Legislativo 112/2007"],
  ["fev/2011", 26723.13, "Decreto Legislativo 805/2010"],
  ["fev/2015", 33763, "Decreto Legislativo 276/2014"],
  ["jan/2023", 39293.32, "Decreto Legislativo 172/2022"],
  ["abr/2023", 41650.92, "Decreto Legislativo 172/2022"],
  ["fev/2024", 44008.52, "Decreto Legislativo 172/2022"],
  ["fev/2025", 46366.19, "Decreto Legislativo 172/2022 (vigente)"],
];

export default function Metodologia() {
  return (
    <article className="flex max-w-[960px] flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-[44px] leading-[1.05] font-medium tracking-tight sm:text-[52px]">Metodologia</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-fg-2">
          Cota parlamentar e fundão são valores pagos, registrados nota por nota. Salário e ajuda de custo são
          estimativas: multiplicamos o subsídio oficial pelo tempo em exercício. O código está na pasta{" "}
          <code>pipeline/total</code> do repositório.
        </p>
      </div>

      <Bloco titulo="Quem entra">
        <p>
          Os <b>deputados federais e senadores</b> que exerceram mandato desde a Constituinte de 1987, incluindo
          suplentes que assumiram. É onde há dados abertos de mandato, salário e cota para todo o período. Deputados
          estaduais, vereadores, prefeitos e governadores ainda não têm dados de salário e verba reunidos em fonte
          aberta nacional.
        </p>
        <p>
          No <b>fundão</b> entram todos os candidatos, de vereador a presidente, que receberam dinheiro do partido para a
          campanha.
        </p>
        <p>
          Quem foi deputado e senador aparece uma vez só. Para isso juntamos os dois cadastros pelo nome civil.
        </p>
      </Bloco>

      <Bloco titulo="Salário">
        <p>
          Subsídio mensal bruto vigente em cada mês, proporcional aos dias em exercício, mais o 13º. O subsídio é o mesmo
          para deputados e senadores:
        </p>
        <div className="overflow-x-auto">
          <table className="tnum w-full min-w-[480px] text-sm">
            <tbody>
              {SUBSIDIOS.map(([d, v, ato]) => (
                <tr key={d} className="border-b border-line last:border-0">
                  <td className="py-2 pr-4 whitespace-nowrap">{d}</td>
                  <td className="py-2 pr-4 text-right whitespace-nowrap text-fg">{fmtBRL(v).replace(/,00$/, "")}</td>
                  <td className="py-2 text-fg-3">{ato}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul>
          <li>
            <b>Antes de fevereiro de 1995 não há valor.</b> Entre 1987 e 1994 o país trocou de moeda quatro vezes, com
            hiperinflação. Esses anos contam como tempo de mandato, mas ficam de fora da soma em reais.
          </li>
          <li>
            <b>Períodos em exercício.</b> No Senado, vêm do registro oficial de exercícios de cada mandato. Na Câmara, do
            histórico de entradas e saídas de cada deputado, que só existe a partir de 2003. Para 1995 a 2002, quem passou
            pela legislatura conta como se tivesse ficado os quatro anos, o que superestima suplentes que ficaram pouco
            tempo. O perfil de cada parlamentar marca esses períodos como estimados.
          </li>
          <li>
            Licença para tratar da saúde conta como exercício, porque o subsídio continua sendo pago. Licença para ser
            ministro ou secretário não conta, porque o salário passa a vir do outro cargo.
          </li>
          <li>
            O 13º depende da presença em sessões. Consideramos o valor cheio. Descontos de faltas e o imposto de renda
            não entram: é o valor bruto.
          </li>
        </ul>
      </Bloco>

      <Bloco titulo="Benefícios">
        <ul>
          <li>
            <b>Cota parlamentar.</b> Cota para o Exercício da Atividade Parlamentar da Câmara (CEAP) e do Senado (CEAPS):
            passagens, aluguel e manutenção de escritório, combustível, divulgação, consultorias. É o valor reembolsado,
            menos restituições, publicado nota por nota pelas Casas a partir de 2008. O Senado identifica o senador só
            pelo nome parlamentar. Ligamos esse nome ao cadastro de senadores e, quando dois têm o mesmo nome, usamos quem
            estava em exercício naquele mês.
          </li>
          <li>
            <b>Ajuda de custo (estimada).</b> Até 2012, um subsídio no início e outro no fim de cada ano legislativo, os
            antigos 14º e 15º salários. Desde o Decreto Legislativo 210/2013, um subsídio no início e outro no fim do
            mandato.
          </li>
          <li>
            <b>Ficam de fora</b> o auxílio-moradia (hoje R$ 4.253 por mês na Câmara e R$ 5.500 no Senado) e o imóvel
            funcional, porque as Casas não publicam quem recebeu mês a mês. Também ficam de fora a verba de gabinete para
            pagar assessores, que não é renda do parlamentar, e o plano de saúde.
          </li>
        </ul>
      </Bloco>

      <Bloco titulo="Fundão">
        <ul>
          <li>
            Receitas declaradas pelas candidaturas ao TSE com fonte <b>Fundo Especial de Financiamento de Campanha</b>{" "}
            (FEFC, o fundão eleitoral) ou <b>Fundo Partidário</b>, vindas de partido político. Conta dinheiro e também
            bens e serviços pagos pelo partido, como material de campanha.
          </li>
          <li>
            Repasses de um candidato para outro ficam de fora. Assim o mesmo real não aparece duas vezes, uma em quem
            repassou e outra em quem recebeu.
          </li>
          <li>
            Eleições de 2018 a 2026. O FEFC foi criado em 2017. Os dados de 2026 são preliminares: a prestação de contas
            final termina 30 dias depois da eleição.
          </li>
          <li>
            A mesma pessoa em eleições diferentes é reconhecida pelo título de eleitor, porque o TSE ocultou o CPF dos
            candidatos em 2024. Para ligar um parlamentar às candidaturas, usamos o CPF do cadastro da Câmara ou, na falta
            dele, o nome civil quando é único entre os candidatos a cargos estaduais e federais.
          </li>
        </ul>
      </Bloco>

      <Bloco titulo="Inflação">
        <p>
          Por padrão, os valores estão corrigidos pelo IPCA (série 433 do Banco Central) até {refIPCA()}, para comparar
          um real de 1995 com um de hoje. Cada mês é corrigido do próprio mês; o fundão, de outubro do ano da eleição.
          Todas as páginas têm a opção de ver os valores da época, sem correção.
        </p>
      </Bloco>

      <Bloco titulo="Fontes">
        <ul>
          <li>Câmara dos Deputados: API de Dados Abertos (deputados, histórico) e arquivos da cota parlamentar.</li>
          <li>Senado Federal: API de Dados Abertos (mandatos e exercícios) e arquivos da CEAPS.</li>
          <li>TSE: candidatos e receitas das prestações de contas de 2018 a 2026.</li>
          <li>Banco Central: IPCA mensal.</li>
          <li>Subsídios: decretos legislativos e atos das Mesas listados acima.</li>
        </ul>
      </Bloco>
    </article>
  );
}
