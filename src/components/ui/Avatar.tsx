/* Bolinha com as iniciais de uma pessoa (responsável de tarefa, membro da equipe). */
import { cx } from "../../utils/classes";

export function Avatar({ iniciais, pequeno, title, className }: { iniciais: string; pequeno?: boolean; title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex flex-none items-center justify-center rounded-full bg-brand font-bold text-white",
        pequeno ? "size-[18px] text-[9px]" : "size-5 text-3xs",
        className,
      )}
    >
      {iniciais}
    </span>
  );
}
