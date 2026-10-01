/* A grade: um grupo por dia, espaço ou atividade, cada um com a tabela dos
   horários. Hora, duração, espaço e atividade mudam na própria linha (a
   gravação só acontece quando o horário cabe); "inserir depois" cria o
   próximo horário colado no fim deste. */
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { cx } from "../../../utils/classes";
import { nomeCadastro, porNome } from "../calculo";
import { gravar } from "../dados";
import { opcoes, rotulo } from "../listas";
import type { Base, Horario } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { ESTILO_CONTROLE_BASE, Opcoes } from "../ui/Campo";
import { ACOES } from "../ui/classes";
import { Tabela, Td, Th } from "../ui/Tabela";
import { Revisar } from "../ui/Tag";
import type { FiltrosGrade, PedidoHorario } from "./TelaProgramacao";
import {
  FIM_DIA, PASSO, classePonto, doMinuto, duracao, duracaoPadrao, faixa, foraDoEspaco, mensagemOcupado, minutos, nomeEspaco,
  nomes, ocupado, opcoesDuracao, opcoesHora, pessoasEmChoque, textoDuracao, type Analise,
} from "./calculoGrade";

interface Props { base: Base; filtros: FiltrosGrade; visiveis: Horario[]; analise: Analise; abrir: (pedido: PedidoHorario) => void }

const AVISO = "cdf:inline-block cdf:cursor-help cdf:whitespace-nowrap cdf:rounded-full cdf:bg-rec-bg cdf:px-2 cdf:py-0.5 cdf:text-[12.5px] cdf:font-bold cdf:leading-[1.3] cdf:text-rec";
const SELECT = ESTILO_CONTROLE_BASE + " cdf:w-auto cdf:px-1.5 cdf:py-[5px] cdf:text-[14.5px] cdf:tabular-nums";

