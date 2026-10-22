/* Aba Redes do núcleo de comunicação: os canais do festival (lista editável,
   guardada na configuração da página) e a tabela com Instagram, seguidores,
   outras redes e, nas atrações, o mídia-kit de todo o cadastro. Os
   indicadores de alcance ficam no painel do núcleo. */
import { useState } from "react";
import { dataBr, nomeCadastro } from "../calculo";
import { linkInstagram, redesDe } from "../cadastro/redes";
import { classeStatus, rotulo } from "../listas";
import { STATUS_CANAL, type Base, type Nucleo } from "../tipos";
import { Botao } from "../ui/Botao";
import { SECAO } from "../ui/classes";
import { Segmentado } from "../ui/Segmentado";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Pilula } from "../ui/Tag";
import type { IrPara } from "../vista";
import { GRUPOS, alcance, comAlcance, grupoDe, porSeguidores, somar } from "./alcance";
import { ModalCanal } from "./ModalCanal";

interface Props { base: Base; nucleo: Nucleo; irPara: IrPara }

const n = (v: number) => v.toLocaleString("pt-BR");
const curto = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").slice(0, 48);

export function AbaRedes({ base, irPara }: Props) {
  const p = base.pagina;
  const [so, setSo] = useState<"confirmados" | "todos">("todos");
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const { todos, semInstagram } = alcance(base);
  const visiveis = (so === "confirmados" ? todos.filter((d) => d.status === "confirmado") : todos).sort(porSeguidores);
  const canais = [...(p.canais || [])].sort((a, b) => a.ordem - b.ordem);
  const noAr = canais.filter((c) => c.status === "no_ar").length;

  return (
    <>
      <h2 className={SECAO}>Canais do festival<Botao mini variante="primario" className="cdf:ml-auto cdf:font-sans" onClick={() => setModal({ id: null })}>Novo canal</Botao></h2>
      <p className="cdf:m-0 cdf:mb-2.5 cdf:text-sm cdf:text-fraco">
        {canais.length ? noAr + " de " + canais.length + " no ar. " : ""}Por onde o festival fala com o público, a imprensa e os parceiros: quem cuida, em que pé está e o link.
      </p>
      {!canais.length ? (
        <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Nenhum canal cadastrado. Comece pelos que já estão em conversa: Instagram (orçamento pedido à agência em 09/10), site, imprensa (release e mailing, COM-007) e WhatsApp.</p>
      ) : (
        <Tabela>
          <thead><tr><Th>Canal</Th><Th>Quem cuida</Th><Th>Status</Th><Th>Link</Th><Th>Anotações</Th><Th><span className="cdf:sr-only">Ações</span></Th></tr></thead>
          <tbody>
            {canais.map((c) => (
              <tr key={c.id}>
                <Td><strong>{c.nome}</strong></Td>
                <Td>{c.responsavel ? nomeCadastro(base, c.responsavel) : <span className="cdf:text-fraco">—</span>}</Td>
                <Td><Pilula classe={classeStatus(c.status)}>{STATUS_CANAL.find(([id]) => id === c.status)?.[1] || c.status}</Pilula></Td>
                <Td>{c.url ? <a href={c.url} target="_blank" rel="noopener" className="cdf:text-link">{curto(c.url)}</a> : <span className="cdf:text-fraco">—</span>}</Td>
                <Td className="cdf:max-w-[36ch] cdf:whitespace-pre-line cdf:text-sm cdf:text-tinta-2">{c.anotacoes || <span className="cdf:text-fraco">—</span>}</Td>
                <Td className="cdf:w-[1%] cdf:whitespace-nowrap cdf:text-right"><Botao mini aria-label={"Editar " + c.nome} onClick={() => setModal({ id: c.id })}>Editar</Botao></Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}

      <h2 className={SECAO}>Redes de quem está no festival<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("cadastro")}>Cadastro</Botao></h2>
      {semInstagram.length > 0 && <p className="cdf:m-0 cdf:mb-2.5 cdf:text-sm cdf:text-fraco">Confirmados sem Instagram: {semInstagram.map((d) => d.nome).join(", ")}.</p>}
      <div className="cdf:mb-2.5"><Segmentado valor={so} aoMudar={setSo} opcoes={[["todos", "Todos"], ["confirmados", "Só confirmados"]]} rotulo="Quem mostrar" /></div>
      {GRUPOS.map((g) => {
        const lista = visiveis.filter((d) => grupoDe(d) === g.id);
        if (!lista.length) return null;
        const soma = somar(lista);
        const atracoes = g.id === "atracoes";
        return (
          <section key={g.id} className="cdf:mb-5">
            <h3 className="cdf:m-0 cdf:mb-1.5 cdf:mt-4 cdf:text-base cdf:font-bold cdf:text-tinta">{g.titulo} <span className="cdf:font-normal cdf:text-fraco">· {lista.length}</span></h3>
            {g.nota && <p className="cdf:m-0 cdf:mb-2 cdf:text-[13.5px] cdf:text-fraco">{g.nota}</p>}
            <Tabela>
              <thead><tr><Th>Quem</Th><Th>Status</Th><Th>Instagram</Th><Th className={NUM}>Seguidores</Th><Th>Contados em</Th><Th>Outras redes</Th>{atracoes && <Th>Mídia-kit</Th>}</tr></thead>
              <tbody>
                {lista.map((d) => (
                  <tr key={d.id}>
                    <Td><strong>{d.nome}</strong></Td>
                    <Td><Pilula classe={classeStatus(d.status)}>{rotulo(p, "statusContato", d.status)}</Pilula></Td>
                    <Td>{d.instagram ? <a href={linkInstagram(d.instagram)} target="_blank" rel="noopener" className="cdf:text-link">@{d.instagram}</a> : <span className="cdf:text-fraco">—</span>}</Td>
                    <Td className={NUM}>{comAlcance(d) ? n(Number(d.seguidores)) : <span className="cdf:text-fraco">—</span>}</Td>
                    <Td className="cdf:whitespace-nowrap">{d.seguidoresEm ? dataBr(d.seguidoresEm) : <span className="cdf:text-fraco">—</span>}</Td>
                    <Td>{redesDe(d).length ? redesDe(d).map((r, i) => <span key={r.rede}>{i > 0 && " · "}<a href={r.url} target="_blank" rel="noopener" className="cdf:text-link">{r.nome}</a></span>) : <span className="cdf:text-fraco">—</span>}</Td>
                    {atracoes && <Td>{d.midiaKit ? <a href={d.midiaKit} target="_blank" rel="noopener" className="cdf:text-link">abrir</a> : <span className="cdf:text-fraco">falta</span>}</Td>}
                  </tr>
                ))}
                {soma > 0 && <tr className="cdf:font-bold"><Td colSpan={3}>{g.soma ? "Soma" : "Soma (fora do alcance do festival)"}</Td><Td className={NUM}>{n(soma)}</Td><Td colSpan={atracoes ? 3 : 2} /></tr>}
              </tbody>
            </Tabela>
          </section>
        );
      })}

      {modal && <ModalCanal base={base} id={modal.id} aoFechar={() => setModal(null)} />}
    </>
  );
}
