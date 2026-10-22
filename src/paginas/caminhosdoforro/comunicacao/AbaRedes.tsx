/* Aba Redes do núcleo de comunicação: o alcance (atrações e parceiros,
   confirmados e em conversa), a tabela com Instagram, seguidores e as outras
   redes de todo o cadastro, os canais do festival e, no fim, as tarefas e o
   orçamento desta frente. Nada aqui grava dado: as redes vêm do cadastro. */
import { useState } from "react";
import { dataBr, porNome, temTipo } from "../calculo";
import { linkInstagram, redesDe } from "../cadastro/redes";
import { classeStatus, rotulo } from "../listas";
import type { Base, Cadastro, Nucleo } from "../tipos";
import { Botao } from "../ui/Botao";
import { SECAO, TEXTO_LONGO } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { Segmentado } from "../ui/Segmentado";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Pilula, Tag } from "../ui/Tag";
import type { AbaNucleo, IrPara } from "../vista";
import { BlocoFrente } from "./BlocoFrente";

const comAlcance = (d: Cadastro) => Number(d.seguidores) > 0;

const n = (v: number) => v.toLocaleString("pt-BR");

/** Os grupos da tabela de redes, na ordem da tela; cada cadastro cai no primeiro grupo em que um tipo seu aparece. */
const GRUPOS: { id: string; titulo: string; tipos: string[]; soma: boolean; nota?: string }[] = [
  { id: "atracoes", titulo: "Atrações", tipos: ["artista", "dj", "oficineiro", "danca", "mediador", "artista_visual"], soma: true },
  { id: "parceiros", titulo: "Parceiros", tipos: ["parceiro_institucional", "parceiro_cultural", "gastronomia", "fornecedor"], soma: true },
  { id: "patrocinio", titulo: "Patrocinadores e empresas em prospecção", tipos: ["patrocinador"], soma: false, nota: "Fora da soma: é o público da marca, não do festival. Serve para marcar a empresa nas peças e para conhecer o tamanho de quem se procura." },
  { id: "equipe", titulo: "Equipe e captação", tipos: ["equipe", "captador"], soma: false },
];
const grupoDe = (d: Cadastro) => GRUPOS.find((g) => g.tipos.some((t) => temTipo(d, t)))?.id || "outros";
/** Entra na conta das apresentações ("atrações e parceiros"). */
const contaNaSoma = (d: Cadastro) => !!GRUPOS.find((g) => g.id === grupoDe(d))?.soma;
const porSeguidores = (a: Cadastro, b: Cadastro) => (Number(b.seguidores) || 0) - (Number(a.seguidores) || 0) || porNome(a, b);


interface Props { base: Base; nucleo: Nucleo; irPara: IrPara; abrirAba: (a: AbaNucleo) => void }

