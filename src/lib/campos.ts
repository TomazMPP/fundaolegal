import type { Campo } from "@/components/FilterBar";
import { ANOS, ANO_PADRAO, ANO_PARCIAL, opcoes } from "./data";

const todos = (l = "Todos") => ({ v: "", l });

export function campoAno({ permitirTodos = true } = {}): Campo {
  return {
    nome: "ano",
    rotulo: "Eleição",
    padrao: String(ANO_PADRAO),
    opcoes: [
      ...[...ANOS].reverse().map((a) => ({
        v: String(a),
        l: `${a} · ${a % 4 === 0 ? "municipal" : "geral"}${a === ANO_PARCIAL ? " (parcial)" : ""}`,
      })),
      ...(permitirTodos ? [{ v: "todos", l: "Todas (2018–2024)" }] : []),
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
    { nome: "uf", rotulo: "UF da candidatura", opcoes: [todos(), ...o.ufs.map((u) => ({ v: u, l: u }))] },
    { nome: "partido", rotulo: "Partido", opcoes: [todos(), ...o.partidos.map((p) => ({ v: p, l: p }))] },
    { nome: "cargo", rotulo: "Cargo", opcoes: [todos(), ...o.cargos.map((c) => ({ v: c, l: c }))] },
  ];
}
