import "server-only";
import fs from "node:fs";
import path from "node:path";

export type Tipo = "adv" | "cont";
export type TipoVinculo = Tipo | "ambos";

export type Vinculo = {
  ano: number;
  firma: string;
  candidato: string;
  partido: string;
  cargo: string;
  uf: string;
  ue: string;
  tipo: TipoVinculo;
  valor: number;
  fefc: number;
  fp: number;
  outros: number;
};

type Total = {
  ano: number;
  tipo: Tipo | "todos";
  uf: string;
  partido: string;
  cargo: string;
  valor: number;
  fefc: number;
  fp: number;
  outros: number;
  valor_pf: number;
  candidatos: number;
};

export type Firma = {
  firma: string;
  nome: string;
  cnpj: string;
  uf_sede: string | null;
  municipio_sede: string | null;
};

export const ANOS = [2018, 2020, 2022, 2024] as const;
export const ANO_PADRAO = 2024;
/** Em 2018 não existia a categoria de despesa jurídica/contábil: só capturamos PJ pelo CNAE. */
export const ANO_PARCIAL = 2018;

export const TIPOS: Record<TipoVinculo, string> = {
  adv: "Advocacia",
  cont: "Contabilidade",
  ambos: "Advocacia e contabilidade",
};

export type Filtros = {
  ano?: number;
  tipo?: Tipo;
  uf?: string;
  partido?: string;
  cargo?: string;
};

// ---------- carga (uma vez por processo) ----------

function ler<T>(arquivo: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/data", arquivo), "utf8"));
}

type Base = {
  vinculos: Vinculo[];
  totais: Total[];
  firmas: Map<string, Firma>;
  porFirma: Map<string, Vinculo[]>;
};

let base: Base | undefined;

function db(): Base {
  if (base) return base;
  const vinculos = ler<Vinculo[]>("vinculos.json");
  const totais = ler<Total[]>("totais.json");
  const firmas = new Map(ler<Firma[]>("firmas.json").map((f) => [f.firma, f]));
  const porFirma = new Map<string, Vinculo[]>();
  for (const v of vinculos) {
    const lista = porFirma.get(v.firma);
    if (lista) lista.push(v);
    else porFirma.set(v.firma, [v]);
  }
  base = { vinculos, totais, firmas, porFirma };
  return base;
}

function casa(v: Pick<Vinculo, "ano" | "uf" | "partido" | "cargo">, f: Filtros) {
  return (
    (!f.ano || v.ano === f.ano) &&
    (!f.uf || v.uf === f.uf) &&
    (!f.partido || v.partido === f.partido) &&
    (!f.cargo || v.cargo === f.cargo)
  );
}

const casaTipo = (t: TipoVinculo, f: Filtros) => !f.tipo || t === f.tipo || t === "ambos";

// ---------- opções de filtro ----------

export function opcoes() {
  const { totais } = db();
  const ufs = new Set<string>();
  const partidos = new Set<string>();
  const cargos = new Set<string>();
  for (const t of totais) {
    ufs.add(t.uf);
    partidos.add(t.partido);
    cargos.add(t.cargo);
  }
  const ordem = (a: string, b: string) => a.localeCompare(b, "pt-BR");
  return {
    ufs: [...ufs].filter((u) => u.length === 2).sort(ordem),
    partidos: [...partidos].sort(ordem),
    cargos: [...cargos].sort(ordem),
  };
}

// ---------- agregados gerais (inclui pessoa física) ----------

export type Soma = {
  valor: number;
  fefc: number;
  fp: number;
  outros: number;
  valor_pf: number;
  candidatos: number;
};

const zero = (): Soma => ({ valor: 0, fefc: 0, fp: 0, outros: 0, valor_pf: 0, candidatos: 0 });

function somar(alvo: Soma, t: Soma) {
  alvo.valor += t.valor;
  alvo.fefc += t.fefc;
  alvo.fp += t.fp;
  alvo.outros += t.outros;
  alvo.valor_pf += t.valor_pf;
  alvo.candidatos += t.candidatos;
}

export function totais(f: Filtros): Soma {
  const s = zero();
  for (const t of db().totais) if (t.tipo === (f.tipo ?? "todos") && casa(t, f)) somar(s, t);
  return s;
}

/** Totais agrupados por uma dimensão (uf, partido, cargo ou ano). */
export function totaisPor(dim: "uf" | "partido" | "cargo" | "ano", f: Filtros) {
  const grupos = new Map<string, Soma>();
  for (const t of db().totais) {
    if (t.tipo !== (f.tipo ?? "todos") || !casa(t, f)) continue;
    const k = String(t[dim]);
    let g = grupos.get(k);
    if (!g) grupos.set(k, (g = zero()));
    somar(g, t);
  }
  return [...grupos].map(([chave, s]) => ({ chave, ...s }));
}

