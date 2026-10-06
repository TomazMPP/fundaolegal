const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

export const fmtBRL = (v: number) => brl.format(v);
export const fmtBRLc = (v: number) => (Math.abs(v) < 10_000 ? brl.format(v) : brlCompact.format(v));
export const fmtInt = (v: number) => int.format(v);
export const fmtPct = (v: number) => (Number.isFinite(v) ? pct.format(v) : "—");

export function fmtDelta(atual: number, anterior: number | undefined) {
  if (!anterior) return null;
  const d = atual / anterior - 1;
  return { valor: d, texto: `${d >= 0 ? "+" : "−"}${pct.format(Math.abs(d))}` };
}

export function fmtCNPJ(cnpj: string) {
  const c = cnpj.padStart(14, "0");
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

/** "SILVA E SOUZA ADVOGADOS" -> "Silva e Souza Advogados" (mantém siglas curtas) */
export function titulo(s: string) {
  const minusculas = new Set(["e", "de", "da", "do", "das", "dos", "em", "a", "o"]);
  return s
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w, i) => {
      if (i > 0 && minusculas.has(w)) return w;
      if (/^(ltda|eireli|me|epp|s\/s|ss|s\/a|sa|oab)$/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}
