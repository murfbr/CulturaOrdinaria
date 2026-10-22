/* Aba Contrapartidas do núcleo de comunicação: o que cada cota promete em
   comunicação (as linhas das contrapartidas que falam de marca, conteúdo,
   redes ou registros), o que cada patrocínio confirmado tem a receber e o
   que ainda não tem onde morar (a prova de entrega). No fim, as tarefas e o
   orçamento desta frente. */
import { nomeCadastro, nomeCota, vendidasPorCota } from "../calculo";
import { normalizar, rotulo } from "../listas";
import type { Base, Cota, Nucleo } from "../tipos";
import { Botao } from "../ui/Botao";
import { SECAO, TEXTO_LONGO } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";
import type { AbaNucleo, IrPara } from "../vista";
import { BlocoFrente } from "./BlocoFrente";

/** Linhas de contrapartida que falam de comunicação (marca, posts, redes, menções, conteúdo, naming). */
const FALA_DE_COMUNICACAO = /comunica|marca|post|rede|men[cç][aã]o|conte[uú]do|v[ií]deo|naming|assinatura|registro|digital|campanha|divulga/;

const linhasDeComunicacao = (c: Cota) =>
  (c.contrapartidas || "").split(/\n|(?<=\.)\s+/).map((l) => l.trim()).filter((l) => l && FALA_DE_COMUNICACAO.test(normalizar(l)));


interface Props { base: Base; nucleo: Nucleo; irPara: IrPara; abrirAba: (a: AbaNucleo) => void }

export function AbaContrapartidas({ base, nucleo, irPara, abrirAba }: Props) {
  const p = base.pagina;
  const vendidas = vendidasPorCota(base);
  const cotas = Object.values(base.cotas).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((c) => ({ c, linhas: linhasDeComunicacao(c) })).filter((x) => x.linhas.length);
  const confirmados = Object.values(base.patrocinios).filter((x) => x.etapa === "confirmado");
  const entregas = confirmados.reduce((t, x) => t + (x.cota && base.cotas[x.cota] ? linhasDeComunicacao(base.cotas[x.cota]).length : 0), 0);
  const emNegociacao = Object.values(base.patrocinios).filter((x) => x.etapa !== "confirmado" && x.etapa !== "perdido").length;

  return (
    <>
      <Resumo
        itens={[
          { titulo: "Patrocínios confirmados", valor: confirmados.length, sub: emNegociacao ? emNegociacao + " em conversa no funil" : "nenhum em conversa" },
          { titulo: "Entregas de comunicação", valor: entregas, sub: "linhas prometidas aos confirmados" },
          { titulo: "Cotas com contrapartida de comunicação", valor: cotas.length + " de " + Object.keys(base.cotas).length, sub: "pelo texto das contrapartidas" },
        ]}
      />

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


      <h2 className={SECAO}>Entregas por patrocínio confirmado<Botao mini className="cdf:ml-auto cdf:font-sans" onClick={() => irPara("patrocinios")}>Funil</Botao></h2>
      {!confirmados.length ? <p className="cdf:m-0 cdf:text-sm cdf:text-fraco">Nenhum patrocínio confirmado ainda. Quando um fechar, as linhas da cota dele aparecem aqui como entregas.</p> : (
        <Tabela>
          <thead><tr><Th>Empresa</Th><Th>Cota</Th><Th>Quem capta</Th><Th>Entregas de comunicação</Th></tr></thead>
          <tbody>
            {confirmados.map((x) => {
              const linhas = x.cota && base.cotas[x.cota] ? linhasDeComunicacao(base.cotas[x.cota]) : [];
              return (
                <tr key={x.id}>
                  <Td><strong>{nomeCadastro(base, x.empresa)}</strong></Td>
                  <Td>{nomeCota(base, x.cota)}</Td>
                  <Td>{x.captador ? nomeCadastro(base, x.captador) : <span className="cdf:text-fraco">equipe</span>}</Td>
                  <Td>{linhas.length ? <ul className="cdf:m-0 cdf:list-disc cdf:pl-4 cdf:text-sm cdf:text-tinta-2">{linhas.map((l, i) => <li key={i}>{l}</li>)}</ul> : <span className="cdf:text-fraco">a cota não fala de comunicação</span>}</Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}

      <h2 className={SECAO}>Para decidir</h2>
      <div className={TEXTO_LONGO + " cdf:max-w-[820px]"}>
        <ul className="cdf:m-0 cdf:list-disc cdf:pl-5">
          <li><strong>Prova de entrega.</strong> Por patrocínio, o que foi prometido e o que já foi entregue, com print ou link, para o relatório pós-evento. Caminho: lista de entregas ligada ao patrocínio, gerada a partir das linhas da cota, com status e prova.</li>
          <li><strong>Mapa de marcas.</strong> Onde cada marca aparece (palco, áreas, peças, redes), conforme a cota: tarefa COM-011.</li>
          <li><strong>Apoio cultural e parceiros.</strong> Parceiros institucionais também recebem menção; decidir se entram nesta lista ou só nas peças.</li>
        </ul>
      </div>

      <BlocoFrente base={base} nucleo={nucleo} frente="contrapartidas" abrirAba={abrirAba} />
    </>
  );
}
