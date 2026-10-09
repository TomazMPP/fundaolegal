-- total.fundaolegal: salários, cota parlamentar e fundão por político.
-- Executado em data/total (ver pipeline/total/build.sh).

CREATE OR REPLACE MACRO norm(s) AS
  trim(regexp_replace(regexp_replace(strip_accents(upper(replace(s, '-', ' '))), '[^A-Z ]', '', 'g'), ' +', ' ', 'g'));
CREATE OR REPLACE MACRO num(s) AS TRY_CAST(replace(s, ',', '.') AS DOUBLE);

----------------------------------------------------------------------------------------------------
-- IPCA: fator que leva um valor do mês m a preços do último mês publicado.
CREATE OR REPLACE TABLE ipca AS
WITH s AS (
  SELECT strptime(data, '%d/%m/%Y')::DATE AS mes, valor::DOUBLE / 100 AS v
  FROM read_json('ipca.json', columns = {data: 'VARCHAR', valor: 'VARCHAR'})
), acc AS (
  SELECT mes, exp(sum(ln(1 + v)) OVER (ORDER BY mes)) AS idx FROM s
)
SELECT mes AS ipca_mes, max(idx) OVER () / idx AS fator FROM acc;
-- meses ainda sem IPCA publicado ficam com fator 1 (coluna ipca_mes tem nome único para não capturar o argumento)
CREATE OR REPLACE MACRO corrige(m) AS coalesce((SELECT max(fator) FROM ipca WHERE ipca_mes = date_trunc('month', m)), 1);
CREATE OR REPLACE TABLE ipca_ref AS SELECT max(ipca_mes) AS mes FROM ipca;

----------------------------------------------------------------------------------------------------
-- Parlamentares e períodos de exercício
CREATE OR REPLACE TABLE parlamentares AS
SELECT * FROM read_csv('parlamentares.csv', header = true, all_varchar = true);
CREATE OR REPLACE TABLE periodos AS
SELECT casa, id, inicio::DATE AS inicio, fim::DATE AS fim, estimado::INT AS estimado, uf, partido
FROM read_csv('periodos.csv', header = true, all_varchar = true);

CREATE OR REPLACE TABLE subsidios AS
SELECT vigencia::DATE AS vigencia, casa, valor::DOUBLE AS valor,
       coalesce(lead(vigencia::DATE) OVER (PARTITION BY casa ORDER BY vigencia), DATE '2100-01-01') AS ate
FROM (
  SELECT vigencia, c.casa, valor
  FROM read_csv('../../pipeline/total/subsidios.csv', header = true, all_varchar = true, delim = ',', quote = '"') s
  JOIN (VALUES ('camara'), ('senado')) c(casa) ON s.casa IN ('ambas', c.casa)
);

-- Dias em exercício por mês. Antes do Plano Real (fev/1995) não há valor confiável: o mês conta como tempo
-- de mandato, mas não entra na soma em reais.
CREATE OR REPLACE TABLE meses AS
WITH m AS (
  SELECT p.casa, p.id, p.estimado, unnest(generate_series(date_trunc('month', p.inicio), p.fim, INTERVAL 1 MONTH))::DATE AS mes,
         p.inicio, p.fim
  FROM periodos p
)
SELECT casa, id, mes, max(estimado) AS estimado,
       sum(datediff('day', greatest(inicio, mes), least(fim, last_day(mes))) + 1)
         / (datediff('day', mes, last_day(mes)) + 1) AS fracao
FROM m GROUP BY casa, id, mes;

-- Salário = subsídio proporcional aos dias em exercício + 13º (1/12 por mês).
CREATE OR REPLACE TABLE salarios AS
SELECT m.casa, m.id, m.mes, m.estimado, least(m.fracao, 1) AS fracao,
       s.valor * least(m.fracao, 1) * 13 / 12 AS nominal,
       s.valor * least(m.fracao, 1) * 13 / 12 * corrige(m.mes) AS corrigido
FROM meses m
LEFT JOIN subsidios s ON s.casa = m.casa AND m.mes >= s.vigencia AND m.mes < s.ate;