export function Grade({ base, filtros: f, visiveis, analise, abrir }: Props) {
  const p = base.pagina;
  const todos = Object.values(base.slots);
  if (!visiveis.length) return <Vazio>{todos.length ? "Nenhum horário com esses filtros." : "A grade está vazia. Use “Novo horário” para começar."}</Vazio>;

  const indiceDia = (id: string) => p.listas.dias.findIndex((d) => d.id === id);
  const ordenar = (a: Horario, b: Horario) =>
    indiceDia(a.dia) - indiceDia(b.dia) || ((faixa(a) || [0])[0] - (faixa(b) || [0])[0]) || nomeEspaco(base, a.espaco).localeCompare(nomeEspaco(base, b.espaco), "pt");
  const espacos = Object.values(base.espacos).sort(porNome);

  let grupos: [string, string, Horario[]][];
  if (f.agrupar === "espaco") grupos = espacos.map((e) => [e.id, e.nome, visiveis.filter((s) => s.espaco === e.id)]);
  else if (f.agrupar === "atividade") grupos = p.listas.atividades.map((a) => [a.id, a.nome, visiveis.filter((s) => s.atividade === a.id)]);
  else grupos = p.listas.dias.map((d) => [d.id, d.nome, visiveis.filter((s) => s.dia === d.id)]);

  /** Salva o horário se couber; avisa de choque de agenda ou de participante fora do espaço. */
  function salvar(d: Horario, ignorarId: string) {
    const fx = faixa(d);
    if (!fx || fx[1] <= fx[0] || fx[1] > FIM_DIA) { toast("O fim precisa ser depois do início e até as 06:00."); return; }
    const oc = ocupado(base, d.dia, d.espaco, fx, ignorarId);
    if (oc) { toast("Não cabe: " + mensagemOcupado(base, oc)); return; }
    gravar("slots", d);
    const choque = pessoasEmChoque(base, d, fx, ignorarId);
    if (choque.length) toast("Salvo. " + nomes(base, choque) + " já tem outro horário nesse período.");
    else if (foraDoEspaco(base, d).length) toast("Salvo. " + nomes(base, foraDoEspaco(base, d)) + " não é do tipo que este espaço recebe.");
  }
  function mudarHora(s: Horario, campo: "inicio" | "fim" | "duracao", valor: string) {
    const d = clonar(s);
    const dur = duracao(s);
    if (campo === "inicio") { d.inicio = valor; const m = minutos(valor); if (dur && m != null) d.fim = doMinuto(m + dur); }
    else if (campo === "fim") d.fim = valor;
    else {
      const m = Number(valor), ini = minutos(d.inicio);
      if (!m || ini == null) { toast("Defina o início antes da duração."); return; }
      d.fim = doMinuto(ini + m);
    }
    salvar(d, s.id);
  }
  function mudarEspaco(s: Horario, espaco: string) {
    const d = { ...clonar(s), espaco };
    const oc = ocupado(base, d.dia, d.espaco, faixa(d), s.id);
    if (oc) { toast("Não cabe: " + mensagemOcupado(base, oc)); return; }
    gravar("slots", d);
    if (foraDoEspaco(base, d).length) toast("Salvo. " + nomes(base, foraDoEspaco(base, d)) + " não é do tipo que este espaço recebe.");
  }
  function inserirDepois(s: Horario) {
    const ini = minutos(s.fim);
    if (ini == null) return;
    const atividade = s.atividade === "dj" || s.atividade === "baile" ? "show" : "dj";
    const proximo = todos.filter((x) => x.dia === s.dia && x.espaco === s.espaco).map(faixa).filter((g): g is [number, number] => !!g && g[0] >= ini).reduce((m, g) => Math.min(m, g[0]), FIM_DIA);
    if (proximo - ini < PASSO) { toast("Não há tempo livre depois deste horário em " + nomeEspaco(base, s.espaco) + "."); return; }
    abrir({ id: null, preset: { dia: s.dia, espaco: s.espaco, inicio: s.fim, fim: doMinuto(ini + Math.min(duracaoPadrao(atividade), proximo - ini)), atividade } });
  }

  const colunaDia = f.agrupar !== "dia", colunaEspaco = f.agrupar !== "espaco";

  return (
    <>
      {grupos.map(([gid, gnome, itens]) => {
        if (!itens.length) return null;
        itens.sort(ordenar);
        const faixas = itens.map(faixa).filter((x): x is [number, number] => !!x);
        let janela = "";
        if (f.agrupar === "dia" && faixas.length) {
          const ini = Math.min(...faixas.map((x) => x[0])), fim = Math.max(...faixas.map((x) => x[1]));
          janela = doMinuto(ini) + " às " + doMinuto(fim) + " (" + textoDuracao(fim - ini) + "), ";
        }
        const presetGrupo: Partial<Horario> = f.agrupar === "dia" ? { dia: gid } : f.agrupar === "espaco" ? { espaco: gid } : { atividade: gid };
        return (
          <section key={gid}>
            <div className="cdf:mb-2.5 cdf:mt-[26px] cdf:flex cdf:flex-wrap cdf:items-baseline cdf:gap-x-3.5 cdf:gap-y-1.5">
              <h2 className="cdf:m-0 cdf:font-display cdf:text-[28px] cdf:font-black cdf:leading-[1.05] cdf:text-primaria">{gnome}</h2>
              <span className="cdf:text-sm cdf:text-fraco">{janela}{itens.length}{itens.length === 1 ? " horário" : " horários"}</span>
              <Botao className="cdf:ml-auto" onClick={() => abrir({ id: null, preset: { dia: f.dia || p.listas.dias[0]?.id || "", espaco: f.espaco || "", atividade: f.atividade || "show", ...presetGrupo } })}>Novo horário aqui</Botao>
            </div>
            <Tabela>
              <thead>
                <tr>
                  <Th>Horário</Th><Th>Duração</Th>{colunaDia && <Th>Dia</Th>}{colunaEspaco && <Th>Espaço</Th>}<Th>Atividade</Th><Th>Quem</Th>
                  <Th><span className="cdf:sr-only">Ações</span></Th>
                </tr>
              </thead>
              <tbody>
                {itens.map((s) => {
                  const conflito = analise.conflitos[s.id];
                  const pend = analise.pendencias[s.id] || [];
                  const fora = foraDoEspaco(base, s);
                  const dur = duracao(s);
                  return (
                    <tr key={s.id} className={cx(conflito && "cdf:[&>td:first-child]:shadow-[inset_4px_0_0_var(--cdf-erro)]")}>
                      <Td className="cdf:whitespace-nowrap">
                        <select aria-label="Início" value={s.inicio} onChange={(e) => mudarHora(s, "inicio", e.target.value)} className={SELECT}>
                          <option value="">--:--</option>{opcoesHora(s.inicio).map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="cdf:mx-1 cdf:text-fraco">às</span>
                        <select aria-label="Fim" value={s.fim} onChange={(e) => mudarHora(s, "fim", e.target.value)} className={SELECT}>
                          <option value="">--:--</option>{opcoesHora(s.fim).map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </Td>
                      <Td>
                        <select aria-label="Duração" value={dur ?? ""} onChange={(e) => mudarHora(s, "duracao", e.target.value)} className={SELECT}>
                          <option value="">—</option>{opcoesDuracao(dur).map((m) => <option key={m} value={m}>{textoDuracao(m)}</option>)}
                        </select>
                      </Td>
                      {colunaDia && <Td>{rotulo(p, "dias", s.dia)}</Td>}
                      {colunaEspaco && (
                        <Td>
                          <select aria-label="Espaço" value={s.espaco} onChange={(e) => mudarEspaco(s, e.target.value)} className={SELECT + " cdf:max-w-[230px]"}>
                            {!base.espacos[s.espaco] && <option value="">Escolha</option>}
                            {espacos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                          </select>
                        </Td>
                      )}
                      <Td>
                        <select aria-label="Atividade" value={s.atividade} onChange={(e) => gravar("slots", { ...clonar(s), atividade: e.target.value })} className={SELECT}>
                          <Opcoes lista={opcoes(p, "atividades")} />
                        </select>
                      </Td>
                      <Td>
                        {(s.participantes || []).map((id) => {
                          const d = base.cadastro[id];
                          return (
                            <span key={id} className="cdf:mb-1 cdf:mr-1 cdf:inline-flex cdf:items-center cdf:gap-1.5 cdf:whitespace-nowrap cdf:rounded-md cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie-2 cdf:px-2 cdf:py-0.5 cdf:text-[13px]">
                              <i className={"cdf:inline-block cdf:h-2 cdf:w-2 cdf:rounded-full " + classePonto(d?.status)} title={rotulo(p, "statusContato", d?.status)} />{nomeCadastro(base, id)}
                            </span>
                          );
                        })}
                        {!(s.participantes || []).length && pend.includes("vazio") && <span className="cdf:inline-block cdf:rounded-full cdf:bg-contatar-bg cdf:px-2 cdf:py-0.5 cdf:text-[13px] cdf:font-bold cdf:text-contatar">A definir</span>}
                        {s.revisar && <Revisar />}
                        {s.anotacoes && <span className="cdf:mt-1 cdf:block cdf:text-sm cdf:text-tinta-2">{s.anotacoes}</span>}
                        {(pend.includes("horario") || conflito || fora.length > 0) && (
                          <span className="cdf:mt-1.5 cdf:flex cdf:flex-wrap cdf:gap-1">
                            {pend.includes("horario") && <span className={AVISO} title="O fim precisa ser depois do início.">Horário inválido</span>}
                            {conflito && conflito.espaco.length > 0 && <span className={AVISO} title={"Mesmo espaço em: " + conflito.espaco.join("; ")}>Sobreposto</span>}
                            {conflito && conflito.pessoas.length > 0 && <span className={AVISO} title={conflito.pessoas.join("; ")}>Conflito de agenda</span>}
                            {fora.length > 0 && <span className={AVISO} title={nomes(base, fora) + (fora.length > 1 ? " não são" : " não é") + " do tipo que este espaço recebe."}>Fora do espaço</span>}
                          </span>
                        )}
                      </Td>
                      <Td className={ACOES}>
                        <Botao variante="fraco" mini title="Criar um horário começando quando este termina" onClick={() => inserirDepois(s)}>Inserir depois</Botao>{" "}
                        <Botao mini onClick={() => abrir({ id: s.id })}>Editar</Botao>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Tabela>
          </section>
        );
      })}
    </>
  );
}
