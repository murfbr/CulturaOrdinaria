/* Modal de cadastro e edição de um divulgador (doc 02, seção 7a2), e o modal
   "Colar lista", que cria vários de uma vez a partir de linhas copiadas de uma
   planilha (uma linha por perfil). */
import { useState } from "react";
import { AcoesModal, Modal, RodapeModal } from "../../../components/Modal";
import { toast } from "../../../components/Toast";
import { BotaoExcluir } from "../../../components/BotaoExcluir";
import { Botao } from "../../../components/ui/Botao";
import { AreaTexto, Campo, Entrada, Linhas, Marcacao, Selecao } from "../../../components/ui/Campo";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { usarCentral } from "../../../store/central";
import { excluirDivulgador, idDivulgador, limparArroba, salvarDivulgador, usarDivulgacao } from "../../../store/divulgacao";
import { ACEITA_DIVULGADOR, CUSTO_DIVULGADOR, TIPOS_DIVULGADOR, type Divulgador } from "../../../types";

export const lista = (s: string) => s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
const hoje = () => new Date().toISOString().slice(0, 10);

export function novoDivulgador(instagram: string): Divulgador {
  const ig = limparArroba(instagram);
  return {
    id: idDivulgador(ig), instagram: ig, nome: "", tipo: "agenda da cena", nichos: [], territorio: [], comoPedir: "", aceita: [],
    custo: "grátis", custoObs: "", quemFala: "", seguidores: null, seguidoresEm: "", situacao: "a testar", historico: [], obs: "",
    criado: hoje(),
  };
}

/** Opções de "quem fala com eles": Equipe e Contatos da Central. */
export function usarPessoas(): { valor: string; rotulo: string }[] {
  const { painel } = usarCentral();
  return [
    ...painel.equipe.map((p) => ({ valor: "equipe:" + p.id, rotulo: p.nome + " (equipe)" })),
    ...painel.contatos.map((c) => ({ valor: "contato:" + c.id, rotulo: c.nome + (c.tipo ? " (" + c.tipo + ")" : "") })),
  ];
}

export function nomeDaPessoa(ref: string, pessoas: { valor: string; rotulo: string }[]): string {
  if (!ref) return "";
  return pessoas.find((p) => p.valor === ref)?.rotulo.replace(/ \(.*\)$/, "") || ref.replace(/^(equipe|contato):/, "");
}

