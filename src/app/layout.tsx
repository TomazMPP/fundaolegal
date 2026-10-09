import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Faustina, Geist } from "next/font/google";
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
      <body className="flex min-h-full flex-col">{children}</body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
