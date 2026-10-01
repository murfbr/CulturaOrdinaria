/* Tela de entrada (modo nuvem): e-mail e senha do Firebase Auth.
   Não há auto-cadastro — contas são criadas no console do Firebase pelo coletivo. */
import { useState, type FormEvent } from "react";
import { entrar, redefinirSenha } from "../services/sessao";
import { Botao } from "../components/ui/Botao";
import { Campo, Entrada } from "../components/ui/Campo";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [avisoOk, setAvisoOk] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro(""); setAvisoOk(""); setEntrando(true);
    try {
      await entrar(email, senha);
      // O App troca de tela sozinho quando a sessão muda.
    } catch (ex) {
      setErro((ex as Error).message);
    } finally {
      setEntrando(false);
    }
  }

  async function aoEsquecer() {
    setErro(""); setAvisoOk("");
    if (!email.trim()) { setErro("Digite o e-mail primeiro, aí eu envio o link"); return; }
    try {
      await redefinirSenha(email);
      setAvisoOk("Enviei o link de redefinição para " + email.trim());
    } catch (ex) {
      setErro((ex as Error).message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-5">
      <form className="w-full max-w-[380px] rounded-[14px] border border-line bg-card px-[30px] py-7 shadow-card" onSubmit={aoEnviar}>
        <h1 className="m-0 mb-0.5 text-xl font-bold tracking-[-.2px]">Central do Coletivo</h1>
        <p className="m-0 mb-[18px] text-sm text-muted">captação, escrita e contexto dos projetos culturais</p>
        {erro && <div className="mb-2.5 rounded-lg bg-no-soft px-2.5 py-2 text-sm text-no-ink">{erro}</div>}
        {avisoOk && <div className="mb-2.5 rounded-lg bg-ok-soft px-2.5 py-2 text-sm text-ok-ink">{avisoOk}</div>}
        <Campo rotulo="E-mail" htmlFor="login-email">
          <Entrada id="login-email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} autoFocus />
        </Campo>
        <Campo rotulo="Senha" htmlFor="login-senha">
          <Entrada id="login-senha" type="password" autoComplete="current-password" value={senha}
            onChange={(e) => setSenha(e.target.value)} />
        </Campo>
        <Botao type="submit" tamanho="grande" className="mt-1 w-full" disabled={entrando}>
          {entrando ? "Entrando…" : "Entrar"}
        </Botao>
        <Botao variante="link" tamanho="pequeno" className="mt-3" onClick={aoEsquecer}>Esqueci a senha</Botao>
        <p className="mt-4 border-t border-line pt-3 text-xs text-faint">Sem conta? Peça a quem administra o coletivo para criar a sua no painel do Firebase.</p>
      </form>
    </div>
  );
}
