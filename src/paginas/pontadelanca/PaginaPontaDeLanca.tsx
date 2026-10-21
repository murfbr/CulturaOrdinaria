/* Página anexo da festa Ponta de Lança (do Samba de Ponta) dentro da
   Central, no endereço /pontadelanca/ (o antigo /sambadeponta/ redireciona).
   Mesmo login e mesmo banco, casca própria com a identidade da festa; o
   conteúdo é a festa ou uma edição aberta, em abas. Tudo desta página vive
   nesta pasta; os dados moram nos documentos descritos em dados.ts. As
   classes de estilo levam o prefixo "sdp" (Samba de Ponta, o coletivo dono
   da festa) e ficaram assim na renomeação de 21/10/2026. */
import { useEffect, useState } from "react";
import { Toast } from "../../components/Toast";
import { iniciarPontaDeLanca, usarPontaDeLanca } from "./dados";
import { MenuLateral } from "./MenuLateral";
import { TelaFesta } from "./festa/TelaFesta";
import { TelaEdicao } from "./edicao/TelaEdicao";
import { hashDaVisao, visaoDoHash, type Visao } from "./visao";
import "./estilos.css";

const CHAVE_VISAO = "pdl-visao";
/* Títulos: Better Faster (licença web pendente) com a Permanent Marker como
   substituta provisória, como no design system da festa; texto e números em Poppins. */
const FONTES = "https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap";

declare global { interface Window { __hashInicialPdl?: string } }

/** Abre pelo link (#e02/financeiro) ou onde parou. O hash é lido pelo index.html
    antes do script da Central, que reescreve a URL ao carregar. */
function lerVisao(): Visao {
  const doLink = visaoDoHash(window.__hashInicialPdl ?? window.location.hash);
  if (doLink) return doLink;
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_VISAO) || "null");
    if (v && v.sec === "edicao" && typeof v.id === "string") return v;
  } catch { /* sem localStorage: abre na festa */ }
  return { sec: "festa" };
}

export function PaginaPontaDeLanca() {
  const painel = usarPontaDeLanca();
  const [visao, setVisao] = useState<Visao>(lerVisao);
  const [ancora, setAncora] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => { iniciarPontaDeLanca(); }, []);

  // Fontes só nesta página e título da aba do navegador.
  useEffect(() => {
    if (!document.getElementById("sdp-fontes")) {
      const link = document.createElement("link");
      link.id = "sdp-fontes";
      link.rel = "stylesheet";
      link.href = FONTES;
      document.head.appendChild(link);
    }
    document.title = "Ponta de Lança · painel da festa";
  }, []);

  // O endereço acompanha a visão (sem criar histórico: o voltar do navegador
  // passaria pela navegação da Central, que entende outro formato de hash).
  useEffect(() => {
    try { history.replaceState(null, "", window.location.pathname + hashDaVisao(visao)); } catch { /* sem history */ }
  }, [visao]);

  // Depois de trocar a tela, rola até a seção pedida (ou para o topo).
  useEffect(() => {
    if (ancora === null) return;
    const alvo = ancora ? document.getElementById(ancora) : null;
    if (alvo) window.scrollTo({ top: alvo.offsetTop - 10, behavior: "smooth" });
    else window.scrollTo(0, 0);
    setAncora(null);
  }, [ancora, visao]);

  const edicao = painel && visao.sec === "edicao" ? painel.edicoes.find((e) => e.id === visao.id) : undefined;

  function irPara(nova: Visao, ancoraDaSecao?: string) {
    setVisao(nova);
    setAncora(ancoraDaSecao || "");
    setMenuAberto(false);
    try { localStorage.setItem(CHAVE_VISAO, JSON.stringify(nova)); } catch { /* sem localStorage: só não lembra */ }
  }

  // Edição que não existe mais (ou id antigo guardado): volta para a festa.
  useEffect(() => {
    if (painel && visao.sec === "edicao" && !edicao) irPara({ sec: "festa" });
  }, [painel, visao, edicao]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!painel) {
    return <div className="sambadeponta"><div className="carregando">abrindo a Ponta de Lança…</div></div>;
  }

  return (
    <div className="sambadeponta">
      <button className="menutoggle" onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu" aria-expanded={menuAberto}>☰</button>
      <div className="shell">
        <MenuLateral painel={painel} visao={visao} aberto={menuAberto} irPara={irPara} />
        <main>
          {edicao && visao.sec === "edicao"
            ? <TelaEdicao key={edicao.id} painel={painel} e={edicao} aba={visao.aba} irPara={irPara} />
            : <TelaFesta painel={painel} irPara={irPara} />}
        </main>
      </div>
      <Toast />
    </div>
  );
}
