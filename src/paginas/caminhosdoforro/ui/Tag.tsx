/* Etiquetas pequenas: Tag (tipo, membro, o que o espaço recebe), Revisar
   ("a revisar"), Pilula (status colorido) e SelecaoStatus (o select com a cor
   do status atual, para trocar na própria linha). */
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cx } from "../../../utils/classes";

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="cdf:mb-1 cdf:mr-1 cdf:inline-block cdf:whitespace-nowrap cdf:rounded-md cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie-2 cdf:px-2 cdf:py-0.5 cdf:text-[13px] cdf:leading-[1.3]">
      {children}
    </span>
  );
}

export function Revisar() {
  return (
    <span className="cdf:ml-2 cdf:inline-block cdf:whitespace-nowrap cdf:rounded-full cdf:bg-conversa-bg cdf:px-2 cdf:align-[1px] cdf:text-[12.5px] cdf:font-bold cdf:text-conversa">
      a revisar
    </span>
  );
}

export function Pilula({ classe, children }: { classe: string; children: ReactNode }) {
  return <span className={cx("cdf:inline-block cdf:whitespace-nowrap cdf:rounded-full cdf:px-2.5 cdf:py-[3px] cdf:text-sm cdf:font-bold", classe)}>{children}</span>;
}

export function SelecaoStatus({ classe, className, ...resto }: SelectHTMLAttributes<HTMLSelectElement> & { classe: string }) {
  return (
    <select
      className={cx("cdf:w-auto cdf:cursor-pointer cdf:rounded-full cdf:border-0 cdf:px-2 cdf:py-1 cdf:text-sm cdf:font-bold", classe, className)}
      {...resto}
    />
  );
}
