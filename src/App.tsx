/* Casca do site: gate de login (modo nuvem), gate de acesso (o documento
   usuarios/<e-mail>: master e lista de módulos), e então uma de três cascas:
   a Central (barra lateral, cabeçalho e os três roteadores: Painel-família,
   Projetos e Contexto), "Suas páginas" (conta sem módulo da Central: só as
   páginas anexo liberadas) ou "sem acesso" (conta sem documento ou
   desativada). Uma página anexo (/<slug>/) abre quando a conta tem o módulo
   dela. O conteúdo em si vive em src/pages/ e src/paginas/. */
import { useEffect } from "react";
import { Banco } from "./services/banco";
import { firebaseAtivo } from "./services/firebase";
import { usarSessao } from "./services/sessao";
import { podeAbrirAmbiente, temCentral, temModulo, usarAcesso } from "./services/acesso";
import { iniciarDados, usarCentral } from "./store/central";
import { AMBIENTES, irParaAmbiente, usarNavegacao } from "./store/navegacao";
import { BarraLateral } from "./components/layout/BarraLateral";
import { CabecalhoPagina } from "./components/layout/CabecalhoPagina";
import { Toast } from "./components/Toast";
import { LimiteDeErro } from "./components/LimiteDeErro";
import { BuscaGlobal } from "./components/BuscaGlobal";
import { FormularioRegistro } from "./forms/FormularioRegistro";
import { Login } from "./pages/Login";
import { SemAcesso } from "./pages/SemAcesso";
import { SuasPaginas } from "./pages/SuasPaginas";
import { RoteadorPainel } from "./pages/RoteadorPainel";
import { Projetos } from "./pages/projetos/Projetos";
import { Contexto } from "./pages/contexto/Contexto";
import { ENDERECOS_ANTIGOS, PAGINAS_PROPRIAS } from "./pages/paginasProprias";
import { moduloDaPagina } from "./types";

/** Caminho da URL sem a barra final: as páginas anexo moram em /<slug>/. */
const CAMINHO = window.location.pathname.replace(/[/]+$/, "").toLowerCase();

// Endereço antigo de página (/sambadeponta/ → /pontadelanca/): em produção o
// vercel.json redireciona antes de qualquer script (e preserva o #hash); aqui é
// o servidor de desenvolvimento fazendo o mesmo, sem o hash, porque a navegação
// da Central já o reescreveu quando este módulo roda.
const NOVO = ENDERECOS_ANTIGOS[CAMINHO.slice(1).split("/")[0]];
if (NOVO) window.location.replace("/" + NOVO + "/" + window.location.search);

const Abrindo = ({ texto }: { texto: string }) => (
  <div className="flex min-h-[60vh] items-center justify-center text-lg text-muted">{texto}</div>
);

export default function App() {
  const sessao = usarSessao();
  const { carregando: conferindoAcesso, acesso } = usarAcesso();
  const emailUsuario = sessao.usuario?.email || null;

  // Modo nuvem: só entra (e só conecta no banco) depois do login e do documento de acesso.
  if (firebaseAtivo) {
    if (sessao.carregando) return <Abrindo texto="abrindo a Central…" />;
    if (!sessao.usuario) return <Login />;
    if (conferindoAcesso) return <Abrindo texto="conferindo o seu acesso…" />;
  }
  if (!acesso || !acesso.ativo) return <SemAcesso emailUsuario={emailUsuario} />;

  // Página anexo (/<slug>/): mesmo login e mesmo banco, casca própria; abre com o módulo dela.
  const slug = CAMINHO.slice(1);
  const Pagina = PAGINAS_PROPRIAS[slug]?.tela;
  if (Pagina) {
    if (temModulo(moduloDaPagina(slug))) return <Pagina />;
    return <SuasPaginas emailUsuario={emailUsuario} aviso={"A página /" + slug + "/ não está liberada para a sua conta."} />;
  }
  if (!temCentral()) return <SuasPaginas emailUsuario={emailUsuario} />;
  return <Central emailUsuario={emailUsuario} />;
}

function Central({ emailUsuario }: { emailUsuario: string | null }) {
  const nav = usarNavegacao();
  const central = usarCentral();
  const { acesso } = usarAcesso();

  // Liga as coleções (uma vez; a função é idempotente).
  useEffect(() => { iniciarDados(); }, []);

  // Endereço de um ambiente que a conta não tem: vai para o primeiro que ela abre.
  useEffect(() => {
    if (podeAbrirAmbiente(nav.amb)) return;
    const primeiro = AMBIENTES.map((a) => a.id).find(podeAbrirAmbiente);
    if (primeiro) irParaAmbiente(primeiro);
  }, [nav.amb, acesso]);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <BarraLateral emailUsuario={emailUsuario} />
      <div className="min-w-0 px-gutter pb-14 md:px-principal">
        <CabecalhoPagina />
        {!central.pronto && Banco.modo === "nuvem" ? (
          <div className="flex min-h-[60vh] items-center justify-center text-lg text-muted">carregando os dados do coletivo…</div>
        ) : (
          <main className="mx-auto max-w-site">
            <LimiteDeErro rota={[nav.amb, nav.aba, nav.detalhe?.tipo, nav.detalhe?.id, nav.detalhe?.sub, nav.fichaAberta, nav.julgamentoAberto].join("/")}>
              {nav.amb === "projetos" ? <Projetos /> : nav.amb === "contexto" ? <Contexto /> : <RoteadorPainel />}
            </LimiteDeErro>
          </main>
        )}
      </div>

      <FormularioRegistro />
      <BuscaGlobal />
      <Toast />
    </div>
  );
}
