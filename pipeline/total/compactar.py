"""Reescreve src/data/total/fundao.json num formato compacto (dicionários de cargo/partido e números de verdade).

Formato de saída:
  {"cargos": [...], "partidos": [...],
   "pessoas": [[id, nome, cargo, uf, ue, partido, eleito, fefc, fp, corrigido, id_parlamentar], ...],
   "candidaturas": [[[ano, cargo, uf, ue, partido, eleito, fefc, fp], ...], ...]}   # mesma ordem de "pessoas"
Na candidatura, uf/ue = null quando iguais aos da pessoa. cargo/partido são índices nos dicionários.
Uso: python3 -I pipeline/total/compactar.py src/data/total/fundao.json
"""
import json
import sys

arq = sys.argv[1]
linhas = json.load(open(arq))
cargos, partidos = {}, {}


def idx(d, v):
    return d.setdefault(v, len(d))


pessoas, cands = [], []
for r in linhas:
    pid, nome, cargo, uf, ue, partido, eleito, fefc, fp, corr, parl = r["p"]
    pessoas.append([pid, nome, idx(cargos, cargo), uf, ue, idx(partidos, partido), int(eleito), int(fefc), int(fp),
                    int(corr), parl or None])
    cands.append([
        [int(a), idx(cargos, c), None if u == uf else u, None if e == ue else e, idx(partidos, p), int(el), int(f), int(x)]
        for a, c, u, e, p, el, f, x in r["c"]
    ])

json.dump({"cargos": list(cargos), "partidos": list(partidos), "pessoas": pessoas, "candidaturas": cands},
          open(arq, "w"), ensure_ascii=False, separators=(",", ":"))
