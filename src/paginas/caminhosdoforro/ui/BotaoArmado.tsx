/* Botão de dois cliques, como o `data-confirmar` do artefato: o primeiro
   clique arma (troca o texto e fica vermelho), o segundo executa; desarma
   sozinho em 4 segundos. */
import { useEffect, useState, type ReactNode } from "react";
import { Botao, type VarianteBotao } from "./Botao";

interface Props {
  /** Texto do estado armado ("Confirmar exclusão"). */
  confirmar: string;
  onClick: () => void;
  variante?: VarianteBotao;
  mini?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
  children: ReactNode;
}

export function BotaoArmado({ confirmar, onClick, variante = "normal", mini, disabled, title, className, children }: Props) {
  const [armado, setArmado] = useState(false);
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(t);
  }, [armado]);
  return (
    <Botao
      variante={armado ? "armado" : variante} mini={mini} disabled={disabled} title={title} className={className}
      onClick={() => { if (armado) { setArmado(false); onClick(); } else setArmado(true); }}
    >
      {armado ? confirmar : children}
    </Botao>
  );
}
