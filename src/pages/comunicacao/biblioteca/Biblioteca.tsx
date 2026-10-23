/* Biblioteca da Comunicação, parte Referências: os perfis que o coletivo
   acompanha pra aprender, lidos por rodada. A leitura nasce no artefato vivo
   (conta do Antonio) e chega aqui pelo espelho (aba Importar); a Central não
   edita. Vistas: visão geral, ficha de cada referência (#/comunicacao/biblioteca/rf-…),
   todos os posts, amostra assistida, grade e método, importar (só master).
   O Mailing, segunda parte da Biblioteca (doc 02, seção 7b), entra depois. */
import { useEffect, useState } from "react";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { SeletorFiltro } from "../../../components/Filtros";
import { Painel } from "../../../components/ui/Painel";
import { Pilulas } from "../../../components/ui/Pilulas";
import { Vazio } from "../../../components/ui/Vazio";
import { usarAcesso } from "../../../services/acesso";
import { iniciarComunicacao, usarComunicacao } from "../../../store/comunicacao";
import { definirBibliotecaAberta, usarNavegacao } from "../../../store/navegacao";
import { Amostra } from "./Amostra";
import { diaMes } from "./calculo";
import { rodadasEmOrdem, usarRodada } from "./dados";
import { FichaReferencia } from "./FichaReferencia";
import { ImportarBiblioteca } from "./ImportarBiblioteca";
import { Metodo } from "./Metodo";
import { TabelaPosts } from "./TabelaPosts";
import { VisaoGeral } from "./VisaoGeral";

const VISTAS = [
  { id: "geral", rotulo: "Visão geral" },
  { id: "posts", rotulo: "Todos os posts" },
  { id: "amostra", rotulo: "Amostra assistida" },
  { id: "metodo", rotulo: "Grade e método" },
];
const CHAVE_RODADA = "central-biblioteca-rodada";

export function Biblioteca() {
  useEffect(() => { iniciarComunicacao(); }, []);
  const com = usarComunicacao();
  const nav = usarNavegacao();
  const master = Boolean(usarAcesso().acesso?.master);
  const [rodadaId, setRodadaId] = useState(() => { try { return localStorage.getItem(CHAVE_RODADA) || ""; } catch { return ""; } });
  const escolherRodada = (id: string) => {
    setRodadaId(id);
    try { localStorage.setItem(CHAVE_RODADA, id); } catch { /* sem localStorage: só não lembra */ }
  };
  const vista = usarRodada(rodadaId);
  const rodadas = rodadasEmOrdem(com.rodadas);
  const aberta = nav.bibliotecaAberta || "geral";
  const opcoes = [...VISTAS, ...(master ? [{ id: "importar", rotulo: "Importar" }] : [])];

  const cabecalho = (
    <CabecalhoSecao titulo="Referências" sub="os perfis que a gente acompanha pra aprender, lidos por rodada">
      {rodadas.length > 1 && (
        <SeletorFiltro valor={vista?.rodada.id || ""} aoMudar={escolherRodada}
          opcoes={rodadas.map((r) => ({ valor: r.id, rotulo: "Rodada de " + diaMes(r.data) + "/" + r.data.slice(0, 4) }))} />
      )}
      {rodadas.length === 1 && vista && <span className="text-sm text-muted">rodada de {diaMes(vista.rodada.data)}/{vista.rodada.data.slice(0, 4)}</span>}
    </CabecalhoSecao>
  );

  if (com.semAcesso) {
    return (
      <>
        {cabecalho}
        <Painel alerta titulo="Sem acesso à Biblioteca">
          <p className="m-0 text-base">
            O banco recusou a leitura das coleções da Biblioteca. Ou as regras do Firestore ainda não têm as coleções
            da Comunicação (o arquivo firestore.rules do repositório tem as linhas; publicar pelo console), ou a conta
            não tem nenhum módulo da Central. O resto da Central segue normal.
          </p>
        </Painel>
      </>
    );
  }

  const ficha = aberta.startsWith("rf-");
  const naoAchou = !ficha && !opcoes.some((o) => o.id === aberta);

  return (
    <>
      {!ficha && cabecalho}
      {!ficha && <Pilulas opcoes={opcoes} ativa={naoAchou ? "geral" : aberta} aoEscolher={(id) => definirBibliotecaAberta(id === "geral" ? null : id)} />}

      {aberta === "importar" && master ? (
        <ImportarBiblioteca aoGravar={escolherRodada} />
      ) : !com.pronto ? (
        <div className="py-10 text-center text-lg text-muted">carregando a Biblioteca…</div>
      ) : !vista ? (
        <Vazio>
          Nenhuma rodada de leitura na Central ainda. A primeira chega pelo espelho do artefato da Biblioteca
          {master ? ", na aba Importar." : " (quem grava é a rotina, com a conta do Antonio)."}
        </Vazio>
      ) : vista.carregando && !vista.leituras.length ? (
        <div className="py-10 text-center text-lg text-muted">carregando as leituras da rodada…</div>
      ) : (
        <>
          {vista.ausentes.length > 0 && (
            <Painel alerta titulo="Rodada incompleta">
              {vista.ausentes.length} leitura(s) desta rodada não estão no banco. Importe o espelho de novo.
            </Painel>
          )}
          {ficha ? <FichaReferencia vista={vista} refId={aberta} />
            : aberta === "posts" ? <TabelaPosts leituras={vista.leituras} cor={vista.cor} desempenho={vista.desempenho} />
              : aberta === "amostra" ? <Amostra vista={vista} />
                : aberta === "metodo" ? <Metodo vista={vista} />
                  : <VisaoGeral vista={vista} />}
        </>
      )}
    </>
  );
}
