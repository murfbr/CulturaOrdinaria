/* Trocar com o Claude: mão dupla, sempre em texto.
   Para fora: marca fichas (e as regras gerais) e copia o bloco de contexto que
   abre uma conversa de escrita. Para dentro: cola o bloco que o Claude devolveu
   e o site cria/atualiza fichas, regras (como "a confirmar") e julgamentos. */
import { Fragment, useState } from "react";
import { usarCentral, obterEstado } from "../../store/central";
import { salvarFicha, salvarJulgamento, salvarRegra } from "../../store/mutacoes";
import {
  TIPOS_FICHA, entidadePorId, entidades, fichaDe, nomeDaEntidade, temFicha,
} from "../../lib/contexto/consultas";
import { lerBloco, montarBloco, type BlocoLido } from "../../lib/contexto/bloco";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { AcoesModal, Modal, RodapeModal } from "../../components/Modal";
import { copiarComAviso, toast } from "../../components/Toast";
import { Botao } from "../../components/ui/Botao";
import { AreaTexto, Marcacao } from "../../components/ui/Campo";
import { Dica } from "../../components/ui/Dica";
import { Grade } from "../../components/ui/Grade";
import { Painel } from "../../components/ui/Painel";
import { Rotulo } from "../../components/ui/Rotulo";
import { ItemMarcado } from "./ItemMarcado";
import type { TipoFicha } from "../../types";

