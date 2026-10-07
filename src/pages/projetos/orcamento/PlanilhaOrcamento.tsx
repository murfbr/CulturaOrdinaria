/* Planilha orçamentária do Salic — a peça especial do Simulador.
   No Salic cada item é cadastrado num modal (produto → local → etapa); aqui a
   planilha inteira fica à vista e soma sozinha. O campo Item sugere o catálogo
   real (filtrado por produto × etapa) e preenche o código; a coluna Bloco é do
   coletivo, não existe na plataforma. Cada linha é um LinhaPlanilha. */
import { useState } from "react";
import { SALIC_DADOS } from "../../../data";
import {
  catalogoDe, codigoDoItem, custosVinculados, linhaVazia,
  orcamentoDe, totalItens, textoOrcamento, csvOrcamento,
} from "../../../lib/simulador/orcamento";
import { BarraTotais } from "./BarraTotais";
import { ESTILO_TOTAL, LinhaPlanilha } from "./LinhaPlanilha";
import { copiarComAviso } from "../../../components/Toast";
import { Botao } from "../../../components/ui/Botao";
import { Campo, Entrada, Marcacao } from "../../../components/ui/Campo";
import { Dica } from "../../../components/ui/Dica";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { BRL, baixarArquivo, slug, uid } from "../../../utils";
import type { LinhaOrcamento, Rascunho } from "../../../types";
import type { Alterar } from "../formulario/tipos";

const SD = SALIC_DADOS;

/** Os custos vinculados que podem entrar em valor absoluto. */
const ABSOLUTOS = [["acess", "Acessibilidade"], ["adm", "Administração"], ["capt", "Captação (limite R$ 150.000,00)"]] as const;

