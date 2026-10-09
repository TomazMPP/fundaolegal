import type { Metadata } from "next";
import PaginaParlamentares from "@/components/total/PaginaParlamentares";
import { fmtBRLc } from "@/lib/format";
import type { SP } from "@/lib/params";

export const metadata: Metadata = { title: "Ranking geral" };

export default async function RankingGeral({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return (
    <PaginaParlamentares
      sp={sp}
      titulo="Ranking geral"
      intro="Tudo o que cada deputado federal e senador recebeu de dinheiro público: salário, cota parlamentar, ajuda de custo e fundão eleitoral nas próprias campanhas."
      padrao="total"
      soma={(p, n) => (n ? p.salario_n + p.ajuda_n + p.cota_n + p.fundao_n : p.salario + p.ajuda + p.cota + p.fundao)}
      rotuloSoma="no total"
      colunas={(n) => [
        {
          k: "total",
          rotulo: "Total",
          valor: (p) => fmtBRLc(n ? p.salario_n + p.ajuda_n + p.cota_n + p.fundao_n : p.salario + p.ajuda + p.cota + p.fundao),
          barra: (p) => (n ? p.salario_n + p.ajuda_n + p.cota_n + p.fundao_n : p.salario + p.ajuda + p.cota + p.fundao),
        },
        { k: "salario", rotulo: "Salário", valor: (p) => fmtBRLc(n ? p.salario_n : p.salario) },
        { k: "beneficios", rotulo: "Benefícios", valor: (p) => fmtBRLc(n ? p.cota_n + p.ajuda_n : p.cota + p.ajuda) },
        { k: "fundao", rotulo: "Fundão", valor: (p) => fmtBRLc(n ? p.fundao_n : p.fundao) },
      ]}
      nota={
        <p>
          Salário desde 1995, benefícios desde 2008 e fundão (FEFC e Fundo Partidário repassados pelo partido à campanha)
          desde 2018. O fundão inclui todas as candidaturas da pessoa, também para outros cargos, quando ela foi
          identificada nos dados do TSE. Detalhes de cada estimativa na metodologia.
        </p>
      }
    />
  );
}
