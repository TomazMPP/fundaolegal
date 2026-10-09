"""Transforma deputados.json/senadores.json em tabelas planas de parlamentares e períodos de exercício.

Saída (no mesmo diretório): parlamentares.csv e periodos.csv
Uso: python3 -I pipeline/total/periodos.py data/total
"""
import csv
import json
import sys
from datetime import date, datetime, timedelta

HOJE = date.today()
INICIO = date(1987, 2, 1)  # posse da Assembleia Constituinte (48ª legislatura)
# Antes da 52ª legislatura (2003) o histórico da Câmara não registra entradas e saídas.
PRIMEIRA_LEG_COM_HISTORICO = 52


def leg_inicio(n):
    return date(1987 + 4 * (n - 48), 2, 1)


def leg_fim(n):
    return min(leg_inicio(n + 1) - timedelta(days=1), HOJE)


def dia(s):
    return datetime.fromisoformat(s[:10]).date() if s else None


def remunerado(h):
    """Licença para tratar da saúde mantém o subsídio; as demais saídas (ministério, secretaria etc.) não."""
    return h["situacao"] == "Licença" and "Saúde" in (h["descricaoStatus"] or "")


def periodos_deputado(d):
    eventos = sorted((h for h in d["historico"] if h["situacao"]), key=lambda h: h["dataHora"])
    por_leg = {}
    for h in eventos:
        por_leg.setdefault(h["idLegislatura"], []).append(h)
    saida = []
    for leg in d["legislaturas"]:
        evs = por_leg.get(leg, [])
        if leg < PRIMEIRA_LEG_COM_HISTORICO or not evs:
            saida.append((leg_inicio(leg), leg_fim(leg), 1, d.get("uf"), None))
            continue
        aberto = None
        for h in evs:
            t = dia(h["dataHora"])
            if h["situacao"] == "Exercício":
                if aberto is None:
                    aberto = (t, h.get("siglaUf"), h.get("siglaPartido"))
            elif aberto is not None and not remunerado(h):
                saida.append((aberto[0], t, 0, aberto[1], aberto[2]))
                aberto = None
        if aberto is not None:
            saida.append((aberto[0], leg_fim(leg), 0, aberto[1], aberto[2]))
    return saida


def main(base):
    deps = json.load(open(f"{base}/deputados.json"))
    sens = json.load(open(f"{base}/senadores.json"))
    with open(f"{base}/parlamentares.csv", "w", newline="") as fp, open(f"{base}/periodos.csv", "w", newline="") as fq:
        p = csv.writer(fp)
        q = csv.writer(fq)
        p.writerow(["casa", "id", "nome", "nome_civil", "cpf", "nascimento", "uf", "partido", "foto"])
        q.writerow(["casa", "id", "inicio", "fim", "estimado", "uf", "partido"])
        for d in deps:
            p.writerow(["camara", d["id"], d["nome"], d["nome_civil"], d["cpf"], d["nascimento"], d["uf"],
                        d["partido"], d["foto"]])
            for ini, fim, est, uf, partido in periodos_deputado(d):
                ini = max(ini, INICIO)
                if fim and fim >= ini:
                    q.writerow(["camara", d["id"], ini, fim, est, uf or d["uf"], partido])
        for s in sens:
            ufs = [m["uf"] for m in s["mandatos"] if m["exercicios"]]
            partido = None
            for m in s["mandatos"]:
                for x in m["partidos"]:
                    if x["ate"] is None and x["sigla"]:
                        partido = x["sigla"]
            p.writerow(["senado", s["id"], s["nome"], s["nome_civil"], None, None, ufs[0] if ufs else None,
                        partido, s.get("foto")])
            for m in s["mandatos"]:
                for e in m["exercicios"]:
                    ini = max(dia(e["inicio"]), INICIO)
                    fim = dia(e["fim"]) or HOJE
                    if fim >= ini:
                        q.writerow(["senado", s["id"], ini, min(fim, HOJE), 0, m["uf"], None])


if __name__ == "__main__":
    main(sys.argv[1])