-- Ajuda de custo (estimada): até 2012, um subsídio no início e outro no fim de cada sessão legislativa;
-- a partir do DL 210/2013, um no início e outro no fim do mandato.
CREATE OR REPLACE TABLE ajuda AS
WITH datas AS (
  SELECT make_date(y, 2, 15) AS d FROM range(1995, 2013) t(y)
  UNION ALL SELECT make_date(y, 12, 15) FROM range(1995, 2013) t(y)
), antiga AS (
  SELECT p.casa, p.id, d.d AS mes FROM periodos p JOIN datas d ON d.d BETWEEN p.inicio AND p.fim
), nova AS (
  SELECT casa, id, inicio AS mes FROM periodos
  WHERE inicio IN (DATE '2015-02-01', DATE '2019-02-01', DATE '2023-02-01')
  UNION ALL
  SELECT casa, id, fim FROM periodos
  WHERE fim IN (DATE '2015-01-31', DATE '2019-01-31', DATE '2023-01-31')
)
SELECT a.casa, a.id, date_trunc('month', a.mes)::DATE AS mes, s.valor AS nominal, s.valor * corrige(a.mes) AS corrigido
FROM (SELECT * FROM antiga UNION ALL SELECT * FROM nova) a
JOIN subsidios s ON s.casa = a.casa AND a.mes >= s.vigencia AND a.mes < s.ate;

----------------------------------------------------------------------------------------------------
-- Cota parlamentar (CEAP na Câmara, CEAPS no Senado), valores reembolsados menos restituições.
CREATE OR REPLACE TABLE cota AS
SELECT 'camara' AS casa, ideCadastro AS id, make_date(numAno::INT, greatest(numMes::INT, 1), 1) AS mes,
       sum(coalesce(num(vlrLiquido), 0) - coalesce(num(vlrRestituicao), 0)) AS nominal
FROM read_csv('ceap/csv/Ano-*.csv', delim = ';', header = true, all_varchar = true, quote = '"', escape = '"', union_by_name = true)
WHERE ideCadastro <> '' AND numAno IS NOT NULL
GROUP BY ALL;

-- O Senado identifica o senador só pelo nome parlamentar.
CREATE OR REPLACE TABLE ceaps AS
SELECT norm(SENADOR) AS nome, make_date(ANO::INT, MES::INT, 1) AS mes, sum(num(VALOR_REEMBOLSADO)) AS nominal
FROM read_csv('ceaps/utf8/*.csv', delim = ';', header = true, all_varchar = true, quote = '"', union_by_name = true, escape = '"', strict_mode = false)
WHERE ANO IS NOT NULL
GROUP BY ALL;

-- Liga o nome do CEAPS ao código do senador. Um nome casa com um senador quando é igual ao nome parlamentar
-- ou ao nome civil, ou quando todas as suas palavras aparecem no nome civil/parlamentar ("GIM ARGELLO").
-- Primeiro entre os senadores em exercício naquele mês; se não houver, entre todos. Só vale se o candidato for único.
CREATE OR REPLACE TABLE senado_nomes AS
SELECT id, norm(nome) AS nome, norm(nome_civil) AS civil,
       list_distinct(string_split(norm(nome) || ' ' || norm(coalesce(nome_civil, '')), ' ')) AS palavras
FROM parlamentares WHERE casa = 'senado';

CREATE OR REPLACE TABLE ceaps_dono AS
WITH nomes AS (SELECT DISTINCT nome FROM ceaps),
cand AS (
  SELECT n.nome, s.id,
         CASE WHEN n.nome IN (s.nome, s.civil) THEN 1 ELSE 2 END AS forca
  FROM nomes n JOIN senado_nomes s
    ON n.nome IN (s.nome, s.civil)
    OR len(list_filter(string_split(n.nome, ' '), lambda w: length(w) > 2 AND NOT list_contains(s.palavras, w))) = 0
       AND len(list_filter(string_split(n.nome, ' '), lambda w: length(w) > 2)) >= 2
),
-- apelidos que não aparecem em nenhum dos dois nomes cadastrados
apelidos AS (SELECT * FROM (VALUES ('GIM ARGELLO', '4776', 0)) t(nome, id, forca)),
melhor AS (
  SELECT * FROM (SELECT * FROM cand UNION ALL SELECT * FROM apelidos)
  QUALIFY forca = min(forca) OVER (PARTITION BY nome)
)
SELECT nome, list(DISTINCT id) AS ids FROM melhor GROUP BY 1;

