/* Comunicação › Divulgadores (doc 02 da metodologia, seção 7a2): perfis de
   agenda e páginas que replicam nossos eventos quando a gente pede. Canal de
   distribuição, não referência: a ficha guarda como pedir, o que aceita, quem
   fala com eles e o histórico de envios, evento a evento. O "Kit do evento"
   monta um link com UTM pra cada um e registra o envio; a contagem pela lista
   do Sympla (Mailing, só para quem tem o módulo) grava quantas retiradas
   vieram pelo link de cada perfil, sem nomes.
   Endereços: #/comunicacao/divulgadores (lista) · /kit · /dv-… */
import { useEffect, useMemo, useState } from "react";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../../components/Filtros";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { copiarComAviso, toast } from "../../../components/Toast";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { CabecalhoFicha } from "../../../components/ui/CabecalhoFicha";
import { AreaTexto, Campo, Entrada, Linhas, Selecao } from "../../../components/ui/Campo";
import { CartaoLista } from "../../../components/ui/CartaoLista";
import { Dado, Dados } from "../../../components/ui/Dados";
import { Grade } from "../../../components/ui/Grade";
import { Painel } from "../../../components/ui/Painel";
import { Pilulas } from "../../../components/ui/Pilulas";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { usarAcesso } from "../../../services/acesso";
import { iniciarComunicacao, usarComunicacao } from "../../../store/comunicacao";
import {
  iniciarDivulgadores, iniciarMailing, pararMailing, registrarMailing, salvarDivulgador, temMailing, usarDivulgacao,
} from "../../../store/divulgacao";
import { abrirNaComunicacao, definirBibliotecaAberta, usarNavegacao } from "../../../store/navegacao";
import { EVENTOS_SYMPLA, PUBLICOU_ENVIO, type Divulgador, type EnvioDivulgador, type PublicouEnvio } from "../../../types";
import { comparar } from "../../../utils";
import { diaMes, formatar } from "../biblioteca/calculo";
import { juntarEventos, retiradasPorConteudo } from "../mailing/calculoMailing";
import { ColarLista, EditorDivulgador, nomeDaPessoa, usarPessoas } from "./EditorDivulgador";
import { campanhaPadrao, etiquetasDivulgador, kitLembrado, lembrarKit, linkComUtm, mensagemDoKit, resumoHistorico } from "./utm";

const VISTAS = [{ id: "lista", rotulo: "Lista" }, { id: "kit", rotulo: "Kit do evento" }];
const hoje = () => new Date().toISOString().slice(0, 10);
const dataCurta = (d: string) => (d ? diaMes(d) + "/" + d.slice(2, 4) : "");
const novoIdEnvio = () => "en-" + Math.random().toString(36).slice(2, 8);
const TOM_PUBLICOU: Record<string, string> = { sim: "ok", não: "erro", "sem resposta": "neutro", aguardando: "aviso" };

export function Divulgadores() {
  useEffect(() => { iniciarDivulgadores(); iniciarComunicacao(); }, []);
  const nav = usarNavegacao();
  const d = usarDivulgacao();
  const [editando, setEditando] = useState<Divulgador | null | "novo">(null);
  const [colando, setColando] = useState(false);
  const aberta = nav.bibliotecaAberta || "lista";
  const ficha = aberta.startsWith("dv-") ? aberta : "";
  const vista = ficha ? "" : aberta === "kit" ? "kit" : "lista";

  const modais = (
    <>
      {editando && <EditorDivulgador inicial={editando === "novo" ? null : editando} aoFechar={() => setEditando(null)}
        aoSalvar={(id) => { if (editando === "novo") definirBibliotecaAberta(id); }} />}
      {colando && <ColarLista aoFechar={() => setColando(false)} />}
    </>
  );

  if (d.divulgadoresSemAcesso) {
    return (
      <>
        <CabecalhoSecao titulo="Divulgadores" />
        <Painel alerta titulo="O banco recusou os Divulgadores">
          As regras do Firestore ainda não têm a coleção divulgadores. O arquivo firestore.rules do repositório tem a linha:
          publicar pelo console do Firebase.
        </Painel>
      </>
    );
  }

  if (ficha) return <>{<FichaDivulgador id={ficha} aoEditar={setEditando} />}{modais}</>;

  return (
    <>
      <CabecalhoSecao titulo="Divulgadores" sub="perfis de agenda e páginas que replicam nossos eventos quando a gente pede">
        <Botao variante="fantasma" onClick={() => setColando(true)}>Colar lista</Botao>
        <Botao onClick={() => setEditando("novo")}>+ Divulgador</Botao>
      </CabecalhoSecao>
      <Pilulas opcoes={VISTAS} ativa={vista} aoEscolher={(id) => definirBibliotecaAberta(id === "lista" ? null : id)}>
        <ContarRetiradas />
      </Pilulas>
      {!d.divulgadoresProntos ? <div className="py-10 text-center text-lg text-muted">carregando os divulgadores…</div>
        : vista === "kit" ? <KitDoEvento />
          : <ListaDivulgadores aoColar={() => setColando(true)} />}
      {modais}
    </>
  );
}

