-- Exporta os JSONs lidos (no servidor) pelas páginas de total.fundaolegal.
-- Valores "corrigidos" estão a preços do último IPCA publicado; "_n" são nominais.

-- Uma linha por parlamentar (deputado e senador que são a mesma pessoa viram uma linha só).
CREATE OR REPLACE TABLE pessoa_info AS
WITH ult AS (
  -- nome, partido e UF do período de exercício mais recente
  SELECT pp.pessoa, pp.casa, pp.id, pp.nome, pp.foto, pp.partido, coalesce(p.uf, pp.uf) AS uf, p.fim
  FROM pessoa_parl pp JOIN periodos p USING (casa, id)
  QUALIFY row_number() OVER (PARTITION BY pp.pessoa ORDER BY p.fim DESC, pp.casa) = 1
),
tempo AS (
  SELECT pp.pessoa, min(p.inicio) AS inicio, max(p.fim) AS fim,
         sum(datediff('day', p.inicio, p.fim) + 1) AS dias,
         sum(CASE WHEN p.estimado = 1 THEN datediff('day', p.inicio, p.fim) + 1 ELSE 0 END) AS dias_estimados,
         sum(CASE WHEN p.inicio < DATE '1995-02-01' THEN datediff('day', p.inicio, least(p.fim, DATE '1995-01-31')) + 1 ELSE 0 END) AS dias_sem_valor,
         string_agg(DISTINCT pp.casa, ',' ORDER BY pp.casa) AS casas
  FROM pessoa_parl pp JOIN periodos p USING (casa, id)
  GROUP BY 1
),
v AS (
  SELECT pessoa,
    sum(corrigido) FILTER (WHERE rubrica = 'salario') AS salario, sum(nominal) FILTER (WHERE rubrica = 'salario') AS salario_n,
    sum(corrigido) FILTER (WHERE rubrica = 'ajuda') AS ajuda, sum(nominal) FILTER (WHERE rubrica = 'ajuda') AS ajuda_n,
    sum(corrigido) FILTER (WHERE rubrica = 'cota') AS cota, sum(nominal) FILTER (WHERE rubrica = 'cota') AS cota_n,
    sum(corrigido) FILTER (WHERE rubrica = 'fundao') AS fundao, sum(nominal) FILTER (WHERE rubrica = 'fundao') AS fundao_n
  FROM anual GROUP BY 1
)
SELECT
  replace(replace(t.pessoa, 'camara:', 'd'), 'senado:', 's') AS id,
  u.nome, u.foto, u.partido, u.uf, t.casas,
  t.inicio, t.fim, t.fim >= current_date - 1 AS atual,
  t.dias, t.dias_estimados, t.dias_sem_valor,
  round(coalesce(v.salario, 0)) AS salario, round(coalesce(v.salario_n, 0)) AS salario_n,
  round(coalesce(v.ajuda, 0)) AS ajuda, round(coalesce(v.ajuda_n, 0)) AS ajuda_n,
  round(coalesce(v.cota, 0)) AS cota, round(coalesce(v.cota_n, 0)) AS cota_n,
  round(coalesce(v.fundao, 0)) AS fundao, round(coalesce(v.fundao_n, 0)) AS fundao_n,
  pt.titulo IS NOT NULL AS ligado_tse,
  t.pessoa, pt.titulo
FROM tempo t
JOIN ult u USING (pessoa)
LEFT JOIN v USING (pessoa)
LEFT JOIN pessoa_titulo pt USING (pessoa);

COPY (
  SELECT * EXCLUDE (pessoa, titulo) FROM pessoa_info ORDER BY salario + ajuda + cota + fundao DESC
) TO '../../src/data/total/parlamentares.json' (FORMAT json, ARRAY true);

