/* Espaços do festival: nome, tipo, capacidade, quem pode ocupar e quantos
   horários da grade já usam cada um. */
import { useState } from "react";
import { porNome } from "../calculo";
import { rotulo } from "../listas";
import type { Base } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { ACOES, BARRA, NOTA, TEXTO_LONGO } from "../ui/classes";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Revisar, Tag } from "../ui/Tag";
import { ModalEspaco } from "./ModalEspaco";

export function Espacos({ base }: { base: Base }) {
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const lista = Object.values(base.espacos).sort(porNome);
  const p = base.pagina;
  const naGrade = (id: string) => Object.values(base.slots).filter((s) => s.espaco === id).length;

  return (
    <>
      <div className={BARRA}>
        <p className={NOTA}>Cada espaço diz quais tipos de cadastro pode receber. A grade só vai oferecer quem cabe em cada espaço.</p>
        <Botao variante="primario" className="cdf:md:ml-auto" onClick={() => setModal({ id: null })}>Novo espaço</Botao>
      </div>
      {!lista.length ? (
        <Vazio>Nenhum espaço cadastrado. Use “Novo espaço”.</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Espaço</Th><Th>Tipo</Th><Th className={NUM}>Capacidade</Th><Th>Recebe</Th><Th className={NUM}>Na grade</Th><Th>Anotações</Th>
              <Th><span className="cdf:sr-only">Ações</span></Th>
            </tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <Td><strong>{e.nome}</strong>{e.revisar && <Revisar />}</Td>
                <Td>{rotulo(p, "tiposEspaco", e.tipo)}</Td>
                <Td className={NUM}>{e.capacidade != null ? Number(e.capacidade).toLocaleString("pt-BR") : <span className="cdf:text-fraco">—</span>}</Td>
                <Td>{(e.aceita || []).map((t) => <Tag key={t}>{rotulo(p, "tiposCadastro", t)}</Tag>)}</Td>
                <Td className={NUM}>{naGrade(e.id) || "—"}</Td>
                <Td><div className={TEXTO_LONGO}>{e.anotacoes || ""}</div></Td>
                <Td className={ACOES}><Botao mini aria-label={"Editar " + e.nome} onClick={() => setModal({ id: e.id })}>Editar</Botao></Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
      {modal && <ModalEspaco base={base} id={modal.id} aoFechar={() => setModal(null)} />}
    </>
  );
}
