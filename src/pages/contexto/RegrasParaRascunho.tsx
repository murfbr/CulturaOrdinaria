/* "Regras e fichas" do projeto (gaveta do Formulário e resumo da aba
   Contexto): as regras gerais e o essencial das fichas (posicionamento,
   argumentos/julgador, cuidados, regras) do edital, do projeto e dos artistas.
   Fica solto dentro da caixa de quem o embute (Gaveta ou Painel): sem largura
   própria, sem padding lateral, sem margem de cima. Desenha o próprio
   cabeçalho (título e "fechar", quando há aoFechar) e os grupos; com
   semCabecalho, quem embute (a Gaveta do formulário) põe o título. */
import type { ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { entidadePorId, fichaDe, regrasDe } from "../../lib/contexto/consultas";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { GrupoGaveta } from "../../components/ui/Gaveta";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_AUXILIAR } from "../../components/ui/estilos";
import { cx } from "../../utils/classes";
import { ROTULO_TIPO_REGRA, type Regra } from "../../types";

export function RegrasParaRascunho({ ids, aoFechar, semCabecalho }: { ids: string[]; aoFechar?: () => void; semCabecalho?: boolean }) {
  usarCentral();
  const gerais = regrasDe("geral");

  /** Linha da gaveta: etiqueta do tipo à esquerda e o texto ao lado. */
  const LinhaMarcada = ({ tom, rotulo, children }: { tom: string; rotulo: string; children: ReactNode }) => (
    <div className="flex max-w-texto items-start gap-2.5 py-1 text-sm">
      <Badge caixaAlta tom={tom}>{rotulo}</Badge>
      <span className="min-w-0">{children}</span>
    </div>
  );
  const LinhaR = ({ r }: { r: Regra }) => (
    <LinhaMarcada tom={r.tipoRegra} rotulo={ROTULO_TIPO_REGRA[r.tipoRegra]}>
      {r.texto}{r.status === "duvida" && <> <Badge tom="aviso" mini>a confirmar</Badge></>}
    </LinhaMarcada>
  );

  return (
    <>
      {!semCabecalho && (
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <b className="text-base">Regras e fichas para este projeto</b>
          {aoFechar && <Botao variante="quieto" tamanho="pequeno" className="ml-auto" onClick={aoFechar}>fechar</Botao>}
        </div>
      )}

      {gerais.length > 0 && (
        <GrupoGaveta rotulo="Gerais">
          {gerais.map((r) => <LinhaR r={r} key={r.id} />)}
        </GrupoGaveta>
      )}

      {ids.map((id) => {
        const entidade = entidadePorId(id);
        if (!entidade) return null;
        const f = fichaDe(id);
        const regras = regrasDe(entidade.tipo, id);
        const argumentos = entidade.tipo === "edital" ? f.julgador || [] : f.argumentos || [];
        return (
          <GrupoGaveta rotulo={<>{entidade.tipo} · {entidade.nome}</>} key={id}>
            {f.posicionamento && <p className={cx("m-0 mb-1.5 max-w-texto", ESTILO_AUXILIAR)}>{f.posicionamento}</p>}
            {argumentos.map((a, i) => (
              <LinhaMarcada tom="dica" rotulo={entidade.tipo === "edital" ? "julgador" : "argumento"} key={i}>{a}</LinhaMarcada>
            ))}
            {f.cuidados && <LinhaMarcada tom="proibicao" rotulo="cuidado">{f.cuidados}</LinhaMarcada>}
            {regras.map((r) => <LinhaR r={r} key={r.id} />)}
            {!f.posicionamento && !regras.length && <Vazio emLinha>sem ficha nem regras ainda</Vazio>}
          </GrupoGaveta>
        );
      })}

      {!ids.length && (
        <Vazio emLinha className="py-2">
          Ligue o projeto a um edital e a artistas (Editar dados) para ver as fichas deles aqui.
        </Vazio>
      )}
    </>
  );
}
