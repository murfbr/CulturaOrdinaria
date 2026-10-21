/* Núcleo do Coletivo, aba Acessos: uma linha por conta (documento
   usuarios/<e-mail>) com e-mail, nome, ativa, a marca master e uma caixa por
   módulo (os ambientes da Central, o Núcleo e cada página anexo). "+ Conta"
   cria o documento a partir de um perfil, que só preenche as caixas. O login
   em si continua no console do Firebase (Authentication), com o mesmo e-mail;
   a senha a pessoa define pelo "esqueci a senha". Contas não se apagam:
   desativam. A última conta master ativa não se rebaixa nem se desativa, para
   ninguém ficar trancado para fora. */
import { useEffect, useState, type ReactNode } from "react";
import { emailSessao } from "../../services/sessao";
import { usarCentral } from "../../store/central";
import { AMBIENTES } from "../../store/navegacao";
import { chaveDaConta, iniciarNucleo, salvarConta, usarNucleo } from "../../store/nucleo";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { toast } from "../../components/Toast";
import { Balao } from "../../components/ui/Balao";
import { Botao } from "../../components/ui/Botao";
import { CaixaMarcar, Entrada, Selecao } from "../../components/ui/Campo";
import { Dica } from "../../components/ui/Dica";
import { Painel } from "../../components/ui/Painel";
import { Tabela, Td, Th } from "../../components/ui/Tabela";
import { Vazio } from "../../components/ui/Vazio";
import { MODULOS_CENTRAL, MODULOS_DA_COLECAO, MODULO_NUCLEO, PERFIS, ROTULO_COLECAO, ROTULO_MODULO, ehModuloDePagina, moduloDaPagina, slugDoModulo, type ContaUsuario } from "../../types";
import { relativo } from "../../utils";
import { PAGINAS_PROPRIAS } from "../paginasProprias";

/** As colunas de módulo: os ambientes da Central, o Núcleo e uma por página anexo do registro em código. */
function colunasDeModulo(titulos: Record<string, string>): [id: string, rotulo: string][] {
  return [
    ...MODULOS_CENTRAL.map((id) => [id, ROTULO_MODULO[id]] as [string, string]),
    [MODULO_NUCLEO, "Núcleo"],
    ...Object.entries(PAGINAS_PROPRIAS).map(([slug, p]) => [moduloDaPagina(slug), titulos[slug] || p.titulo] as [string, string]),
  ];
}

const ROTULO_EXTRA: Record<string, string> = {
  formularios: "Formulários", rascunhos: "Rascunhos de projeto", versoes: "Versões de projeto", candidaturas: "Candidaturas",
  fichas: "Fichas de contexto", regras: "Regras", julgamentos: "Julgamentos",
  semanas: "Programação da semana", nucleo: "Anotações do Núcleo", usuarios: "Contas",
};
const rotuloDaColecao = (c: string) => (ROTULO_COLECAO as Record<string, string>)[c] || ROTULO_EXTRA[c] || c;
/** "a, b e c" */
const lista = (xs: string[]) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " e " + xs[xs.length - 1]);
const abasDe = (id: string) => (AMBIENTES.find((a) => a.id === id)?.abas || []).map(([, r]) => r);
function nomeDoModulo(m: string, titulos: Record<string, string>): string {
  if (!ehModuloDePagina(m)) return ROTULO_MODULO[m] || m;
  const slug = slugDoModulo(m);
  return titulos[slug] || PAGINAS_PROPRIAS[slug]?.titulo || slug;
}

/** O que a coluna envolve: as telas que o módulo abre e as coleções em que grava, com quem mais grava nelas
    (a mesma tabela MODULOS_DA_COLECAO das regras do banco). */
