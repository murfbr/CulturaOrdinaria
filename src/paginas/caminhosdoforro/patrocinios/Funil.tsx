/* Patrocínios: o funil (uma caixa por etapa, com quantidade e valor; clicar
   filtra) e a tabela, com a etapa trocável na própria linha. O filtro vale
   enquanto a página está aberta. */
import { useState } from "react";
import { clonar } from "../../../utils";
import { cx } from "../../../utils/classes";
import { brl, dataBr, nomeCadastro, nomeCota, ordemEtapa } from "../calculo";
import { gravar } from "../dados";
import { classeStatus, opcoes, rotulo } from "../listas";
import type { Base, Patrocinio } from "../tipos";
import { LinkArquivo } from "../ui/Arquivo";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { Opcoes } from "../ui/Campo";
import { ACOES, BARRA, LINK, NOTA, TEXTO_LONGO } from "../ui/classes";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Revisar, SelecaoStatus } from "../ui/Tag";
import type { IrPara } from "../vista";
import { ModalPatrocinio } from "./ModalPatrocinio";
import { ResumoCaptacao } from "./ResumoCaptacao";

let etapaLembrada = "";

export function Funil({ base, irPara }: { base: Base; irPara: IrPara }) {
  const [etapaFiltro, setEtapaFiltro] = useState(etapaLembrada);
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const p = base.pagina;
  const etapas = p.listas.etapasFunil;
  const todos = Object.values(base.patrocinios);
  const escolher = (id: string) => { etapaLembrada = id; setEtapaFiltro(id); };
  const mudarEtapa = (x: Patrocinio, etapa: string) => gravar("patrocinios", { ...clonar(x), etapa });

  const lista = todos
    .filter((x) => !etapaFiltro || x.etapa === etapaFiltro)
    .sort((a, b) => ordemEtapa(base, a.etapa) - ordemEtapa(base, b.etapa) || nomeCadastro(base, a.empresa).localeCompare(nomeCadastro(base, b.empresa), "pt"));

  return (
    <>
      <ResumoCaptacao base={base} irPara={irPara} />
      <ol aria-label="Funil de patrocínio" className="cdf:m-0 cdf:mb-4 cdf:flex cdf:list-none cdf:gap-1.5 cdf:overflow-x-auto cdf:p-0 cdf:pb-1">
        {etapas.map((e) => {
          const ps = todos.filter((x) => x.etapa === e.id);
          const v = ps.reduce((t, x) => t + (Number(x.valor) || 0), 0);
          const sel = etapaFiltro === e.id;
          return (
            <li key={e.id} className="cdf:flex-[1_0_132px]">
              <button
                type="button" aria-pressed={sel} onClick={() => escolher(sel ? "" : e.id)}
                className={cx(
                  "cdf:flex cdf:h-full cdf:w-full cdf:cursor-pointer cdf:flex-col cdf:gap-0.5 cdf:rounded-[10px] cdf:border-[1.5px] cdf:border-solid cdf:px-3 cdf:py-2.5 cdf:text-left cdf:text-tinta cdf:hover:border-tinta-2",
                  sel ? "cdf:border-primaria cdf:bg-primaria-suave" : "cdf:border-linha cdf:bg-superficie",
                )}
              >
                <span className="cdf:text-sm cdf:font-bold cdf:text-tinta-2">{e.nome}</span>
                <span className="cdf:font-display cdf:text-3xl cdf:font-black cdf:leading-none">{ps.length}</span>
                <span className="cdf:min-h-[1.2em] cdf:text-[13px] cdf:tabular-nums cdf:text-fraco">{v ? brl(v) : ""}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className={BARRA}>
        <p className={NOTA}>
          {etapaFiltro
            ? <>Mostrando só “{rotulo(p, "etapasFunil", etapaFiltro)}”. <button type="button" className={LINK} onClick={() => escolher("")}>Mostrar todas</button></>
            : "Clique numa etapa para filtrar."}
        </p>
        <Botao variante="primario" className="cdf:md:ml-auto" onClick={() => setModal({ id: null })}>Novo patrocínio</Botao>
      </div>
      {!lista.length ? (
        <Vazio>{todos.length ? "Nenhum patrocínio nesta etapa." : "Nenhum patrocínio registrado. Use “Novo patrocínio”."}</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Empresa</Th><Th>Cota</Th><Th className={NUM}>Valor</Th><Th>Etapa</Th><Th>Último contato</Th><Th>Próximo passo</Th><Th>Proposta</Th>
              <Th><span className="cdf:sr-only">Ações</span></Th>
            </tr>
          </thead>
          <tbody>
            {lista.map((x) => (
              <tr key={x.id}>
                <Td><strong>{nomeCadastro(base, x.empresa)}</strong>{x.revisar && <Revisar />}</Td>
                <Td>{nomeCota(base, x.cota)}</Td>
                <Td className={NUM}>{brl(x.valor)}</Td>
                <Td>
                  <SelecaoStatus classe={classeStatus(x.etapa)} value={x.etapa} aria-label="Etapa" onChange={(e) => mudarEtapa(x, e.target.value)}>
                    <Opcoes lista={opcoes(p, "etapasFunil")} />
                  </SelecaoStatus>
                </Td>
                <Td className={NUM}>{dataBr(x.ultimoContato)}</Td>
                <Td><div className={TEXTO_LONGO}>{x.proximoPasso || ""}</div></Td>
                <Td><LinkArquivo arquivo={x.proposta} /></Td>
                <Td className={ACOES}><Botao mini onClick={() => setModal({ id: x.id })}>Editar</Botao></Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
      {modal && <ModalPatrocinio base={base} id={modal.id} aoFechar={() => setModal(null)} />}
    </>
  );
}
