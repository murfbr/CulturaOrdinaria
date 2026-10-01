/* Botão de excluir com confirmação em dois cliques: o primeiro clique vira
   "Confirmar exclusão", o segundo executa. Sai do estado de confirmação se o
   componente remontar (ex.: fechar e reabrir o modal). */
import { useState } from "react";
import { cx } from "../utils/classes";

export function BotaoExcluir({ aoConfirmar }: { aoConfirmar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <button
      type="button"
      className={cx(
        "cursor-pointer border-0 bg-transparent text-sm font-semibold text-no",
        confirmando ? "rounded-md bg-no-soft px-2 py-1" : "p-0",
      )}
      onClick={() => (confirmando ? aoConfirmar() : setConfirmando(true))}
    >
      {confirmando ? "Confirmar exclusão" : "Excluir"}
    </button>
  );
}
