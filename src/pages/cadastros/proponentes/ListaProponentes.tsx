/* Proponentes (Cadastros): quem assina as inscrições. Uma linha por
   proponente, com perfil, situação, CNPJ e a idade dele, CNAE, sede, quem
   assina e os projetos que assina (com os avisos de cada um); a linha abre a
   edição. "Criar a partir dos projetos" lê os nomes já escritos nos projetos e
   monta o cadastro, com prévia antes de gravar. "Consultar CNPJ" completa
   abertura, CNAE, sede e perfil pela base pública da Receita. */
import { useMemo, useState } from "react";
import { usarCentral } from "../../../store/central";
import { abrirProjeto } from "../../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../../store/edicao";
import { aplicarPlanoProponentes } from "../../../store/mutacoes";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../../components/Filtros";
import { AcoesModal, Modal, RodapeModal } from "../../../components/Modal";
import { toast } from "../../../components/Toast";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Dica } from "../../../components/ui/Dica";
import { Tabela, Td, Th, Tr } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_APAGADO, ESTILO_AUXILIAR, ESTILO_LINK } from "../../../components/ui/estilos";
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

  const linha = (pr: Proponente) => {
    const projetos = painel.projetos.filter((p) => p.proponenteId === pr.id && !p.arquivado);
    const anos = anosDeCnpj(pr.abertura);
    const cnaes = cnaesDoTexto(pr.cnae);
    const temCnpj = soDigitos(pr.cnpj).length === 14;
    const faltaAbertura = !pr.abertura && pr.perfil && !pr.perfil.startsWith("Coletivo") && pr.perfil !== "PF";
    return (
      <Tr key={pr.id} aoClicar={() => abrirEdicao("proponente", pr.id)}>
        <Td className="font-semibold">{pr.nome}</Td>
        <Td>{pr.perfil && <Badge tom="tipo">{pr.perfil}</Badge>}</Td>
        <Td>
          <Badge tom={pr.situacao === "confirmado" ? "st-ok" : "st-prev"}>{pr.situacao === "confirmado" ? "confirmado" : "a confirmar"}</Badge>
        </Td>
        <Td className="whitespace-nowrap">
          {pr.cnpj || "—"}
          {pr.abertura && <div className={ESTILO_APAGADO}>aberto há {idadeLegivel(anos)}</div>}
          {faltaAbertura && <div className={ESTILO_APAGADO}>abertura do CNPJ: falta</div>}
        </Td>
        <Td>
          {pr.cnae ? <div className="max-w-[28ch] truncate" title={pr.cnae}>{pr.cnae}</div> : "—"}
          {cnaes.length > 0 && (
            <div className={ESTILO_APAGADO}>
              CNAE cultural: {cnaes.some(cnaeEhCultural)
                ? <b>sim</b>
                : <span title="nenhum código de artes, espetáculos, audiovisual, eventos ou ensino de cultura entre os registrados">não identificado</span>}
            </div>
          )}
        </Td>
        <Td>{pr.municipio || "—"}</Td>
        <Td>{pr.representante || "—"}</Td>
        {/* Os links dos projetos não abrem a edição do proponente. */}
        <Td className="min-w-[240px]" onClick={(e) => e.stopPropagation()}>
          {projetos.map((p) => {
            const avisos = avisosProponente(p, painel);
            const e = editalDoProjeto(p);
            return (
              <div key={p.id}>
                <a className={ESTILO_LINK} onClick={() => abrirProjeto(p.id)}>{p.nome}</a>
                <span className="text-muted"> · {e ? nomeCurto(e) : "sem edital"} · {ROTULO_STATUS_PROJETO[p.status]}</span>
                {avisos.map((a) => <div key={a} className="text-xs text-warn">⚠ {a}</div>)}
              </div>
            );
          })}
          {!projetos.length && <span className={ESTILO_AUXILIAR}>nenhum projeto em aberto assina com este proponente</span>}
        </Td>
        <Td>
          <div className="flex justify-end gap-1 whitespace-nowrap">
            {temCnpj && (
              <Botao variante="fantasma" tamanho="mini" onClick={(e) => { e.stopPropagation(); setConsultar([pr]); }}>
                consultar CNPJ na Receita
              </Botao>
            )}
            <Botao variante="quieto" tamanho="mini" onClick={(e) => { e.stopPropagation(); abrirEdicao("proponente", pr.id); }}>editar</Botao>
          </div>
        </Td>
      </Tr>
    );
  };

  return (
    <>
      <CabecalhoSecao titulo="Proponentes" sub="quem assina as inscrições: empresa, MEI, pessoa física ou coletivo representado (sem CPF, RG nem dados bancários)">
        {semCadastro > 0 && (
          <Botao variante="fantasma" onClick={() => setVerPlano(true)}>Criar a partir dos projetos ({semCadastro})</Botao>
        )}
        {comCnpj.length > 0 && (
          <Botao variante="fantasma" onClick={() => setConsultar(comCnpj)} title="abertura, CNAE, sede e perfil pela base pública da Receita">
            Consultar CNPJs ({comCnpj.length})
          </Botao>
        )}
        <Botao onClick={() => abrirNovo("proponente")}>+ Novo proponente</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={lista.length} total={painel.proponentes.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, CNPJ, CNAE, cidade…" />
        <SeletorFiltro valor={perfil} aoMudar={setPerfil} rotuloTodos="todos os perfis" opcoes={perfis} />
      </BarraFiltros>

      {lista.length > 0 && (
        <Tabela minima="min-w-[1000px]">
          <thead>
            <tr>
              <Th>Proponente</Th>
              <Th>Perfil</Th>
              <Th>Situação</Th>
              <Th>CNPJ</Th>
              <Th>CNAE</Th>
              <Th>Sede</Th>
              <Th>Assina</Th>
              <Th>Projetos</Th>
              <Th />
            </tr>
          </thead>
          <tbody>{lista.map(linha)}</tbody>
        </Tabela>
      )}
      {!painel.proponentes.length && (
        <Vazio>
          Nenhum proponente cadastrado ainda.
          {semCadastro > 0 && " Os projetos já têm nomes de proponente escritos: use \"Criar a partir dos projetos\" para montar o cadastro de uma vez."}
        </Vazio>
      )}

      {consultar && <ModalConsultaCnpj alvos={consultar} aoFechar={() => setConsultar(null)} />}

      {verPlano && (
        <Modal titulo="Criar proponentes a partir dos projetos" aoFechar={() => setVerPlano(false)} largo>
          <Dica emModal className="mb-3">
            Lido do campo proponente de cada projeto. Nomes com o mesmo nome fantasia entre parênteses viram um só cadastro;
            "(a confirmar)" vira a situação do cadastro. Depois, complete CNPJ, abertura e CNAE em cada cadastro.
          </Dica>
          <ul className="mx-0 my-2 max-h-[50vh] list-disc overflow-auto pl-[18px] text-sm">
            {plano.novos.map((pr) => (
              <li key={pr.id} className="mb-1.5">
                <b>{pr.nome}</b>{" "}
                <span className="text-muted">· {pr.perfil || "perfil não informado"}{pr.situacao === "a_confirmar" ? " · a confirmar" : ""}{pr.cnpj ? " · CNPJ " + pr.cnpj : ""}</span>
                <div className={ESTILO_APAGADO}>
                  assina: {plano.vinculos.filter((v) => v.proponenteId === pr.id)
                    .map((v) => painel.projetos.find((p) => p.id === v.projetoId)?.nome).filter(Boolean).join(" · ")}
                </div>
              </li>
            ))}
            {plano.vinculos.filter((v) => !plano.novos.some((n) => n.id === v.proponenteId)).length > 0 && (
              <li className="mb-1.5 text-muted">
                + {plano.vinculos.filter((v) => !plano.novos.some((n) => n.id === v.proponenteId)).length} projeto(s) ligado(s) a proponentes que já estão no cadastro.
              </li>
            )}
          </ul>
          <RodapeModal>
            <AcoesModal>
              <Botao variante="fantasma" onClick={() => setVerPlano(false)}>Cancelar</Botao>
              <Botao onClick={() => {
                const n = aplicarPlanoProponentes(plano);
                toast(`${n} proponente(s) criado(s) e ${plano.vinculos.length} projeto(s) ligado(s)`);
                setVerPlano(false);
              }}>Criar {plano.novos.length} e ligar {plano.vinculos.length} projeto(s)</Botao>
            </AcoesModal>
          </RodapeModal>
        </Modal>
      )}
    </>
  );
}
