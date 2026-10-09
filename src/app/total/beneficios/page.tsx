import type { Metadata } from "next";
import PaginaParlamentares from "@/components/total/PaginaParlamentares";
import { fmtBRLc } from "@/lib/format";
import type { SP } from "@/lib/params";

export const metadata: Metadata = { title: "Benefícios" };

export default async function Beneficios({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return (
    <PaginaParlamentares
      sp={sp}
      titulo="Benefícios"
      intro="Cota parlamentar (passagens, aluguel de escritório, combustível, divulgação, consultorias) e ajuda de custo que cada deputado federal e senador recebeu além do salário."
      padrao="beneficios"
      soma={(p, n) => (n ? p.cota_n + p.ajuda_n : p.cota + p.ajuda)}
      rotuloSoma="em benefícios"
      colunas={(n) => [
        {
          k: "beneficios",
          rotulo: "Total",
          valor: (p) => fmtBRLc(n ? p.cota_n + p.ajuda_n : p.cota + p.ajuda),
          barra: (p) => (n ? p.cota_n + p.ajuda_n : p.cota + p.ajuda),
        },
        { k: "cota", rotulo: "Cota parlamentar", valor: (p) => fmtBRLc(n ? p.cota_n : p.cota) },
        { k: "ajuda", rotulo: "Ajuda de custo", valor: (p) => fmtBRLc(n ? p.ajuda_n : p.ajuda) },
      ]}
      nota={
        <>
          <p>
            A cota parlamentar (CEAP na Câmara, CEAPS no Senado) é o valor efetivamente reembolsado, nota por nota,
            publicado pelas duas Casas a partir de 2008. Antes disso não há dados abertos. A ajuda de custo é estimada:
            até 2012, um subsídio no início e outro no fim de cada ano legislativo (os antigos 14º e 15º salários); desde
            2013, um no início e outro no fim do mandato.
          </p>
          <p className="mt-3">
            Ficam de fora o auxílio-moradia e o imóvel funcional (as Casas não publicam quem recebeu, mês a mês), a verba
            de gabinete para pagar assessores e os planos de saúde.
          </p>
        </>
      }
    />
  );
}
