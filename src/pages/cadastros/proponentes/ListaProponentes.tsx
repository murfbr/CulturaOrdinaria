/* Proponentes (Cadastros): quem assina as inscrições. Um card por proponente,
   com perfil, CNPJ, idade do CNPJ e os projetos que assina (com os avisos de
   cada um). "Criar a partir dos projetos" lê os nomes já escritos nos
   projetos e monta o cadastro, com prévia antes de gravar. "Consultar CNPJ"
   completa abertura, CNAE, sede e perfil pela base pública da Receita. */
import { useMemo, useState } from "react";
import { usarCentral } from "../../../store/central";
import { abrirProjeto } from "../../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../../store/edicao";
import { aplicarPlanoProponentes } from "../../../store/mutacoes";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../../components/Filtros";
import { Modal, RodapeModal } from "../../../components/Modal";
import { toast } from "../../../components/Toast";
import { anosDeCnpj, avisosProponente, idadeLegivel, planoDosProjetos } from "../../../lib/proponentes";
import { nomeCurto, editalDoProjeto } from "../../../lib/nomes";
import { ROTULO_STATUS_PROJETO, type Proponente } from "../../../types";
import { comparar, uid } from "../../../utils";
import { cnaeEhCultural, cnaesDoTexto, soDigitos } from "../../../lib/cnpj";
import { ModalConsultaCnpj } from "./ModalConsultaCnpj";

