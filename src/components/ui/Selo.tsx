/* Selo: quadrado com fio preto grosso e contorno tracejado por dentro, com
   uma letra em letra de cartaz. É a marca na barra lateral e o avatar das
   fichas (a inicial do nome). */
import { cx } from "../../utils/classes";

export function Selo({ letra, grande, className }: { letra: string; grande?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-grid flex-none place-items-center border-stamp border-solid border-ink bg-bg font-display leading-none text-ink outline-dashed outline-[3px] outline-ink",
        grande ? "size-20 text-6xl outline-offset-[-10px]" : "size-10 text-3xl outline-offset-[-8px]",
        className,
      )}
    >
      {letra}
    </span>
  );
}