// ---------- escritórios (somente PJ) ----------

export type FirmaAgg = Firma & {
  tipo: TipoVinculo;
  anos: number[];
  candidaturas: number;
  partidos: number;
  ufs: number;
  ues: number;
  valor: number;
  fefc: number;
  fp: number;
  outros: number;
  ticket: number;
  partidoTop: string;
};

function agregarFirma(firma: Firma, vs: Vinculo[]): FirmaAgg {
  const anos = new Set<number>();
  const partidos = new Map<string, number>();
  const ufs = new Set<string>();
  const ues = new Set<string>();
  const tipos = new Set<TipoVinculo>();
  let valor = 0, fefc = 0, fp = 0, outros = 0;
  for (const v of vs) {
    anos.add(v.ano);
    partidos.set(v.partido, (partidos.get(v.partido) ?? 0) + 1);
    ufs.add(v.uf);
    ues.add(`${v.uf}|${v.ue}`);
    tipos.add(v.tipo);
    valor += v.valor;
    fefc += v.fefc;
    fp += v.fp;
    outros += v.outros;
  }
  const tipo: TipoVinculo =
    tipos.has("ambos") || (tipos.has("adv") && tipos.has("cont")) ? "ambos" : tipos.has("adv") ? "adv" : "cont";
  let partidoTop = "";
  let max = 0;
  for (const [p, n] of partidos) if (n > max) [partidoTop, max] = [p, n];
  return {
    ...firma,
    tipo,
    anos: [...anos].sort(),
    candidaturas: vs.length,
    partidos: partidos.size,
    ufs: ufs.size,
    ues: ues.size,
    valor,
    fefc,
    fp,
    outros,
    ticket: vs.length ? valor / vs.length : 0,
    partidoTop,
  };
}

const cacheFirmas = new Map<string, FirmaAgg[]>();

/** Todos os escritórios que atenderam candidaturas dentro do recorte, já agregados. */
export function escritorios(f: Filtros): FirmaAgg[] {
  const chave = JSON.stringify(f);
  const hit = cacheFirmas.get(chave);
  if (hit) return hit;
  const { porFirma, firmas } = db();
  const out: FirmaAgg[] = [];
  for (const [id, vs] of porFirma) {
    const sel = vs.filter((v) => casa(v, f) && casaTipo(v.tipo, f));
    if (sel.length) out.push(agregarFirma(firmas.get(id)!, sel));
  }
  if (cacheFirmas.size > 200) cacheFirmas.clear();
  cacheFirmas.set(chave, out);
  return out;
}

export function escritorio(id: string) {
  const { porFirma, firmas } = db();
  const firma = firmas.get(id);
  const vs = porFirma.get(id);
  if (!firma || !vs) return null;
  return { resumo: agregarFirma(firma, vs), vinculos: vs };
}

/** Faixas de concentração: quantos escritórios atendem N candidaturas e quanto faturam. */
export const FAIXAS = [
  { rotulo: "1", min: 1, max: 1 },
  { rotulo: "2–4", min: 2, max: 4 },
  { rotulo: "5–9", min: 5, max: 9 },
  { rotulo: "10–19", min: 10, max: 19 },
  { rotulo: "20–49", min: 20, max: 49 },
  { rotulo: "50–99", min: 50, max: 99 },
  { rotulo: "100+", min: 100, max: Infinity },
];

export function concentracao(lista: FirmaAgg[]) {
  return FAIXAS.map((fx) => {
    const sel = lista.filter((e) => e.candidaturas >= fx.min && e.candidaturas <= fx.max);
    return {
      ...fx,
      escritorios: sel.length,
      candidaturas: sel.reduce((s, e) => s + e.candidaturas, 0),
      valor: sel.reduce((s, e) => s + e.valor, 0),
    };
  });
}

/** Partidos: totais gerais + quantos escritórios PJ distintos atenderam suas candidaturas. */
export function partidos(f: Filtros) {
  const t = totaisPor("partido", f);
  const firmasPorPartido = new Map<string, Map<string, number>>();
  for (const v of db().vinculos) {
    if (!casa(v, f) || !casaTipo(v.tipo, f)) continue;
    let m = firmasPorPartido.get(v.partido);
    if (!m) firmasPorPartido.set(v.partido, (m = new Map()));
    m.set(v.firma, (m.get(v.firma) ?? 0) + v.valor);
  }
  const { firmas } = db();
  return t.map((p) => {
    const m = firmasPorPartido.get(p.chave);
    let topId = "";
    let topValor = 0;
    for (const [id, val] of m ?? []) if (val > topValor) [topId, topValor] = [id, val];
    return {
      ...p,
      escritorios: m?.size ?? 0,
      top: topId ? { id: topId, nome: firmas.get(topId)!.nome, valor: topValor } : null,
    };
  });
}
