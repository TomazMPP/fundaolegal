"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "", rotulo: "Panorama" },
  { href: "/ranking", rotulo: "Ranking geral" },
  { href: "/salarios", rotulo: "Salários" },
  { href: "/beneficios", rotulo: "Benefícios" },
  { href: "/fundao", rotulo: "Fundão" },
  { href: "/metodologia", rotulo: "Metodologia" },
];

/** `base` é "" no subdomínio total.* e "/total" no domínio principal. */
export default function NavTotal({ base }: { base: string }) {
  const atual = usePathname().replace(/^\/total/, "") || "";
  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      {itens.map((i) => {
        const ativo = i.href === "" ? atual === "" || atual === "/" : atual.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={base + i.href || "/"}
            aria-current={ativo ? "page" : undefined}
            className={ativo ? "font-medium text-fg" : "text-fg-3 hover:text-fg"}
          >
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
