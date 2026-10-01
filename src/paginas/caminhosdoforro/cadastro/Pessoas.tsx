/* Pessoas e organizações: filtros (busca, tipo, status, núcleo, só a
   revisar), atalhos, a tabela com o status editável na linha e a linha
   expandida com histórico e detalhes. Os filtros valem enquanto a página está
   aberta, como o S.f do artefato. */
import { Fragment, useState } from "react";
import { clonar } from "../../../utils";
import { dataBr, porNome, temTipo, ultimoContato } from "../calculo";
import { gravar } from "../dados";
import { classeStatus, normalizar, opcoes, rotulo } from "../listas";
import type { Base, Cadastro } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { Check, ESTILO_CONTROLE_BASE, Opcoes } from "../ui/Campo";
import { ACOES, BARRA, LINK, SUB } from "../ui/classes";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Revisar, SelecaoStatus, Tag } from "../ui/Tag";
import { DetalheCadastro } from "./DetalheCadastro";
import { ModalCadastro } from "./ModalCadastro";

interface Filtros { busca: string; tipo: string; status: string; nucleo: string; revisar: boolean }
const LIMPO: Filtros = { busca: "", tipo: "", status: "", nucleo: "", revisar: false };
let filtrosLembrados: Filtros = LIMPO;
let abertosLembrados: string[] = [];

/** [rótulo, tipo, status]; sem tipo = limpar. */
const ATALHOS: [string, string, string][] = [
  ["Line-up confirmado", "artista", "confirmado"], ["DJs confirmados", "dj", "confirmado"], ["Oficineiros", "oficineiro", ""],
  ["Parceiros institucionais", "parceiro_institucional", ""], ["Equipe", "equipe", ""], ["Limpar filtros", "", ""],
];

function filtrar(base: Base, f: Filtros): Cadastro[] {
  const q = normalizar(f.busca.trim());
  return Object.values(base.cadastro).filter((d) => {
    if (f.tipo && !temTipo(d, f.tipo)) return false;
    if (f.status && d.status !== f.status) return false;
    if (f.nucleo === "_sem" && d.nucleo) return false;
    if (f.nucleo && f.nucleo !== "_sem" && d.nucleo !== f.nucleo) return false;
    if (f.revisar && !d.revisar) return false;
    if (q) {
      const c = d.contato || { nome: "", email: "", telefone: "" };
      if (!normalizar([d.nome, c.nome, c.email, c.telefone, d.anotacoes].join(" ")).includes(q)) return false;
    }
    return true;
  }).sort(porNome);
}

