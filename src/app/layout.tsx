import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Fundão Legal", template: "%s · Fundão Legal" },
  description:
    "Quanto escritórios de advocacia e contabilidade faturam com campanhas eleitorais pagas com dinheiro público. Dados abertos do TSE, 2018–2026.",
};

const nav = [
  { href: "/", rotulo: "Panorama" },
  { href: "/escritorios", rotulo: "Escritórios" },
  { href: "/partidos", rotulo: "Partidos" },
  { href: "/metodologia", rotulo: "Metodologia" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="flex min-h-full flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4 sm:px-6">
            <Link href="/" className="text-[15px] font-semibold tracking-tight">
              Fundão Legal
            </Link>
            <nav className="flex gap-5 text-sm text-ink-2">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-ink">
                  {n.rotulo}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
            Fonte: prestações de contas de candidatos, TSE (dadosabertos.tse.jus.br), eleições 2018–2026.
            Contratar advogado e contador em campanha é legal — o contador é obrigatório. Os números
            mostram volume e concentração, não irregularidade.{" "}
            <Link href="/metodologia" className="underline underline-offset-2 hover:text-ink">
              Metodologia
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
