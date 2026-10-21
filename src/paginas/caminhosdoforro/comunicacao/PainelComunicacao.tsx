/* Comunicação: a aba própria do núcleo de comunicação. Junta o que a base
   já tem sobre comunicação (as redes de todo mundo do cadastro, com o alcance
   somado, as peças prontas, o que as cotas prometem aos patrocinadores e as
   tarefas do núcleo) e deixa escrito o que ainda não tem onde morar. Nada
   aqui grava dado novo: as redes vêm do cadastro (Instagram, seguidores, dia
   da contagem e as outras redes). */
import { useState } from "react";
import { contarTarefas, dataBr, nomeCadastro, porNome, respEfetivo, tarefaAtrasada, temTipo, vendidasPorCota } from "../calculo";
import { linkInstagram, redesDe } from "../cadastro/redes";
import { classeStatus, normalizar, rotulo } from "../listas";
import type { ArquivoBase, Base, Cadastro, Cota, Nucleo } from "../tipos";
import { Botao } from "../ui/Botao";
import { LINK, SECAO, TEXTO_LONGO } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Segmentado } from "../ui/Segmentado";
import { Pilula, Tag } from "../ui/Tag";
import type { IrPara } from "../vista";

/** Linhas de contrapartida que falam de comunicação (marca, posts, redes, menções, conteúdo, naming). */
const FALA_DE_COMUNICACAO = /comunica|marca|post|rede|men[cç][aã]o|conte[uú]do|v[ií]deo|naming|assinatura|registro|digital|campanha|divulga/;

const linhasDeComunicacao = (c: Cota) =>
  (c.contrapartidas || "").split(/\n|(?<=\.)\s+/).map((l) => l.trim()).filter((l) => l && FALA_DE_COMUNICACAO.test(normalizar(l)));

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

