"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export type Campo = {
  nome: string;
  rotulo: string;
  opcoes: { v: string; l: string }[];
  /** valor exibido quando o parâmetro está ausente da URL */
  padrao?: string;
  /** "pilulas" mostra as opções lado a lado, como botões */
  forma?: "select" | "pilulas";
};

const caixa =
  "h-11 rounded-[10px] border border-line-2 bg-bg px-3.5 text-sm text-fg outline-none focus:border-ouro";

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

  const valor = (c: Campo) => sp.get(c.nome) ?? c.padrao ?? "";
  const mudar = (c: Campo, v: string) => aplicar({ [c.nome]: v === c.padrao ? "" : v });
  const ativos = campos.filter((c) => sp.get(c.nome)).length + (sp.get("q") ? 1 : 0);
  const selects = campos.filter((c) => c.forma !== "pilulas");
  const pilulas = campos.filter((c) => c.forma === "pilulas");

  return (
    <div className={`flex flex-col gap-4 transition-opacity ${pendente ? "opacity-60" : ""}`} aria-busy={pendente}>
      <div className="flex flex-wrap items-end gap-3">
        {busca !== undefined && (
          <label className="rotulo flex min-w-64 flex-[1_1_280px] flex-col gap-2">
            Buscar
            <span className="relative block">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="absolute top-[13px] left-3.5 text-fg-3"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={busca}
                className={`${caixa} w-full pl-[42px] tracking-normal normal-case placeholder:text-fg-3`}
              />
            </span>
          </label>
        )}
        {selects.map((c) => (
          <label key={c.nome} className="rotulo flex flex-col gap-2">
            {c.rotulo}
            <select
              value={valor(c)}
              onChange={(e) => mudar(c, e.target.value)}
              className={`${caixa} min-w-32 tracking-normal normal-case`}
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
            type="button"
            onClick={() => {
              setQ("");
              startTransition(() => router.push(pathname, { scroll: false }));
            }}
            className="h-11 px-2 text-sm text-fg-2 underline underline-offset-4 hover:text-fg"
          >
            Limpar filtros
          </button>
        )}
      </div>
      {pilulas.map((c) => (
        <div key={c.nome} className="flex flex-wrap items-center gap-2" role="group" aria-label={c.rotulo}>
          <span className="mr-1 text-[13px] text-fg-3">{c.rotulo}</span>
          {c.opcoes.map((o) => {
            const ativo = valor(c) === o.v;
            return (
              <button
                key={o.v}
                type="button"
                aria-pressed={ativo}
                onClick={() => mudar(c, o.v)}
                className={`min-h-9 rounded-full border px-3.5 text-[13px] ${
                  ativo ? "border-fg bg-fg font-medium text-bg" : "border-line-2 text-fg-2 hover:border-fg-3 hover:text-fg"
                }`}
              >
                {o.l}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Seletor de eleição em formato de pílulas, usado no topo do panorama. */
export function SeletorEleicao({ campo }: { campo: Campo }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pendente, startTransition] = useTransition();
  const atual = sp.get(campo.nome) ?? campo.padrao ?? "";
  return (
    <div className={`flex max-w-full min-w-0 flex-col gap-2 ${pendente ? "opacity-60" : ""}`}>
      <span className="rotulo">{campo.rotulo}</span>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 rounded-full border border-line bg-panel p-1" role="group" aria-label={campo.rotulo}>
          {campo.opcoes.map((o) => {
            const ativo = atual === o.v;
            return (
              <button
                key={o.v}
                type="button"
                aria-pressed={ativo}
                onClick={() => {
                  const p = new URLSearchParams(sp.toString());
                  if (o.v === campo.padrao) p.delete(campo.nome);
                  else p.set(campo.nome, o.v);
                  p.delete("pagina");
                  const s = p.toString();
                  startTransition(() => router.push(s ? `${pathname}?${s}` : pathname, { scroll: false }));
                }}
                className={`min-h-9 shrink-0 rounded-full px-4 text-sm whitespace-nowrap ${
                  ativo ? "bg-fg font-medium text-bg" : "text-fg-2 hover:text-fg"
                }`}
              >
                {o.l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
