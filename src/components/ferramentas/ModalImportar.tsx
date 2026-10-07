/* Modal de importação em dois tempos: analisa o arquivo (ou texto colado) e
   mostra a prévia ANTES de gravar qualquer coisa.
   - Pacote .json da Central: contagem do que vem dentro + escolha entre
     mesclar (não apaga nada) e substituir.
   - Planilha .csv (daqui, do Excel ou do Google): escolha da coleção, mapeamento
     coluna → campo com exemplo, e mesclar ou só adicionar. */
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { AcoesModal, Modal, RodapeModal } from "../Modal";
import { toast } from "../Toast";
import { Botao } from "../ui/Botao";
import { AreaTexto, Campo, ESTILO_CONTROLE } from "../ui/Campo";
import { Dica } from "../ui/Dica";
import { Tabela, Td, Th } from "../ui/Tabela";
import { cx } from "../../utils/classes";
import { analisarPacote, type ModoPainel, type ResumoPacote } from "../../store/importarExportar";
import {
  COLUNAS_CSV, detectarColecao, importarCsv, mapeamentoInicial,
  type AlvoColuna, type ResultadoCsv,
} from "../../store/planilha";
import { decodificarTexto, lerCsv } from "../../lib/csv";
import { COLECOES_PAINEL, ROTULO_COLECAO, type ColecaoPainel } from "../../types";

interface EstadoCsv {
  colecao: ColecaoPainel;
  cabecalho: string[];
  linhas: string[][];
  mapeamento: AlvoColuna[];
}

/** Uma opção de rádio com explicação ao lado. */
function Opcao({ marcada, aoEscolher, children }: { marcada: boolean; aoEscolher: () => void; children: ReactNode }) {
  return (
    <label className="my-1.5 flex cursor-pointer items-start gap-2 text-sm font-normal text-muted [&_b]:text-ink">
      <input type="radio" className="mt-0.5 w-auto flex-none accent-ink" checked={marcada} onChange={aoEscolher} />
      <span>{children}</span>
    </label>
  );
}

/** Lista de contagens ou avisos da importação. */
function Lista({ children }: { children: ReactNode }) {
  return <ul className="mb-3 mt-1.5 list-disc pl-[18px] text-sm text-muted [&_b]:text-ink [&_li]:my-0.5">{children}</ul>;
}

function Erro({ texto }: { texto: string }) {
  return texto ? <p className="text-sm font-semibold text-no">{texto}</p> : null;
}

