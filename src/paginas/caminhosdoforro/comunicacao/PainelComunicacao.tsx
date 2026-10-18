/* Comunicação: a aba própria do núcleo de comunicação. Primeira versão,
   feita como proposta para a conversa do núcleo: junta o que a base já tem
   sobre comunicação (as peças prontas, o que as cotas prometem aos
   patrocinadores, o alcance somado das comunidades digitais e as tarefas do
   núcleo) e deixa escrito o que ainda não tem onde morar. Nada aqui grava
   dado novo: o alcance vem dos campos Instagram e seguidores do cadastro. */
import { cadastrosDoTipo, contarTarefas, dataBr, nomeCadastro, respEfetivo, tarefaAtrasada, temTipo, vendidasPorCota } from "../calculo";
import { normalizar } from "../listas";
import type { ArquivoBase, Base, Cadastro, Cota, Nucleo } from "../tipos";
import { Botao } from "../ui/Botao";
import { LINK, SECAO, TEXTO_LONGO } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import { Tag } from "../ui/Tag";
import type { IrPara } from "../vista";

/** Linhas de contrapartida que falam de comunicação (marca, posts, redes, menções, conteúdo, naming). */
const FALA_DE_COMUNICACAO = /comunica|marca|post|rede|men[cç][aã]o|conte[uú]do|v[ií]deo|naming|assinatura|registro|digital|campanha|divulga/;

const linhasDeComunicacao = (c: Cota) =>
  (c.contrapartidas || "").split(/\n|(?<=\.)\s+/).map((l) => l.trim()).filter((l) => l && FALA_DE_COMUNICACAO.test(normalizar(l)));

/** Quem entra na conta de alcance: artistas, DJs, oficineiros, parceiros e o próprio festival (qualquer cadastro com seguidores). */
const comAlcance = (d: Cadastro) => Number(d.seguidores) > 0;

const n = (v: number) => v.toLocaleString("pt-BR");

export function PainelComunicacao({ base, nucleo, irPara }: { base: Base; nucleo: Nucleo; irPara: IrPara }) {
  const p = base.pagina;

  // Alcance: quem tem seguidores informados, e quantos do line-up ainda não têm.
  const todos = Object.values(base.cadastro);
  const comSeguidores = todos.filter(comAlcance).sort((a, b) => Number(b.seguidores) - Number(a.seguidores));
  const alcance = comSeguidores.reduce((t, d) => t + Number(d.seguidores), 0);
  const lineup = todos.filter((d) => d.status === "confirmado" && (temTipo(d, "artista") || temTipo(d, "dj") || temTipo(d, "oficineiro") || temTipo(d, "parceiro_institucional")));
  const semSeguidores = lineup.filter((d) => !comAlcance(d));

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
        <p className="cdf:m-0"><strong className="cdf:text-tinta">Proposta de estrutura, para o núcleo revisar.</strong> Esta aba junta o que a Central já sabe sobre comunicação. O que ainda não tem onde morar está listado no fim, em “Para decidir”.</p>
      </div>

      <Resumo
        itens={[
          { titulo: "Alcance somado", valor: alcance ? n(alcance) : "—", sub: alcance ? comSeguidores.length + " perfis com seguidores informados" : "Informe seguidores no cadastro de cada atração" },
          { titulo: "Sem seguidores informados", valor: semSeguidores.length, sub: "confirmados do line-up e parceiros", classeValor: semSeguidores.length ? "cdf:text-conversa" : undefined },
          { titulo: "Peças guardadas", valor: pecas.filter((a) => a.versoes?.length).length + " de " + pecas.length, sub: "apresentações e identidade visual" },
          { titulo: "Tarefas de comunicação", valor: conta.abertas, sub: conta.atrasadas ? <span className="cdf:font-bold cdf:text-erro">{conta.atrasadas} atrasadas</span> : conta.total ? conta.feitas + " concluídas de " + conta.total : "nenhuma no plano", classeValor: conta.atrasadas ? "cdf:text-erro" : undefined },
        ]}
      />

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

      <h2 className={SECAO}>Alcance das comunidades digitais<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("cadastro")}>Cadastro</Botao></h2>
      <p className="cdf:m-0 cdf:mb-2.5 cdf:text-sm cdf:text-fraco">
        As apresentações falam em “mais de 450 mil seguidores somados” entre atrações e parceiros. Aqui a conta sai do cadastro: Instagram e seguidores de cada um (campos no formulário do cadastro).
        {semSeguidores.length > 0 && <> Faltam {semSeguidores.length}: {semSeguidores.slice(0, 12).map((d) => <Tag key={d.id}>{d.nome}</Tag>)}{semSeguidores.length > 12 && " e mais " + (semSeguidores.length - 12)}.</>}
      </p>
      {!comSeguidores.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Ninguém com seguidores informados ainda.</p> : (
        <Tabela>
          <thead><tr><Th>Quem</Th><Th>Instagram</Th><Th className={NUM}>Seguidores</Th></tr></thead>
          <tbody>
            {comSeguidores.map((d) => (
              <tr key={d.id}>
                <Td><strong>{d.nome}</strong></Td>
                <Td>{d.instagram ? <a href={"https://instagram.com/" + d.instagram} target="_blank" rel="noopener" className="cdf:text-link">@{d.instagram}</a> : <span className="cdf:text-fraco">—</span>}</Td>
                <Td className={NUM}>{n(Number(d.seguidores))}</Td>
              </tr>
            ))}
            <tr className="cdf:font-bold"><Td colSpan={2}>Soma</Td><Td className={NUM}>{n(alcance)}</Td></tr>
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
