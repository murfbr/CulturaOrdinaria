/* Importar o plano de ação por GTs: escolhe a planilha (.xlsx ou .csv), vê
   a prévia do que entra, do que muda e do que sobra, e só então grava. Nada
   é gravado antes do botão. A leitura e a comparação são de plano.ts; aqui
   ficam a tela e a gravação (pelo Banco, com autoria e log como qualquer
   edição).

   As duas escolhas perigosas (apagar o que está fora da planilha e, nos
   conflitos, valer a planilha) ficam presas ao que estava na tela quando
   foram marcadas: se a lista mudar (outra planilha, alguém editando a base
   enquanto a prévia está aberta), a marca cai e é preciso confirmar de novo. */
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "../../../components/Toast";
import { decodificarTexto, lerCsv } from "../../../lib/csv";
import { alterarPagina, apagar, gravar } from "../dados";
import type { Base, TarefaFestival } from "../tipos";
import { Check, Entrada, Grupo } from "../ui/Campo";
import { NOTA } from "../ui/classes";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";
import { ROTULO_CAMPO, lerPlano, mostrarCelula, mostrarValor, prepararImportacao, type Plano, type Preparo } from "./plano";
import { lerXlsx, type Aba } from "./xlsx";

interface Props { base: Base; aoFechar: () => void }

/** Grava o que a prévia mostrou: primeiro a página (núcleos e status), depois as tarefas. */
function aplicarImportacao(pr: Preparo, apagarFora: TarefaFestival[]) {
  if (pr.nucleosNovos.length || pr.nucleosAtualizados.length || pr.statusNovos.length || pr.statusRenomeados.length) {
    alterarPagina((p) => {
      p.nucleos = [
        ...p.nucleos.map((n) => {
          const m = pr.nucleosAtualizados.find((x) => x.id === n.id);
          if (!m) return n;
          return {
            ...n,
            ...(m.escopo != null ? { escopo: m.escopo } : {}),
            ...(m.escopoDoPlano != null ? { escopoDoPlano: m.escopoDoPlano } : {}),
            ...(m.responsavel != null ? { responsavel: m.responsavel } : {}),
            membros: [...(n.membros || []), ...(m.membros || []).filter((x) => !(n.membros || []).includes(x))],
          };
        }),
        ...pr.nucleosNovos,
      ];
      const lista = (p.listas.statusTarefa || []).map((s) => {
        const r = pr.statusRenomeados.find((x) => x.id === s.id);
        return r ? { ...s, nome: r.para } : s;
      });
      // Status novo entra antes de "Concluído", que fica sendo a última coluna do quadro.
      const fim = lista.findIndex((s) => s.id === "concluido");
      lista.splice(fim < 0 ? lista.length : fim, 0, ...pr.statusNovos);
      p.listas.statusTarefa = lista;
    });
  }
  [...pr.novas, ...pr.atualizadas.map((m) => m.tarefa), ...pr.carimbos].forEach((t) => gravar("tarefas", t));
  apagarFora.forEach((t) => apagar("tarefas", t.id));
}

const plural = (n: number, um: string, varios: string) => n + " " + (n === 1 ? um : varios);

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="cdf:rounded-[10px] cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie-2 cdf:px-3 cdf:py-2.5">
      <div className="cdf:font-display cdf:text-[30px] cdf:font-black cdf:leading-none cdf:text-primaria cdf:tabular-nums">{valor}</div>
      <div className="cdf:mt-1 cdf:text-[13px] cdf:text-tinta-2">{rotulo}</div>
    </div>
  );
}

