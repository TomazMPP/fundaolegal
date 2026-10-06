-- Fonte dos pagamentos + modelo final exportado para o app.
CREATE OR REPLACE TABLE pagas AS
SELECT
  AA_ELEICAO::INT     AS ano,
  SQ_PRESTADOR_CONTAS AS sq_prestador,
  SQ_DESPESA          AS sq_despesa,
  sum(CASE WHEN DS_FONTE_DESPESA = 'Fundo Especial de Financiamento de Campanha' THEN v ELSE 0 END) AS fefc,
  sum(CASE WHEN DS_FONTE_DESPESA = 'Fundo Partidário' THEN v ELSE 0 END)                              AS fp,
  sum(CASE WHEN DS_FONTE_DESPESA NOT IN ('Fundo Especial de Financiamento de Campanha', 'Fundo Partidário') THEN v ELSE 0 END) AS outros
FROM (
  SELECT *, TRY_CAST(replace(VR_PAGTO_DESPESA, ',', '.') AS DOUBLE) AS v
  FROM read_csv('filtered/despesas_pagas_candidatos_*_BRASIL.csv',
                delim=';', header=true, all_varchar=true, quote='"')
)
GROUP BY ALL;

-- SQ_DESPESA pode se repetir em várias linhas contratadas (nota rateada entre candidatos),
-- então o pago não é somado direto: o valor contratado é a base e a fonte de recurso
-- é distribuída na proporção do que foi efetivamente pago naquela despesa.
CREATE OR REPLACE TABLE fato AS
SELECT
  c.*,
  CASE WHEN c.tipo_fornecedor = 'PJ' THEN left(lpad(c.doc_fornecedor, 14, '0'), 8) END AS firma,
  coalesce(c.valor * p.fefc   / nullif(p.fefc + p.fp + p.outros, 0), 0) AS fefc,
  coalesce(c.valor * p.fp     / nullif(p.fefc + p.fp + p.outros, 0), 0) AS fp,
  coalesce(c.valor * p.outros / nullif(p.fefc + p.fp + p.outros, 0), 0) AS outros
FROM contratadas c
LEFT JOIN pagas p USING (ano, sq_prestador, sq_despesa)
WHERE c.valor > 0;

-- Uma linha por (eleição, escritório, candidato)
CREATE OR REPLACE TABLE vinculos AS
SELECT
  ano, firma, sq_candidato,
  any_value(candidato) AS candidato,
  any_value(partido)   AS partido,
  any_value(cargo)     AS cargo,
  any_value(uf)        AS uf,
  any_value(ue)        AS ue,
  CASE WHEN count(DISTINCT tipo) > 1 THEN 'ambos' ELSE any_value(tipo) END AS tipo,
  round(sum(valor), 2)  AS valor,
  round(sum(fefc), 2)   AS fefc,
  round(sum(fp), 2)     AS fp,
  round(sum(outros), 2) AS outros,
  count(*)              AS lancamentos,
  min(data)             AS primeira_data
FROM fato
WHERE firma IS NOT NULL
GROUP BY ano, firma, sq_candidato;

CREATE OR REPLACE TABLE firmas AS
WITH nomes AS (
  SELECT firma, coalesce(nome_rfb, nome_fornecedor) AS nome, lpad(doc_fornecedor, 14, '0') AS cnpj,
         uf_fornecedor, municipio_fornecedor, count(*) AS n
  FROM fato WHERE firma IS NOT NULL GROUP BY ALL
)
SELECT
  firma,
  arg_max(nome, n)                 AS nome,
  arg_max(cnpj, n)                 AS cnpj,
  arg_max(uf_fornecedor, n)        AS uf_sede,
  arg_max(municipio_fornecedor, n) AS municipio_sede
FROM nomes GROUP BY firma;

-- Totais (inclui pessoa física, que não é identificada no app).
-- Um candidato tem um só UF/partido/cargo, então dentro de cada "tipo" as contagens somam sem duplicar.
CREATE OR REPLACE TABLE totais AS
SELECT ano, coalesce(tipo, 'todos') AS tipo, uf, partido, cargo,
       round(sum(valor), 2) AS valor, round(sum(fefc), 2) AS fefc,
       round(sum(fp), 2) AS fp, round(sum(outros), 2) AS outros,
       round(coalesce(sum(valor) FILTER (WHERE tipo_fornecedor = 'PF'), 0), 2) AS valor_pf,
       count(DISTINCT sq_candidato) AS candidatos
FROM fato
GROUP BY GROUPING SETS ((ano, tipo, uf, partido, cargo), (ano, uf, partido, cargo));
