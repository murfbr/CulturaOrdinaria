/* Novo ou editar horário: dia, espaço, início, duração e fim (mudar um
   recalcula o outro), atividade, quem (só os cadastros do tipo que o espaço
   recebe, com busca), anotações, a revisar. Não salva se o espaço já está
   ocupado; avisa de choque de agenda e de participante fora do espaço. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { cx } from "../../../utils/classes";
import { auditoria, porNome, temTipo } from "../calculo";
import { apagar, gravar, novoId } from "../dados";
import { normalizar, opcoes, rotulo } from "../listas";
import type { Base, Horario } from "../tipos";
import { AreaTexto, Campo, Check, Entrada, Grupo, Opcoes, Selecao } from "../ui/Campo";
import { LISTA_MARCAR } from "../ui/classes";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";
import {
  cabeNoEspaco, classePonto, doMinuto, duracao, duracaoPadrao, faixa, mensagemOcupado, minutos, nomes, ocupado, opcoesDuracao, opcoesHora,
  pessoasEmChoque, textoDuracao, foraDoEspaco,
} from "./calculoGrade";

interface Props { base: Base; id: string | null; preset?: Partial<Horario>; aoFechar: () => void }

export function ModalHorario({ base, id, preset, aoFechar }: Props) {
  const existente = id ? base.slots[id] : undefined;
  const p = base.pagina;
  const [d, setD] = useState<Horario>(() => {
    if (existente) return clonar(existente);
    const novo: Horario = { id: novoId("slots"), dia: p.listas.dias[0]?.id || "", espaco: "", inicio: "", fim: "", atividade: "show", participantes: [], anotacoes: "", revisar: false, ...preset };
    const m = minutos(novo.inicio);
    if (novo.inicio && !novo.fim && m != null) novo.fim = doMinuto(m + duracaoPadrao(novo.atividade));
    return novo;
  });
  const [busca, setBusca] = useState("");
  const mudar = (parte: Partial<Horario>) => setD((a) => ({ ...a, ...parte }));

  function mudarInicio(inicio: string) {
    const m = minutos(inicio);
    const dur = duracao(d) || duracaoPadrao(d.atividade);
    mudar({ inicio, fim: m != null ? doMinuto(m + dur) : d.fim });
  }
  function mudarDuracao(valor: string) {
    const m = Number(valor), ini = minutos(d.inicio);
    if (m && ini != null) mudar({ fim: doMinuto(ini + m) });
  }

  const marcados = d.participantes || [];
  const candidatos = Object.values(base.cadastro)
    .filter((c) => !temTipo(c, "equipe") && (!d.espaco || cabeNoEspaco(base, d.espaco, c.id) || marcados.includes(c.id)))
    .sort(porNome);
  const q = normalizar(busca.trim());

  function salvar() {
    if (!d.espaco) { toast("Escolha o espaço."); return; }
    if (!d.inicio || !d.fim) { toast("Preencha início e fim."); return; }
    const fx = faixa(d);
    if (!fx || fx[1] <= fx[0]) { toast("O fim precisa ser depois do início. Horários antes das 6h contam como madrugada do mesmo dia."); return; }
    const oc = ocupado(base, d.dia, d.espaco, fx, d.id);
    if (oc) { toast("Não cabe: " + mensagemOcupado(base, oc)); return; }
    const registro = { ...d, anotacoes: d.anotacoes.trim() };
    gravar("slots", registro);
    aoFechar();
    const choque = pessoasEmChoque(base, registro, fx, d.id);
    if (choque.length) toast("Salvo. " + nomes(base, choque) + " já tem outro horário nesse período.");
    else if (foraDoEspaco(base, registro).length) toast("Salvo. Há participante fora do que o espaço recebe.");
    else toast(id ? "Horário salvo." : "Horário criado.");
  }

  function excluir() {
    apagar("slots", id!);
    aoFechar();
    toast("Horário excluído.");
  }

  return (
    <Modal titulo={id ? "Editar horário" : "Novo horário"} auditoria={auditoria(existente as (Horario & { atualizadoPor?: string }) | undefined)} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Dia"><Selecao autoFocus value={d.dia} onChange={(e) => mudar({ dia: e.target.value })}><Opcoes lista={opcoes(p, "dias")} /></Selecao></Campo>
      <Campo rotulo="Espaço">
        <Selecao value={d.espaco} onChange={(e) => mudar({ espaco: e.target.value })}>
          <option value="">Escolha</option>
          {Object.values(base.espacos).sort(porNome).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </Selecao>
      </Campo>
      <div className={LINHA_INTEIRA + " cdf:grid cdf:grid-cols-3 cdf:gap-3"}>
        <Campo rotulo="Início">
          <Selecao value={d.inicio} onChange={(e) => mudarInicio(e.target.value)}>
            <option value="">Escolha</option>{opcoesHora(d.inicio).map((h) => <option key={h} value={h}>{h}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Duração">
          <Selecao value={duracao(d) ?? ""} onChange={(e) => mudarDuracao(e.target.value)}>
            <option value="">Escolha</option>{opcoesDuracao(duracao(d)).map((m) => <option key={m} value={m}>{textoDuracao(m)}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Fim">
          <Selecao value={d.fim} onChange={(e) => mudar({ fim: e.target.value })}>
            <option value="">Escolha</option>{opcoesHora(d.fim).map((h) => <option key={h} value={h}>{h}</option>)}
          </Selecao>
        </Campo>
      </div>
      <Campo rotulo="Atividade" className={LINHA_INTEIRA}><Selecao value={d.atividade} onChange={(e) => mudar({ atividade: e.target.value })}><Opcoes lista={opcoes(p, "atividades")} /></Selecao></Campo>
      <Grupo rotulo="Quem" className={LINHA_INTEIRA}>
        <Entrada type="search" placeholder="Filtrar nomes" aria-label="Filtrar participantes" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <div className={LISTA_MARCAR}>
          {!d.espaco ? (
            <p className="cdf:m-0 cdf:p-2 cdf:text-fraco">Escolha o espaço para ver quem pode ocupá-lo.</p>
          ) : !candidatos.length ? (
            <p className="cdf:m-0 cdf:p-2 cdf:text-fraco">Nenhum cadastro do tipo que este espaço recebe.</p>
          ) : candidatos.map((c) => {
            const cabe = cabeNoEspaco(base, d.espaco, c.id);
            const on = marcados.includes(c.id);
            return (
              <label key={c.id} hidden={!!q && !normalizar(c.nome).includes(q)} className={cx("cdf:flex cdf:cursor-pointer cdf:items-center cdf:gap-2 cdf:rounded-md cdf:px-2 cdf:py-1.5 cdf:text-base cdf:hover:bg-superficie-2", !!q && !normalizar(c.nome).includes(q) && "cdf:hidden")}>
                <input type="checkbox" checked={on} className="cdf:h-[17px] cdf:w-[17px] cdf:shrink-0 cdf:accent-primaria" onChange={(ev) => mudar({ participantes: ev.target.checked ? [...marcados, c.id] : marcados.filter((x) => x !== c.id) })} />
                <span className="cdf:inline-flex cdf:items-center cdf:gap-1.5"><i className={"cdf:inline-block cdf:h-2 cdf:w-2 cdf:rounded-full " + classePonto(c.status)} />{c.nome}</span>
                {!cabe && <span className="cdf:ml-auto cdf:text-[12.5px] cdf:text-rec">fora do que o espaço recebe</span>}
              </label>
            );
          })}
        </div>
        <p className="cdf:m-0 cdf:mt-1.5 cdf:text-sm cdf:text-fraco">A lista mostra só os tipos de cadastro que este espaço recebe ({d.espaco && base.espacos[d.espaco]?.aceita?.length ? base.espacos[d.espaco].aceita.map((t) => rotulo(p, "tiposCadastro", t)).join(", ") : "qualquer um"}). Para mudar, ajuste o espaço em Cadastro geral.</p>
      </Grupo>
      <Campo rotulo="Anotações" className={LINHA_INTEIRA}><AreaTexto rows={2} value={d.anotacoes} onChange={(e) => mudar({ anotacoes: e.target.value })} /></Campo>
      <Check rotulo="A revisar" className={LINHA_INTEIRA} checked={d.revisar} onChange={(e) => mudar({ revisar: e.target.checked })} />
    </Modal>
  );
}
