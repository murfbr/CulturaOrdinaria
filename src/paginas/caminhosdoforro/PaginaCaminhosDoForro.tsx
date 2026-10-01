/* Página própria do Festival Caminhos do Forró: a "Central do festival" do
   artefato dentro da Central, no endereço /caminhosdoforro/. Mesmo login e
   mesmo banco, casca própria com a barra lateral do artefato; o conteúdo é a
   vista escolhida no menu. Tudo desta página vive nesta pasta; os dados moram
   em paginas/caminhosdoforro e nas subcoleções dela (ver dados.ts). */
import { useEffect, useState } from "react";
import { Toast } from "../../components/Toast";
import { TelaCadastro } from "./cadastro/TelaCadastro";
import { TelaConfiguracao } from "./configuracao/TelaConfiguracao";
import { iniciarCaminhosDoForro, usarCaminhosDoForro } from "./dados";
import { EmBreve } from "./EmBreve";
import { MenuLateral } from "./MenuLateral";
import { VISTAS, type Vista } from "./vista";
import "./estilos.css";

const CHAVE_VISTA = "cf-vista";
const FONTES = "https://fonts.googleapis.com/css2?family=Londrina+Solid:wght@400;900&family=Outfit:wght@400;500;600;700&family=Barlow+Condensed:ital,wght@0,700;1,700&display=swap";

/** Reabre na vista em que parou, como o artefato. */
function lerVista(): Vista {
  try {
    const v = localStorage.getItem(CHAVE_VISTA);
    if (v && (VISTAS as readonly string[]).includes(v)) return v as Vista;
  } catch { /* sem localStorage: abre no cadastro */ }
  return "cadastro";
}

/** O filtro "grunge" da marca e do sol (SVG invisível, referenciado por url(#cdf-grunge)). */
function Filtros() {
  return (
    <svg width="0" height="0" className="cdf:absolute" aria-hidden="true" focusable="false">
      <filter id="cdf-grunge" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="ruido" />
        <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 5.1" result="mascara" />
        <feComposite in="SourceGraphic" in2="mascara" operator="in" />
      </filter>
    </svg>
  );
}

export function PaginaCaminhosDoForro() {
  const base = usarCaminhosDoForro();
  const [vista, setVista] = useState<Vista>(lerVista);

  useEffect(() => { iniciarCaminhosDoForro(); }, []);

  // Fontes do artefato só nesta página, título da aba e URL limpa (a
  // navegação da Central põe um hash na URL ao carregar, que aqui não vale).
  useEffect(() => {
    if (!document.getElementById("cdf-fontes")) {
      const link = document.createElement("link");
      link.id = "cdf-fontes";
      link.rel = "stylesheet";
      link.href = FONTES;
      document.head.appendChild(link);
    }
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    document.title = "Caminhos do Forró · Central do festival";
  }, []);

  function irPara(nova: Vista) {
    setVista(nova);
    try { localStorage.setItem(CHAVE_VISTA, nova); } catch { /* sem localStorage: só não lembra */ }
    window.scrollTo(0, 0);
  }

  if (!base) {
    return (
      <div className="caminhosdoforro cdf:min-h-dvh cdf:p-9">
        <p className="cdf:m-0 cdf:max-w-[640px] cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-6 cdf:py-5">Carregando a base do festival…</p>
      </div>
    );
  }

  return (
    <div className="caminhosdoforro cdf:grid cdf:min-h-dvh cdf:grid-cols-1 cdf:md:grid-cols-[252px_minmax(0,1fr)]">
      <Filtros />
      <MenuLateral base={base} vista={vista} irPara={irPara} />
      <main className="cdf:min-w-0 cdf:max-w-[1320px] cdf:px-4 cdf:pb-[72px] cdf:pt-6 cdf:md:px-[clamp(16px,4vw,48px)] cdf:md:pt-9">
        {vista === "config" ? <TelaConfiguracao base={base} />
          : vista === "cadastro" ? <TelaCadastro base={base} irPara={irPara} />
          : <EmBreve vista={vista} base={base} />}
      </main>
      <Toast />
    </div>
  );
}
