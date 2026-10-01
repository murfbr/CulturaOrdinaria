/* Página própria do Samba de Ponta: o painel "Ponta de Lança" (a festa e as
   edições) dentro da Central, no endereço /sambadeponta/. Mesmo login e
   mesmo banco, casca própria com o menu lateral do artefato; o conteúdo é a
   festa ou uma edição aberta. Tudo desta página vive nesta pasta; os dados
   moram num documento só do banco (ver dados.ts). */
import { useEffect, useState } from "react";
import { Toast } from "../../components/Toast";
import { iniciarSambaDePonta, usarSambaDePonta } from "./dados";
import { MenuLateral } from "./MenuLateral";
import { TelaFesta } from "./festa/TelaFesta";
import { TelaEdicao } from "./edicao/TelaEdicao";
import type { Visao } from "./visao";
import "./estilos.css";

const CHAVE_VISAO = "sdp-visao";
const FONTES = "https://fonts.googleapis.com/css2?family=Anton&family=Poppins:wght@300;400;500;600;700&display=swap";

/** Reabre onde parou (a festa ou uma edição), como o artefato. */
function lerVisao(): Visao {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_VISAO) || "null");
    if (v && v.sec === "edicao" && typeof v.id === "string") return v;
  } catch { /* sem localStorage: abre na festa */ }
  return { sec: "festa" };
}

export function PaginaSambaDePonta() {
  const painel = usarSambaDePonta();
  const [visao, setVisao] = useState<Visao>(lerVisao);
  const [ancora, setAncora] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => { iniciarSambaDePonta(); }, []);

  // Fontes do artefato só nesta página, título da aba e URL limpa (a
  // navegação da Central põe um hash na URL ao carregar, que aqui não vale).
  useEffect(() => {
    if (!document.getElementById("sdp-fontes")) {
      const link = document.createElement("link");
      link.id = "sdp-fontes";
      link.rel = "stylesheet";
      link.href = FONTES;
      document.head.appendChild(link);
    }
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    document.title = "Ponta de Lança · Samba de Ponta";
  }, []);

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
    return <div className="sambadeponta"><div className="carregando">abrindo a página do Samba de Ponta…</div></div>;
  }

  return (
    <div className="sambadeponta">
      <button className="menutoggle" onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu">☰</button>
      <div className="shell">
        <MenuLateral painel={painel} visao={visao} aberto={menuAberto} irPara={irPara} />
        <main>
          {edicao
            ? <TelaEdicao key={edicao.id} painel={painel} e={edicao} />
            : <TelaFesta painel={painel} irPara={irPara} />}
        </main>
      </div>
      <Toast />
    </div>
  );
}