export function EditorDivulgador({ inicial, aoFechar, aoSalvar }: { inicial: Divulgador | null; aoFechar: () => void; aoSalvar?: (id: string) => void }) {
  const { divulgadores } = usarDivulgacao();
  const pessoas = usarPessoas();
  const novo = !inicial;
  const [d, setD] = useState<Divulgador>(inicial || novoDivulgador(""));
  const [nichos, setNichos] = useState((inicial?.nichos || []).join(", "));
  const [territorio, setTerritorio] = useState((inicial?.territorio || []).join(", "));
  const mudar = (m: Partial<Divulgador>) => setD({ ...d, ...m });

  function salvar() {
    const ig = limparArroba(d.instagram);
    if (!ig) { toast("Falta o @ do perfil."); return; }
    const id = novo ? idDivulgador(ig) : d.id;
    if (novo && divulgadores[id]) { toast("@" + ig + " já está na lista."); return; }
    const final: Divulgador = { ...d, id, instagram: ig, nichos: lista(nichos), territorio: lista(territorio), nome: d.nome.trim() };
    if (salvarDivulgador(final)) { aoSalvar?.(id); aoFechar(); }
  }

  return (
    <Modal titulo={novo ? "Novo divulgador" : "@" + d.instagram} aoFechar={aoFechar} largo>
      <Linhas colunas={3}>
        <Campo rotulo="@ no Instagram"><Entrada value={d.instagram} placeholder="@perfil ou o link" onChange={(e) => mudar({ instagram: e.target.value })} /></Campo>
        <Campo rotulo="Nome"><Entrada value={d.nome} placeholder="como a página se chama" onChange={(e) => mudar({ nome: e.target.value })} /></Campo>
        <Campo rotulo="Situação">
          <Selecao value={d.situacao} onChange={(e) => mudar({ situacao: e.target.value as Divulgador["situacao"] })}>
            <option value="em uso">em uso</option><option value="a testar">a testar (ainda não pedimos)</option><option value="não usar">não usar</option>
          </Selecao>
        </Campo>
      </Linhas>
      <Linhas colunas={3}>
        <Campo rotulo="Tipo">
          <Selecao value={d.tipo} onChange={(e) => mudar({ tipo: e.target.value })}>
            {TIPOS_DIVULGADOR.map((t) => <option key={t} value={t}>{t}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Nichos"><Entrada value={nichos} placeholder="samba, forró, gratuito…" onChange={(e) => setNichos(e.target.value)} /></Campo>
        <Campo rotulo="Território"><Entrada value={territorio} placeholder="Centro, Zona Norte, cidade toda…" onChange={(e) => setTerritorio(e.target.value)} /></Campo>
      </Linhas>
      <Campo rotulo="Como pedir">
        <AreaTexto value={d.comoPedir} placeholder="DM, WhatsApp, e-mail ou formulário; com quanta antecedência; o que mandar (arte, texto, link)"
          onChange={(e) => mudar({ comoPedir: e.target.value })} />
      </Campo>
      <Campo rotulo="O que aceita">
        <div className="flex flex-wrap gap-4">
          {ACEITA_DIVULGADOR.map((a) => (
            <Marcacao key={a} marcado={d.aceita.includes(a)}
              aoMudar={(v) => mudar({ aceita: v ? [...d.aceita, a] : d.aceita.filter((x) => x !== a) })}>{a}</Marcacao>
          ))}
        </div>
      </Campo>
      <Linhas colunas={3}>
        <Campo rotulo="Custo">
          <Selecao value={d.custo} onChange={(e) => mudar({ custo: e.target.value })}>
            {CUSTO_DIVULGADOR.map((c) => <option key={c} value={c}>{c}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Valor ou condição"><Entrada value={d.custoObs} placeholder="R$ 150 por post; 2 ingressos…" onChange={(e) => mudar({ custoObs: e.target.value })} /></Campo>
        <Campo rotulo="Quem fala com eles">
          <Selecao value={d.quemFala} onChange={(e) => mudar({ quemFala: e.target.value })}>
            <option value="">—</option>
            {pessoas.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
          </Selecao>
        </Campo>
      </Linhas>
      <Linhas colunas={3}>
        <Campo rotulo="Seguidores">
          <Entrada type="number" min={0} value={d.seguidores ?? ""} onChange={(e) => mudar({ seguidores: e.target.value === "" ? null : Number(e.target.value) })} />
        </Campo>
        <Campo rotulo="Contados em"><Entrada type="date" value={d.seguidoresEm} onChange={(e) => mudar({ seguidoresEm: e.target.value })} /></Campo>
      </Linhas>
      <Campo rotulo="Observações"><AreaTexto value={d.obs} onChange={(e) => mudar({ obs: e.target.value })} /></Campo>
      <RodapeModal>
        {!novo && <BotaoExcluir aoConfirmar={() => { excluirDivulgador(d.id); aoFechar(); toast("@" + d.instagram + " saiu da lista."); }} />}
        <AcoesModal>
          <Botao variante="quieto" onClick={aoFechar}>Cancelar</Botao>
          <Botao onClick={salvar}>Salvar</Botao>
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}

/** Linha colada → divulgador. Colunas: @, nome, tipo, nichos, território, como pedir, aceita, custo. */
export function linhaParaDivulgador(colunas: string[]): Divulgador | null {
  const [ig, nome, tipo, nichos, territorio, comoPedir, aceita, custo] = colunas.map((c) => (c || "").trim());
  const handle = limparArroba(ig || "");
  if (!handle || !/^[a-z0-9._]+$/.test(handle)) return null;
  const d = novoDivulgador(handle);
  d.nome = nome || "";
  if (tipo) d.tipo = TIPOS_DIVULGADOR.find((t) => t.startsWith(tipo.toLowerCase().slice(0, 5))) || tipo.toLowerCase();
  d.nichos = lista(nichos || "");
  d.territorio = lista(territorio || "");
  d.comoPedir = comoPedir || "";
  d.aceita = lista(aceita || "").map((a) => ACEITA_DIVULGADOR.find((x) => x.startsWith(a.toLowerCase().slice(0, 5))) || a.toLowerCase());
  if (custo) d.custo = CUSTO_DIVULGADOR.find((c) => c.startsWith(custo.toLowerCase().slice(0, 3))) || "pago";
  if (custo && !CUSTO_DIVULGADOR.some((c) => c === custo.toLowerCase())) d.custoObs = custo;
  return d;
}

export function lerListaColada(texto: string): Divulgador[] {
  const saida: Divulgador[] = [];
  for (const linha of texto.split(/\r?\n/)) {
    if (!linha.trim()) continue;
    const colunas = linha.includes("\t") ? linha.split("\t") : linha.split(";");
    const d = linhaParaDivulgador(colunas);
    if (d && !saida.some((x) => x.id === d.id)) saida.push(d);
  }
  return saida;
}

export function ColarLista({ aoFechar }: { aoFechar: () => void }) {
  const { divulgadores } = usarDivulgacao();
  const [texto, setTexto] = useState("");
  const lidos = lerListaColada(texto);
  const novos = lidos.filter((d) => !divulgadores[d.id]);
  const repetidos = lidos.length - novos.length;

  function gravar() {
    let n = 0;
    for (const d of novos) if (salvarDivulgador(d)) n++;
    toast(n + " divulgador(es) entraram na lista" + (repetidos ? "; " + repetidos + " já estavam." : "."));
    aoFechar();
  }

  return (
    <Modal titulo="Colar lista" aoFechar={aoFechar} largo>
      <p className="m-0 mb-2 text-base">
        Uma linha por perfil, copiada de uma planilha (colunas separadas por tabulação) ou digitada com ";". Só o @ é obrigatório.
        Ordem das colunas: <b>@</b>; nome; tipo; nichos; território; como pedir; o que aceita; custo.
      </p>
      <AreaTexto className="min-h-40 font-mono text-sm" value={texto} onChange={(e) => setTexto(e.target.value)}
        placeholder={"@rionoforro; Rio no Forró; agenda da cena; forró, gratuito; cidade toda; DM 5 dias antes com arte e texto; story, agenda da semana; grátis\n@outroperfil"} />
      {lidos.length > 0 && (
        <>
          <p className="m-0 mt-3 text-base">{novos.length} novo(s){repetidos ? ", " + repetidos + " já na lista (ficam como estão)" : ""}.</p>
          <Tabela simples minima="min-w-[600px]">
            <thead><tr><Th>@</Th><Th>Nome</Th><Th>Tipo</Th><Th>Nichos</Th><Th>Território</Th></tr></thead>
            <tbody>
              {lidos.slice(0, 30).map((d) => (
                <tr key={d.id} className={divulgadores[d.id] ? "opacity-50" : ""}>
                  <Td>@{d.instagram}</Td><Td>{d.nome}</Td><Td>{d.tipo}</Td><Td>{d.nichos.join(", ")}</Td><Td>{d.territorio.join(", ")}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </>
      )}
      <RodapeModal>
        <AcoesModal>
          <Botao variante="quieto" onClick={aoFechar}>Cancelar</Botao>
          <Botao onClick={gravar} disabled={!novos.length}>Gravar {novos.length || ""}</Botao>
        </AcoesModal>
      </RodapeModal>
    </Modal>
  );
}