-- Pessoas que receberam fundão. id estável = "c" + SQ_CANDIDATO da primeira candidatura com fundão.
-- Formato compacto (tuplas) porque são ~285 mil pessoas.
CREATE OR REPLACE TABLE fundao_pessoa AS
WITH c AS (
  SELECT c.*, row_number() OVER (PARTITION BY titulo ORDER BY ano DESC, fefc + fp DESC) AS rk_rec,
         first_value(sq) OVER (PARTITION BY titulo ORDER BY ano, sq) AS sq0
  FROM candidaturas c
)
SELECT
  'c' || any_value(sq0) AS id,
  any_value(nome_urna) FILTER (WHERE rk_rec = 1) AS nome,
  any_value(cargo) FILTER (WHERE rk_rec = 1) AS cargo,
  any_value(uf) FILTER (WHERE rk_rec = 1) AS uf,
  any_value(ue) FILTER (WHERE rk_rec = 1) AS ue,
  any_value(partido) FILTER (WHERE rk_rec = 1) AS partido,
  bool_or(eleito) AS eleito,
  round(sum(fefc)) AS fefc, round(sum(fp)) AS fp, round(sum(corrigido)) AS corrigido,
  list([ano::VARCHAR, cargo, uf, ue, partido, eleito::INT::VARCHAR, round(fefc)::BIGINT::VARCHAR, round(fp)::BIGINT::VARCHAR]
       ORDER BY ano) AS candidaturas,
  titulo
FROM c GROUP BY titulo;

COPY (
  SELECT [f.id, f.nome, f.cargo, f.uf, f.ue, f.partido, f.eleito::INT::VARCHAR,
          f.fefc::BIGINT::VARCHAR, f.fp::BIGINT::VARCHAR, f.corrigido::BIGINT::VARCHAR, coalesce(p.id, '')] AS p,
         f.candidaturas AS c
  FROM fundao_pessoa f LEFT JOIN pessoa_info p USING (titulo)
  ORDER BY f.corrigido DESC
) TO '../../src/data/total/fundao.json' (FORMAT json, ARRAY true);

-- Detalhe dos parlamentares: série anual, períodos de exercício e candidaturas com fundão.
COPY (
  SELECT p.id,
    (SELECT list([a.ano, round(coalesce(a.salario, 0)), round(coalesce(a.ajuda, 0)), round(coalesce(a.cota, 0)), round(coalesce(a.fundao, 0))] ORDER BY a.ano)
     FROM (SELECT ano,
                  sum(corrigido) FILTER (WHERE rubrica = 'salario') AS salario,
                  sum(corrigido) FILTER (WHERE rubrica = 'ajuda') AS ajuda,
                  sum(corrigido) FILTER (WHERE rubrica = 'cota') AS cota,
                  sum(corrigido) FILTER (WHERE rubrica = 'fundao') AS fundao
           FROM anual WHERE anual.pessoa = p.pessoa GROUP BY ano) a) AS anos,
    (SELECT list([pp.casa, pr.inicio::VARCHAR, pr.fim::VARCHAR, pr.uf, pr.estimado::VARCHAR] ORDER BY pr.inicio)
     FROM pessoa_parl pp JOIN periodos pr USING (casa, id) WHERE pp.pessoa = p.pessoa) AS periodos,
    (SELECT f.id FROM fundao_pessoa f WHERE f.titulo = p.titulo) AS fundao_id
  FROM pessoa_info p
) TO '../../src/data/total/parlamentares_detalhe.json' (FORMAT json, ARRAY true);

-- Metadados: referência do IPCA e totais do fundão por eleição.
COPY (
  SELECT strftime((SELECT mes FROM ipca_ref), '%Y-%m') AS ipca_ref,
         (SELECT list({ano: ano, fefc: fefc, fp: fp, pessoas: pessoas, corrigido: corrigido} ORDER BY ano) FROM (
            SELECT ano, round(sum(fefc)) AS fefc, round(sum(fp)) AS fp, count(DISTINCT titulo) AS pessoas,
                   round(sum(corrigido)) AS corrigido
            FROM candidaturas GROUP BY ano)) AS fundao_anos
) TO '../../src/data/total/meta.json' (FORMAT json, ARRAY false);
