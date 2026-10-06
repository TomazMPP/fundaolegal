import type { NextRequest } from "next/server";
import { fmtCNPJ } from "@/lib/format";
import { ranking } from "@/lib/ranking";
import { csv } from "@/lib/csv";

export function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const { lista, f } = ranking(sp);
  const corpo = csv(
    ["cnpj", "nome", "servico", "municipio_sede", "uf_sede", "eleicoes", "candidaturas", "partidos", "municipios", "ufs",
     "valor_contratado", "fefc", "fundo_partidario", "outros_recursos", "media_por_candidatura"],
    lista.map((e) => [
      fmtCNPJ(e.cnpj), e.nome, e.tipo, e.municipio_sede, e.uf_sede, e.anos.join(" "), e.candidaturas, e.partidos,
      e.ues, e.ufs, e.valor, e.fefc, e.fp, e.outros, e.ticket,
    ]),
  );
  return new Response(corpo, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="escritorios-${f.ano ?? "2018-2024"}.csv"`,
    },
  });
}
