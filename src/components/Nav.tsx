"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "/", rotulo: "Panorama" },
  { href: "/escritorios", rotulo: "Escritórios" },
  { href: "/partidos", rotulo: "Partidos" },
  { href: "/metodologia", rotulo: "Metodologia" },
];

export default function Nav() {
  const atual = usePathname();
  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      {itens.map((i) => {
        const ativo = i.href === "/" ? atual === "/" : atual.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
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
