/* Detalhamento do orçamento: filtros (busca, categoria, núcleo, momento,
   status), o valor do recorte e a tabela agrupada por categoria, com o
   status trocável na linha. Os filtros valem enquanto a página está aberta. */
import { Fragment, useState } from "react";
import { clonar } from "../../../utils";
import { MOMENTOS, brl, nomeCadastro, pctTexto, porNome, rotuloCenario, valorItem, vezesItem } from "../calculo";
import { gravar } from "../dados";
import { classeStatus, normalizar, opcoes, rotulo } from "../listas";
import type { Base, ItemOrcamento, Momento } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { ESTILO_CONTROLE_BASE, Opcoes } from "../ui/Campo";
import { ACOES, BARRA, SUB } from "../ui/classes";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Revisar, SelecaoStatus } from "../ui/Tag";
import { ModalItem } from "./ModalItem";

interface Filtros { busca: string; categoria: string; nucleo: string; momento: Momento | ""; status: string }
let filtrosLembrados: Filtros = { busca: "", categoria: "", nucleo: "", momento: "", status: "" };

export function Detalhamento({ base }: { base: Base }) {
  const [f, setF] = useState<Filtros>(filtrosLembrados);
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const p = base.pagina;
  const cenario = p.simulador.cenario;
  const mudarF = (parte: Partial<Filtros>) => { filtrosLembrados = { ...filtrosLembrados, ...parte }; setF(filtrosLembrados); };
  const mudarStatus = (it: ItemOrcamento, status: string) => gravar("orcamento_itens", { ...clonar(it), status });

  const q = normalizar(f.busca.trim());
  const so = f.momento || undefined;
  const todos = Object.values(base.orcamento_itens);
  const visiveis = todos.filter((it) =>
    (!f.categoria || it.categoria === f.categoria) && (!f.nucleo || it.nucleo === f.nucleo) && (!f.status || it.status === f.status)
    && (!so || vezesItem(it, so) > 0)
    && (!q || normalizar([it.nome, it.anotacoes, it.fornecedor ? nomeCadastro(base, it.fornecedor) : ""].join(" ")).includes(q)));
  const totalRecorte = visiveis.reduce((t, it) => t + valorItem(it, cenario, so), 0);
  const totalGeral = todos.reduce((t, it) => t + valorItem(it, cenario), 0);
  const categorias = [...p.listas.categoriasOrcamento.map((c) => c.id), "_sem"];
  const select = ESTILO_CONTROLE_BASE + " cdf:w-auto cdf:flex-[0_1_190px]";

  return (
    <>
      <div className={BARRA}>
        <input type="search" aria-label="Buscar" placeholder="Buscar item, fornecedor ou anotação" value={f.busca} onChange={(e) => mudarF({ busca: e.target.value })} className={ESTILO_CONTROLE_BASE + " cdf:flex-[1_1_240px]"} />
        <select aria-label="Categoria" value={f.categoria} onChange={(e) => mudarF({ categoria: e.target.value })} className={select}><Opcoes lista={opcoes(p, "categoriasOrcamento", "Todas as categorias")} /></select>
        <select aria-label="Núcleo" value={f.nucleo} onChange={(e) => mudarF({ nucleo: e.target.value })} className={select}><Opcoes lista={opcoes(p, "nucleos", "Todos os núcleos")} /></select>
        <select aria-label="Momento" value={f.momento} onChange={(e) => mudarF({ momento: e.target.value as Momento | "" })} className={select}><Opcoes lista={opcoes(p, "momentos", "Todos os momentos")} /></select>
        <select aria-label="Status" value={f.status} onChange={(e) => mudarF({ status: e.target.value })} className={select}><Opcoes lista={opcoes(p, "statusOrcamento", "Todos os status")} /></select>
        <Botao variante="primario" className="cdf:md:ml-auto" onClick={() => setModal({ id: null })}>Novo item</Botao>
      </div>
      <p className="cdf:m-0 cdf:mb-2 cdf:text-sm cdf:text-fraco">
        {visiveis.length} de {todos.length} itens. Valor do recorte: <strong>{brl(totalRecorte)}</strong>
        {so ? ", só a parte de " + rotulo(p, "momentos", so) : ""} (cenário {rotuloCenario(cenario)}, sem contingência).
      </p>
      {!visiveis.length ? (
        <Vazio>Nenhum item com esses filtros.</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Item</Th><Th>Núcleo</Th><Th className={NUM}>Quantos</Th><Th className={NUM}>Vezes</Th><Th className={NUM}>Unitário</Th><Th className={NUM}>Total</Th><Th>Status</Th>
              <Th><span className="cdf:sr-only">Ações</span></Th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((cid) => {
              const itens = visiveis.filter((it) => (it.categoria || "_sem") === cid).sort((a, b) => (a.ordem || 999) - (b.ordem || 999) || porNome(a, b));
              if (!itens.length) return null;
              const subtotal = itens.reduce((t, it) => t + valorItem(it, cenario, so), 0);
              return (
                <Fragment key={cid}>
                  <tr className="cdf:[&>td]:bg-superficie-2 cdf:[&>td]:font-bold">
                    <Td colSpan={5}>{cid === "_sem" ? "Sem categoria" : rotulo(p, "categoriasOrcamento", cid)}<span className="cdf:ml-2 cdf:font-normal cdf:text-fraco">{pctTexto(subtotal, totalGeral)} do orçamento</span></Td>
                    <Td className={NUM}>{brl(subtotal)}</Td>
                    <Td colSpan={2} />
                  </tr>
                  {itens.map((it) => {
                    const distribuicao = MOMENTOS.filter((k) => Number(it.distribuicao?.[k])).map((k) => rotulo(p, "momentos", k) + " " + it.distribuicao[k]).join(", ");
                    return (
                      <tr key={it.id}>
                        <Td>
                          <strong>{it.nome}</strong>{it.revisar && <Revisar />}
                          {it.fornecedor && <span className="cdf:block cdf:text-[13px] cdf:text-tinta-2">Fornecedor: {nomeCadastro(base, it.fornecedor)}</span>}
                          {it.anotacoes && <small className={SUB}>{it.anotacoes}</small>}
                        </Td>
                        <Td>{rotulo(p, "nucleos", it.nucleo)}</Td>
                        <Td className={NUM}>{(Number(it.quantidade) || 0).toLocaleString("pt-BR")}{it.unidade && <small className={SUB}>{it.unidade}</small>}</Td>
                        <Td className={NUM}>
                          {vezesItem(it, so)}{it.unidadeVezes && <small className={SUB}>{it.unidadeVezes}</small>}
                          {!so && distribuicao && <span className="cdf:block cdf:whitespace-normal cdf:text-[12.5px] cdf:text-fraco">{distribuicao}</span>}
                        </Td>
                        <Td className={NUM}>{brl(it.unitario?.[cenario])}</Td>
                        <Td className={NUM}><strong>{brl(valorItem(it, cenario, so))}</strong></Td>
                        <Td>
                          <SelecaoStatus classe={classeStatus(it.status)} value={it.status} aria-label="Status" onChange={(e) => mudarStatus(it, e.target.value)}>
                            <Opcoes lista={opcoes(p, "statusOrcamento")} />
                          </SelecaoStatus>
                        </Td>
                        <Td className={ACOES}><Botao mini onClick={() => setModal({ id: it.id })}>Editar</Botao></Td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </Tabela>
      )}
      {modal && <ModalItem base={base} id={modal.id} preset={modal.id ? undefined : { categoria: f.categoria, nucleo: f.nucleo || null }} aoFechar={() => setModal(null)} />}
    </>
  );
}
