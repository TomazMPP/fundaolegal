import type { Campo } from "@/components/FilterBar";
import { ANOS, ANO_PADRAO, PARCIAIS, opcoes } from "./data";

const todos = (l = "Todos") => ({ v: "", l });

export function campoAno({ permitirTodos = true } = {}): Campo {
  return {
    nome: "ano",
    rotulo: "Eleição",
    padrao: String(ANO_PADRAO),
    opcoes: [
      ...[...ANOS].reverse().map((a) => ({ v: String(a), l: PARCIAIS[a] ? `${a} · parcial` : String(a) })),
      ...(permitirTodos ? [{ v: "todos", l: "Todas" }] : []),
    ],
  };
}

export const campoTipo: Campo = {
  nome: "tipo",
  rotulo: "Serviço",
  opcoes: [todos("Advocacia e contabilidade"), { v: "adv", l: "Advocacia" }, { v: "cont", l: "Contabilidade" }],
};

export function camposRecorte(): Campo[] {
  const o = opcoes();
  return [
    { nome: "uf", rotulo: "Estado", opcoes: [todos(), ...o.ufs.map((u) => ({ v: u, l: u === "BR" ? "Nacional" : u }))] },
    { nome: "partido", rotulo: "Partido", opcoes: [todos(), ...o.partidos.map((p) => ({ v: p, l: p }))] },
    { nome: "cargo", rotulo: "Cargo", opcoes: [todos(), ...o.cargos.map((c) => ({ v: c, l: c }))] },
  ];
}