CREATE OR REPLACE TABLE exercicio_senado AS
SELECT DISTINCT id, mes FROM meses WHERE casa = 'senado';

CREATE OR REPLACE TABLE ceaps_ligado AS
WITH c AS (
  SELECT c.nome, c.mes, c.nominal, d.ids,
         list(e.id) FILTER (WHERE e.id IS NOT NULL) AS ativos
  FROM ceaps c
  JOIN ceaps_dono d USING (nome)
  LEFT JOIN exercicio_senado e ON e.mes = c.mes AND list_contains(d.ids, e.id)
  GROUP BY ALL
)
SELECT nome, mes, nominal, CASE WHEN len(ativos) = 1 THEN ativos[1] ELSE ids[1] END AS id
FROM c WHERE len(ativos) = 1 OR len(ids) = 1;

INSERT INTO cota SELECT 'senado', id, mes, nominal FROM ceaps_ligado;

CREATE OR REPLACE TABLE ceaps_sem_dono AS
SELECT nome, sum(nominal) AS nominal FROM ceaps c
WHERE (nome, mes) NOT IN (SELECT (nome, mes) FROM ceaps_ligado)
GROUP BY 1 ORDER BY 2 DESC;

ALTER TABLE cota ADD COLUMN corrigido DOUBLE;
UPDATE cota SET corrigido = nominal * corrige(mes);

----------------------------------------------------------------------------------------------------
-- Fundão: FEFC e Fundo Partidário repassados por partidos a candidatos (2018 em diante).
-- Repasses entre candidatos ficam de fora para não contar o mesmo real duas vezes.
CREATE OR REPLACE TABLE cand AS
SELECT ANO_ELEICAO::INT AS ano, SQ_CANDIDATO AS sq, any_value(NR_TITULO_ELEITORAL_CANDIDATO) AS titulo,
       any_value(NULLIF(NR_CPF_CANDIDATO, '-4')) AS cpf,
       any_value(NM_CANDIDATO) AS nome, any_value(NM_URNA_CANDIDATO) AS nome_urna,
       any_value(DS_CARGO) AS cargo, any_value(SG_UF) AS uf, any_value(NM_UE) AS ue, any_value(SG_PARTIDO) AS partido,
       any_value(DT_NASCIMENTO) AS nascimento,
       max(DS_SIT_TOT_TURNO IN ('ELEITO', 'ELEITO POR QP', 'ELEITO POR MÉDIA'))::BOOLEAN AS eleito
FROM read_csv('cand/cand_*.csv', delim = ';', header = true, all_varchar = true, quote = '"', union_by_name = true)
GROUP BY 1, 2;

CREATE OR REPLACE TABLE fundao_cand AS
SELECT r.ano, r.sq,
       sum(CASE WHEN r.fonte = 'fefc' THEN r.v ELSE 0 END) AS fefc,
       sum(CASE WHEN r.fonte = 'fp' THEN r.v ELSE 0 END) AS fp
FROM (
  SELECT AA_ELEICAO::INT AS ano, SQ_CANDIDATO AS sq,
         CASE WHEN upper(DS_FONTE_RECEITA) LIKE 'FUNDO ESPECIAL%' THEN 'fefc' ELSE 'fp' END AS fonte,
         num(VR_RECEITA) AS v
  FROM read_csv('receitas/receitas_*.csv', delim = ';', header = true, all_varchar = true, quote = '"', union_by_name = true)
  WHERE (upper(DS_FONTE_RECEITA) LIKE 'FUNDO ESPECIAL%' OR upper(DS_FONTE_RECEITA) LIKE 'FUNDO PARTID%')
    AND DS_ORIGEM_RECEITA = 'Recursos de partido político'
) r
GROUP BY ALL;

