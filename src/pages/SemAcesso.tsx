/* Casca de quem entrou mas não tem acesso: a conta existe no Firebase e não
   tem documento em `usuarios` (ou está desativada). Só diz com quem falar e
   deixa sair. Não conecta em nada. */
import { sair } from "../services/sessao";
import { Botao } from "../components/ui/Botao";
import { Rotulo } from "../components/ui/Rotulo";
import { Selo } from "../components/ui/Selo";

export function SemAcesso({ emailUsuario }: { emailUsuario: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-gutter">
      <div className="w-full max-w-[460px] rounded-md border border-line bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <Selo letra="C" />
          <div>
            <b className="block font-display text-3xl font-normal leading-tight">Cultura Ordinária</b>
            <Rotulo className="text-muted">Central do Coletivo</Rotulo>
          </div>
        </div>
        <h1 className="m-0 mb-2 font-display text-4xl font-normal">Sem acesso</h1>
        <p className="m-0 text-lg">Sua conta existe, mas ainda não tem acesso a nenhuma parte da Central. Fale com quem coordena o coletivo: o acesso é liberado na tela Acessos do Núcleo. Se foi liberado agora há pouco, ou se a internet caiu na entrada, tente de novo.</p>
        <div className="mt-5 flex items-center gap-3 border-t border-line pt-3 text-sm text-muted">
          {emailUsuario && <span className="min-w-0 truncate">{emailUsuario}</span>}
          <Botao variante="fantasma" tamanho="pequeno" className="ml-auto" onClick={() => window.location.reload()}>tentar de novo</Botao>
          {emailUsuario && <Botao variante="fantasma" tamanho="pequeno" onClick={() => void sair()}>sair</Botao>}
        </div>
      </div>
    </div>
  );
}
