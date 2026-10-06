import type { NextRequest } from "next/server";
import { csv } from "@/lib/csv";
import { escritorio } from "@/lib/data";
import { fmtCNPJ } from "@/lib/format";

export async function GET(req: NextRequest, { params }: { params: Promise<{ firma: string }> }) {
  const { firma } = await params;
  const e = escritorio(firma);
  if (!e) return new Response("Não encontrado", { status: 404 });
  const ano = Number(req.nextUrl.searchParams.get("ano")) || undefined;
  const vs = ano ? e.vinculos.filter((v) => v.ano === ano) : e.vinculos;
  const corpo = csv(
    ["cnpj_escritorio", "escritorio", "eleicao", "candidato", "partido", "cargo", "uf", "localidade", "servico",
     "valor_contratado", "fefc", "fundo_partidario", "outros_recursos"],
    vs.map((v) => [fmtCNPJ(e.resumo.cnpj), e.resumo.nome, v.ano, v.candidato, v.partido, v.cargo, v.uf, v.ue,
      v.tipo, v.valor, v.fefc, v.fp, v.outros]),
  );
  return new Response(corpo, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${firma}${ano ? `-${ano}` : ""}.csv"`,
    },
  });
}
