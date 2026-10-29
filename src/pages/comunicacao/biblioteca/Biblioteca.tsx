/* Biblioteca da Comunicação, parte Referências: os perfis que o coletivo
   acompanha pra aprender. A referência é a unidade: o catálogo lista todas,
   de qualquer rodada, e a ficha (#/comunicacao/biblioteca/rf-…) junta todas as
   leituras de um perfil. A rodada é a coleta: a vista Rodadas mostra uma por
   vez, lado a lado (visão geral, todos os posts, amostra, grade e método).
   A leitura nasce no artefato vivo ou na rotina e chega aqui pelo espelho
   (vista Importar, só master); a Central não edita. Endereços:
   #/comunicacao/biblioteca (catálogo) · /rodadas · /posts · /amostra · /metodo · /importar · /rf-… */
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
import { Catalogo } from "./Catalogo";
import { rodadasEmOrdem, usarRodada } from "./dados";
import { FichaReferencia } from "./FichaReferencia";
import { ImportarBiblioteca } from "./ImportarBiblioteca";
import { Metodo } from "./Metodo";
import { TabelaPosts } from "./TabelaPosts";
import { VisaoGeral } from "./VisaoGeral";

const VISTAS = [
  { id: "geral", rotulo: "Referências" },
  { id: "rodadas", rotulo: "Rodada: visão geral" },
  { id: "posts", rotulo: "Rodada: posts" },
  { id: "amostra", rotulo: "Rodada: amostra" },
  { id: "metodo", rotulo: "Grade e método" },
];
const DA_RODADA = new Set(["rodadas", "posts", "amostra", "metodo"]);
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
  const ficha = aberta.startsWith("rf-");
  const opcoes = [...VISTAS, ...(master ? [{ id: "importar", rotulo: "Importar" }] : [])];
  const naoAchou = !ficha && !opcoes.some((o) => o.id === aberta);
  const vistaAtiva = naoAchou ? "geral" : aberta;
  const nRefs = Object.keys(com.referencias).length;

  const cabecalho = (
    <CabecalhoSecao titulo="Referências" sub={DA_RODADA.has(vistaAtiva) ? "uma rodada de leitura, lado a lado" : "os perfis que a gente acompanha pra aprender, de qualquer rodada"}>
      {DA_RODADA.has(vistaAtiva) && rodadas.length > 1 && (
        <SeletorFiltro valor={vista?.rodada.id || ""} aoMudar={escolherRodada}
          opcoes={rodadas.map((r) => ({ valor: r.id, rotulo: "Rodada de " + diaMes(r.data) + "/" + r.data.slice(0, 4) + " · " + r.grade }))} />
      )}
      {DA_RODADA.has(vistaAtiva) && rodadas.length === 1 && vista && <span className="text-sm text-muted">rodada de {diaMes(vista.rodada.data)}/{vista.rodada.data.slice(0, 4)}</span>}
      {vistaAtiva === "geral" && nRefs > 0 && <span className="text-sm text-muted">{nRefs} referências · {rodadas.length} rodada(s)</span>}
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

  if (ficha) return <FichaReferencia refId={aberta} />;

  const vazio = (
    <Vazio>
      Nenhuma referência na Central ainda. A primeira rodada chega pelo espelho
      {master ? ", na vista Importar." : " (quem grava é a rotina, com a conta do Antonio)."}
    </Vazio>
  );

  return (
    <>
      {cabecalho}
      <Pilulas opcoes={opcoes} ativa={vistaAtiva} aoEscolher={(id) => definirBibliotecaAberta(id === "geral" ? null : id)} />

      {vistaAtiva === "importar" && master ? (
        <ImportarBiblioteca aoGravar={escolherRodada} />
      ) : !com.pronto ? (
        <div className="py-10 text-center text-lg text-muted">carregando a Biblioteca…</div>
      ) : vistaAtiva === "geral" ? (
        nRefs ? <Catalogo referencias={com.referencias} /> : vazio
      ) : !vista ? vazio : vista.carregando && !vista.leituras.length ? (
        <div className="py-10 text-center text-lg text-muted">carregando as leituras da rodada…</div>
      ) : (
        <>
          {vista.ausentes.length > 0 && (
            <Painel alerta titulo="Rodada incompleta">
              {vista.ausentes.length} leitura(s) desta rodada não estão no banco. Importe o espelho de novo.
            </Painel>
          )}
          {vistaAtiva === "posts" ? <TabelaPosts leituras={vista.leituras} cor={vista.cor} desempenho={vista.desempenho} />
            : vistaAtiva === "amostra" ? <Amostra vista={vista} />
              : vistaAtiva === "metodo" ? <Metodo vista={vista} />
                : <VisaoGeral vista={vista} />}
        </>
      )}
    </>
  );
}