function explicacaoDoModulo(id: string, titulos: Record<string, string>): ReactNode {
  const grava = Object.entries(MODULOS_DA_COLECAO)
    .filter(([, donos]) => donos.includes(id))
    .map(([colecao, donos]) => {
      const outros = donos.filter((d) => d !== id).map((d) => nomeDoModulo(d, titulos));
      return rotuloDaColecao(colecao) + (outros.length ? " (também " + lista(outros) + ")" : "");
    });
  let abre: string;
  let nota: string;
  if (ehModuloDePagina(id)) {
    const slug = slugDoModulo(id);
    abre = "a página /" + slug + "/";
    grava.unshift("a base da própria página");
    nota = PAGINAS_PROPRIAS[slug]?.leACentral
      ? "A página lê a Central: só abre para conta que também tem um módulo da Central."
      : "Página independente: abre mesmo para conta sem módulo da Central, em Suas páginas.";
  } else if (id === MODULO_NUCLEO) {
    abre = lista(abasDe(id));
    nota = "Único módulo de leitura restrita: quem não o tem não lê contas nem anotações.";
  } else {
    abre = lista(abasDe(id));
    nota = "Lê o banco inteiro do coletivo, como todo módulo da Central; o que muda é onde grava.";
  }
  return (
    <>
      <span className="block"><b className="font-semibold">Abre:</b> {abre}.</span>
      <span className="block"><b className="font-semibold">Grava:</b> {grava.length ? lista(grava) : "nada, só mostra"}.</span>
      <span className="mt-1 block text-muted">{nota}</span>
    </>
  );
}

const NOVA = { email: "", nome: "", perfil: "coordenador" };

