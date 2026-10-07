/* Tela Geral do Contexto: o que mora aqui, contagens do que já está
   registrado e as regras gerais (valem para todo texto). */
import type { ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { regrasDe, textoFonte } from "../../lib/contexto/consultas";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Grade } from "../../components/ui/Grade";
import { Linha } from "../../components/ui/Linha";
import { Painel } from "../../components/ui/Painel";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_AUXILIAR } from "../../components/ui/estilos";
import { cx } from "../../utils/classes";
import { ROTULO_TIPO_REGRA } from "../../types";
import type { PedidoModalRegra } from "./ModalRegra";

export function Geral({ aoAbrirRegra }: { aoAbrirRegra: (p: PedidoModalRegra) => void }) {
  const { fichas, regras, julgamentos } = usarCentral();
  const gerais = regrasDe("geral");
  const listaRegras = Object.values(regras);
  const listaJulg = Object.values(julgamentos);
  const contagemFichas = (tipo: string) => Object.values(fichas).filter((f) => f.tipo === tipo).length;

  return (
    <>
      <CabecalhoSecao
        grande
        titulo="Contexto e regras"
        sub="O que sabemos sobre cada artista, projeto e edital, e o que o texto pode ou não ter. Nada de cadastro: isso é de Cadastros e Projetos, apontado pelo mesmo id. As mesmas fichas aparecem na aba Contexto de cada artista, edital e projeto."
      />

      <Grade colunas={2} className="md:grid-cols-[1.2fr_1fr]">
        <Painel titulo="O que mora aqui">
          <p className="m-0 mb-2.5 max-w-texto">Conhecimento de escrita e de julgamento: como falar de cada artista, projeto e edital; quais argumentos funcionam; o que o julgador pesa de verdade; o que o texto não pode ter; e o que os pareceres anteriores ensinaram.</p>
          <p className="m-0 max-w-texto">Regra sem fonte não entra. Cada lição de um julgamento pode virar regra, e a regra aponta o julgamento como fonte.</p>
        </Painel>
        <Painel titulo="O que já está registrado">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Contagem n={contagemFichas("artista")}>fichas de artista</Contagem>
            <Contagem n={contagemFichas("projeto")}>de projeto</Contagem>
            <Contagem n={contagemFichas("edital")}>de edital</Contagem>
            <Contagem n={listaRegras.length}>regras</Contagem>
            <Contagem n={listaJulg.length}>julgamentos</Contagem>
          </div>
          <p className={cx("m-0 mt-3.5", ESTILO_AUXILIAR)}>
            Regras <Badge tom="aviso" mini>a confirmar</Badge>: {listaRegras.filter((r) => r.status === "duvida").length}.
            São as de fonte incerta; a próxima leitura dos materiais deve fechar ou derrubar cada uma.
          </p>
        </Painel>
      </Grade>

      <Painel titulo="Regras gerais, valem para todo texto">
        {gerais.map((r) => (
          <Linha topo key={r.id} direita={<span className="whitespace-nowrap text-xs text-faint">{textoFonte(r.fonte)}</span>}>
            <div className="flex items-start gap-2.5">
              <Badge caixaAlta tom={r.tipoRegra}>{ROTULO_TIPO_REGRA[r.tipoRegra]}</Badge>
              <span className="text-base">{r.texto}</span>
            </div>
          </Linha>
        ))}
        {!gerais.length && <Vazio emLinha>nenhuma ainda</Vazio>}
        <Botao variante="fantasma" tamanho="pequeno" className="mt-2.5" onClick={() => aoAbrirRegra({ contexto: { tipo: "geral" } })}>
          + regra geral
        </Botao>
      </Painel>
    </>
  );
}

/** Número grande com o rótulo ao lado (o que já está registrado). */
function Contagem({ n, children }: { n: number; children: ReactNode }) {
  return (
    <span className={ESTILO_AUXILIAR}>
      <b className="mr-1 font-display text-4xl font-normal text-ink tabular-nums">{n}</b>
      {children}
    </span>
  );
}