export function ModalImportar({ aoFechar }: { aoFechar: () => void }) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [colado, setColado] = useState("");
  const [erro, setErro] = useState("");
  const [resumo, setResumo] = useState<ResumoPacote | null>(null);
  const [modo, setModo] = useState<ModoPainel>("mesclar");
  const [csv, setCsv] = useState<EstadoCsv | null>(null);
  const [modoCsv, setModoCsv] = useState<"mesclar" | "adicionar">("mesclar");
  const [resultado, setResultado] = useState<ResultadoCsv | null>(null);

  function analisar(texto: string) {
    setErro("");
    const t = texto.trim();
    if (!t) { setErro("O arquivo está vazio."); return; }
    if (t[0] === "{" || t[0] === "[") {
      try { setResumo(analisarPacote(JSON.parse(t))); }
      catch (e) { setErro((e as Error).message); }
      return;
    }
    const linhas = lerCsv(t);
    if (linhas.length < 2) { setErro("A planilha precisa de uma linha de cabeçalho e ao menos uma de dados."); return; }
    const cabecalho = linhas[0];
    const colecao = detectarColecao(cabecalho);
    setCsv({ colecao, cabecalho, linhas: linhas.slice(1), mapeamento: mapeamentoInicial(colecao, cabecalho) });
  }

  function aoEscolherArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    arquivo.arrayBuffer().then((buf) => analisar(decodificarTexto(buf)));
  }

  function aplicarJson() {
    if (!resumo) return;
    try { toast(resumo.aplicar(modo)); aoFechar(); }
    catch (e) { setErro((e as Error).message); }
  }

  function aplicarCsv() {
    if (!csv) return;
    const r = importarCsv(csv.colecao, csv.mapeamento, csv.linhas, modoCsv);
    if (r.avisos.length) { setResultado(r); return; }
    toast(`${ROTULO_COLECAO[csv.colecao]}: ${r.criados} criado(s), ${r.atualizados} atualizado(s)`);
    aoFechar();
  }

  function trocarAlvo(indice: number, valor: string) {
    if (!csv) return;
    const novo: AlvoColuna = valor === "" ? null
      : valor === "id" ? "id"
        : COLUNAS_CSV[csv.colecao].find((c) => c.campo === valor) || null;
    setCsv({ ...csv, mapeamento: csv.mapeamento.map((a, i) => (i === indice ? novo : a)) });
  }

  const valorAlvo = (a: AlvoColuna) => (a === "id" ? "id" : a ? a.campo : "");

  return (
    <Modal titulo="Importar dados" aoFechar={aoFechar} largo>
      {!resumo && !csv && !resultado && (
        <>
          <Dica emModal className="mb-3">
            Aceita o pacote <b>.json</b> da Central (backup completo ou de uma coleção) e planilhas{" "}
            <b>.csv</b> — as exportadas daqui ou as suas do Excel/Google Planilhas.
            Nada é gravado antes da prévia.
          </Dica>
          <Botao onClick={() => arquivoRef.current?.click()}>Escolher arquivo…</Botao>
          <input ref={arquivoRef} type="file" className="hidden"
            accept=".json,.csv,.txt,application/json,text/csv" onChange={aoEscolherArquivo} />
          <Campo rotulo="ou cole o conteúdo aqui (JSON ou tabela)" className="mt-3">
            <AreaTexto value={colado} onChange={(e) => setColado(e.target.value)}
              placeholder={'{"central":"coletivo", ...}   ou   Nome;Tipo;Contato'} />
          </Campo>
          <Erro texto={erro} />
          <RodapeModal>
            <AcoesModal>
              <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
              <Botao disabled={!colado.trim()} onClick={() => analisar(colado)}>Analisar</Botao>
            </AcoesModal>
          </RodapeModal>
        </>
      )}

      {resumo && (
        <>
          <Dica emModal className="mb-3">Formato reconhecido: <b>{resumo.formato}</b></Dica>
          <Lista>
            {resumo.painel && Object.entries(resumo.painel).map(([c, n]) => (
              <li key={c}><b>{n}</b> · {ROTULO_COLECAO[c as ColecaoPainel]}</li>
            ))}
            {resumo.candidaturasV2 != null && <li><b>{resumo.candidaturasV2}</b> · candidatura(s) do formato antigo (cada uma vira um projeto)</li>}
            {resumo.rascunhos != null && <li><b>{resumo.rascunhos}</b> · resposta(s) de formulário</li>}
            {resumo.formularios != null && <li><b>{resumo.formularios}</b> · formulário(s)</li>}
            {resumo.contexto && (
              <li>
                <b>{resumo.contexto.fichas + resumo.contexto.regras + resumo.contexto.julgamentos}</b>
                {" "}· docs do Contexto ({resumo.contexto.fichas} ficha(s), {resumo.contexto.regras} regra(s), {resumo.contexto.julgamentos} julgamento(s))
              </li>
            )}
          </Lista>
          {(resumo.painel || resumo.rascunhos || resumo.contexto) && (
            <Campo rotulo="Como aplicar">
              <Opcao marcada={modo === "mesclar"} aoEscolher={() => setModo("mesclar")}>
                <b>Mesclar</b>: cada registro de mesmo id é trocado pelo do arquivo, os novos entram e nada é apagado.
              </Opcao>
              <Opcao marcada={modo === "campos"} aoEscolher={() => setModo("campos")}>
                <b>Atualizar só os campos do arquivo</b>: nos registros que já existem, muda apenas o que veio no arquivo (nas respostas de formulário, resposta por resposta); o resto fica como está.
              </Opcao>
              <Opcao marcada={modo === "substituir"} aoEscolher={() => setModo("substituir")}>
                <b>Substituir</b>: as coleções do Painel presentes no arquivo ficam exatamente como nele; o que não estiver lá é apagado.
              </Opcao>
            </Campo>
          )}
          <Erro texto={erro} />
          <RodapeModal>
            <Botao variante="fantasma" onClick={() => { setResumo(null); setErro(""); }}>← Voltar</Botao>
            <AcoesModal>
              <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
              <Botao onClick={aplicarJson}>Importar</Botao>
            </AcoesModal>
          </RodapeModal>
        </>
      )}

      {csv && !resultado && (
        <>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-muted">Importar como</label>
            <select className={cx(ESTILO_CONTROLE, "py-1.5")} value={csv.colecao}
              onChange={(e) => {
                const c = e.target.value as ColecaoPainel;
                setCsv({ ...csv, colecao: c, mapeamento: mapeamentoInicial(c, csv.cabecalho) });
              }}>
              {COLECOES_PAINEL.map((c) => <option key={c} value={c}>{ROTULO_COLECAO[c]}</option>)}
            </select>
            <span className="ml-auto text-xs text-muted">{csv.linhas.length} linha(s) de dados</span>
          </div>

          <Tabela className="max-h-[290px] overflow-y-auto">
            <thead>
              <tr><Th>Coluna do arquivo</Th><Th>Vai para</Th><Th>Exemplo (1ª linha)</Th></tr>
            </thead>
            <tbody>
              {csv.cabecalho.map((h, j) => (
                <tr key={j}>
                  <Td><b>{h.trim() || "(sem nome)"}</b></Td>
                  <Td>
                    <select className={cx(ESTILO_CONTROLE, "max-w-[190px] px-[7px] py-1 text-xs")}
                      value={valorAlvo(csv.mapeamento[j])} onChange={(e) => trocarAlvo(j, e.target.value)}>
                      <option value="">— ignorar —</option>
                      <option value="id">id (usado pra mesclar)</option>
                      {COLUNAS_CSV[csv.colecao].map((c) => <option key={c.campo} value={c.campo}>{c.rotulo}</option>)}
                    </select>
                  </Td>
                  <Td className="text-muted">{(csv.linhas[0] || [])[j] || ""}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>

          <div className="mt-3">
            <Opcao marcada={modoCsv === "mesclar"} aoEscolher={() => setModoCsv("mesclar")}>
              <b>Mesclar</b> — atualiza pelo id ou por nome/título igual; o resto entra como novo. Células vazias não apagam nada.
            </Opcao>
            <Opcao marcada={modoCsv === "adicionar"} aoEscolher={() => setModoCsv("adicionar")}>
              <b>Só adicionar</b> — todas as linhas entram como registros novos.
            </Opcao>
          </div>

          <RodapeModal>
            <Botao variante="fantasma" onClick={() => { setCsv(null); setErro(""); }}>← Voltar</Botao>
            <AcoesModal>
              <Botao variante="fantasma" onClick={aoFechar}>Cancelar</Botao>
              <Botao onClick={aplicarCsv}>Importar {csv.linhas.length} linha(s)</Botao>
            </AcoesModal>
          </RodapeModal>
        </>
      )}

      {resultado && (
        <>
          <Dica emModal className="mb-3">
            Importação concluída: <b>{resultado.criados}</b> criado(s), <b>{resultado.atualizados}</b> atualizado(s).
          </Dica>
          <Dica emModal className="mb-3">Avisos — relações que não foram encontradas ficaram em branco (dá pra ajustar abrindo o registro):</Dica>
          <Lista>
            {resultado.avisos.map((a, i) => <li key={i}>{a}</li>)}
          </Lista>
          <RodapeModal>
            <AcoesModal><Botao onClick={aoFechar}>Fechar</Botao></AcoesModal>
          </RodapeModal>
        </>
      )}
    </Modal>
  );
}