export function TelaTrocar() {
  usarCentral();
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [comGerais, setComGerais] = useState(true);
  const [entrada, setEntrada] = useState("");
  const [pendente, setPendente] = useState<BlocoLido | null>(null);

  const bloco = montarBloco([...selecionadas], comGerais);

  const alternar = (id: string, marcado: boolean) => {
    const novo = new Set(selecionadas);
    if (marcado) novo.add(id); else novo.delete(id);
    setSelecionadas(novo);
  };

  function importar() {
    const lido = lerBloco(entrada);
    if (!lido.fichas.length && !lido.regras.length && !lido.julgamentos.length) {
      toast("Não reconheci nada no bloco");
      return;
    }
    setPendente(lido);
  }

  /** Aplica o bloco confirmado: fichas mesclam, regras não duplicam, julgamentos atualizam. */
  function aplicar(lido: BlocoLido) {
    const unicos = (a: string[]) => [...new Set(a)];
    const unicosPor = <T,>(a: T[], chave: (x: T) => string) => {
      const vistos = new Set<string>();
      return a.filter((x) => { const k = chave(x); if (vistos.has(k)) return false; vistos.add(k); return true; });
    };
    lido.fichas.forEach((f) => {
      if (!entidadePorId(f.id)) return; // ficha de id que não existe no Painel é ignorada
      const atual = fichaDe(f.id);
      salvarFicha({
        id: f.id, tipo: atual.tipo,
        posicionamento: f.posicionamento || atual.posicionamento,
        argumentos: unicos([...atual.argumentos, ...f.argumentos]),
        julgador: unicos([...(atual.julgador || []), ...f.julgador]),
        vocabulario: unicosPor([...atual.vocabulario, ...f.vocabulario], (v) => v.usar + "|" + v.evitar),
        usados: unicosPor([...atual.usados, ...f.usados], (u) => u.texto + "|" + u.onde + "|" + u.quando),
        cuidados: f.cuidados || atual.cuidados,
      });
    });
    const existentes = Object.values(obterEstado().regras);
    lido.regras.forEach((r) => {
      if (existentes.some((x) => x.texto === r.texto)) return;
      salvarRegra(r);
    });
    lido.julgamentos.forEach((j) => {
      const atual = obterEstado().julgamentos[j.id];
      salvarJulgamento(atual ? { ...atual, ...j, id: j.id } : j);
    });
    setPendente(null);
    setEntrada("");
    toast("Bloco importado");
  }

  const grupo = (tipo: TipoFicha) => (
    <Fragment key={tipo}>
      <Rotulo className="pb-0.5 pt-2">{TIPOS_FICHA[tipo]}</Rotulo>
      {entidades(tipo).map((f) => (
        <Marcacao key={f.id} className="w-full py-1" marcado={selecionadas.has(f.id)} aoMudar={(v) => alternar(f.id, v)}>
          <span className="text-ink">{f.nome}</span>
          {!temFicha(f.id) && <span className="italic text-faint">(sem ficha)</span>}
        </Marcacao>
      ))}
    </Fragment>
  );

  return (
    <>
      <CabecalhoSecao
        grande
        titulo="Trocar com o Claude"
        sub="Mão dupla, sempre em texto. Para fora: o bloco de contexto que abre uma conversa de escrita. Para dentro: o bloco que o Claude devolve depois de ler os materiais."
      />

      <Grade colunas="lateral" className="md:grid-cols-[320px_1fr]">
        <div className="min-w-0">
          <Painel titulo="Para fora: montar o contexto">
            <Marcacao className="w-full py-1" marcado={comGerais} aoMudar={setComGerais}>
              <b className="text-ink">Regras gerais</b>
            </Marcacao>
            {grupo("artista")}{grupo("projeto")}{grupo("edital")}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <Botao onClick={() => void copiarComAviso(bloco, "Bloco copiado")}>Copiar bloco</Botao>
              <Dica>cole no início da conversa de escrita</Dica>
            </div>
          </Painel>

          <Painel titulo="Para dentro: colar o que o Claude devolveu">
            <ol className="m-0 mb-3 list-decimal space-y-1.5 pl-gutter text-base text-muted">
              <li>Numa conversa do Project, junte os materiais (edital, parecer, portfólio) e o md de orientação.</li>
              <li>O Claude devolve um bloco no mesmo formato ao lado.</li>
              <li>Cole aqui: fichas, regras e julgamentos são criados ou atualizados (as regras novas entram como "a confirmar").</li>
            </ol>
            <AreaTexto className="min-h-40 font-mono text-xs" value={entrada} onChange={(e) => setEntrada(e.target.value)}
              placeholder={'## FICHA edital ed7 · Nome do edital\nposicionamento: ...\n- JULGADOR ...\n- REGRA [edital ed7] [prioridade] ... | fonte: edital, item 5.2'} />
            <Botao variante="fantasma" className="mt-2" onClick={importar}>Importar bloco</Botao>
          </Painel>
        </div>

        <div className="min-w-0">
          <Rotulo className="mb-2">
            bloco gerado ({selecionadas.size} ficha{selecionadas.size === 1 ? "" : "s"}{comGerais ? " + gerais" : ""})
          </Rotulo>
          <pre className="m-0 max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-card px-4 py-3.5 font-mono text-xs">{bloco}</pre>
        </div>
      </Grade>

      {pendente && (
        <Modal titulo="Importar bloco" aoFechar={() => setPendente(null)}>
          <Dica emModal className="mb-3">
            Vai criar ou atualizar: {pendente.fichas.length} ficha(s), {pendente.regras.length} regra(s),{" "}
            {pendente.julgamentos.length} julgamento(s). Fichas de ids que não existem no Painel são ignoradas.
            Regras novas entram como "a confirmar".
          </Dica>
          <div className="max-h-[40vh] overflow-auto">
            {pendente.fichas.map((f, i) => (
              <ItemMarcado marca="F" key={"f" + i}>{f.tipo} {f.id}{!entidadePorId(f.id) && " (ignorada: id não existe no Painel)"}</ItemMarcado>
            ))}
            {pendente.regras.map((r, i) => <ItemMarcado marca="R" key={"r" + i}>{r.texto}</ItemMarcado>)}
            {pendente.julgamentos.map((j, i) => <ItemMarcado marca="J" key={"j" + i}>{j.id} · {nomeDaEntidade(j.edital)}</ItemMarcado>)}
          </div>
          <RodapeModal>
            <AcoesModal>
              <Botao variante="fantasma" onClick={() => setPendente(null)}>Cancelar</Botao>
              <Botao onClick={() => aplicar(pendente)}>Importar</Botao>
            </AcoesModal>
          </RodapeModal>
        </Modal>
      )}
    </>
  );
}
