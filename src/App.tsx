/* Casca do site: gate de login (modo nuvem), cabeçalho, abas e a troca entre
   os três grandes roteadores (Painel-família, Projetos e Contexto). O conteúdo
   em si vive em src/pages/. */
import { useEffect } from "react";
import { Banco } from "./services/banco";
import { firebaseAtivo } from "./services/firebase";
import { usarSessao } from "./services/sessao";
import { iniciarDados, usarCentral } from "./store/central";
import { usarNavegacao } from "./store/navegacao";
import { Cabecalho } from "./components/layout/Cabecalho";
import { BarraAbas } from "./components/layout/BarraAbas";
import { Toast } from "./components/Toast";
import { BuscaGlobal } from "./components/BuscaGlobal";
import { FormularioRegistro } from "./forms/FormularioRegistro";
import { Login } from "./pages/Login";
import { RoteadorPainel } from "./pages/RoteadorPainel";
import { Projetos } from "./pages/projetos/Projetos";
import { Contexto } from "./pages/contexto/Contexto";
import { PAGINAS_PROPRIAS } from "./pages/paginasProprias";

/** Caminho da URL sem a barra final: páginas próprias de projeto moram em /<slug>/. */
const CAMINHO = window.location.pathname.replace(/[/]+$/, "").toLowerCase();

export default function App() {
  const sessao = usarSessao();

  // Modo nuvem: só entra (e só conecta no banco) depois do login.
  if (firebaseAtivo) {
    if (sessao.carregando) return <div className="flex min-h-[60vh] items-center justify-center text-base text-muted">abrindo a Central…</div>;
    if (!sessao.usuario) return <Login />;
  }
  // Página própria de projeto (/<slug>/): mesmo login e mesmo banco, casca própria.
  const Pagina = PAGINAS_PROPRIAS[CAMINHO.slice(1)];
  if (Pagina) return <Pagina />;
  return <Central emailUsuario={sessao.usuario?.email || null} />;
}

function Central({ emailUsuario }: { emailUsuario: string | null }) {
  const nav = usarNavegacao();
  const central = usarCentral();

  // Liga as coleções (uma vez; a função é idempotente).
  useEffect(() => { iniciarDados(); }, []);

  return (
    <>
      <Cabecalho emailUsuario={emailUsuario} />
      <BarraAbas />

      {!central.pronto && Banco.modo === "nuvem" ? (
        <div className="flex min-h-[60vh] items-center justify-center text-base text-muted">carregando os dados do coletivo…</div>
      ) : (
        <main className="mx-auto max-w-site px-gutter pb-16">
          {nav.amb === "projetos" ? <Projetos /> : nav.amb === "contexto" ? <Contexto /> : <RoteadorPainel />}
        </main>
      )}

      <FormularioRegistro />
      <BuscaGlobal />
      <Toast />
    </>
  );
}
