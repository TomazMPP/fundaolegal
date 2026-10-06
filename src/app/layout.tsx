import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Faustina, Geist } from "next/font/google";
import Link from "next/link";
import Nav from "@/components/Nav";
import { ATUALIZADO_EM } from "@/lib/data";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const faustina = Faustina({ subsets: ["latin"], variable: "--font-faustina" });

// ID de medição do GA4. Só carrega em produção, para o ambiente local não contar visitas.
const GA_ID = process.env.NODE_ENV === "production" ? (process.env.NEXT_PUBLIC_GA_ID ?? "G-2PDJEL372S") : undefined;

export const metadata: Metadata = {
  title: { default: "Fundão Legal", template: "%s | Fundão Legal" },
  description:
    "Quanto escritórios de advocacia e contabilidade recebem de campanhas eleitorais e quanto disso é dinheiro público. Dados abertos do TSE, de 2018 a 2026.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${faustina.variable} h-full`}>
      <body className="flex min-h-full flex-col">
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
      </body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
