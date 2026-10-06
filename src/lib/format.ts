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
export const fmtPct = (v: number) => (Number.isFinite(v) ? pct.format(v) : "n/d");

/** "R$ 219 milhões", "R$ 51,4 milhões", "R$ 1,1 bilhão", "R$ 820 mil": para frases. */
export function fmtExtenso(v: number) {
  const um = (n: number, casas: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: casas });
  if (v >= 1e9) {
    const n = v / 1e9;
    return `R$ ${um(n, 1)} ${n < 2 ? "bilhão" : "bilhões"}`;
  }
  if (v >= 1e6) {
    const n = v / 1e6;
    return `R$ ${um(n, n >= 100 ? 0 : 1)} ${n < 2 ? "milhão" : "milhões"}`;
  }
  if (v >= 1e4) return `R$ ${um(v / 1e3, 0)} mil`;
  return brl.format(v);
}

/** "91% a mais que em 2020" */
export function fmtComparacao(atual: number, anterior: number | undefined, anoAnterior: number | undefined) {
  if (!anterior || !anoAnterior) return null;
  const d = atual / anterior - 1;
  if (Math.abs(d) < 0.005) return `Igual a ${anoAnterior}`;
  return `${pct.format(Math.abs(d))} a ${d > 0 ? "mais" : "menos"} que em ${anoAnterior}`;
}

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
    .replace(/\b([A-Z])\.(?=[A-Z])/g, "$1. ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w, i, ws) => {
      // iniciais soltas: "G O MORAES" -> "G O Moraes"
      if (/^[a-z]\.?$/.test(w) && (ws[i - 1]?.length <= 2 || ws[i + 1]?.length <= 2)) return w.toUpperCase();
      if (i > 0 && minusculas.has(w)) return w;
      if (/^(ltda|eireli|me|epp|s\/s|ss|s\/a|sa|oab)$/.test(w)) return w.toUpperCase();
      if (w.length <= 4 && !/[aeiouáéíóúâêôãõ]/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export const UFS: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
  SP: "São Paulo", SE: "Sergipe", TO: "Tocantins", BR: "Nacional",
};
