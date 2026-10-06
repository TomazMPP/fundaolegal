#!/usr/bin/env bash
# Pipeline completo: baixa as prestações de contas do TSE, filtra e gera src/data/*.json
# Requer: curl, unzip, iconv, awk e o binário do DuckDB em tools/duckdb
set -euo pipefail
cd "$(dirname "$0")/../data"
ANOS="${ANOS:-2018 2020 2022 2024}"
DUCKDB=../tools/duckdb
URL=https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas

mkdir -p raw csv filtered ../src/data
for ano in $ANOS; do
  [ -f "raw/pc_$ano.zip" ] || curl -fL -o "raw/pc_$ano.zip" "$URL/prestacao_de_contas_eleitorais_candidatos_$ano.zip"
  mkdir -p "csv/$ano"
  unzip -o -q "raw/pc_$ano.zip" -d "csv/$ano" \
    "despesas_contratadas_candidatos_${ano}_BRASIL.csv" "despesas_pagas_candidatos_${ano}_BRASIL.csv"
done

# 1) contratadas: só linhas candidatas (categoria jurídica/contábil ou CNAE 6911/6920)
for f in csv/*/despesas_contratadas_*.csv; do
  iconv -f cp1252 -t utf-8 -c "$f" | tr -d '\r' \
    | awk 'NR==1 || /"Serviços advocatícios"|"Serviços contábeis"|"6911[0-9]"|"6920[0-9]"/' \
    > "filtered/$(basename "$f")" &
done; wait
rm -f work.duckdb
$DUCKDB work.duckdb -c ".read ../pipeline/01_contratadas.sql"

# 2) pagas: só as despesas selecionadas acima (coluna 24 = SQ_DESPESA)
for f in csv/*/despesas_pagas_*.csv; do
  iconv -f cp1252 -t utf-8 -c "$f" | tr -d '\r' \
    | awk -F';' 'NR==FNR{ids[$1];next} FNR==1 || ($24 in ids)' filtered/ids.txt - \
    > "filtered/$(basename "$f")" &
done; wait

$DUCKDB work.duckdb -c ".read ../pipeline/02_modelo.sql" -c ".read ../pipeline/03_export.sql"
ls -la ../src/data