export function ListaProponentes() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [perfil, setPerfil] = useState("");
  const [verPlano, setVerPlano] = useState(false);
  const [consultar, setConsultar] = useState<Proponente[] | null>(null);

  const plano = useMemo(() => planoDosProjetos(painel, () => uid("pr")), [painel]);
  const semCadastro = plano.vinculos.length;

  const termo = busca.toLowerCase();
  const lista = painel.proponentes
    .filter((x) => (!perfil || x.perfil === perfil)
      && (!termo || [x.nome, x.perfil, x.cnpj, x.cnae, x.municipio, x.representante, x.obs].join(" ").toLowerCase().includes(termo)))
    .sort((a, b) => comparar(a.nome, b.nome));
  const perfis = [...new Set(painel.proponentes.map((x) => x.perfil).filter(Boolean))].sort(comparar);
  const comCnpj = painel.proponentes.filter((x) => soDigitos(x.cnpj).length === 14).sort((a, b) => comparar(a.nome, b.nome));

  const cartao = (pr: Proponente) => {
    const projetos = painel.projetos.filter((p) => p.proponenteId === pr.id && !p.arquivado);
    const anos = anosDeCnpj(pr.abertura);
    return (
      <div className="card click prop-card" key={pr.id} onClick={() => abrirEdicao("proponente", pr.id)}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          {pr.perfil && <span className="badge b-type">{pr.perfil}</span>}
          <span className={"badge " + (pr.situacao === "confirmado" ? "st-ok" : "st-prev")}>{pr.situacao === "confirmado" ? "confirmado" : "a confirmar"}</span>
        </div>
        <h3>{pr.nome}</h3>
        {pr.cnpj && <div className="kv"><span>CNPJ:</span> <b>{pr.cnpj}</b></div>}
        {pr.abertura && <div className="kv"><span>Aberto há:</span> <b>{idadeLegivel(anos)}</b></div>}
        {!pr.abertura && pr.perfil && !pr.perfil.startsWith("Coletivo") && pr.perfil !== "PF" && (
          <div className="kv"><span>Abertura do CNPJ:</span> <b className="muted">falta</b></div>
        )}
        {pr.cnae && <div className="kv"><span>CNAE:</span> <b className="corta">{pr.cnae}</b></div>}
        {pr.cnae && cnaesDoTexto(pr.cnae).length > 0 && (
          <div className="kv"><span>CNAE cultural:</span> {cnaesDoTexto(pr.cnae).some(cnaeEhCultural)
            ? <b>sim</b>
            : <b className="muted" title="nenhum código de artes, espetáculos, audiovisual, eventos ou ensino de cultura entre os registrados">não identificado</b>}</div>
        )}
        {pr.municipio && <div className="kv"><span>Sede:</span> <b>{pr.municipio}</b></div>}
        {pr.representante && <div className="kv"><span>Assina:</span> <b>{pr.representante}</b></div>}
        {soDigitos(pr.cnpj).length === 14 && (
          <button className="btn sm ghost prop-receita" onClick={(e) => { e.stopPropagation(); setConsultar([pr]); }}>
            consultar CNPJ na Receita
          </button>
        )}
        <div className="prop-projs" onClick={(e) => e.stopPropagation()}>
          {projetos.map((p) => {
            const avisos = avisosProponente(p, painel);
            const e = editalDoProjeto(p);
            return (
              <div key={p.id}>
                <a className="lnk" onClick={() => abrirProjeto(p.id)}>{p.nome}</a>
                <span className="muted"> · {e ? nomeCurto(e) : "sem edital"} · {ROTULO_STATUS_PROJETO[p.status]}</span>
                {avisos.map((a) => <div key={a} className="aviso-linha">⚠ {a}</div>)}
              </div>
            );
          })}
          {!projetos.length && <span className="muted">nenhum projeto em aberto assina com este proponente</span>}
        </div>
      </div>
    );
  };

  return (
    <>
      <CabecalhoSecao titulo="Proponentes" sub="quem assina as inscrições: empresa, MEI, pessoa física ou coletivo representado (sem CPF, RG nem dados bancários)">
        {semCadastro > 0 && (
          <button className="btn ghost" onClick={() => setVerPlano(true)}>Criar a partir dos projetos ({semCadastro})</button>
        )}
        {comCnpj.length > 0 && (
          <button className="btn ghost" onClick={() => setConsultar(comCnpj)} title="abertura, CNAE, sede e perfil pela base pública da Receita">
            Consultar CNPJs ({comCnpj.length})
          </button>
        )}
        <button className="btn" onClick={() => abrirNovo("proponente")}>+ Novo proponente</button>
      </CabecalhoSecao>

      <BarraFiltros mostrando={lista.length} total={painel.proponentes.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, CNPJ, CNAE, cidade…" />
        <SeletorFiltro valor={perfil} aoMudar={setPerfil} rotuloTodos="todos os perfis" opcoes={perfis} />
      </BarraFiltros>

      <div className="grid g2">{lista.map(cartao)}</div>
      {!painel.proponentes.length && (
        <p className="muted">
          Nenhum proponente cadastrado ainda.
          {semCadastro > 0 && " Os projetos já têm nomes de proponente escritos: use \"Criar a partir dos projetos\" para montar o cadastro de uma vez."}
        </p>
      )}

      {consultar && <ModalConsultaCnpj alvos={consultar} aoFechar={() => setConsultar(null)} />}

      {verPlano && (
        <Modal titulo="Criar proponentes a partir dos projetos" aoFechar={() => setVerPlano(false)} largo>
          <p className="hint" style={{ marginTop: 0 }}>
            Lido do campo proponente de cada projeto. Nomes com o mesmo nome fantasia entre parênteses viram um só cadastro;
            "(a confirmar)" vira a situação do cadastro. Depois, complete CNPJ, abertura e CNAE em cada card.
          </p>
          <ul className="plano-prop">
            {plano.novos.map((pr) => (
              <li key={pr.id}>
                <b>{pr.nome}</b> <span className="muted">· {pr.perfil || "perfil não informado"}{pr.situacao === "a_confirmar" ? " · a confirmar" : ""}{pr.cnpj ? " · CNPJ " + pr.cnpj : ""}</span>
                <div className="muted" style={{ fontSize: 12 }}>
                  assina: {plano.vinculos.filter((v) => v.proponenteId === pr.id)
                    .map((v) => painel.projetos.find((p) => p.id === v.projetoId)?.nome).filter(Boolean).join(" · ")}
                </div>
              </li>
            ))}
            {plano.vinculos.filter((v) => !plano.novos.some((n) => n.id === v.proponenteId)).length > 0 && (
              <li className="muted">
                + {plano.vinculos.filter((v) => !plano.novos.some((n) => n.id === v.proponenteId)).length} projeto(s) ligado(s) a proponentes que já estão no cadastro.
              </li>
            )}
          </ul>
          <RodapeModal>
            <span className="sp">
              <button className="btn ghost" onClick={() => setVerPlano(false)}>Cancelar</button>
              <button className="btn" onClick={() => {
                const n = aplicarPlanoProponentes(plano);
                toast(`${n} proponente(s) criado(s) e ${plano.vinculos.length} projeto(s) ligado(s)`);
                setVerPlano(false);
              }}>Criar {plano.novos.length} e ligar {plano.vinculos.length} projeto(s)</button>
            </span>
          </RodapeModal>
        </Modal>
      )}
    </>
  );
}
