import "server-only";
import { headers } from "next/headers";
import { texto, type SP } from "@/lib/params";
import { ANOS_FUNDAO, meta, parlamentares, recebedores, type Candidatura, type Parlamentar, type Recebedor } from "./data";

/** Prefixo das rotas: vazio no subdomínio total.*, "/total" no domínio principal. */
export async function base() {
  const host = (await headers()).get("host") ?? "";
  return host.startsWith("total.") ? "" : "/total";
}

export const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Valores nominais (como foram pagos) em vez de corrigidos pela inflação. */
export const nominal = (sp: SP) => texto(sp, "valores") === "nominal";

// ---------- parlamentares ----------

export const ORDENS_PARL = {
  total: (p: Parlamentar, n: boolean) => (n ? p.salario_n + p.ajuda_n + p.cota_n + p.fundao_n : p.salario + p.ajuda + p.cota + p.fundao),
  salario: (p: Parlamentar, n: boolean) => (n ? p.salario_n : p.salario),
  beneficios: (p: Parlamentar, n: boolean) => (n ? p.cota_n + p.ajuda_n : p.cota + p.ajuda),
  cota: (p: Parlamentar, n: boolean) => (n ? p.cota_n : p.cota),
  ajuda: (p: Parlamentar, n: boolean) => (n ? p.ajuda_n : p.ajuda),
  fundao: (p: Parlamentar, n: boolean) => (n ? p.fundao_n : p.fundao),
  /** salário por mês de mandato com valor (depois de fev/1995) */
  mensal: (p: Parlamentar, n: boolean) => {
    const meses = (p.dias - p.dias_sem_valor) / 30.44;
    return meses >= 1 ? (n ? p.salario_n : p.salario) / meses : 0;
  },
  dias: (p: Parlamentar) => p.dias,
  nome: (p: Parlamentar) => p.nome,
} as const;
export type OrdemParl = keyof typeof ORDENS_PARL;

export function rankingParlamentares(sp: SP, padrao: OrdemParl) {
  const n = nominal(sp);
  const casa = texto(sp, "casa");
  const uf = texto(sp, "uf");
  const partido = texto(sp, "partido");
  const situacao = texto(sp, "situacao");
  const q = texto(sp, "q")?.trim();
  const ordemRaw = texto(sp, "ordem");
  const ordem: OrdemParl = ordemRaw && ordemRaw in ORDENS_PARL ? (ordemRaw as OrdemParl) : padrao;
  const dir: "asc" | "desc" = texto(sp, "dir") === "asc" ? "asc" : "desc";

  let lista = parlamentares().filter(
    (p) =>
      (!casa || p.casas.split(",").includes(casa)) &&
      (!uf || p.uf === uf) &&
      (!partido || p.partido === partido) &&
      (!situacao || (situacao === "atual" ? p.atual : !p.atual)),
  );
  if (q) {
    const nq = normalizar(q);
    lista = lista.filter((p) => normalizar(p.nome).includes(nq));
  }
  const chave = ORDENS_PARL[ordem];
  const sinal = dir === "asc" ? 1 : -1;
  lista = [...lista].sort((a, b) => {
    const x = chave(a, n), y = chave(b, n);
    return (typeof x === "string" ? x.localeCompare(y as string, "pt-BR") : x - (y as number)) * sinal;
  });
  return { lista, ordem, dir, n };
}

// ---------- fundão ----------

/** Fator IPCA por eleição (o pipeline corrige a partir de outubro do ano da eleição). */
export function fatorAno(ano: number) {
  const a = meta().fundao_anos.find((x) => x.ano === ano);
  return a && a.fefc + a.fp > 0 ? a.corrigido / (a.fefc + a.fp) : 1;
}

export type LinhaFundao = Recebedor & { valor: number; recorte: Candidatura[] };

export function rankingFundao(sp: SP) {
  const n = nominal(sp);
  const anoRaw = Number(texto(sp, "ano"));
  const ano = ANOS_FUNDAO.includes(anoRaw as never) ? anoRaw : undefined;
  const cargo = texto(sp, "cargo");
  const uf = texto(sp, "uf");
  const partido = texto(sp, "partido");
  const eleito = texto(sp, "eleito") === "1";
  const q = texto(sp, "q")?.trim();
  const nq = q ? normalizar(q) : undefined;
  const dir: "asc" | "desc" = texto(sp, "dir") === "asc" ? "asc" : "desc";
  const fatores = new Map(ANOS_FUNDAO.map((a) => [a, n ? 1 : fatorAno(a)]));
  const filtrado = Boolean(ano || cargo || uf || partido || eleito);

  const lista: LinhaFundao[] = [];
  for (const r of recebedores()) {
    if (nq && !normalizar(r.nome).includes(nq)) continue;
    const recorte = filtrado
      ? r.candidaturas.filter(
          (c) =>
            (!ano || c.ano === ano) &&
            (!cargo || c.cargo === cargo) &&
            (!uf || c.uf === uf) &&
            (!partido || c.partido === partido) &&
            (!eleito || c.eleito),
        )
      : r.candidaturas;
    if (recorte.length === 0) continue;
    const valor = filtrado || n
      ? recorte.reduce((s, c) => s + (c.fefc + c.fp) * (fatores.get(c.ano as never) ?? 1), 0)
      : r.corrigido;
    lista.push({ ...r, valor, recorte });
  }
  lista.sort((a, b) => (dir === "asc" ? a.valor - b.valor : b.valor - a.valor));
  return { lista, ano, n, dir };
}
