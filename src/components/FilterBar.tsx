"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export type Campo = {
  nome: string;
  rotulo: string;
  opcoes: { v: string; l: string }[];
  /** valor exibido quando o parâmetro está ausente da URL */
  padrao?: string;
};

export default function FilterBar({ campos, busca }: { campos: Campo[]; busca?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pendente, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const primeira = useRef(true);

  function aplicar(mudancas: Record<string, string>) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    p.delete("pagina");
    const s = p.toString();
    startTransition(() => router.push(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  }

  // busca com debounce
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const t = setTimeout(() => {
      if ((sp.get("q") ?? "") !== q) aplicar({ q });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const ativos = campos.filter((c) => sp.get(c.nome)).length + (sp.get("q") ? 1 : 0);

  return (
    <div
      className={`flex flex-wrap items-end gap-x-3 gap-y-3 transition-opacity ${pendente ? "opacity-60" : ""}`}
      aria-busy={pendente}
    >
      {busca !== undefined && (
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs text-muted">
          Buscar
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={busca}
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
          />
        </label>
      )}
      {campos.map((c) => (
        <label key={c.nome} className="flex flex-col gap-1 text-xs text-muted">
          {c.rotulo}
          <select
            value={sp.get(c.nome) ?? c.padrao ?? ""}
            onChange={(e) => aplicar({ [c.nome]: e.target.value === c.padrao ? "" : e.target.value })}
            className="h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent"
          >
            {c.opcoes.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </label>
      ))}
      {ativos > 0 && (
        <button
          onClick={() => {
            setQ("");
            startTransition(() => router.push(pathname, { scroll: false }));
          }}
          className="h-9 px-1 text-sm text-ink-2 underline underline-offset-2 hover:text-ink"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
