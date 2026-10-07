/* Modal de exportação: o pacote .json completo (backup que restaura tudo) e
   cada coleção do Painel como planilha .csv (Excel/Google, relações pelo nome)
   ou .json (registro completo, reimportável). */
import { AcoesModal, Modal, RodapeModal } from "../Modal";
import { toast } from "../Toast";
import { Botao } from "../ui/Botao";
import { Dica } from "../ui/Dica";
import { Tabela, Td } from "../ui/Tabela";
import { usarCentral } from "../../store/central";
import { exportarTudo } from "../../store/importarExportar";
import { exportarColecaoCsv, exportarColecaoJson } from "../../store/planilha";
import { COLECOES_PAINEL, ROTULO_COLECAO } from "../../types";

export function ModalExportar({ aoFechar }: { aoFechar: () => void }) {
  const { painel, rascunhos, fichas, regras, julgamentos } = usarCentral();
  const docsContexto = Object.keys(fichas).length + Object.keys(regras).length + Object.keys(julgamentos).length;

  return (
    <Modal titulo="Exportar dados" aoFechar={aoFechar} largo>
      <div className="flex items-center justify-between gap-3.5 rounded-md border border-line bg-bg px-3.5 py-3">
        <div>
          <b>Backup completo (.json)</b>
          <Dica emModal className="mt-0.5">
            Painel inteiro + {Object.keys(rascunhos).length} resposta(s) de formulário dos projetos + os formulários
            + {docsContexto} doc(s) do Contexto. É o arquivo que restaura tudo pelo Importar.
          </Dica>
        </div>
        <Botao className="flex-none" onClick={() => { exportarTudo(); toast("Backup completo gerado"); }}>
          ⤓ Baixar pacote
        </Botao>
      </div>

      <Dica emModal className="mb-2 mt-3.5">
        Por coleção: <b>CSV</b> abre no Excel/Google Planilhas (bom pra revisar e compartilhar);{" "}
        <b>JSON</b> guarda o registro completo e volta pelo Importar sem perder nada.
      </Dica>
      <Tabela>
        <tbody>
          {COLECOES_PAINEL.map((c) => (
            <tr key={c}>
              <Td><b>{ROTULO_COLECAO[c]}</b></Td>
              <Td className="whitespace-nowrap text-muted">{painel[c].length} registro(s)</Td>
              <Td className="whitespace-nowrap text-right">
                <Botao variante="fantasma" tamanho="pequeno" disabled={!painel[c].length}
                  onClick={() => { exportarColecaoCsv(c); toast("Planilha de " + ROTULO_COLECAO[c] + " gerada"); }}>
                  ⤓ CSV
                </Botao>{" "}
                <Botao variante="fantasma" tamanho="pequeno" disabled={!painel[c].length}
                  onClick={() => { exportarColecaoJson(c); toast(ROTULO_COLECAO[c] + " exportado em .json"); }}>
                  ⤓ JSON
                </Botao>
              </Td>
            </tr>
          ))}
        </tbody>
      </Tabela>

      <RodapeModal>
        <AcoesModal><Botao variante="fantasma" onClick={aoFechar}>Fechar</Botao></AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
