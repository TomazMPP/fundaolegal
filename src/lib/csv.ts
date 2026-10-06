type Celula = string | number | null | undefined;

const esc = (v: Celula) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

/** CSV com BOM para abrir acentuado no Excel. */
export function csv(cabecalho: string[], linhas: Celula[][]) {
  return "﻿" + [cabecalho, ...linhas].map((l) => l.map(esc).join(",")).join("\n");
}