/** Lista que abre e fecha ("Ver as 34 tarefas"). */
function Detalhe({ resumo, children }: { resumo: string; children: ReactNode }) {
  return (
    <details className="cdf:mt-1.5 cdf:text-sm">
      <summary className="cdf:cursor-pointer cdf:font-bold cdf:text-link">{resumo}</summary>
      <ul className="cdf:m-0 cdf:mt-1.5 cdf:max-h-[180px] cdf:list-none cdf:overflow-y-auto cdf:rounded-lg cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:p-0">{children}</ul>
    </details>
  );
}
const ITEM = "cdf:border-0 cdf:border-b cdf:border-solid cdf:border-linha cdf:px-2.5 cdf:py-1.5 cdf:last:border-b-0";
const CODIGO = "cdf:mr-1.5 cdf:font-bold cdf:tabular-nums cdf:text-tinta-2";

export function ModalImportarPlano({ base, aoFechar }: Props) {
  const [arquivo, setArquivo] = useState("");
  const [plano, setPlano] = useState<Plano | null>(null);
  const [erro, setErro] = useState("");
  const [lendo, setLendo] = useState(false);
  // Cada marca guarda a lista que estava na tela quando foi feita (ver o comentário do arquivo).
  const [marcaPlanilhaVence, setMarcaPlanilhaVence] = useState<string | null>(null);
  const [marcaApagar, setMarcaApagar] = useState<string | null>(null);

  // Os conflitos não dependem da escolha (ela só decide quem vence), então a chave sai de uma prévia sem a opção.
  const chaveConflitos = useMemo(
    () => (plano ? prepararImportacao(base, plano, { planilhaVenceConflito: false }).conflitos.map((c) => c.codigo + ":" + c.campo + ":" + c.naCentral + ":" + c.naPlanilha).join("|") : ""),
    [base, plano],
  );
  const planilhaVence = marcaPlanilhaVence != null && marcaPlanilhaVence === chaveConflitos;
  const pr = useMemo(() => (plano ? prepararImportacao(base, plano, { planilhaVenceConflito: planilhaVence }) : null), [base, plano, planilhaVence]);
  const chaveFora = pr ? pr.fora.map((t) => t.id).join("|") : "";
  const apagaFora = !!pr && pr.fora.length > 0 && marcaApagar === chaveFora;

  async function escolher(f: File | undefined) {
    if (!f) return;
    setPlano(null); setErro(""); setArquivo(f.name); setMarcaPlanilhaVence(null); setMarcaApagar(null);
    setLendo(true);
    try {
      const buf = await f.arrayBuffer();
      const abas: Aba[] = /\.csv$/i.test(f.name) ? [{ nome: f.name, linhas: lerCsv(decodificarTexto(buf)) }] : await lerXlsx(buf);
      setPlano(lerPlano(abas));
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : "Não consegui ler a planilha.");
    } finally {
      setLendo(false);
    }
  }

  const mudaNucleos = !!pr && (pr.nucleosNovos.length > 0 || pr.nucleosAtualizados.some((n) => n.escopo != null || n.responsavel != null || n.membros));
  const mudaStatus = !!pr && pr.statusNovos.length + pr.statusRenomeados.length > 0;
  const visivel = !!pr && (pr.novas.length + pr.atualizadas.length > 0 || mudaNucleos || mudaStatus || apagaFora);
  const soRegistro = !!pr && !visivel && (pr.carimbos.length > 0 || pr.nucleosAtualizados.length > 0);
  const temOQueFazer = visivel || soRegistro;

  function importar() {
    if (!pr) return;
    aplicarImportacao(pr, apagaFora ? pr.fora : []);
    aoFechar();
    const partes = [
      pr.novas.length ? plural(pr.novas.length, "tarefa nova", "tarefas novas") : "",
      pr.atualizadas.length ? plural(pr.atualizadas.length, "atualizada", "atualizadas") : "",
      apagaFora ? plural(pr.fora.length, "apagada", "apagadas") : "",
    ].filter(Boolean);
    toast(partes.length ? "Plano importado: " + partes.join(", ") + "." : "Plano importado.");
  }

  const mexe = pr ? pr.novas.length + pr.atualizadas.length : 0;
  const rotulo = mexe ? "Importar " + plural(mexe, "tarefa", "tarefas") : "Importar";

  return (
    <Modal titulo="Importar plano de ação" aoFechar={aoFechar} aoSalvar={importar} rotuloSalvar={rotulo} bloqueado={!temOQueFazer}>
      <Grupo rotulo="Planilha do plano de ação (.xlsx ou .csv)" className={LINHA_INTEIRA}>
        <Entrada
          type="file" accept=".xlsx,.csv" aria-label="Planilha do plano de ação" className="cdf:cursor-pointer cdf:py-1.5"
          // Limpar antes de abrir faz o navegador avisar mesmo quando se escolhe de novo o mesmo arquivo (já corrigido).
          onClick={(e) => { e.currentTarget.value = ""; }}
          onChange={(e) => { void escolher(e.target.files?.[0]); }}
        />
        <p className={NOTA + " cdf:mt-1.5"}>
          A tabela precisa das colunas ID e Tarefa; as outras (Grupo de Trabalho, Frente, Responsável, Prazo, Prioridade, Status, Dependência, Entrega, Observações) entram quando existem.
          A tarefa é reconhecida pelo ID: importar de novo atualiza, não duplica, e não desfaz o que a equipe mudou aqui.
        </p>
      </Grupo>

      {lendo && <p className={NOTA + " " + LINHA_INTEIRA}>Lendo {arquivo}…</p>}
      {erro && <p role="alert" className={LINHA_INTEIRA + " cdf:m-0 cdf:rounded-lg cdf:bg-rec-bg cdf:px-3 cdf:py-2.5 cdf:font-bold cdf:text-rec"}>{erro}</p>}

      {plano && pr && (
        <>
          <p className={LINHA_INTEIRA + " cdf:m-0"}>
            <strong>{arquivo}</strong>, aba {plano.aba}: {plural(plano.linhas.length, "tarefa", "tarefas")} em {plural(plano.gts.length, "grupo de trabalho", "grupos de trabalho")}. Nada foi gravado ainda.
          </p>

          <div className={LINHA_INTEIRA + " cdf:grid cdf:grid-cols-2 cdf:gap-2 cdf:md:grid-cols-4"}>
            <Numero valor={pr.novas.length} rotulo="novas" />
            <Numero valor={pr.atualizadas.length} rotulo="atualizadas" />
            <Numero valor={pr.iguais} rotulo="sem mudança" />
            <Numero valor={pr.fora.length} rotulo="fora da planilha" />
          </div>

          {pr.atualizadas.length > 0 && (
            <div className={LINHA_INTEIRA}>
              <Detalhe resumo={"Ver o que muda em " + plural(pr.atualizadas.length, "tarefa", "tarefas")}>
                {pr.atualizadas.map((m) => (
                  <li key={m.tarefa.id} className={ITEM}>
                    <span className={CODIGO}>{m.tarefa.codigo}</span>{m.tarefa.titulo}
                    <span className="cdf:block cdf:text-[13px] cdf:text-fraco">muda: {m.campos.map((c) => ROTULO_CAMPO[c]).join(", ")}</span>
                  </li>
                ))}
              </Detalhe>
            </div>
          )}

          {(mudaNucleos || mudaStatus) && (
            <Grupo rotulo="Núcleos e status" className={LINHA_INTEIRA}>
              <ul className="cdf:m-0 cdf:list-disc cdf:pl-[18px] cdf:text-sm">
                {pr.nucleosNovos.length > 0 && <li>Núcleo novo: {pr.nucleosNovos.map((n) => n.nome).join(", ")}.</li>}
                {pr.nucleosAtualizados.some((n) => n.escopo != null) && (
                  <li>Escopo do plano gravado em: {pr.nucleosAtualizados.filter((n) => n.escopo != null).map((n) => n.nome).join(", ")}.</li>
                )}
                {pr.nucleosAtualizados.filter((n) => n.responsavel != null).map((n) => (
                  <li key={"r" + n.id}>{n.nome} passa a ter responsável: {mostrarValor(base, "responsavel", n.responsavel!)}.</li>
                ))}
                {pr.nucleosAtualizados.filter((n) => n.membros).map((n) => (
                  <li key={"m" + n.id}>{n.nome} ganha como membro: {n.membros!.map((m) => mostrarValor(base, "responsavel", m)).join(", ")}.</li>
                ))}
                {pr.statusRenomeados.map((s) => <li key={s.id}>O status “{s.de}” passa a se chamar “{s.para}”, como na planilha.</li>)}
                {pr.statusNovos.length > 0 && <li>Status novo: {pr.statusNovos.map((s) => s.nome).join(", ")}.</li>}
              </ul>
            </Grupo>
          )}

          {pr.conflitos.length > 0 && (
            <Grupo rotulo={plural(pr.conflitos.length, "conflito", "conflitos")} className={LINHA_INTEIRA}>
              <p className={NOTA}>Campo com um valor na planilha e outro aqui, os dois mudados desde a última importação. Fica o valor da Central, a não ser que você marque a opção.</p>
              <Detalhe resumo="Ver os conflitos">
                {pr.conflitos.map((c) => (
                  <li key={c.codigo + c.campo} className={ITEM}>
                    <span className={CODIGO}>{c.codigo}</span>{ROTULO_CAMPO[c.campo]}
                    <span className="cdf:block cdf:text-[13px] cdf:text-fraco">Central: {mostrarValor(base, c.campo, c.naCentral)} · Planilha: {mostrarCelula(c.campo, c.naPlanilha)}</span>
                  </li>
                ))}
              </Detalhe>
              <Check
                rotulo="Nos conflitos, vale a planilha" className="cdf:mt-2" checked={planilhaVence}
                onChange={(e) => setMarcaPlanilhaVence(e.target.checked ? chaveConflitos : null)}
              />
            </Grupo>
          )}

          {pr.fora.length > 0 && (
            <Grupo rotulo={plural(pr.fora.length, "tarefa da Central não está na planilha", "tarefas da Central não estão na planilha")} className={LINHA_INTEIRA}>
              <p className={NOTA}>Continuam como estão, a não ser que você mande apagar. Apagar aqui é definitivo (não vai para a lixeira); se quiser guardar, baixe antes a base em Configuração.</p>
              <Detalhe resumo={"Ver " + plural(pr.fora.length, "tarefa", "tarefas")}>
                {pr.fora.map((t) => <li key={t.id} className={ITEM}>{t.codigo && <span className={CODIGO}>{t.codigo}</span>}{t.titulo}</li>)}
              </Detalhe>
              <Check
                rotulo={"Apagar " + (pr.fora.length === 1 ? "essa tarefa" : "essas " + pr.fora.length + " tarefas")} className="cdf:mt-2" checked={apagaFora}
                onChange={(e) => setMarcaApagar(e.target.checked ? chaveFora : null)}
              />
            </Grupo>
          )}

          {pr.avisos.length > 0 && (
            <Grupo rotulo="Avisos" className={LINHA_INTEIRA}>
              <ul className="cdf:m-0 cdf:list-disc cdf:pl-[18px] cdf:text-sm cdf:text-tinta-2">{pr.avisos.map((a) => <li key={a}>{a}</li>)}</ul>
            </Grupo>
          )}

          {soRegistro && <p className={NOTA + " " + LINHA_INTEIRA}>Nada muda nas tarefas. Importar só atualiza o registro do que a planilha diz (e a ordem do plano), para a próxima comparação.</p>}
          {!temOQueFazer && <p className={NOTA + " " + LINHA_INTEIRA}>A Central já está em dia com a planilha: não há nada para importar.</p>}
        </>
      )}
    </Modal>
  );
}
