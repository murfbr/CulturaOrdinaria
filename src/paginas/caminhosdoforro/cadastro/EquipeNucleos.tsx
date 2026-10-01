/* Equipe e núcleos: um card por núcleo (responsável, membros, contagem de
   tarefas) e a tabela das pessoas da equipe (núcleos, responsável por, tarefas
   abertas e atrasadas, contato). "Ver tarefas" abre a vista de Tarefas já
   filtrada pelo núcleo ou pela pessoa. */
import { useState } from "react";
import { cadastrosDoTipo, contasNucleo, nomeCadastro, nucleosDe, respEfetivo, tarefaAberta, tarefaAtrasada } from "../calculo";
import type { Base } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { ACOES, LINK, NOTA, SECAO, SUB } from "../ui/classes";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Tag } from "../ui/Tag";
import { pedirFiltroTarefas, type IrPara } from "../vista";
import { ModalCadastro } from "./ModalCadastro";
import { ModalNucleo } from "./ModalNucleo";

export function EquipeNucleos({ base, irPara }: { base: Base; irPara: IrPara }) {
  const [modalNucleo, setModalNucleo] = useState<{ id: string | null } | null>(null);
  const [modalPessoa, setModalPessoa] = useState<{ id: string | null } | null>(null);
  const nucleos = base.pagina.nucleos;
  const equipe = cadastrosDoTipo(base, "equipe");
  const verTarefas = (f: { nucleo?: string; resp?: string }) => { pedirFiltroTarefas(f); irPara("tarefas"); };

  return (
    <>
      <p className={NOTA}>Quem trabalha no festival e em quais núcleos. Cada núcleo tem membros e um responsável; as tarefas de um núcleo só podem ir para os membros dele.</p>

      <h2 className={SECAO}>Núcleos<Botao className="cdf:ml-auto cdf:font-sans" onClick={() => setModalNucleo({ id: null })}>Novo núcleo</Botao></h2>
      <div className="cdf:grid cdf:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] cdf:gap-3">
        {nucleos.map((n) => {
          const c = contasNucleo(base, n.id);
          const membros = (n.membros || []).filter((id) => base.cadastro[id]);
          return (
            <article key={n.id} className="cdf:flex cdf:flex-col cdf:gap-2 cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:p-4">
              <h3 className="cdf:m-0 cdf:font-display cdf:text-[22px] cdf:font-black cdf:leading-[1.1]">{n.nome}</h3>
              <p className="cdf:m-0 cdf:text-sm cdf:text-tinta-2">
                {n.responsavel ? <>Responsável: <strong>{nomeCadastro(base, n.responsavel)}</strong></> : <span className="cdf:text-fraco">Sem responsável</span>}
              </p>
              <div>{membros.length ? membros.map((id) => <Tag key={id}>{nomeCadastro(base, id)}</Tag>) : <span className="cdf:text-fraco">Nenhum membro ainda</span>}</div>
              <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">
                <b className="cdf:text-tinta">{c.abertas}</b> tarefas abertas, <b className="cdf:text-tinta">{c.feitas}</b> concluídas
                {c.atrasadas ? <>, <span className="cdf:font-bold cdf:text-erro">{c.atrasadas} atrasadas</span></> : null}
              </p>
              <div className="cdf:mt-auto cdf:flex cdf:gap-1.5 cdf:pt-1">
                <Botao mini onClick={() => setModalNucleo({ id: n.id })}>Editar núcleo</Botao>
                <Botao mini variante="fraco" onClick={() => verTarefas({ nucleo: n.id })}>Ver tarefas</Botao>
              </div>
            </article>
          );
        })}
      </div>

      <h2 className={SECAO}>Pessoas da equipe<Botao className="cdf:ml-auto cdf:font-sans" onClick={() => setModalPessoa({ id: null })}>Nova pessoa da equipe</Botao></h2>
      {!equipe.length ? (
        <Vazio>Ninguém cadastrado como equipe ainda.</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Nome</Th><Th>Núcleos</Th><Th>Responsável por</Th><Th className={NUM}>Tarefas abertas</Th><Th className={NUM}>Atrasadas</Th><Th>Contato</Th>
              <Th><span className="cdf:sr-only">Ações</span></Th>
            </tr>
          </thead>
          <tbody>
            {equipe.map((d) => {
              const minhas = Object.values(base.tarefas).filter((t) => respEfetivo(base, t) === d.id);
              const abertas = minhas.filter(tarefaAberta).length;
              const atrasadas = minhas.filter(tarefaAtrasada).length;
              const c = d.contato || { nome: "", email: "", telefone: "" };
              const responsavelPor = nucleos.filter((n) => n.responsavel === d.id).map((n) => n.nome).join(", ");
              const deNucleos = nucleosDe(base, d.id);
              return (
                <tr key={d.id}>
                  <Td><strong>{d.nome}</strong>{d.anotacoes && <small className={SUB}>{d.anotacoes}</small>}</Td>
                  <Td>{deNucleos.length ? deNucleos.map((n) => <Tag key={n.id}>{n.nome}</Tag>) : <span className="cdf:text-fraco">—</span>}</Td>
                  <Td>{responsavelPor || <span className="cdf:text-fraco">—</span>}</Td>
                  <Td className={NUM}>{abertas ? <button type="button" className={LINK} onClick={() => verTarefas({ resp: d.id })}>{abertas}</button> : "0"}</Td>
                  <Td className={NUM}>{atrasadas ? <span className="cdf:font-bold cdf:text-erro">{atrasadas}</span> : "0"}</Td>
                  <Td>{c.telefone || c.email ? <>{c.telefone}{c.email && <small className={SUB}>{c.email}</small>}</> : <span className="cdf:text-fraco">—</span>}</Td>
                  <Td className={ACOES}><Botao mini onClick={() => setModalPessoa({ id: d.id })}>Editar</Botao></Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}

      {modalNucleo && <ModalNucleo base={base} id={modalNucleo.id} aoFechar={() => setModalNucleo(null)} />}
      {modalPessoa && (
        <ModalCadastro base={base} id={modalPessoa.id} preset={modalPessoa.id ? undefined : { tipos: ["equipe"], status: "confirmado" }} aoFechar={() => setModalPessoa(null)} />
      )}
    </>
  );
}
