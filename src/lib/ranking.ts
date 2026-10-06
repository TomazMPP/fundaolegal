import { escritorios, type FirmaAgg } from "./data";
import { lerFiltros, texto, type SP } from "./params";

export const ORDENS = {
  candidaturas: (e: FirmaAgg) => e.candidaturas,
  valor: (e: FirmaAgg) => e.valor,
  publico: (e: FirmaAgg) => e.fefc + e.fp,
  ticket: (e: FirmaAgg) => e.ticket,
  partidos: (e: FirmaAgg) => e.partidos,
  ues: (e: FirmaAgg) => e.ues,
  nome: (e: FirmaAgg) => e.nome,
} as const;
export type Ordem = keyof typeof ORDENS;

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Ranking de escritórios a partir dos parâmetros da URL (usado pela página e pelo CSV). */
export function ranking(sp: SP) {
  const f = lerFiltros(sp);
  const q = texto(sp, "q")?.trim();
  const min = Number(texto(sp, "min")) || 0;
  const max = Number(texto(sp, "max")) || Infinity;
  const ordemRaw = texto(sp, "ordem");
  const ordem: Ordem = ordemRaw && ordemRaw in ORDENS ? (ordemRaw as Ordem) : "valor";
  const dir: "asc" | "desc" = texto(sp, "dir") === "asc" ? "asc" : "desc";

  let lista = escritorios(f).filter((e) => e.candidaturas >= min && e.candidaturas <= max);
  if (q) {
    const nq = normalizar(q);
    const digitos = q.replace(/\D/g, "");
    lista = lista.filter(
      (e) =>
        normalizar(e.nome).includes(nq) ||
        (digitos.length >= 4 && e.cnpj.includes(digitos)) ||
        (e.municipio_sede && normalizar(e.municipio_sede).includes(nq)),
    );
  }
  const chave = ORDENS[ordem];
  const sinal = dir === "asc" ? 1 : -1;
  lista = [...lista].sort((a, b) => {
    const x = chave(a), y = chave(b);
    return (typeof x === "string" ? x.localeCompare(y as string, "pt-BR") : x - (y as number)) * sinal;
  });
  return { f, q, min, max, ordem, dir, lista };
}