-- Uma linha por candidatura com fundão. Pessoa = título de eleitor (o CPF foi ocultado pelo TSE em 2024).
CREATE OR REPLACE TABLE candidaturas AS
SELECT f.ano, f.sq, c.titulo, c.cpf, coalesce(c.nome_urna, c.nome) AS nome_urna, c.nome, c.cargo, c.uf, c.ue, c.partido,
       c.nascimento, coalesce(c.eleito, false) AS eleito, f.fefc, f.fp,
       -- eleição em outubro: corrige a partir do mês do pleito
       (f.fefc + f.fp) * corrige(make_date(f.ano, 10, 1)) AS corrigido
FROM fundao_cand f LEFT JOIN cand c USING (ano, sq)
WHERE f.fefc + f.fp > 0;

----------------------------------------------------------------------------------------------------
-- Pessoa: junta deputado e senador que são a mesma pessoa (mesmo nome civil) e liga ao título de eleitor.
CREATE OR REPLACE TABLE pessoa_parl AS
WITH base AS (
  SELECT casa, id, nome, nome_civil, norm(coalesce(nome_civil, nome)) AS chave, cpf, nascimento, uf, partido, foto
  FROM parlamentares
  WHERE (casa, id) IN (SELECT casa, id FROM periodos)
)
SELECT *, min(casa || ':' || id) OVER (PARTITION BY chave) AS pessoa FROM base;

-- Título por CPF (deputados) ou, na falta dele, por nome civil + data de nascimento / nome civil único.
CREATE OR REPLACE TABLE titulo_cpf AS
SELECT cpf, any_value(titulo) AS titulo FROM cand WHERE cpf IS NOT NULL GROUP BY 1 HAVING count(DISTINCT titulo) = 1;
CREATE OR REPLACE TABLE titulo_nome AS
SELECT norm(nome) AS chave, any_value(titulo) AS titulo FROM cand
WHERE cargo IN ('DEPUTADO FEDERAL', 'SENADOR', '1º SUPLENTE', '2º SUPLENTE', 'GOVERNADOR', 'VICE-GOVERNADOR',
                'PRESIDENTE', 'VICE-PRESIDENTE', 'DEPUTADO ESTADUAL', 'DEPUTADO DISTRITAL', 'PREFEITO')
GROUP BY 1 HAVING count(DISTINCT titulo) = 1;

CREATE OR REPLACE TABLE pessoa_titulo AS
SELECT pessoa, coalesce(any_value(tc.titulo), any_value(tn.titulo)) AS titulo
FROM pessoa_parl p
LEFT JOIN titulo_cpf tc ON tc.cpf = p.cpf
LEFT JOIN titulo_nome tn ON tn.chave = p.chave
GROUP BY 1;

-- Valores anuais por pessoa e rubrica (corrigido e nominal).
CREATE OR REPLACE TABLE anual AS
WITH chave AS (SELECT casa, id, pessoa FROM pessoa_parl)
SELECT k.pessoa, year(s.mes) AS ano, 'salario' AS rubrica, sum(s.nominal) AS nominal, sum(s.corrigido) AS corrigido
FROM salarios s JOIN chave k USING (casa, id) WHERE s.nominal IS NOT NULL GROUP BY ALL
UNION ALL
SELECT k.pessoa, year(a.mes), 'ajuda', sum(a.nominal), sum(a.corrigido) FROM ajuda a JOIN chave k USING (casa, id) GROUP BY ALL
UNION ALL
SELECT k.pessoa, year(c.mes), 'cota', sum(c.nominal), sum(c.corrigido) FROM cota c JOIN chave k USING (casa, id) GROUP BY ALL
UNION ALL
SELECT pt.pessoa, c.ano, 'fundao', sum(c.fefc + c.fp), sum(c.corrigido)
FROM candidaturas c JOIN pessoa_titulo pt ON pt.titulo = c.titulo GROUP BY ALL;
