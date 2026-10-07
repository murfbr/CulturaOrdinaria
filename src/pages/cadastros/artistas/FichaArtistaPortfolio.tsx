/* Sub-aba Portfólio cultural da ficha do artista: histórico e realizações
   por ano, num bloco editável (uma linha "ano | texto" por item). */
import { BlocoEditavel } from "../../../components/BlocoEditavel";
import { LinhaMarcada, VAZIO_ACERVO, linhasDe, partes, type PropsAcervo } from "./FichaArtistaBase";

export function FichaArtistaPortfolio({ d, alterarDet }: PropsAcervo) {
  const itens = d.portfolio || [];
  return (
    <BlocoEditavel titulo="Histórico & realizações" dica='por linha: ano | texto (ex.: "2025 | 40 rodas na Pedra do Leme")'
      valor={itens.map((x) => x.ano + " | " + x.texto).join("\n")}
      aoSalvar={(t) => alterarDet((det) => {
        det.portfolio = linhasDe(t).map((l) => {
          const p = partes(l);
          return { ano: p[0] || "", texto: p.slice(1).join(" | ") };
        });
      })}>
      {itens.length ? itens.map((item, i) => <LinhaMarcada key={i} marca={item.ano}>{item.texto}</LinhaMarcada>) : VAZIO_ACERVO}
    </BlocoEditavel>
  );
}
