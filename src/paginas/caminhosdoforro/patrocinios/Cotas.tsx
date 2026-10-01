/* Cotas de patrocínio: valor, quantas já foram vendidas (patrocínios
   confirmados), inventário e contrapartidas. */
import { useState } from "react";
import { brl, cotasOrdenadas, vendidasPorCota } from "../calculo";
import type { Base } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { ACOES, BARRA, NOTA, SUB, TEXTO_LONGO } from "../ui/classes";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Revisar } from "../ui/Tag";
import type { IrPara } from "../vista";
import { ModalCota } from "./ModalCota";
import { ResumoCaptacao } from "./ResumoCaptacao";

export function Cotas({ base, irPara }: { base: Base; irPara: IrPara }) {
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const vendidas = vendidasPorCota(base);
  const lista = cotasOrdenadas(base);
  return (
    <>
      <ResumoCaptacao base={base} irPara={irPara} />
      <div className={BARRA}>
        <p className={NOTA}>Estes valores alimentam as apresentações comerciais e o simulador do orçamento.</p>
        <Botao variante="primario" className="cdf:md:ml-auto" onClick={() => setModal({ id: null })}>Nova cota</Botao>
      </div>
      {!lista.length ? (
        <Vazio>Nenhuma cota cadastrada.</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Cota</Th><Th className={NUM}>Valor</Th><Th className={NUM}>Vendidas</Th><Th className={NUM}>Inventário</Th><Th>Contrapartidas</Th>
              <Th><span className="cdf:sr-only">Ações</span></Th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => {
              const q = c.quantidade;
              const v = Number(c.valor) || 0;
              return (
                <tr key={c.id}>
                  <Td><strong>{c.nome}</strong>{c.revisar && <Revisar />}{c.anotacoes && <small className={SUB}>{c.anotacoes}</small>}</Td>
                  <Td className={NUM}>{v ? brl(v) : <span className="cdf:text-fraco">variável</span>}</Td>
                  <Td className={NUM}>{(vendidas[c.id] || 0) + (q ? " de " + q : "")}</Td>
                  <Td className={NUM}>{v && q ? brl(v * q) : "—"}</Td>
                  <Td><div className={TEXTO_LONGO}>{c.contrapartidas || ""}</div></Td>
                  <Td className={ACOES}><Botao mini aria-label={"Editar cota " + c.nome} onClick={() => setModal({ id: c.id })}>Editar</Botao></Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}
      {modal && <ModalCota base={base} id={modal.id} aoFechar={() => setModal(null)} />}
    </>
  );
}
