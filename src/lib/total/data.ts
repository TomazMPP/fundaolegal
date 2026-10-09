import "server-only";
import fs from "node:fs";
import path from "node:path";

/** Valores em reais. Sem sufixo: corrigidos pelo IPCA até `meta().ipca_ref`; com `_n`: nominais. */
export type Parlamentar = {
  id: string;
  nome: string;
  foto: string | null;
  partido: string | null;
  uf: string | null;
  /** "camara", "senado" ou "camara,senado" */
  casas: string;
  inicio: string;
  fim: string;
  atual: boolean;
  dias: number;
  /** dias contados pela legislatura inteira, sem registro de entradas e saídas (antes de 2003, na Câmara) */
  dias_estimados: number;
  /** dias antes do Plano Real, que contam como mandato mas não entram na soma em reais */
  dias_sem_valor: number;
  salario: number;
  salario_n: number;
  ajuda: number;
  ajuda_n: number;
  cota: number;
  cota_n: number;
  fundao: number;
  fundao_n: number;
  ligado_tse: boolean;
};

export type Detalhe = {
  id: string;
  /** [ano, salário, ajuda de custo, cota, fundão] corrigidos */
  anos: [number, number, number, number, number][] | null;
  /** [casa, início, fim, uf, estimado ("0" | "1")] */
  periodos: [string, string, string, string, string][] | null;
  fundao_id: string | null;
};

export type Candidatura = {
  ano: number;
  cargo: string;
  uf: string;
  ue: string;
  partido: string;
  eleito: boolean;
  fefc: number;
  fp: number;
};

/** Pessoa que recebeu FEFC ou Fundo Partidário de partido como candidata (2018 em diante). */
export type Recebedor = {
  id: string;
  nome: string;
  cargo: string;
  uf: string;
  ue: string;
  partido: string;
  eleito: boolean;
  fefc: number;
  fp: number;
  /** FEFC + FP corrigidos */
  corrigido: number;
  /** id do parlamentar, quando a pessoa também foi deputada federal ou senadora */
  parlamentar: string | null;
  candidaturas: Candidatura[];
};

type Meta = {
  ipca_ref: string;
  fundao_anos: { ano: number; fefc: number; fp: number; pessoas: number; corrigido: number }[];
};

type FundaoCompacto = {
  cargos: string[];
  partidos: string[];
  pessoas: [string, string, number, string, string, number, number, number, number, number, string | null][];
  candidaturas: [number, number, string | null, string | null, number, number, number, number][][];
};

export const ANOS_FUNDAO = [2018, 2020, 2022, 2024, 2026] as const;
/** Eleição cuja prestação de contas ainda não terminou. */
export const ANO_PARCIAL = 2026;
/** Data de geração dos arquivos usados (atualize ao rodar pipeline/total/build.sh). */
export const ATUALIZADO_EM = "9 de outubro de 2026";

export const CASAS: Record<string, string> = {
  camara: "Câmara",
  senado: "Senado",
};

// ---------- carga (uma vez por processo) ----------

function ler<T>(arquivo: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/data/total", arquivo), "utf8"));
}

type Base = {
  parlamentares: Parlamentar[];
  porId: Map<string, Parlamentar>;
  detalhes: Map<string, Detalhe>;
  meta: Meta;
};

let base: Base | undefined;
let baseFundao: { lista: Recebedor[]; porId: Map<string, Recebedor> } | undefined;

function db(): Base {
  if (base) return base;
  const parlamentares = ler<Parlamentar[]>("parlamentares.json");
  base = {
    parlamentares,
    porId: new Map(parlamentares.map((p) => [p.id, p])),
    detalhes: new Map(ler<Detalhe[]>("parlamentares_detalhe.json").map((d) => [d.id, d])),
    meta: ler<Meta>("meta.json"),
  };
  return base;
}

/** O arquivo do fundão é grande (todas as candidaturas desde 2018); só carrega quando alguma página precisa. */
function dbFundao() {
  if (baseFundao) return baseFundao;
  const f = ler<FundaoCompacto>("fundao.json");
  const lista: Recebedor[] = f.pessoas.map(([id, nome, cargo, uf, ue, partido, eleito, fefc, fp, corrigido, parl], i) => ({
    id,
    nome,
    cargo: f.cargos[cargo],
    uf,
    ue,
    partido: f.partidos[partido],
    eleito: eleito === 1,
    fefc,
    fp,
    corrigido,
    parlamentar: parl,
    candidaturas: f.candidaturas[i].map(([ano, c, cuf, cue, p, el, cfefc, cfp]) => ({
      ano,
      cargo: f.cargos[c],
      uf: cuf ?? uf,
      ue: cue ?? ue,
      partido: f.partidos[p],
      eleito: el === 1,
      fefc: cfefc,
      fp: cfp,
    })),
  }));
  baseFundao = { lista, porId: new Map(lista.map((r) => [r.id, r])) };
  return baseFundao;
}

export const meta = () => db().meta;
export const parlamentares = () => db().parlamentares;
export const parlamentar = (id: string) => db().porId.get(id);
export const detalhe = (id: string) => db().detalhes.get(id);
export const recebedores = () => dbFundao().lista;
export const recebedor = (id: string) => dbFundao().porId.get(id);

/** "ago/2026" */
export function refIPCA() {
  const [a, m] = meta().ipca_ref.split("-");
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${meses[Number(m) - 1]}/${a}`;
}

export const totalParlamentar = (p: Parlamentar, nominal = false) =>
  nominal ? p.salario_n + p.ajuda_n + p.cota_n + p.fundao_n : p.salario + p.ajuda + p.cota + p.fundao;

export function rotuloCasas(p: Pick<Parlamentar, "casas">) {
  const c = p.casas.split(",");
  if (c.length > 1) return "Deputado(a) e senador(a)";
  return c[0] === "senado" ? "Senador(a)" : "Deputado(a) federal";
}

/** Recebido numa eleição específica (sem correção) ou em todas (corrigido, ou nominal se pedido). */
export function valorFundao(r: Recebedor, ano?: number, nominal = false) {
  if (ano) return r.candidaturas.filter((c) => c.ano === ano).reduce((s, c) => s + c.fefc + c.fp, 0);
  return nominal ? r.fefc + r.fp : r.corrigido;
}

// ---------- opções de filtro ----------

const ordem = (a: string, b: string) => a.localeCompare(b, "pt-BR");

export function opcoesParlamentares() {
  const ufs = new Set<string>();
  const partidos = new Set<string>();
  for (const p of parlamentares()) {
    if (p.uf) ufs.add(p.uf);
    if (p.partido) partidos.add(p.partido);
  }
  return { ufs: [...ufs].sort(ordem), partidos: [...partidos].sort(ordem) };
}

export function opcoesFundao() {
  const ufs = new Set<string>();
  const partidos = new Set<string>();
  const cargos = new Set<string>();
  for (const r of recebedores())
    for (const c of r.candidaturas) {
      ufs.add(c.uf);
      partidos.add(c.partido);
      cargos.add(c.cargo);
    }
  return { ufs: [...ufs].sort(ordem), partidos: [...partidos].sort(ordem), cargos: [...cargos].sort(ordem) };
}
