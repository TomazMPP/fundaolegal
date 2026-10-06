# Fundão Legal

Painel público de quanto escritórios de advocacia e contabilidade faturam com campanhas eleitorais
— e quanto disso é dinheiro público (FEFC + Fundo Partidário). Dados abertos do TSE, eleições 2018–2026.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

O Google Analytics (GA4, `G-2PDJEL372S`) carrega só em produção. Para usar outro ID, defina `NEXT_PUBLIC_GA_ID`
nas variáveis de ambiente da Vercel.

Os dados já processados ficam em `src/data/*.json` (lidos no servidor, não vão para o navegador).

## Atualizar os dados

```bash
# requer curl, unzip, iconv, awk e o binário do DuckDB em tools/duckdb
# (https://github.com/duckdb/duckdb/releases → duckdb_cli-linux-amd64.zip)
./pipeline/build.sh             # baixa ~3,4 GB do TSE e regenera src/data
ANOS="2024" ./pipeline/build.sh # só um ano
```

- `pipeline/01_contratadas.sql` — seleciona despesas jurídicas/contábeis (categoria TSE ou CNAE 6911/6920)
- `pipeline/02_modelo.sql` — cruza com despesas pagas (fonte do recurso) e agrega
- `pipeline/03_export.sql` — exporta os JSONs do app

Critérios e limitações: página `/metodologia`.

## Páginas

| Rota | O que mostra |
|---|---|
| `/` | Panorama: total, fonte do dinheiro, concentração, série por eleição, top escritórios, UF/partido/cargo |
| `/escritorios` | Ranking filtrável e ordenável de todos os CNPJs, com exportação CSV |
| `/escritorios/[raiz-cnpj]` | Perfil: candidaturas atendidas, partidos, localidades, valores por eleição |
| `/partidos` | Gasto por partido, % público, nº de escritórios, maior fornecedor |
| `/api/escritorios` | CSV do ranking (mesmos filtros da URL) |

Todos os filtros ficam na URL — qualquer recorte pode ser compartilhado por link.
