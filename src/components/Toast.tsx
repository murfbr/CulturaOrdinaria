/* Toast: avisos rápidos no rodapé ("Salvo", "Copiado"...), com ação opcional
   ("Desfazer" da lixeira). Qualquer código chama `toast("msg")` ou
   `toast("msg", { acao })`; o componente vive no App. Com ação, dura 6 s. */
import { useEffect, useState } from "react";
import { cx } from "../utils/classes";

export interface AcaoToast { rotulo: string; fazer: () => void }

let mostrar: ((texto: string, acao?: AcaoToast) => void) | null = null;

/** Mostra um aviso passageiro (2 s; 6 s quando tem ação). */
export function toast(texto: string, opcoes?: { acao?: AcaoToast }) {
  mostrar?.(texto, opcoes?.acao);
}

/** Copia texto e avisa; com mensagem de fallback se o navegador bloquear. */
export async function copiarComAviso(texto: string, mensagem = "Copiado") {
  try {
    await navigator.clipboard.writeText(texto);
    toast(mensagem);
  } catch {
    toast("Não consegui copiar. Selecione e use Ctrl+C");
  }
}

export function Toast() {
  const [texto, setTexto] = useState("");
  const [acao, setAcao] = useState<AcaoToast | null>(null);
  const [ligado, setLigado] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    mostrar = (t, a) => {
      setTexto(t);
      setAcao(a || null);
      setLigado(true);
      clearTimeout(timer);
      timer = setTimeout(() => setLigado(false), a ? 6000 : 2000);
    };
    return () => { mostrar = null; clearTimeout(timer); };
  }, []);

  return (
    <div
      className={cx(
        "fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white transition-opacity duration-[180ms] motion-reduce:transition-none",
        ligado ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      role="status" aria-live="polite"
    >
      {texto}
      {acao && ligado && (
        <button
          className="ml-3 cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-gold underline hover:text-white"
          onClick={() => { setLigado(false); acao.fazer(); }}
        >
          {acao.rotulo}
        </button>
      )}
    </div>
  );
}