export function Pessoas({ base }: { base: Base }) {
  const [f, setF] = useState<Filtros>(filtrosLembrados);
  const [abertos, setAbertos] = useState<string[]>(abertosLembrados);
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const p = base.pagina;

  const mudarF = (parte: Partial<Filtros>) => { filtrosLembrados = { ...filtrosLembrados, ...parte }; setF(filtrosLembrados); };
  const alternar = (id: string) => {
    abertosLembrados = abertos.includes(id) ? abertos.filter((x) => x !== id) : [...abertos, id];
    setAbertos(abertosLembrados);
  };
  const mudarStatus = (d: Cadastro, status: string) => gravar("cadastro", { ...clonar(d), status });

  const todos = Object.keys(base.cadastro).length;
  const lista = filtrar(base, f);
  const rev = lista.filter((d) => d.revisar).length;
  const select = ESTILO_CONTROLE_BASE + " cdf:w-auto cdf:flex-[0_1_190px]";

  return (
    <>
      <div className={BARRA}>
        <input
          type="search" aria-label="Buscar" placeholder="Buscar por nome, contato ou anotação" value={f.busca}
          onChange={(e) => mudarF({ busca: e.target.value })} className={ESTILO_CONTROLE_BASE + " cdf:flex-[1_1_240px]"}
        />
        <select aria-label="Tipo" value={f.tipo} onChange={(e) => mudarF({ tipo: e.target.value })} className={select}><Opcoes lista={opcoes(p, "tiposCadastro", "Todos os tipos")} /></select>
        <select aria-label="Status" value={f.status} onChange={(e) => mudarF({ status: e.target.value })} className={select}><Opcoes lista={opcoes(p, "statusContato", "Todos os status")} /></select>
        <select aria-label="Núcleo" value={f.nucleo} onChange={(e) => mudarF({ nucleo: e.target.value })} className={select}>
          <Opcoes lista={opcoes(p, "nucleos", "Todos os núcleos")} /><option value="_sem">Sem núcleo</option>
        </select>
        <Check rotulo="Só a revisar" checked={f.revisar} onChange={(e) => mudarF({ revisar: e.target.checked })} />
        <Botao variante="primario" className="cdf:md:ml-auto" onClick={() => setModal({ id: null })}>Novo cadastro</Botao>
      </div>
      <div className="cdf:mb-4 cdf:flex cdf:flex-wrap cdf:items-center cdf:gap-1.5 cdf:text-sm cdf:text-fraco">
        <span>Atalhos:</span>
        {ATALHOS.map(([nome, tipo, status]) => (
          <button
            key={nome} type="button" onClick={() => mudarF({ ...LIMPO, tipo, status })}
            className="cdf:cursor-pointer cdf:rounded-full cdf:border-0 cdf:bg-conf-bg cdf:px-3 cdf:py-1 cdf:text-sm cdf:text-conf cdf:hover:underline"
          >
            {nome}
          </button>
        ))}
      </div>

      {!todos ? (
        <Vazio>Nenhum cadastro ainda. Use “Novo cadastro” para começar.</Vazio>
      ) : (
        <>
          <p className="cdf:m-0 cdf:mb-2 cdf:text-sm cdf:text-fraco">{lista.length} de {todos} registros{rev ? `, ${rev} a revisar` : ""}</p>
          {!lista.length ? (
            <Vazio>Nada encontrado com esses filtros. <button type="button" className={LINK} onClick={() => mudarF(LIMPO)}>Limpar filtros</button></Vazio>
          ) : (
            <Tabela>
              <thead>
                <tr>
                  <Th>Nome</Th><Th>Tipo</Th><Th>Status</Th><Th>Núcleo que cuida</Th><Th>Contato</Th><Th>Carta</Th><Th>Último contato</Th>
                  <Th><span className="cdf:sr-only">Ações</span></Th>
                </tr>
              </thead>
              <tbody>
                {lista.map((d) => {
                  const aberto = abertos.includes(d.id);
                  const c = d.contato || { nome: "", email: "", telefone: "" };
                  const ultimo = ultimoContato(d);
                  return (
                    <Fragment key={d.id}>
                      <tr className={aberto ? "cdf:[&>td]:bg-superficie-2" : ""}>
                        <Td>
                          <button
                            type="button" aria-expanded={aberto} onClick={() => alternar(d.id)}
                            className="cdf:inline-flex cdf:cursor-pointer cdf:items-baseline cdf:gap-2 cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:text-left cdf:font-bold cdf:text-tinta"
                          >
                            <span aria-hidden="true" className="cdf:text-xs cdf:text-fraco">{aberto ? "▼" : "▶"}</span>{d.nome}
                          </button>
                          {d.revisar && <Revisar />}
                        </Td>
                        <Td>{(d.tipos || []).map((t) => <Tag key={t}>{rotulo(p, "tiposCadastro", t)}</Tag>)}</Td>
                        <Td>
                          <SelecaoStatus classe={classeStatus(d.status)} value={d.status} aria-label={"Status de " + d.nome} onChange={(e) => mudarStatus(d, e.target.value)}>
                            <Opcoes lista={opcoes(p, "statusContato")} />
                          </SelecaoStatus>
                        </Td>
                        <Td>{rotulo(p, "nucleos", d.nucleo)}</Td>
                        <Td>{c.nome || c.telefone ? <>{c.nome}{c.telefone && <small className={SUB}>{c.telefone}</small>}</> : <span className="cdf:text-fraco">—</span>}</Td>
                        <Td>{rotulo(p, "cartaAnuencia", d.carta)}</Td>
                        <Td className={NUM}>{ultimo ? dataBr(ultimo) : "—"}</Td>
                        <Td className={ACOES}><Botao mini aria-label={"Editar " + d.nome} onClick={() => setModal({ id: d.id })}>Editar</Botao></Td>
                      </tr>
                      {aberto && (
                        <tr>
                          <Td colSpan={8} className="cdf:bg-superficie-2 cdf:pb-[18px] cdf:pt-1">
                            <DetalheCadastro base={base} d={d} aoEditar={() => setModal({ id: d.id })} />
                          </Td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </Tabela>
          )}
        </>
      )}

      {modal && <ModalCadastro base={base} id={modal.id} aoFechar={() => setModal(null)} />}
    </>
  );
}