export function PainelComunicacao({ base, nucleo, irPara }: { base: Base; nucleo: Nucleo; irPara: IrPara }) {
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

  // Peças: as apresentações e os arquivos do contexto que são de comunicação (identidade visual, manual).
  const arquivos = Object.values(base.arquivos).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const pecas = arquivos.filter((a) => a.secao === "apresentacao" || /identidade|marca|manual|logo|comunica/i.test(a.nome + " " + a.descricao));

  // O que as cotas prometem em comunicação, e quantas estão vendidas.
  const vendidas = vendidasPorCota(base);
  const cotas = Object.values(base.cotas).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((c) => ({ c, linhas: linhasDeComunicacao(c) })).filter((x) => x.linhas.length);

  // Tarefas do núcleo.
  const tarefas = Object.values(base.tarefas).filter((t) => t.nucleo === nucleo.id);
  const conta = contarTarefas(tarefas);
  const abertas = tarefas.filter((t) => t.status !== "concluido").sort((a, b) => String(a.prazo || "9999").localeCompare(String(b.prazo || "9999")));
  const frentes = [...new Set(abertas.map((t) => t.frente || "Sem frente"))];

  return (
    <>
      <div className="cdf:mb-5 cdf:max-w-[820px] cdf:rounded-xl cdf:border cdf:border-dashed cdf:border-linha cdf:bg-superficie cdf:px-5 cdf:py-4 cdf:text-sm cdf:text-tinta-2">
        <p className="cdf:m-0"><strong className="cdf:text-tinta">Proposta de estrutura, para o núcleo revisar.</strong> Esta aba junta o que a Central já sabe sobre comunicação. As redes e os seguidores vêm do cadastro de cada um. O que ainda não tem onde morar está listado no fim, em “Para decidir”.</p>
      </div>

      <Resumo
        itens={[
          { titulo: "Alcance dos confirmados", valor: alcance ? n(alcance) : "—", sub: alcance ? confirmados.filter(comAlcance).length + " perfis de atrações e parceiros confirmados" : "Informe seguidores no cadastro de cada atração" },
          { titulo: "Com quem está em conversa", valor: alcancePossivel ? "+" + n(alcancePossivel) : "—", sub: emConversa.filter(comAlcance).length + " perfis de atrações e parceiros ainda em conversa" },
          { titulo: "Confirmados sem Instagram", valor: semInstagram.length, sub: "atrações e parceiros", classeValor: semInstagram.length ? "cdf:text-conversa" : undefined },
          { titulo: "Peças guardadas", valor: pecas.filter((a) => a.versoes?.length).length + " de " + pecas.length, sub: "apresentações e identidade visual" },
          { titulo: "Tarefas de comunicação", valor: conta.abertas, sub: conta.atrasadas ? <span className="cdf:font-bold cdf:text-erro">{conta.atrasadas} atrasadas</span> : conta.total ? conta.feitas + " concluídas de " + conta.total : "nenhuma no plano", classeValor: conta.atrasadas ? "cdf:text-erro" : undefined },
        ]}
      />

      <h2 className={SECAO}>Redes de quem está no festival<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("cadastro")}>Cadastro</Botao></h2>
      <p className="cdf:m-0 cdf:mb-2.5 cdf:max-w-[820px] cdf:text-sm cdf:text-fraco">
        Instagram, seguidores e as outras redes de cada cadastro, para marcar nas peças e para a conta de alcance. As apresentações falam em “mais de 450 mil seguidores somados” entre atrações e parceiros; pela contagem do cadastro, os confirmados somam {alcance ? n(alcance) : "—"}{alcancePossivel ? " e quem está em conversa soma mais " + n(alcancePossivel) : ""}.
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

      <h2 className={SECAO}>Peças e identidade<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("apresentacoes")}>Apresentações</Botao><Botao mini className="cdf:font-sans" onClick={() => irPara("contexto")}>Contexto</Botao></h2>
      {!pecas.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Nenhum cartão de arquivo de comunicação ainda.</p> : (
        <Tabela>
          <thead><tr><Th>Peça</Th><Th>Versão atual</Th><Th>Data</Th><Th>Onde</Th></tr></thead>
          <tbody>{pecas.map((a) => <LinhaPeca key={a.id} a={a} />)}</tbody>
        </Tabela>
      )}

      <h2 className={SECAO}>O que as cotas prometem em comunicação<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("patrocinios")}>Cotas</Botao></h2>
      <p className="cdf:m-0 cdf:mb-2.5 cdf:text-sm cdf:text-fraco">Linhas das contrapartidas que falam de marca, conteúdo, redes ou registros. Cada cota vendida vira uma entrega da comunicação.</p>
      {!cotas.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Nenhuma cota com contrapartida de comunicação.</p> : (
        <Tabela>
          <thead><tr><Th>Cota</Th><Th className={NUM}>Vendidas</Th><Th>Entregas de comunicação</Th></tr></thead>
          <tbody>
            {cotas.map(({ c, linhas }) => (
              <tr key={c.id}>
                <Td><strong>{c.nome}</strong></Td>
                <Td className={NUM}>{vendidas[c.id] || 0}{c.quantidade ? " de " + c.quantidade : ""}</Td>
                <Td><ul className="cdf:m-0 cdf:list-disc cdf:pl-4 cdf:text-sm cdf:text-tinta-2">{linhas.map((l, i) => <li key={i}>{l}</li>)}</ul></Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}

      <h2 className={SECAO}>Tarefas do núcleo<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("tarefas")}>Aba Tarefas</Botao></h2>
      {!abertas.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">{tarefas.length ? "Tudo concluído." : "Nenhuma tarefa classificada no núcleo de comunicação."}</p> : (
        <Tabela>
          <thead><tr><Th>Frente</Th><Th>Tarefa</Th><Th>Responsável</Th><Th>Prazo</Th></tr></thead>
          <tbody>
            {frentes.map((f) => abertas.filter((t) => (t.frente || "Sem frente") === f).map((t, i) => {
              const resp = respEfetivo(base, t);
              const atrasada = tarefaAtrasada(t);
              return (
                <tr key={t.id}>
                  <Td>{i === 0 ? <strong>{f}</strong> : ""}</Td>
                  <Td>{t.codigo && <span className="cdf:mr-1.5 cdf:text-[12.5px] cdf:text-fraco">{t.codigo}</span>}{t.titulo}</Td>
                  <Td>{resp ? nomeCadastro(base, resp) : <span className="cdf:text-fraco">—</span>}</Td>
                  <Td className={atrasada ? "cdf:font-bold cdf:text-erro" : undefined}>{dataBr(t.prazo)}</Td>
                </tr>
              );
            }))}
          </tbody>
        </Tabela>
      )}

      <h2 className={SECAO}>Para decidir</h2>
      <div className={TEXTO_LONGO + " cdf:max-w-[820px]"}>
        <p className="cdf:m-0 cdf:mb-2">O que ainda não tem onde morar na Central, e um caminho possível para cada item:</p>
        <ul className="cdf:m-0 cdf:list-disc cdf:pl-5">
          <li><strong>Canais do festival.</strong> Instagram (o Igor pediu orçamento à agência em 09/10, com e sem patrocínio), site, imprensa e WhatsApp. Caminho: uma lista de canais com responsável, status e link, guardada na configuração da página.</li>
          <li><strong>Calendário de peças.</strong> O que sai antes, durante e depois do festival: anúncio do line-up, chamada aberta e sorteio, oficinas, dia a dia, pós-evento. Caminho: tarefas do núcleo com a frente “Peça”, ou uma grade própria com data, canal, peça e status.</li>
          <li><strong>Entregas aos patrocinadores.</strong> Por patrocínio confirmado, o que foi prometido e o que já foi entregue, com prova (print ou link) para o relatório pós-evento. Caminho: lista de entregas ligada ao patrocínio, gerada a partir das contrapartidas da cota.</li>
          <li><strong>Identidade e regras de uso.</strong> Manual da Ana Colier, assinatura, grafismos, fontes (Garet ainda sem arquivos) e créditos das fotos da pesquisa. Caminho: o cartão “Identidade visual” do Contexto, com as regras resumidas na descrição.</li>
          <li><strong>Imprensa e assessoria.</strong> Release, lista de veículos e contatos. Caminho: cadastros do tipo “Imprensa” (lista de tipos) e uma frente de tarefas.</li>
        </ul>
        <p className="cdf:m-0 cdf:mt-2">Decidido o caminho, a aba passa a gravar dados; até lá ela só lê. O que for combinado na conversa do núcleo pode ser registrado desde já como tarefa, na <button type="button" className={LINK} onClick={() => irPara("tarefas")}>aba Tarefas</button>.</p>
      </div>
    </>
  );
}

function LinhaPeca({ a }: { a: ArquivoBase }) {
  const versoes = a.versoes || [];
  const atual = versoes[versoes.length - 1];
  return (
    <tr>
      <Td><strong>{a.nome}</strong>{a.descricao && <span className="cdf:block cdf:text-[13px] cdf:text-fraco">{a.descricao}</span>}</Td>
      <Td>{atual ? <a href={atual.arquivo.url} target="_blank" rel="noopener" className="cdf:font-bold cdf:text-link">{atual.versao}</a> : <span className="cdf:text-rec">faltante</span>}</Td>
      <Td>{atual ? dataBr(atual.data) : "—"}</Td>
      <Td>{a.secao === "apresentacao" ? "Apresentações" : "Contexto"}</Td>
    </tr>
  );
}
