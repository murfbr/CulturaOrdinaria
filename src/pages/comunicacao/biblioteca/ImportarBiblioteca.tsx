/* "Trazer do painel (JSON)": lê o arquivo do espelho que o artefato vivo da
   Biblioteca (ou a rotina) gera, mostra a conferência (rodada, referências,
   posts, análises, avisos e erros) e grava as coleções. O arquivo pode trazer
   só análises, apontando pra rodadas que já estão na Central. Mesmo id grava por cima: repetir não
   duplica. Só master, como o Importar da Central; na prática quem usa é a
   rotina da Biblioteca, pelo Chrome do Antonio. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { Botao } from "../../../components/ui/Botao";
import { AreaTexto } from "../../../components/ui/Campo";
import { Dica } from "../../../components/ui/Dica";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { gravarEspelhoBiblioteca, usarComunicacao } from "../../../store/comunicacao";
import { definirBibliotecaAberta } from "../../../store/navegacao";
import { FORMATO_ESPELHO_REFERENCIAS } from "../../../types";
import { diaMes, formatar, janela } from "./calculo";
import { converterEspelho, type EspelhoConvertido } from "./converterEspelho";

export function ImportarBiblioteca({ aoGravar }: { aoGravar: (rodadaId: string) => void }) {
  const { referencias, rodadas, analises } = usarComunicacao();
  const [texto, setTexto] = useState("");
  const [conferencia, setConferencia] = useState<EspelhoConvertido | null>(null);
  const [erro, setErro] = useState("");

  function lerArquivo(arquivo?: File) {
    if (!arquivo) return;
    arquivo.text().then((t) => { setTexto(t); setErro(""); conferir(t); });
  }

  function conferir(t = texto) {
    try {
      setConferencia(converterEspelho(JSON.parse(t), referencias, undefined, rodadas));
      setErro("");
    } catch {
      setConferencia(null);
      setErro("Não deu para ler: o texto não é um JSON válido.");
    }
  }

  function gravar() {
    if (!conferencia || conferencia.erros.length) return;
    const n = gravarEspelhoBiblioteca(conferencia);
    if (!n) return;
    toast(n + " documento(s) gravado(s) na Biblioteca");
    const { rodada } = conferencia;
    setTexto(""); setConferencia(null);
    if (rodada) { aoGravar(rodada.id); definirBibliotecaAberta(null); }
    else definirBibliotecaAberta("analises");
  }

  const c = conferencia;
  const jaExiste = c?.rodada ? Boolean(rodadas[c.rodada.id]) : false;
  const analisesQueJaExistem = c ? c.analises.filter((a) => analises[a.id]).length : 0;
  return (
    <Painel titulo="Trazer do painel (JSON)" sub={"o arquivo do espelho que o artefato da Biblioteca gera (" + FORMATO_ESPELHO_REFERENCIAS + ")"}>
      <div className="flex flex-col gap-2">
        <input type="file" accept=".json,application/json" aria-label="Arquivo do espelho" className="text-sm" data-importar="biblioteca"
          onChange={(e) => lerArquivo(e.target.files?.[0])} />
        <AreaTexto rows={3} value={texto} placeholder="…ou cole o JSON aqui" onChange={(e) => { setTexto(e.target.value); setConferencia(null); }} />
        {erro && <Dica emModal className="text-no">{erro}</Dica>}
        {c && (
          <div className="rounded-md border border-line bg-bg-sunk p-3 text-sm">
            {c.rodada ? (
              <>
                <b>Rodada de {diaMes(c.rodada.data)}/{c.rodada.data.slice(0, 4)}</b>
                {c.rodada.grade ? " · grade " + c.rodada.grade : ""} · {c.referencias.length} referência(s)
                {c.novas.length ? " (" + c.novas.length + " nova(s): " + c.novas.join(", ") + ")" : ""} ·{" "}
                {c.leituras.reduce((n, l) => n + l.posts.length, 0)} posts · {c.leituras.reduce((n, l) => n + l.amostra.length, 0)} na amostra ·{" "}
                {c.analises.length} análise(s).
              </>
            ) : <b>Só análises: {c.analises.length}.</b>}
            {jaExiste && <div className="mt-1 text-warn">Esta rodada já está na Central: gravar substitui a versão de lá.</div>}
            {analisesQueJaExistem > 0 && <div className="mt-1 text-warn">{analisesQueJaExistem} análise(s) já estão na Central: gravar substitui.</div>}
            {c.analises.length > 0 && (
              <ul className="m-0 mt-2 list-none p-0">
                {c.analises.map((a) => (
                  <li key={a.id}>
                    Análise <b>{a.titulo}</b> · {a.planos.join(", ")} · lê {a.rodadaIds.map((r) => rodadas[r] ? diaMes(rodadas[r].data) : c.rodada?.id === r ? diaMes(c.rodada.data) : r).join(", ")} · {a.refIds.length} referência(s) · {a.secoes.length} seção(ões)
                  </li>
                ))}
              </ul>
            )}
            {c.leituras.length > 0 && <Tabela simples className="mt-2">
              <thead><tr><Th>Referência</Th><Th numerico>Posts</Th><Th>Janela</Th><Th numerico>Seguidores</Th><Th numerico>Tamanho</Th></tr></thead>
              <tbody>
                {c.leituras.map((l) => {
                  const j = janela(l);
                  return (
                    <tr key={l.id}>
                      <Td>{l.nome}</Td><Td numerico>{l.posts.length}</Td>
                      <Td>{diaMes(j.inicio)} a {diaMes(j.fim)}</Td>
                      <Td numerico>{formatar(l.perfil.seguidores, "compact")}</Td>
                      <Td numerico>{c.tamanhos[l.id]} KB</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Tabela>}
            {c.erros.map((a) => <div key={a} className="mt-1 font-semibold text-no">{a}</div>)}
            {c.avisos.map((a) => <div key={a} className="mt-1 text-warn">{a}</div>)}
            <Dica className="mt-2">
              Registros com o mesmo id são gravados por cima. Na referência que já existe, o que o arquivo não traz fica como está; o histórico ganha a linha desta rodada. A análise tem id pelos planos e pela data: a mesma análise importada de novo grava por cima.
            </Dica>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Botao variante="fantasma" onClick={() => conferir()} disabled={!texto.trim()}>Conferir</Botao>
          <Botao onClick={gravar} disabled={!c || c.erros.length > 0}>Gravar na Central</Botao>
        </div>
      </div>
    </Painel>
  );
}