export function Acessos() {
  useEffect(() => { iniciarNucleo(); }, []);
  const { contas } = usarNucleo();
  const { presets } = usarCentral();
  const [nova, setNova] = useState(NOVA);
  const eu = chaveDaConta(emailSessao());
  const titulos = Object.fromEntries((presets.paginas?.paginas || []).map((p) => [p.slug, p.titulo]));
  const colunas = colunasDeModulo(titulos);
  const mastersAtivos = contas.filter((c) => c.master && c.ativo).length;
  const ultimoMaster = (c: ContaUsuario) => c.master && c.ativo && mastersAtivos === 1;

  const alterar = (c: ContaUsuario, mudanca: Partial<ContaUsuario>) => salvarConta({ ...c, ...mudanca });
  const alternarModulo = (c: ContaUsuario, m: string) =>
    alterar(c, { modulos: c.modulos.includes(m) ? c.modulos.filter((x) => x !== m) : [...c.modulos, m], perfil: "personalizado" });
  const aplicarPerfil = (c: ContaUsuario, id: string) => {
    const p = PERFIS.find((x) => x.id === id);
    if (!p) return;
    if (ultimoMaster(c) && !p.master) { toast("É a última conta master ativa: não dá para rebaixar."); return; }
    alterar(c, { master: p.master, modulos: [...p.modulos], perfil: p.id });
  };

  /** Página que lê a Central marcada para conta sem módulo da Central: a página não abriria. */
  const avisoPagina = (c: ContaUsuario) =>
    !c.master && !MODULOS_CENTRAL.some((m) => c.modulos.includes(m))
    && Object.entries(PAGINAS_PROPRIAS).some(([slug, p]) => p.leACentral && c.modulos.includes(moduloDaPagina(slug)));

  function criar() {
    const id = chaveDaConta(nova.email);
    if (!id.includes("@")) { toast("Digite o e-mail do login."); return; }
    if (contas.some((c) => c.id === id)) { toast("Já existe uma conta com esse e-mail."); return; }
    const p = PERFIS.find((x) => x.id === nova.perfil) || PERFIS[1];
    salvarConta({ id, email: id, nome: nova.nome.trim(), ativo: true, master: p.master, modulos: [...p.modulos], perfil: p.id });
    setNova(NOVA);
    toast("Conta criada. Crie o login com este e-mail no console do Firebase, se ainda não existe.");
  }

  return (
    <>
      <CabecalhoSecao titulo="Acessos" sub="quem abre o quê: a marca master e a lista de módulos de cada conta" />

      <Painel titulo="+ Conta" sub="o login se cria no console do Firebase (Authentication → Users) com o mesmo e-mail; a senha a pessoa define pelo 'esqueci a senha'. Conta sem linha aqui vê 'Sem acesso'">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm"><span className="text-muted">e-mail do login</span>
            <Entrada type="email" value={nova.email} onChange={(e) => setNova({ ...nova, email: e.target.value })} placeholder="pessoa@exemplo.com" /></label>
          <label className="flex flex-1 flex-col gap-1 text-sm"><span className="text-muted">nome</span>
            <Entrada value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} placeholder="como aparece no site" /></label>
          <label className="flex flex-col gap-1 text-sm"><span className="text-muted">perfil (preenche as caixas)</span>
            <Selecao value={nova.perfil} onChange={(e) => setNova({ ...nova, perfil: e.target.value })}>
              {PERFIS.map((p) => <option key={p.id} value={p.id}>{p.rotulo}: {p.descricao}</option>)}
            </Selecao></label>
          <Botao onClick={criar}>Criar</Botao>
        </div>
      </Painel>

      {!contas.length && <Vazio>Nenhuma conta cadastrada ainda. Comece pela sua, com o perfil Master; as outras entram por aqui.</Vazio>}

      {contas.length > 0 && (
        <Tabela minima="min-w-[900px]">
          <thead>
            <tr>
              <Th>Conta</Th>
              <Th><Balao titulo="Ativa" texto="Desmarcada, a conta não abre nada, com qualquer lista de módulos. É o jeito de tirar alguém sem apagar a linha.">Ativa</Balao></Th>
              <Th><Balao titulo="Master" texto="Passa por cima da lista: abre e grava tudo, inclusive os módulos que vierem. A última master ativa não se rebaixa nem se desativa.">Master</Balao></Th>
              {colunas.map(([id, rotulo]) => <Th key={id} quebra><Balao titulo={rotulo} texto={explicacaoDoModulo(id, titulos)}>{rotulo}</Balao></Th>)}
              <Th><Balao titulo="Preencher como" texto="Um perfil só preenche as caixas da linha de uma vez; depois você ajusta caixa por caixa. Não cria regra nova.">Preencher como</Balao></Th>
            </tr>
          </thead>
          <tbody>
            {contas.map((c) => (
              <tr key={c.id}>
                <Td>
                  <div className="font-semibold">{c.email}{c.id === eu && <span className="ml-1.5 font-mono text-2xs text-muted">você</span>}</div>
                  <Entrada className="mt-1 py-1 text-sm" value={c.nome || ""} placeholder="nome" onChange={(e) => alterar(c, { nome: e.target.value })} />
                  <div className="mt-1 text-xs text-faint">{c.perfil || "personalizado"}{c.atualizado ? " · " + relativo(c.atualizado) : ""}</div>
                  {avisoPagina(c) && <div className="mt-1 text-xs text-warn">⚠ página que lê a Central marcada para conta sem módulo da Central: não vai abrir.</div>}
                </Td>
                <Td><CaixaMarcar marcado={c.ativo} title={ultimoMaster(c) ? "última master ativa" : "ativa"}
                  aoMudar={() => { if (ultimoMaster(c)) { toast("É a última conta master ativa: não dá para desativar."); return; } alterar(c, { ativo: !c.ativo }); }} /></Td>
                <Td><CaixaMarcar marcado={c.master} title={ultimoMaster(c) ? "última master ativa" : "master: tudo, sempre"}
                  aoMudar={() => { if (ultimoMaster(c)) { toast("É a última conta master ativa: não dá para rebaixar."); return; } alterar(c, { master: !c.master, perfil: c.master ? "personalizado" : "master" }); }} /></Td>
                {colunas.map(([id]) => (
                  <Td key={id} className="text-center">
                    {c.master
                      ? <span className="font-mono text-2xs text-muted" title="master abre tudo">tudo</span>
                      : <CaixaMarcar marcado={c.modulos.includes(id)} aoMudar={() => alternarModulo(c, id)} />}
                  </Td>
                ))}
                <Td>
                  <Selecao className="w-auto py-1 text-sm" value="" onChange={(e) => { if (e.target.value) aplicarPerfil(c, e.target.value); }}>
                    <option value="">perfil…</option>
                    {PERFIS.map((p) => <option key={p.id} value={p.id}>{p.rotulo}</option>)}
                  </Selecao>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}

      <Dica>Master passa por cima da lista: abre e grava em tudo, inclusive nos módulos que vierem. Páginas anexo não é módulo: abre para quem tem qualquer módulo da Central. Quem não tem nenhum módulo da Central entra em "Suas páginas" e abre só as páginas marcadas; uma página que lê a Central (hoje o Ponta de Lança) não abre para essas contas.</Dica>
    </>
  );
}