function ListaDivulgadores({ aoColar }: { aoColar: () => void }) {
  const { divulgadores } = usarDivulgacao();
  const pessoas = usarPessoas();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [nicho, setNicho] = useState("");
  const [territorio, setTerritorio] = useState("");
  const [situacao, setSituacao] = useState("");
  const todos = Object.values(divulgadores);
  const nichos = [...new Set(todos.flatMap((x) => x.nichos))].sort(comparar);
  const territorios = [...new Set(todos.flatMap((x) => x.territorio))].sort(comparar);
  const tipos = [...new Set(todos.map((x) => x.tipo).filter(Boolean))].sort(comparar);
  const termo = busca.trim().toLowerCase();
  const lista = todos
    .filter((x) => !termo || x.instagram.includes(termo) || x.nome.toLowerCase().includes(termo))
    .filter((x) => !tipo || x.tipo === tipo)
    .filter((x) => !nicho || x.nichos.includes(nicho))
    .filter((x) => !territorio || x.territorio.includes(territorio))
    .filter((x) => !situacao || x.situacao === situacao)
    .sort((a, b) => resumoHistorico(b.historico).retiradas - resumoHistorico(a.historico).retiradas || comparar(a.nome || a.instagram, b.nome || b.instagram));

  if (!todos.length) {
    return (
      <Vazio>
        Nenhum divulgador na lista ainda. Se a lista está numa planilha (ou na cabeça de quem já manda pras páginas de agenda),
        o jeito mais rápido é <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-accent hover:underline" onClick={aoColar}>Colar lista</button>: uma linha por @.
      </Vazio>
    );
  }

  return (
    <>
      <BarraFiltros mostrando={lista.length} total={todos.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="@ ou nome…" />
        {tipos.length > 1 && <SeletorFiltro valor={tipo} aoMudar={setTipo} rotuloTodos="todos os tipos" opcoes={tipos} />}
        {nichos.length > 0 && <SeletorFiltro valor={nicho} aoMudar={setNicho} rotuloTodos="todos os nichos" opcoes={nichos} />}
        {territorios.length > 0 && <SeletorFiltro valor={territorio} aoMudar={setTerritorio} rotuloTodos="todo território" opcoes={territorios} />}
        <SeletorFiltro valor={situacao} aoMudar={setSituacao} rotuloTodos="qualquer situação" opcoes={["em uso", "a testar", "não usar"]} />
      </BarraFiltros>
      <Grade colunas={2} className="xl:grid-cols-3">
        {lista.map((x) => {
          const r = resumoHistorico(x.historico);
          return (
            <CartaoLista key={x.id} aoAbrir={() => definirBibliotecaAberta(x.id)}
              etiquetas={<>
                <Badge mini>{x.tipo}</Badge>
                {x.situacao !== "em uso" && <Badge mini tom={x.situacao === "não usar" ? "erro" : "aviso"}>{x.situacao}</Badge>}
                {x.custo !== "grátis" && <Badge mini tom="info">{x.custo}</Badge>}
              </>}
              titulo={x.nome || "@" + x.instagram}
              sub={<>@{x.instagram}{x.territorio.length ? " · " + x.territorio.join(", ") : ""}</>}>
              {x.nichos.length > 0 && <p className="m-0 mt-1 text-sm text-muted">{x.nichos.join(" · ")}</p>}
              <Dados compacto className="mt-2">
                <Dado compacto rotulo="Envios">{r.envios}</Dado>
                <Dado compacto rotulo="Publicaram">{r.respondidos ? r.publicaram + "/" + r.respondidos : "—"}</Dado>
                <Dado compacto rotulo="Retiradas">{r.comContagem ? formatar(r.retiradas, "int") : "—"}</Dado>
                <Dado compacto rotulo="Quem fala">{nomeDaPessoa(x.quemFala, pessoas) || "—"}</Dado>
              </Dados>
            </CartaoLista>
          );
        })}
      </Grade>
      <p className="m-0 mt-3 max-w-texto text-sm text-muted">
        Ordem: quem mais trouxe retiradas pelo link primeiro. "Publicaram" conta os envios com resposta (sem os que ainda aguardam).
        As retiradas chegam pela contagem na lista do Sympla (botão "Contar retiradas", com o módulo Mailing).
      </p>
    </>
  );
}

function FichaDivulgador({ id, aoEditar }: { id: string; aoEditar: (d: Divulgador) => void }) {
  const { divulgadores, divulgadoresProntos } = usarDivulgacao();
  const com = usarComunicacao();
  const pessoas = usarPessoas();
  const x = divulgadores[id];
  // Abre com o link e a campanha do último kit montado neste navegador.
  const [base, setBase] = useState(() => kitLembrado()?.base || "");
  const [campanha, setCampanha] = useState(() => kitLembrado()?.campanha || "");
  const voltar = () => definirBibliotecaAberta(null);
  if (!x) {
    return (
      <>
        <CabecalhoFicha rotuloVoltar="Divulgadores" aoVoltar={voltar} titulo={id} />
        {divulgadoresProntos ? <Vazio>Divulgador não encontrado.</Vazio> : <div className="py-10 text-center text-lg text-muted">carregando…</div>}
      </>
    );
  }
  const ref = Object.values(com.referencias).find((r) => r.instagram?.toLowerCase() === x.instagram);
  const r = resumoHistorico(x.historico);
  const link = linkComUtm(base, etiquetasDivulgador(x, campanha));
  const historico = [...x.historico].sort((a, b) => b.enviadoEm.localeCompare(a.enviadoEm));
  const mudarEnvio = (envId: string, m: Partial<EnvioDivulgador>) =>
    salvarDivulgador({ ...x, historico: x.historico.map((h) => (h.id === envId ? { ...h, ...m } : h)) });
  const tirarEnvio = (envId: string) => salvarDivulgador({ ...x, historico: x.historico.filter((h) => h.id !== envId) });

  return (
    <>
      <CabecalhoFicha rotuloVoltar="Divulgadores" aoVoltar={voltar} titulo={x.nome || "@" + x.instagram}
        sub={<>@{x.instagram} · {x.tipo} · {x.situacao}{x.territorio.length ? " · " + x.territorio.join(", ") : ""}</>}
        acoes={<>
          <a href={"https://www.instagram.com/" + x.instagram + "/"} target="_blank" rel="noreferrer" className="text-sm text-muted hover:text-ink">Instagram ↗</a>
          <Botao variante="fantasma" tamanho="pequeno" onClick={() => aoEditar(x)}>Editar</Botao>
        </>} />

      {ref && (
        <Painel titulo="Também é referência">
          <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-base font-semibold text-accent hover:underline"
            onClick={() => abrirNaComunicacao("biblioteca", ref.id)}>abrir a ficha de referência de @{ref.instagram} →</button>
          <span className="ml-2 text-sm text-muted">a leitura do perfil (o que posta, o que rende) mora lá; aqui fica o canal.</span>
        </Painel>
      )}

      <Grade>
        <Painel titulo="Como pedir" className="mb-0">
          <p className="m-0 whitespace-pre-line text-base">{x.comoPedir || <span className="text-muted">ainda não anotado</span>}</p>
          <Dados compacto className="mt-3">
            <Dado compacto rotulo="Aceita">{x.aceita.length ? x.aceita.join(", ") : "—"}</Dado>
            <Dado compacto rotulo="Custo">{x.custo}{x.custoObs ? " · " + x.custoObs : ""}</Dado>
            <Dado compacto rotulo="Quem fala">{nomeDaPessoa(x.quemFala, pessoas) || "—"}</Dado>
            <Dado compacto rotulo="Seguidores">{x.seguidores != null ? formatar(x.seguidores, "compact") + (x.seguidoresEm ? " em " + dataCurta(x.seguidoresEm) : "") : "—"}</Dado>
          </Dados>
          {x.nichos.length > 0 && <p className="m-0 mt-2 text-sm text-muted">Nichos: {x.nichos.join(", ")}</p>}
          {x.obs && <p className="m-0 mt-2 whitespace-pre-line text-sm">{x.obs}</p>}
        </Painel>
        <Painel titulo="Link com UTM" sub="o link do evento com a etiqueta deste perfil" className="mb-0">
          <Campo rotulo="Link do evento no Sympla"><Entrada value={base} placeholder="https://www.sympla.com.br/evento/…" onChange={(e) => setBase(e.target.value)} /></Campo>
          <Campo rotulo="Campanha (utm_campaign)"><Entrada value={campanha} placeholder="pontadelanca-nov26" onChange={(e) => setCampanha(e.target.value)} /></Campo>
          {link ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all text-sm">{link}</code>
              <Botao tamanho="mini" variante="fantasma" onClick={() => void copiarComAviso(link, "Link copiado")}>copiar</Botao>
            </div>
          ) : <p className="m-0 text-sm text-muted">utm_source=instagram · utm_medium=agenda · utm_content={x.instagram}</p>}
        </Painel>
      </Grade>

      <CabecalhoSecao titulo="Histórico" sub={r.envios + " envio(s) · " + (r.respondidos ? r.publicaram + " de " + r.respondidos + " publicaram" : "sem resposta anotada")
        + (r.comContagem ? " · " + formatar(r.retiradas, "int") + " retiradas pelo link" : "")} />
      {!historico.length ? <Vazio>Nenhum envio ainda. O Kit do evento registra os envios de uma vez.</Vazio> : (
        <Tabela minima="min-w-[900px]">
          <thead><tr><Th>Evento</Th><Th>Enviado</Th><Th>Publicou?</Th><Th>Formato</Th><Th>Link do post</Th><Th numerico>Retiradas</Th><Th>Obs</Th><Th /></tr></thead>
          <tbody>
            {historico.map((h) => (
              <tr key={h.id}>
                <Td>
                  <b className="font-semibold">{h.plano || "—"}</b>{h.ciclo ? " · " + h.ciclo : ""}
                  <div className="text-xs text-muted">utm_content={h.utm}{h.symplaId ? " · Sympla " + h.symplaId : ""}</div>
                </Td>
                <Td className="whitespace-nowrap">{dataCurta(h.enviadoEm)}</Td>
                <Td>
                  <Selecao className="w-auto min-w-[150px] py-1 text-sm" value={h.publicou} onChange={(e) => mudarEnvio(h.id, { publicou: e.target.value as PublicouEnvio })}>
                    {PUBLICOU_ENVIO.map((p) => <option key={p} value={p}>{p}</option>)}
                  </Selecao>
                </Td>
                <Td>
                  <Selecao className="w-auto min-w-[150px] py-1 text-sm" value={h.formato} onChange={(e) => mudarEnvio(h.id, { formato: e.target.value })}>
                    <option value="">—</option>
                    {["repost no feed", "story", "agenda da semana", "collab", "post próprio"].map((f) => <option key={f} value={f}>{f}</option>)}
                  </Selecao>
                </Td>
                <Td><Entrada className="py-1 text-sm" defaultValue={h.link} placeholder="https://instagram.com/p/…" onBlur={(e) => { if (e.target.value !== h.link) mudarEnvio(h.id, { link: e.target.value.trim() }); }} /></Td>
                <Td numerico>{h.retiradas != null ? formatar(h.retiradas, "int") : "—"}</Td>
                <Td><Entrada className="py-1 text-sm" defaultValue={h.obs} onBlur={(e) => { if (e.target.value !== h.obs) mudarEnvio(h.id, { obs: e.target.value }); }} /></Td>
                <Td><Botao tamanho="mini" variante="quieto" title="tirar este envio do histórico" onClick={() => tirarEnvio(h.id)}>×</Botao></Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
      <NovoEnvio divulgador={x} />
    </>
  );
}

/** Envio avulso (fora do kit). */
function NovoEnvio({ divulgador }: { divulgador: Divulgador }) {
  const [aberto, setAberto] = useState(false);
  const [symplaId, setSymplaId] = useState("");
  const [plano, setPlano] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [data, setData] = useState(hoje());
  if (!aberto) return <div className="mt-3"><Botao variante="fantasma" tamanho="pequeno" onClick={() => setAberto(true)}>+ Envio</Botao></div>;
  const escolher = (id: string) => {
    setSymplaId(id);
    const ev = EVENTOS_SYMPLA.find((e) => e.symplaId === id);
    if (ev) { setPlano(ev.plano); setCiclo(ev.ciclo || ev.titulo + " " + dataCurta(ev.data)); }
  };
  const gravar = () => {
    const envio: EnvioDivulgador = {
      id: novoIdEnvio(), plano: plano.trim(), ciclo: ciclo.trim(), symplaId, enviadoEm: data, publicou: "aguardando",
      link: "", formato: "", utm: divulgador.instagram, retiradas: null, obs: "",
    };
    if (salvarDivulgador({ ...divulgador, historico: [...divulgador.historico, envio], situacao: divulgador.situacao === "a testar" ? "em uso" : divulgador.situacao })) setAberto(false);
  };
  return (
    <Painel titulo="Novo envio" className="mt-3">
      <Linhas colunas={3}>
        <Campo rotulo="Evento do Sympla">
          <Selecao value={symplaId} onChange={(e) => escolher(e.target.value)}>
            <option value="">sem evento no Sympla</option>
            {[...EVENTOS_SYMPLA].reverse().map((e) => <option key={e.symplaId} value={e.symplaId}>{dataCurta(e.data)} · {e.titulo}</option>)}
          </Selecao>
        </Campo>
        <Campo rotulo="Plano"><Entrada value={plano} onChange={(e) => setPlano(e.target.value)} /></Campo>
        <Campo rotulo="Ciclo"><Entrada value={ciclo} onChange={(e) => setCiclo(e.target.value)} /></Campo>
      </Linhas>
      <Linhas colunas={3}>
        <Campo rotulo="Enviado em"><Entrada type="date" value={data} onChange={(e) => setData(e.target.value)} /></Campo>
      </Linhas>
      <div className="flex gap-2">
        <Botao variante="quieto" onClick={() => setAberto(false)}>Cancelar</Botao>
        <Botao onClick={gravar}>Registrar envio</Botao>
      </div>
    </Painel>
  );
}

const MODELO_PADRAO = "{titulo} · {data} · {local}\nEntrada com ingresso gratuito no Sympla: {link}";

/** Kit do evento: um link com UTM pra cada divulgador, a mensagem pronta e o registro do envio. */
function KitDoEvento() {
  const { divulgadores } = usarDivulgacao();
  const futuros = EVENTOS_SYMPLA.filter((e) => e.data >= hoje());
  const [symplaId, setSymplaId] = useState(futuros[0]?.symplaId || "");
  const evento = EVENTOS_SYMPLA.find((e) => e.symplaId === symplaId);
  const [plano, setPlano] = useState(evento?.plano || "");
  const [ciclo, setCiclo] = useState(evento?.ciclo || "");
  const [base, setBase] = useState(() => kitLembrado(symplaId)?.base || "");
  const [campanha, setCampanha] = useState(() => kitLembrado(symplaId)?.campanha || (evento ? campanhaPadrao(evento.plano, evento.data) : ""));
  const [modelo, setModelo] = useState(MODELO_PADRAO);
  const [nicho, setNicho] = useState("");
  const [territorio, setTerritorio] = useState("");
  const [fora, setFora] = useState<Set<string>>(new Set());

  const escolher = (id: string) => {
    setSymplaId(id);
    const ev = EVENTOS_SYMPLA.find((e) => e.symplaId === id);
    setPlano(ev?.plano || "");
    setCiclo(ev?.ciclo || "");
    const lembrado = kitLembrado(id);
    setBase(lembrado?.base || "");
    setCampanha(lembrado?.campanha || (ev ? campanhaPadrao(ev.plano, ev.data) : ""));
  };
  useEffect(() => { if (base || campanha) lembrarKit(symplaId, { base, campanha }); }, [symplaId, base, campanha]);
  const todos = Object.values(divulgadores).filter((x) => x.situacao !== "não usar");
  const nichos = [...new Set(todos.flatMap((x) => x.nichos))].sort(comparar);
  const territorios = [...new Set(todos.flatMap((x) => x.territorio))].sort(comparar);
  const lista = todos
    .filter((x) => !nicho || x.nichos.includes(nicho))
    .filter((x) => !territorio || x.territorio.includes(territorio))
    .sort((a, b) => comparar(a.nome || a.instagram, b.nome || b.instagram));
  const marcados = lista.filter((x) => !fora.has(x.id));
  const preenchido = (texto: string) => texto
    .replace(/\{titulo\}/g, evento?.titulo || ciclo || "")
    .replace(/\{data\}/g, evento ? diaMes(evento.data) : "")
    .replace(/\{local\}/g, evento?.local || "");
  const linkDe = (x: Divulgador) => linkComUtm(base, etiquetasDivulgador(x, campanha));
  const jaEnviado = (x: Divulgador) => Boolean(symplaId) && x.historico.some((h) => h.symplaId === symplaId);

  function registrar() {
    let n = 0;
    for (const x of marcados) {
      if (jaEnviado(x)) continue;
      const envio: EnvioDivulgador = {
        id: novoIdEnvio(), plano: plano.trim(), ciclo: ciclo.trim(), symplaId, enviadoEm: hoje(), publicou: "aguardando",
        link: "", formato: "", utm: x.instagram, retiradas: null, obs: "kit" + (campanha ? " · " + campanha : ""),
      };
      if (salvarDivulgador({ ...x, historico: [...x.historico, envio], situacao: x.situacao === "a testar" ? "em uso" : x.situacao })) n++;
    }
    toast(n ? n + " envio(s) registrados no histórico." : "Todos os marcados já tinham envio neste evento.");
  }

  return (
    <>
      <Painel titulo="O evento">
        <Linhas colunas={3}>
          <Campo rotulo="Evento">
            <Selecao value={symplaId} onChange={(e) => escolher(e.target.value)}>
              <option value="">outro (sem evento no Sympla)</option>
              {[...EVENTOS_SYMPLA].reverse().map((e) => <option key={e.symplaId} value={e.symplaId}>{dataCurta(e.data)} · {e.titulo}</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="Plano"><Entrada value={plano} onChange={(e) => setPlano(e.target.value)} /></Campo>
          <Campo rotulo="Ciclo"><Entrada value={ciclo} onChange={(e) => setCiclo(e.target.value)} /></Campo>
        </Linhas>
        <Linhas>
          <Campo rotulo="Campanha (utm_campaign)"><Entrada value={campanha} onChange={(e) => setCampanha(e.target.value)} /></Campo>
          <Campo rotulo="Link do evento no Sympla (sem etiquetas)">
            <Entrada value={base} placeholder="https://www.sympla.com.br/evento/…" onChange={(e) => setBase(e.target.value)} />
          </Campo>
        </Linhas>
        <Campo rotulo={<>Mensagem <span className="text-sm text-muted">({"{link}"} vira o link de cada perfil; {"{titulo}"}, {"{data}"} e {"{local}"} vêm do evento)</span></>}>
          <AreaTexto value={modelo} onChange={(e) => setModelo(e.target.value)} />
        </Campo>
        <p className="m-0 text-sm text-muted">
          Etiquetas de cada link: utm_source=instagram · utm_medium=agenda · utm_campaign={campanha || "…"} · utm_content=o @ do perfil.
          Arte e texto curto vão junto, por onde cada um pede (DM, WhatsApp, e-mail).
        </p>
      </Painel>

      <BarraFiltros mostrando={marcados.length} total={lista.length}>
        {nichos.length > 0 && <SeletorFiltro valor={nicho} aoMudar={setNicho} rotuloTodos="todos os nichos" opcoes={nichos} />}
        {territorios.length > 0 && <SeletorFiltro valor={territorio} aoMudar={setTerritorio} rotuloTodos="todo território" opcoes={territorios} />}
        <Botao tamanho="pequeno" variante="fantasma" disabled={!base || !marcados.length}
          onClick={() => void copiarComAviso(marcados.map((x) => "@" + x.instagram + ": " + linkDe(x)).join("\n"), marcados.length + " links copiados")}>
          Copiar todos os links
        </Botao>
        <Botao tamanho="pequeno" disabled={!marcados.length} onClick={registrar}>Registrar envio pros marcados ({marcados.length})</Botao>
      </BarraFiltros>
      {!lista.length ? <Vazio>Nenhum divulgador {nicho || territorio ? "com esse filtro" : "na lista ainda"}.</Vazio> : (
        <Tabela minima="min-w-[900px]">
          <thead><tr><Th /><Th>Divulgador</Th><Th>Como pedir</Th><Th>Link</Th><Th /></tr></thead>
          <tbody>
            {lista.map((x) => {
              const link = linkDe(x);
              return (
                <tr key={x.id} className={fora.has(x.id) ? "opacity-50" : ""}>
                  <Td>
                    <input type="checkbox" className="accent-ink" checked={!fora.has(x.id)}
                      onChange={() => { const s = new Set(fora); if (s.has(x.id)) s.delete(x.id); else s.add(x.id); setFora(s); }} />
                  </Td>
                  <Td>
                    <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-ink hover:underline"
                      onClick={() => definirBibliotecaAberta(x.id)}>{x.nome || "@" + x.instagram}</button>
                    <div className="text-xs text-muted">@{x.instagram} · {x.aceita.join(", ") || x.tipo}</div>
                    {jaEnviado(x) && <Badge mini tom="ok">envio registrado</Badge>}
                  </Td>
                  <Td className="max-w-[260px] text-sm">{x.comoPedir || <span className="text-faint">—</span>}</Td>
                  <Td className="max-w-[340px] break-all text-sm">{link || <span className="text-faint">cole o link do evento</span>}</Td>
                  <Td className="whitespace-nowrap">
                    <Botao tamanho="mini" variante="fantasma" disabled={!link} onClick={() => void copiarComAviso(link, "Link copiado")}>link</Botao>{" "}
                    <Botao tamanho="mini" variante="fantasma" disabled={!link}
                      onClick={() => void copiarComAviso(mensagemDoKit(preenchido(modelo), link), "Mensagem copiada")}>mensagem</Botao>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}
    </>
  );
}

/** Grava, em cada envio com evento do Sympla, quantas retiradas vieram pelo link (só o número). Precisa do módulo Mailing. */
function ContarRetiradas() {
  usarAcesso();
  const d = usarDivulgacao();
  const [pedido, setPedido] = useState(false);
  const pode = temMailing();
  const eventos = useMemo(() => (pedido ? juntarEventos(Object.values(d.eventos)) : []), [pedido, d.eventos]);

  useEffect(() => {
    if (!pedido || !d.mailingPronto) return;
    const porEvento = new Map<string, Map<string, { ingressos: number }>>();
    const importados = new Set(eventos.map((e) => e.symplaId));
    let envios = 0, divs = 0;
    for (const x of Object.values(d.divulgadores)) {
      let mudou = false;
      const historico = x.historico.map((h) => {
        if (!h.symplaId || !importados.has(h.symplaId)) return h;
        if (!porEvento.has(h.symplaId)) porEvento.set(h.symplaId, retiradasPorConteudo(eventos, h.symplaId));
        const n = porEvento.get(h.symplaId)?.get((h.utm || x.instagram).toLowerCase())?.ingressos || 0;
        if (h.retiradas === n) return h;
        mudou = true;
        envios++;
        return { ...h, retiradas: n };
      });
      if (mudou && salvarDivulgador({ ...x, historico })) divs++;
    }
    registrarMailing("contou", "retiradas pela UTM dos divulgadores: " + envios + " envio(s) de " + divs + " divulgador(es) atualizados (só números)");
    toast(envios ? envios + " envio(s) com retiradas atualizadas." : "Nenhuma mudança: as contagens já estavam em dia (ou os eventos não foram importados).");
    setPedido(false);
    pararMailing();
  }, [pedido, d.mailingPronto, eventos, d.divulgadores]);

  if (!pode) return null;
  return (
    <Botao variante="fantasma" tamanho="pequeno" disabled={pedido}
      title="lê a lista do Sympla (Mailing) e grava em cada envio quantas retiradas vieram pelo link do perfil"
      onClick={() => { setPedido(true); iniciarMailing("contagem de retiradas dos Divulgadores"); }}>
      {pedido ? "contando…" : "Contar retiradas (Mailing)"}
    </Botao>
  );
}
