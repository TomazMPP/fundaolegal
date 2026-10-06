-- Contratações de serviços advocatícios/contábeis por candidatos.
-- Critério: categoria TSE "Serviços advocatícios"/"Serviços contábeis" (existe desde 2020)
-- OU fornecedor PJ com CNAE 6911-7 (atividades jurídicas) / 6920-6 (contabilidade).
CREATE OR REPLACE TABLE contratadas AS
SELECT
  AA_ELEICAO::INT                                   AS ano,
  SQ_PRESTADOR_CONTAS                               AS sq_prestador,
  SQ_DESPESA                                        AS sq_despesa,
  CASE
    WHEN DS_ORIGEM_DESPESA = 'Serviços advocatícios' THEN 'adv'
    WHEN DS_ORIGEM_DESPESA = 'Serviços contábeis'    THEN 'cont'
    WHEN CD_CNAE_FORNECEDOR = '69117'                THEN 'adv'
    ELSE 'cont'
  END                                               AS tipo,
  CASE WHEN DS_ORIGEM_DESPESA IN ('Serviços advocatícios', 'Serviços contábeis')
       THEN 'categoria' ELSE 'cnae' END             AS criterio,
  DS_ORIGEM_DESPESA                                 AS origem,
  CASE WHEN DS_TIPO_FORNECEDOR = 'PESSOA JURÍDICA' THEN 'PJ' ELSE 'PF' END AS tipo_fornecedor,
  NR_CPF_CNPJ_FORNECEDOR                            AS doc_fornecedor,
  NULLIF(NM_FORNECEDOR_RFB, '#NULO')                AS nome_rfb,
  NM_FORNECEDOR                                     AS nome_fornecedor,
  NULLIF(CD_CNAE_FORNECEDOR, '-1')                  AS cnae,
  NULLIF(SG_UF_FORNECEDOR, '#NULO#')                AS uf_fornecedor,
  NULLIF(NM_MUNICIPIO_FORNECEDOR, '#NULO')          AS municipio_fornecedor,
  SQ_CANDIDATO                                      AS sq_candidato,
  NM_CANDIDATO                                      AS candidato,
  NR_CANDIDATO                                      AS nr_candidato,
  SG_PARTIDO                                        AS partido,
  DS_CARGO                                          AS cargo,
  SG_UF                                             AS uf,
  NM_UE                                             AS ue,
  TRY_STRPTIME(DT_DESPESA, '%d/%m/%Y')::DATE        AS data,
  DS_DESPESA                                        AS descricao,
  TRY_CAST(replace(VR_DESPESA_CONTRATADA, ',', '.') AS DOUBLE) AS valor
FROM read_csv('filtered/despesas_contratadas_candidatos_*_BRASIL.csv',
              delim=';', header=true, all_varchar=true, quote='"')
WHERE DS_ORIGEM_DESPESA IN ('Serviços advocatícios', 'Serviços contábeis')
   OR (DS_TIPO_FORNECEDOR = 'PESSOA JURÍDICA' AND CD_CNAE_FORNECEDOR IN ('69117', '69206'));

COPY (SELECT DISTINCT sq_despesa FROM contratadas) TO 'filtered/ids.txt' (HEADER false);
