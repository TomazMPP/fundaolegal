#!/usr/bin/env bash
# total.fundaolegal: baixa Câmara, Senado, TSE e IPCA e gera src/data/total/*.json
# Requer: curl, unzip, iconv, awk, python3 e o binário do DuckDB em tools/duckdb.
# Reaproveita os zips do TSE baixados por pipeline/build.sh (data/raw/pc_ANO.zip), se existirem.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
D="$RAIZ/data/total"
DUCKDB="$RAIZ/tools/duckdb"
ANOS="${ANOS:-2018 2020 2022 2024 2026}"
TSE=https://cdn.tse.jus.br/estatistica/sead/odsele
mkdir -p "$D"/{ceap/csv,ceaps/utf8,receitas,cand} "$RAIZ/data/raw" "$RAIZ/src/data/total"
cd "$D"

juntar() { awk '{ buf = (buf == "" ? $0 : buf " " $0); if (gsub(/"/, "\"", buf) % 2 == 0) { print buf; buf = "" } }'; }

# 1) Parlamentares e períodos de exercício (APIs da Câmara e do Senado; respostas ficam em cache/)
python3 -I "$RAIZ/pipeline/total/fetch_parlamentares.py" "$D"
python3 -I "$RAIZ/pipeline/total/periodos.py" "$D"

# 2) Cota parlamentar: CEAP (Câmara) e CEAPS (Senado), 2008 em diante
for a in $(seq 2008 "$(date +%Y)"); do
  curl -fsSL -o "ceap/Ano-$a.csv.zip" "https://www.camara.leg.br/cotas/Ano-$a.csv.zip" && unzip -o -q "ceap/Ano-$a.csv.zip" -d ceap/csv &
  curl -fsSL "https://www.senado.leg.br/transparencia/LAI/verba/despesa_ceaps_$a.csv" \
    | iconv -f cp1252 -t utf-8 -c | tr -d '\r' | tail -n +2 > "ceaps/utf8/ceaps_$a.csv" &
done; wait

# 3) IPCA mensal (Banco Central, série 433)
curl -fsSL -o ipca.json 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01/01/1995'

# 4) TSE: candidatos e receitas das candidaturas
for a in $ANOS; do
  (
    [ -f "$RAIZ/data/raw/pc_$a.zip" ] || curl -fL -o "$RAIZ/data/raw/pc_$a.zip" "$TSE/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_$a.zip"
    unzip -p "$RAIZ/data/raw/pc_$a.zip" "receitas_candidatos_${a}_BRASIL.csv" \
      | iconv -f cp1252 -t utf-8 -c | tr -d '\r' | juntar > "receitas/receitas_$a.csv"
    [ -f "cand/cand_$a.zip" ] || curl -fL -o "cand/cand_$a.zip" "$TSE/consulta_cand/consulta_cand_$a.zip"
    unzip -p "cand/cand_$a.zip" "consulta_cand_${a}_BRASIL.csv" | iconv -f cp1252 -t utf-8 -c | tr -d '\r' > "cand/cand_$a.csv"
  ) &
done; wait

# 5) Modelo e exportação
rm -f total.duckdb
"$DUCKDB" total.duckdb -c ".bail on" -c ".read $RAIZ/pipeline/total/modelo.sql" -c ".read $RAIZ/pipeline/total/export.sql"
python3 -I "$RAIZ/pipeline/total/compactar.py" "$RAIZ/src/data/total/fundao.json"
ls -la "$RAIZ/src/data/total"
