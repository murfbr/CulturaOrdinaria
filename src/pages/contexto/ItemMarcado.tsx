/* Item de lista com uma marca à esquerda (número, "·", letra) e o texto ao
   lado: argumentos e critérios das fichas, pontos fortes e fracos dos
   julgamentos, a prévia do bloco importado. Componente local do Contexto. */
import type { ReactNode } from "react";
import { Linha } from "../../components/ui/Linha";

export function ItemMarcado({ marca, children }: { marca: ReactNode; children: ReactNode }) {
  return (
    <Linha topo compacta>
      <div className="flex items-start gap-2.5 text-base">
        <span className="min-w-[18px] flex-none font-bold text-accent">{marca}</span>
        <span className="min-w-0">{children}</span>
      </div>
    </Linha>
  );
}
