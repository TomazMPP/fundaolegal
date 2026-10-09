import type { Metadata } from "next";
import PaginaParlamentares from "@/components/total/PaginaParlamentares";
import { fmtBRLc } from "@/lib/format";
import type { SP } from "@/lib/params";
import { ORDENS_PARL } from "@/lib/total/ranking";

export const metadata: Metadata = { title: "Salários" };

export default async function Salarios({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return (
    <PaginaParlamentares
      sp={sp}
      titulo="Salários"
      intro="Quanto cada deputado federal e senador recebeu de subsídio, com 13º, em todo o tempo que passou no mandato desde 1995."
      padrao="salario"
      soma={(p, n) => (n ? p.salario_n : p.salario)}
      rotuloSoma="em salários"
      colunas={(n) => [
        {
          k: "salario",
          rotulo: "Salário total",
          valor: (p) => fmtBRLc(n ? p.salario_n : p.salario),
          barra: (p) => (n ? p.salario_n : p.salario),
        },
        {
          k: "mensal",
          rotulo: "Por mês",
          valor: (p) => {
            const v = ORDENS_PARL.mensal(p, n);
            return v ? fmtBRLc(v) : "—";
          },
        },
      ]}
      nota={
        <p>
          O salário é estimado: subsídio oficial de cada época (igual para deputados e senadores) multiplicado pelos dias
          em exercício, mais o 13º. Licença para tratar da saúde conta; licença para ser ministro ou secretário não conta,
          porque nesse caso o salário vem do outro cargo. Mandatos antes de fevereiro de 1995 aparecem no tempo de mandato
          mas não na soma, por causa da troca de moedas e da hiperinflação. Na Câmara, antes de 2003 não há registro de
          entradas e saídas, então quem passou pela legislatura conta como se tivesse ficado os quatro anos.
        </p>
      }
    />
  );
}
