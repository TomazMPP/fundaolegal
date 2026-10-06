import { ANOS, ANO_PADRAO, type Filtros, type Tipo } from "./data";

export type SP = Record<string, string | string[] | undefined>;

const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/**
 * Lê filtros da URL. `ano`: ausente => padrão (eleição mais recente); "todos" => série completa.
 */
export function lerFiltros(sp: SP, { anoPadrao = ANO_PADRAO as number | undefined } = {}): Filtros {
  const anoRaw = um(sp.ano);
  const ano =
    anoRaw === "todos" ? undefined : ANOS.includes(Number(anoRaw) as never) ? Number(anoRaw) : anoPadrao;
  const tipo = um(sp.tipo);
  return {
    ano,
    tipo: tipo === "adv" || tipo === "cont" ? (tipo as Tipo) : undefined,
    uf: um(sp.uf),
    partido: um(sp.partido),
    cargo: um(sp.cargo),
  };
}

export const texto = (sp: SP, k: string) => um(sp[k]);

/** Monta query string preservando os parâmetros atuais e aplicando mudanças. */
export function qs(sp: SP, mudancas: Record<string, string | number | undefined | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const s = um(v);
    if (s) p.set(k, s);
  }
  for (const [k, v] of Object.entries(mudancas)) {
    if (v === undefined || v === null || v === "") p.delete(k);
    else p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}
