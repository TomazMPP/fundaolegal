import Link from "next/link";
import Nav from "@/components/Nav";
import { ATUALIZADO_EM } from "@/lib/data";

export default function FundaoLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-10 gap-y-3 px-4 py-4 sm:px-6">
          <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-fg">
            Fundão Legal
          </Link>
          <Nav />
          <p className="text-[13px] text-fg-3 lg:ml-auto">Dados do TSE, atualizados em {ATUALIZADO_EM}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-8 pb-20 sm:px-6">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 text-sm text-fg-3 sm:px-6 md:grid-cols-2 md:gap-12">
          <p>
            Os dados vêm das prestações de contas que as próprias candidaturas entregam ao Tribunal Superior
            Eleitoral, disponíveis em dadosabertos.tse.jus.br.
          </p>
          <p>
            Contratar advogado e contador é legal, e o contador é obrigatório. Os números mostram quanto se gasta e
            com quem, sem apontar irregularidade.{" "}
            <Link href="/metodologia" className="text-ouro hover:text-ouro-claro">
              Leia a metodologia
            </Link>
            .
          </p>
        </div>
      </footer>
    </>
  );
}
