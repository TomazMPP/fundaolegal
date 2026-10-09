import type { Metadata } from "next";
import Link from "next/link";
import NavTotal from "@/components/total/NavTotal";
import { ATUALIZADO_EM } from "@/lib/total/data";
import { base } from "@/lib/total/ranking";

export const metadata: Metadata = {
  title: { default: "Total · Fundão Legal", template: "%s | Total · Fundão Legal" },
  description:
    "Quanto cada deputado federal e senador já recebeu em salário, cota parlamentar e ajuda de custo desde 1995, e quanto cada político recebeu do fundão eleitoral desde 2018.",
};

export default async function TotalLayout({ children }: LayoutProps<"/total">) {
  const b = await base();
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-10 gap-y-3 px-4 py-4 sm:px-6">
          <Link href={b || "/"} className="font-serif text-2xl font-semibold tracking-tight text-fg">
            Total <span className="text-ouro">·</span> Fundão Legal
          </Link>
          <NavTotal base={b} />
          <p className="text-[13px] text-fg-3 lg:ml-auto">Atualizado em {ATUALIZADO_EM}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-8 pb-20 sm:px-6">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 text-sm text-fg-3 sm:px-6 md:grid-cols-2 md:gap-12">
          <p>
            Fontes: dados abertos da Câmara dos Deputados, do Senado Federal e do Tribunal Superior Eleitoral, e o IPCA
            do Banco Central para corrigir a inflação.
          </p>
          <p>
            Salário, cota e fundão são previstos em lei. Os números mostram quanto cada um custou, sem apontar
            irregularidade. Salários são estimados a partir do subsídio oficial e do tempo em exercício.{" "}
            <Link href={`${b}/metodologia`} className="text-ouro hover:text-ouro-claro">
              Leia a metodologia
            </Link>
            .
          </p>
        </div>
      </footer>
    </>
  );
}
