-- Exporta o modelo para JSON consumido (no servidor) pelo app Next.js.
COPY (SELECT * FROM totais) TO '../src/data/totais.json' (FORMAT json, ARRAY true);
COPY (SELECT * FROM firmas ORDER BY firma) TO '../src/data/firmas.json' (FORMAT json, ARRAY true);
COPY (
  SELECT ano, firma, candidato, partido, cargo, uf, ue, tipo, valor, fefc, fp, outros
  FROM vinculos ORDER BY ano, firma, valor DESC
) TO '../src/data/vinculos.json' (FORMAT json, ARRAY true);
