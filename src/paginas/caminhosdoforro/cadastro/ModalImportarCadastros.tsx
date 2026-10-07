/* Importar cadastros (pessoas e organizações) de uma planilha ou de texto
   colado: guia das colunas, prévia do que entra e do que muda, e só então
   grava. Reconhece pelo id ou pelo nome; célula vazia não apaga nada. */
import { useMemo, useState } from "react";
import { toast } from "../../../components/Toast";
import { gravar } from "../dados";
import { EntradaTabela } from "../importar/EntradaTabela";
import { GuiaColunas } from "../importar/GuiaColunas";
import { DETALHE_ITEM, Detalhe, ERRO, ITEM, Numero, plural } from "../importar/Previa";
import { guiaDasColunas, lerTabela, modeloTabela, type TabelaLida } from "../importar/tabela";
import { rotulo } from "../listas";
import type { Base } from "../tipos";
import { Grupo } from "../ui/Campo";
import { NOTA } from "../ui/classes";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";
import { colunasCadastro, prepararCadastros } from "./importacaoCadastro";

export function ModalImportarCadastros({ base, aoFechar }: { base: Base; aoFechar: () => void }) {
  const colunas = useMemo(() => colunasCadastro(base), [base]);
  const cabecalhoDe = useMemo(() => Object.fromEntries(colunas.map((c) => [c.campo, c.cabecalho])), [colunas]);
  const [lida, setLida] = useState<TabelaLida | null>(null);
  const [origem, setOrigem] = useState("");
  const [erro, setErro] = useState("");
  const pr = useMemo(() => (lida ? prepararCadastros(base, lida) : null), [base, lida]);
  const mexe = pr ? pr.novos.length + pr.atualizadas.length : 0;
  const avisos = lida && pr ? [...lida.avisos, ...pr.avisos] : [];

  function importar() {
    if (!pr) return;
    [...pr.novos, ...pr.atualizadas.map((m) => m.registro)].forEach((d) => gravar("cadastro", d));
    aoFechar();
    const partes = [
      pr.novos.length ? plural(pr.novos.length, "novo", "novos") : "",
      pr.atualizadas.length ? plural(pr.atualizadas.length, "atualizado", "atualizados") : "",
    ].filter(Boolean);
    toast("Cadastros importados: " + partes.join(", ") + ".");
  }

  return (
    <Modal
      titulo="Importar cadastros" aoFechar={aoFechar} aoSalvar={importar} bloqueado={!mexe}
      rotuloSalvar={mexe ? "Importar " + plural(mexe, "cadastro", "cadastros") : "Importar"}
    >
      <GuiaColunas
        colunas={guiaDasColunas(colunas)} modelo={modeloTabela(colunas)} arquivo="modelo-cadastros.csv"
        nota="Só Nome é obrigatória. Nome igual ao de um cadastro que já existe atualiza esse cadastro, só nas colunas preenchidas; os outros entram como novos. Nada é gravado antes do botão."
      />
      <EntradaTabela
        aoLer={(abas, nome) => { setErro(""); setOrigem(nome); setLida(lerTabela(colunas, abas)); }}
        aoFalhar={(m) => { setLida(null); setErro(m); }}
      />
      {erro && <p role="alert" className={LINHA_INTEIRA + " " + ERRO}>{erro}</p>}

      {lida && pr && (
        <>
          <p className={LINHA_INTEIRA + " cdf:m-0"}>
            <strong>{origem}</strong>{lida.aba !== origem && <>, aba {lida.aba}</>}: {plural(lida.linhas.length, "linha", "linhas")}. Nada foi gravado ainda.
          </p>
          <div className={LINHA_INTEIRA + " cdf:grid cdf:grid-cols-3 cdf:gap-2"}>
            <Numero valor={pr.novos.length} rotulo="novos" />
            <Numero valor={pr.atualizadas.length} rotulo="atualizados" />
            <Numero valor={pr.iguais} rotulo="sem mudança" />
          </div>
          {pr.novos.length > 0 && (
            <div className={LINHA_INTEIRA}>
              <Detalhe resumo={"Ver os " + plural(pr.novos.length, "novo", "novos")}>
                {pr.novos.map((d) => (
                  <li key={d.id} className={ITEM}>
                    {d.nome}
                    <span className={DETALHE_ITEM}>{d.tipos.map((t) => rotulo(base.pagina, "tiposCadastro", t)).join(", ") || "sem tipo"} · {rotulo(base.pagina, "statusContato", d.status)}</span>
                  </li>
                ))}
              </Detalhe>
            </div>
          )}
          {pr.atualizadas.length > 0 && (
            <div className={LINHA_INTEIRA}>
              <Detalhe resumo={"Ver o que muda em " + plural(pr.atualizadas.length, "cadastro", "cadastros")}>
                {pr.atualizadas.map((m) => (
                  <li key={m.registro.id} className={ITEM}>
                    {m.registro.nome}
                    <span className={DETALHE_ITEM}>muda: {m.campos.map((c) => cabecalhoDe[c] || c).join(", ")}</span>
                  </li>
                ))}
              </Detalhe>
            </div>
          )}
          {avisos.length > 0 && (
            <Grupo rotulo="Avisos" className={LINHA_INTEIRA}>
              <ul className="cdf:m-0 cdf:list-disc cdf:pl-[18px] cdf:text-sm cdf:text-tinta-2">{avisos.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </Grupo>
          )}
          {!mexe && <p className={NOTA + " " + LINHA_INTEIRA}>Tudo já está igual à planilha: não há nada para importar.</p>}
        </>
      )}
    </Modal>
  );
}
