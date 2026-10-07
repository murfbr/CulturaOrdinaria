/* Importar formulário: cola a definição JSON (extraída da plataforma, ou
   escrita com o Claude), o validador confere a estrutura e a definição vai
   para o banco — formulário novo entra para todo mundo, sem deploy.
   "Ver modelo" mostra os tipos de campo e uma definição de exemplo. */
import { useMemo, useState } from "react";
import { AcoesModal, Modal, RodapeModal } from "../../../components/Modal";
import { toast } from "../../../components/Toast";
import { BlocoModelo } from "../../../components/ferramentas/GuiaImportacao";
import { Botao } from "../../../components/ui/Botao";
import { AreaTexto } from "../../../components/ui/Campo";
import { Dica } from "../../../components/ui/Dica";
import { ESTILO_MONO } from "../../../components/ui/estilos";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { modeloFormulario, TIPOS_CAMPO_FORMULARIO } from "../../../store/modelosImportacao";
import { salvarFormulario } from "../../../store/mutacoes";
import { formularioDe, nomePlataforma } from "../../../data";
import { validarFormulario, type ValidacaoFormulario } from "../../../lib/simulador/validarFormulario";

export function ModalImportarFormulario({ aoFechar }: { aoFechar: () => void }) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<ValidacaoFormulario | null>(null);
  const [modelo, setModelo] = useState(false);
  const exemplo = useMemo(modeloFormulario, []);

  const pronto = Boolean(resultado?.formulario && !resultado.erros.length);
  const existente = resultado?.formulario ? formularioDe(resultado.formulario.id) : undefined;

  function importar() {
    if (!resultado?.formulario) return;
    salvarFormulario(resultado.formulario);
    toast(`Formulário "${resultado.formulario.nome}" importado`);
    aoFechar();
  }

  return (
    <Modal titulo="Importar formulário" aoFechar={aoFechar} largo>
      <Dica emModal className="mb-3">
        Cole a definição JSON de um formulário (etapas → blocos → campos). O site confere a
        estrutura antes de gravar; importado, ele aparece para todo mundo na hora, sem precisar
        de nova versão do site. Para reimportar um formulário existente, use o mesmo <span className={ESTILO_MONO}>id</span>.
        Diga a origem em <span className={ESTILO_MONO}>"origem"</span>: "chrome" (extraído da plataforma) ou "documento".
      </Dica>
      <Botao variante="fantasma" tamanho="pequeno" className="mb-3" onClick={() => setModelo(!modelo)}>
        {modelo ? "Fechar o modelo" : "Ver modelo e tipos de campo"}
      </Botao>
      {modelo && (
        <div className="mb-3 rounded-md border border-line bg-bg px-3.5 py-2.5">
          <Tabela simples className="max-h-[200px] overflow-y-auto">
            <thead>
              <tr><Th>t</Th><Th quebra>Tipo de campo</Th></tr>
            </thead>
            <tbody>
              {Object.entries(TIPOS_CAMPO_FORMULARIO).map(([t, d]) => (
                <tr key={t}><Td><span className={ESTILO_MONO}>{t}</span></Td><Td className="text-muted">{d}</Td></tr>
              ))}
            </tbody>
          </Tabela>
          <BlocoModelo titulo="Modelo de formulário" texto={exemplo} arquivo="modelo-formulario.json"
            acoes={(
              <Botao variante="fantasma" tamanho="pequeno" onClick={() => { setTexto(exemplo); setResultado(null); }}>
                Usar no campo
              </Botao>
            )} />
        </div>
      )}
      <AreaTexto
        rows={10} value={texto}
        placeholder='{ "id": "dc-140", "nome": "…", "plataforma": "dc", "etapas": [ { "id": "e1", "nome": "…", "blocos": [ { "t": "…", "campos": [ … ] } ] } ] }'
        onChange={(e) => { setTexto(e.target.value); setResultado(null); }}
      />

      {resultado && (
        <div className="mt-2.5 flex flex-col gap-2">
          {pronto && resultado.resumo && (
            <Dica emModal>
              ✓ <b>{resultado.resumo.nome}</b> · {nomePlataforma(resultado.resumo.plataforma)} ·{" "}
              {resultado.resumo.etapas} etapa(s) · {resultado.resumo.campos} campo(s) ·{" "}
              id <span className={ESTILO_MONO}>{resultado.resumo.id}</span>
            </Dica>
          )}
          {pronto && existente && (
            <Dica emModal>
              <b>Atenção:</b> já existe um formulário com esse id ("{existente.nome}") — importar vai
              sobrescrevê-lo, e os projetos que o usam passam a usar a nova definição.
            </Dica>
          )}
          {resultado.erros.length > 0 && (
            <ul className="mx-0 my-0 list-disc pl-[18px] text-sm">
              {resultado.erros.map((e, i) => <li key={i} className="my-0.5 font-semibold text-no">{e}</li>)}
            </ul>
          )}
          {resultado.avisos.length > 0 && (
            <ul className="mx-0 my-0 list-disc pl-[18px] text-sm text-muted">
              {resultado.avisos.map((a, i) => <li key={i} className="my-0.5">⚠ {a}</li>)}
            </ul>
          )}
        </div>
      )}

      <RodapeModal>
        <AcoesModal>
          <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
          {pronto
            ? <Botao onClick={importar}>{existente ? "Sobrescrever formulário" : "Importar formulário"}</Botao>
            : <Botao disabled={!texto.trim()} onClick={() => setResultado(validarFormulario(texto))}>Conferir</Botao>}
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
