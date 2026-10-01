/* Parceiros institucionais: quem é (do cadastro, com o status de lá),
   categoria, o que oferece e o que recebe. */
import { useState } from "react";
import { nomeCadastro } from "../calculo";
import { classeStatus, rotulo } from "../listas";
import type { Base } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { ACOES, BARRA, NOTA, SUB, TEXTO_LONGO } from "../ui/classes";
import { Tabela, Td, Th } from "../ui/Tabela";
import { Pilula, Revisar } from "../ui/Tag";
import { ModalParceiro } from "./ModalParceiro";

export function Parceiros({ base }: { base: Base }) {
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const p = base.pagina;
  const lista = Object.values(base.parceiros).sort((a, b) =>
    rotulo(p, "categoriasParceiro", a.categoria).localeCompare(rotulo(p, "categoriasParceiro", b.categoria), "pt")
    || nomeCadastro(base, a.parceiro).localeCompare(nomeCadastro(base, b.parceiro), "pt"));

  return (
    <>
      <div className={BARRA}>
        <p className={NOTA}>O status vem do cadastro geral. Aqui fica o que cada parceiro oferece e o que recebe.</p>
        <Botao variante="primario" className="cdf:md:ml-auto" onClick={() => setModal({ id: null })}>Novo parceiro institucional</Botao>
      </div>
      {!lista.length ? (
        <Vazio>Nenhum parceiro institucional registrado.</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr><Th>Parceiro</Th><Th>Categoria</Th><Th>Status</Th><Th>Oferece</Th><Th>Recebe</Th><Th><span className="cdf:sr-only">Ações</span></Th></tr>
          </thead>
          <tbody>
            {lista.map((x) => {
              const c = base.cadastro[x.parceiro];
              return (
                <tr key={x.id}>
                  <Td><strong>{nomeCadastro(base, x.parceiro)}</strong>{x.revisar && <Revisar />}{c?.contato?.nome && <small className={SUB}>{c.contato.nome}</small>}</Td>
                  <Td>{rotulo(p, "categoriasParceiro", x.categoria)}</Td>
                  <Td>{c?.status ? <Pilula classe={classeStatus(c.status)}>{rotulo(p, "statusContato", c.status)}</Pilula> : "—"}</Td>
                  <Td><div className={TEXTO_LONGO}>{x.oferece || "—"}</div></Td>
                  <Td><div className={TEXTO_LONGO}>{x.recebe || "—"}</div></Td>
                  <Td className={ACOES}><Botao mini onClick={() => setModal({ id: x.id })}>Editar</Botao></Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}
      {modal && <ModalParceiro base={base} id={modal.id} aoFechar={() => setModal(null)} />}
    </>
  );
}