export function AbaRedes({ base, nucleo, irPara, abrirAba }: Props) {
  const p = base.pagina;
  // Redes e alcance: a soma das apresentações conta atrações e parceiros; os confirmados separados de quem ainda está em conversa.
  const [so, setSo] = useState<"confirmados" | "todos">("todos");
  const todos = Object.values(base.cadastro);
  const naSoma = todos.filter(contaNaSoma);
  const confirmados = naSoma.filter((d) => d.status === "confirmado");
  const emConversa = naSoma.filter((d) => d.status !== "confirmado" && d.status !== "recusou");
  const somar = (lista: Cadastro[]) => lista.filter(comAlcance).reduce((t, d) => t + Number(d.seguidores), 0);
  const alcance = somar(confirmados);
  const alcancePossivel = somar(emConversa);
  const semInstagram = confirmados.filter((d) => !d.instagram);
  const comInstagram = todos.filter((d) => d.instagram).length;
  const datas = todos.map((d) => d.seguidoresEm).filter((x): x is string => !!x).sort();
  const visiveis = (so === "confirmados" ? todos.filter((d) => d.status === "confirmado") : todos).sort(porSeguidores);


  return (
    <>
      <Resumo
        itens={[
          { titulo: "Alcance dos confirmados", valor: alcance ? n(alcance) : "—", sub: alcance ? confirmados.filter(comAlcance).length + " perfis de atrações e parceiros confirmados" : "Informe seguidores no cadastro de cada atração" },
          { titulo: "Ainda não confirmados", valor: alcancePossivel ? "+" + n(alcancePossivel) : "—", sub: emConversa.filter(comAlcance).length + " perfis de atrações e parceiros em conversa ou a contatar" },
          { titulo: "Confirmados sem Instagram", valor: semInstagram.length, sub: "atrações e parceiros", classeValor: semInstagram.length ? "cdf:text-conversa" : undefined },
        ]}
      />

      <h2 className={SECAO}>Redes de quem está no festival<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("cadastro")}>Cadastro</Botao></h2>
      <p className="cdf:m-0 cdf:mb-2.5 cdf:max-w-[820px] cdf:text-sm cdf:text-fraco">
        Instagram, seguidores e as outras redes de cada cadastro, para marcar nas peças e para a conta de alcance. As apresentações falam em “mais de 450 mil seguidores somados” entre atrações e parceiros; pela contagem do cadastro, os confirmados somam {alcance ? n(alcance) : "—"}{alcancePossivel ? " e quem ainda não confirmou soma mais " + n(alcancePossivel) : ""}.
        {" "}{comInstagram} de {todos.length} cadastros têm Instagram{!datas.length ? "" : datas[0] === datas[datas.length - 1] ? "; seguidores contados em " + dataBr(datas[0]) : "; seguidores contados entre " + dataBr(datas[0]) + " e " + dataBr(datas[datas.length - 1])}. Para corrigir um perfil, edite o cadastro.
        {semInstagram.length > 0 && <> Confirmados sem Instagram: {semInstagram.sort(porNome).map((d) => <Tag key={d.id}>{d.nome}</Tag>)}</>}
      </p>
      <div className="cdf:mb-2.5"><Segmentado valor={so} aoMudar={setSo} opcoes={[["todos", "Todos"], ["confirmados", "Só confirmados"]]} rotulo="Quem mostrar" /></div>
      {GRUPOS.map((g) => {
        const lista = visiveis.filter((d) => grupoDe(d) === g.id);
        if (!lista.length) return null;
        const soma = somar(lista);
        return (
          <section key={g.id} className="cdf:mb-5">
            <h3 className="cdf:m-0 cdf:mb-1.5 cdf:mt-4 cdf:text-base cdf:font-bold cdf:text-tinta">{g.titulo} <span className="cdf:font-normal cdf:text-fraco">· {lista.length}</span></h3>
            {g.nota && <p className="cdf:m-0 cdf:mb-2 cdf:text-[13.5px] cdf:text-fraco">{g.nota}</p>}
            <Tabela>
              <thead><tr><Th>Quem</Th><Th>Status</Th><Th>Instagram</Th><Th className={NUM}>Seguidores</Th><Th>Contados em</Th><Th>Outras redes</Th></tr></thead>
              <tbody>
                {lista.map((d) => (
                  <tr key={d.id}>
                    <Td><strong>{d.nome}</strong></Td>
                    <Td><Pilula classe={classeStatus(d.status)}>{rotulo(p, "statusContato", d.status)}</Pilula></Td>
                    <Td>{d.instagram ? <a href={linkInstagram(d.instagram)} target="_blank" rel="noopener" className="cdf:text-link">@{d.instagram}</a> : <span className="cdf:text-fraco">—</span>}</Td>
                    <Td className={NUM}>{comAlcance(d) ? n(Number(d.seguidores)) : <span className="cdf:text-fraco">—</span>}</Td>
                    <Td className="cdf:whitespace-nowrap">{d.seguidoresEm ? dataBr(d.seguidoresEm) : <span className="cdf:text-fraco">—</span>}</Td>
                    <Td>{redesDe(d).length ? redesDe(d).map((r, i) => <span key={r.rede}>{i > 0 && " · "}<a href={r.url} target="_blank" rel="noopener" className="cdf:text-link">{r.nome}</a></span>) : <span className="cdf:text-fraco">—</span>}</Td>
                  </tr>
                ))}
                {soma > 0 && <tr className="cdf:font-bold"><Td colSpan={3}>{g.soma ? "Soma" : "Soma (fora do alcance do festival)"}</Td><Td className={NUM}>{n(soma)}</Td><Td colSpan={2} /></tr>}
              </tbody>
            </Tabela>
          </section>
        );
      })}


      <h2 className={SECAO}>Canais do festival</h2>
      <div className={TEXTO_LONGO + " cdf:max-w-[820px]"}>
        <p className="cdf:m-0 cdf:mb-2">O festival ainda não tem os canais no ar. O que se sabe até aqui:</p>
        <ul className="cdf:m-0 cdf:list-disc cdf:pl-5">
          <li><strong>Instagram.</strong> O Igor pediu orçamento à agência em 09/10, com e sem patrocínio. A tarefa "Colocar o site e o Instagram no ar" está no núcleo.</li>
          <li><strong>Site e imprensa.</strong> Release, mailing e lista de veículos: tarefa COM-007. Contatos de imprensa podem entrar no Cadastro com um tipo próprio ("Imprensa", na lista de tipos).</li>
          <li><strong>WhatsApp.</strong> Canal de serviço ao público; decidir se entra no plano de comunicação (COM-001).</li>
        </ul>
        <p className="cdf:m-0 cdf:mt-2">Quando os canais existirem, esta parte vira uma lista com responsável, status e link, guardada na configuração da página.</p>
      </div>

      <BlocoFrente base={base} nucleo={nucleo} frente="redes" abrirAba={abrirAba} />
    </>
  );
}
