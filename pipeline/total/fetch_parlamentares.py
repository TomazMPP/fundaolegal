"""Baixa deputados federais e senadores desde a 48ª legislatura (1987) e seus períodos de exercício.

Saída (em data/total/):
  deputados.json  — um registro por deputado com os eventos do histórico (API v2 da Câmara)
  senadores.json  — um registro por senador com mandatos e exercícios (API do Senado)
Uso: python3 -I pipeline/total/fetch_parlamentares.py data/total
"""
import hashlib
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

LEGISLATURAS = range(48, 58)  # 1987 (Constituinte) até a atual
CAMARA = "https://dadosabertos.camara.leg.br/api/v2"
SENADO = "https://legis.senado.leg.br/dadosabertos"


CACHE = None  # diretório de cache das respostas (permite retomar após erro / limite de requisições)


def get(url, tentativas=8):
    arq = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + ".json")
    if os.path.exists(arq):
        return json.load(open(arq))
    for i in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "fundaolegal"})
            with urllib.request.urlopen(req, timeout=60) as r:
                dados = json.load(r)
            json.dump(dados, open(arq, "w"))
            return dados
        except Exception as e:  # rede instável ou HTTP 429: tenta de novo com espera crescente
            if i == tentativas - 1:
                raise RuntimeError(f"{url}: {e}")
            time.sleep(min(2 ** i, 60))


def lista(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def deputados():
    ids = {}
    for leg in LEGISLATURAS:
        url = f"{CAMARA}/deputados?idLegislatura={leg}&itens=100&ordem=ASC&ordenarPor=id"
        while url:
            r = get(url)
            for d in r["dados"]:
                ids.setdefault(d["id"], set()).add(leg)
            url = next((l["href"] for l in r["links"] if l["rel"] == "next"), None)
        print(f"câmara: legislatura {leg}, {len(ids)} deputados acumulados", file=sys.stderr)

    def um(id_):
        det = get(f"{CAMARA}/deputados/{id_}")["dados"]
        hist = get(f"{CAMARA}/deputados/{id_}/historico")["dados"]
        u = det.get("ultimoStatus") or {}
        return {
            "id": id_,
            "nome": u.get("nome") or det.get("nomeCivil"),
            "nome_civil": det.get("nomeCivil"),
            "cpf": det.get("cpf") or None,
            "nascimento": det.get("dataNascimento"),
            "uf_nascimento": det.get("ufNascimento"),
            "partido": u.get("siglaPartido"),
            "uf": u.get("siglaUf"),
            "foto": u.get("urlFoto"),
            "legislaturas": sorted(ids[id_]),
            "historico": [
                {k: h.get(k) for k in ("dataHora", "situacao", "condicaoEleitoral", "descricaoStatus",
                                       "idLegislatura", "siglaPartido", "siglaUf")}
                for h in hist
            ],
        }

    with ThreadPoolExecutor(4) as ex:
        return list(ex.map(um, sorted(ids)))


def senadores():
    r = get(f"{SENADO}/senador/lista/legislatura/{LEGISLATURAS[0]}/{LEGISLATURAS[-1]}")
    pars = lista(r["ListaParlamentarLegislatura"]["Parlamentares"]["Parlamentar"])
    print(f"senado: {len(pars)} parlamentares", file=sys.stderr)

    def um(p):
        ident = p["IdentificacaoParlamentar"]
        cod = ident["CodigoParlamentar"]
        m = get(f"{SENADO}/senador/{cod}/mandatos?v=5")["MandatoParlamentar"]["Parlamentar"]
        mandatos = []
        for md in lista((m.get("Mandatos") or {}).get("Mandato")):
            mandatos.append({
                "uf": md.get("UfParlamentar"),
                "participacao": md.get("DescricaoParticipacao"),
                "exercicios": [
                    {"inicio": e.get("DataInicio"), "fim": e.get("DataFim"), "causa": e.get("DescricaoCausaAfastamento")}
                    for e in lista((md.get("Exercicios") or {}).get("Exercicio"))
                ],
                "partidos": [
                    {"sigla": x.get("Sigla"), "desde": x.get("DataFiliacao"), "ate": x.get("DataDesfiliacao")}
                    for x in lista((md.get("Partidos") or {}).get("Partido"))
                ],
            })
        return {
            "id": cod,
            "nome": ident.get("NomeParlamentar"),
            "nome_civil": ident.get("NomeCompletoParlamentar"),
            "foto": ident.get("UrlFotoParlamentar"),
            "mandatos": mandatos,
        }

    with ThreadPoolExecutor(2) as ex:
        return list(ex.map(um, pars))


if __name__ == "__main__":
    out = sys.argv[1]
    CACHE = os.path.join(out, "cache")
    os.makedirs(CACHE, exist_ok=True)
    alvo = sys.argv[2:] or ["senadores", "deputados"]
    if "senadores" in alvo:
        json.dump(senadores(), open(f"{out}/senadores.json", "w"), ensure_ascii=False)
    if "deputados" in alvo:
        json.dump(deputados(), open(f"{out}/deputados.json", "w"), ensure_ascii=False)