export function PlanilhaOrcamento({ r, alterar }: { r: Rascunho; alterar: Alterar }) {
  const [colunasSalic, setColunasSalic] = useState(false);
  const o = orcamentoDe(r);
  const v = custosVinculados(r);
  const catalogosComNome = Object.keys(SD.catalogos);
  // As colunas do Salic ficam escondidas até o botão ligar.
  const sc = colunasSalic ? undefined : "hidden";

  /** Muda um campo de uma linha; item conhecido preenche o código sozinho. */
  const mudarLinha = (id: string, campo: keyof LinhaOrcamento, valor: string) =>
    alterar((copia) => {
      const linha = orcamentoDe(copia).linhas.find((l) => l.id === id);
      if (!linha) return;
      (linha[campo] as string) = valor;
      if (campo === "item") {
        const codigo = codigoDoItem(valor);
        if (codigo) linha.cod = codigo;
      }
    });

  const duplicarLinha = (id: string) => alterar((copia) => {
    const linhas = orcamentoDe(copia).linhas;
    const i = linhas.findIndex((x) => x.id === id);
    if (i < 0) return;
    const nova = { ...linhas[i], id: uid("l") };
    linhas.splice(i + 1, 0, nova);
  }, true);

  const removerLinha = (id: string) => alterar((copia) => {
    const orc = orcamentoDe(copia);
    const i = orc.linhas.findIndex((x) => x.id === id);
    if (i >= 0) orc.linhas.splice(i, 1);
    if (!orc.linhas.length) orc.linhas.push(linhaVazia());
  }, true);

  // Um datalist por combinação produto × etapa em uso (catálogo do Salic + curadoria).
  const combinacoes = new Map<string, string>();
  o.linhas.forEach((l) => {
    const chave = (l.produto || "") + "|" + l.etapa;
    if (!combinacoes.has(chave)) combinacoes.set(chave, "cat-" + combinacoes.size);
  });

  return (
    <>
      <BarraTotais r={r} />
      <Dica className="mb-2 max-w-[75ch]">
        No Salic cada item é cadastrado num modal, dentro de um produto, dentro de um local, dentro de
        uma etapa, e o total só aparece depois de salvar. Aqui a planilha inteira fica à vista e soma
        sozinha. A coluna <b>Bloco</b> é sua, não existe na plataforma. O campo <b>Item</b> sugere o
        catálogo real do Salic ({catalogosComNome.join(", ")}) filtrado por produto e etapa, e preenche
        o código sozinho; outros produtos caem no catálogo de {SD.catalogoPadrao}.
      </Dica>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        <Marcacao marcado={colunasSalic} aoMudar={setColunasSalic}>
          Mostrar colunas do Salic (produto, local, código, fonte, detalhamento)
        </Marcacao>
      </div>

      <Tabela className="mt-2.5" minima={colunasSalic ? "min-w-[1240px]" : "min-w-[720px]"}>
        <thead>
          <tr>
            <Th className="w-[170px]">Bloco</Th><Th className={sc}>Produto</Th><Th className={sc}>Local</Th>
            <Th>Etapa</Th><Th className="min-w-[230px]">Item</Th><Th className={sc}>Cód.</Th><Th>Unid.</Th>
            <Th>Qtd</Th><Th>Ocor.</Th><Th>Vlr unit.</Th><Th>Total</Th>
            <Th className={sc}>Fonte</Th><Th className={sc}>Detalhamento</Th><Th></Th>
          </tr>
        </thead>
        <tbody>
          {o.linhas.map((l) => (
            <LinhaPlanilha key={l.id} l={l} colunasSalic={colunasSalic}
              idLista={combinacoes.get((l.produto || "") + "|" + l.etapa)}
              mudar={(campo, valor) => mudarLinha(l.id, campo, valor)}
              duplicar={() => duplicarLinha(l.id)} remover={() => removerLinha(l.id)} />
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-bg-sunk font-semibold">
            <Td colSpan={9}>{o.linhas.length} {o.linhas.length === 1 ? "linha" : "linhas"}</Td>
            <Td className={ESTILO_TOTAL}>{BRL(totalItens(o))}</Td>
            <Td colSpan={4}></Td>
          </tr>
        </tfoot>
      </Tabela>

      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        <Botao tamanho="pequeno"
          onClick={() => alterar((copia) => {
            const linhas = orcamentoDe(copia).linhas;
            linhas.push(linhaVazia(linhas[linhas.length - 1]));
          }, true)}>+ Nova linha</Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => baixarArquivo(`orcamento-${slug(r.nome)}.csv`, csvOrcamento(r), "text/csv")}>Exportar CSV</Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => void copiarComAviso(textoOrcamento(r), "Planilha copiada em texto")}>Copiar planilha em texto</Botao>
      </div>

      {[...combinacoes.entries()].map(([chave, id]) => {
        const [produto, etapa] = chave.split("|");
        return (
          <datalist id={id} key={id}>
            {(SD.curadoria || []).map((c) => <option value={c[0]} key={"cur" + c[1] + c[0]} />)}
            {catalogoDe(produto, etapa).map((c) => <option value={c[0]} key={c[1] + c[0]} />)}
          </datalist>
        );
      })}
      <datalist id="lista-blocos">
        {(SD.blocos || []).map((b) => <option value={b} key={b} />)}
      </datalist>

      <details className="mt-3.5 text-sm text-muted" open={o.usarAbs}>
        <summary className="cursor-pointer text-sm font-medium text-muted">Custos vinculados em valores absolutos (em vez dos percentuais da tela "Custos vinculados")</summary>
        <Marcacao className="mt-2" marcado={o.usarAbs}
          aoMudar={(marcado) => alterar((copia) => { orcamentoDe(copia).usarAbs = marcado; }, true)}>
          Usar valores absolutos (útil ao importar um orçamento antigo; o Salic só aceita percentual)
        </Marcacao>
        {o.usarAbs && (
          <div className="mt-2 grid gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {ABSOLUTOS.map(([k, rotulo]) => (
              <Campo rotulo={rotulo} key={k}>
                <Entrada type="text" inputMode="decimal" value={o.abs[k]} placeholder="0,00"
                  onChange={(e) => alterar((copia) => { orcamentoDe(copia).abs[k] = e.target.value; })} />
              </Campo>
            ))}
          </div>
        )}
        {v.estourou && (
          <p className="mb-0 mt-2 rounded-md bg-warn-soft px-2.5 py-2 text-sm text-warn">
            <b>Acima do limite:</b> a remuneração de captação daria {BRL(v.captBruto)}, mas o Salic trava
            em R$ 150.000,00. Os totais já consideram o limite.
          </p>
        )}
      </details>
    </>
  );
}
