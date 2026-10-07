/* Bolinha com as iniciais de uma pessoa (responsável de tarefa, membro da
   equipe): fundo afundado, letra preta. */
import { cx } from "../../utils/classes";

export function Avatar({ iniciais, pequeno, title, className }: { iniciais: string; pequeno?: boolean; title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex flex-none items-center justify-center rounded-full bg-bg-sunk font-semibold text-ink",
        pequeno ? "size-[18px] text-[9px]" : "size-6 text-xs",
        className,
      )}
    >
      {iniciais}
    </span>
  );
}
