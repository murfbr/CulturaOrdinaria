/* Balão: a explicação curta que aparece ao passar o mouse, focar ou tocar num
   rótulo. Flutua fora do fluxo (portal no body, posição fixa logo abaixo do
   rótulo), por isso não é cortado pela rolagem de lado das tabelas. Visual da
   identidade: cartão com régua preta e cantos retos, título em mono caixa
   alta, texto normal; sem sombra (só o modal tem). O gatilho ganha o
   sublinhado pontilhado, a pista de "tem explicação". */
import { useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "../../utils/classes";

interface Props {
  titulo?: ReactNode;
  texto: ReactNode;
  className?: string;
  children: ReactNode;
}

const LARGURA = 288;

export function Balao({ titulo, texto, className, children }: Props) {
  const id = useId();
  const gatilho = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const abrir = () => {
    const r = gatilho.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: Math.max(8, Math.min(r.left, window.innerWidth - LARGURA - 8)), y: r.bottom + 6 });
  };
  const fechar = () => setPos(null);

  return (
    <span
      ref={gatilho}
      tabIndex={0}
      aria-describedby={pos ? id : undefined}
      className={cx("cursor-help underline decoration-dotted decoration-line-strong underline-offset-4 outline-none focus-visible:decoration-accent", className)}
      onMouseEnter={abrir}
      onMouseLeave={fechar}
      onFocus={abrir}
      onBlur={fechar}
      onClick={() => (pos ? fechar() : abrir())}
      onKeyDown={(e) => { if (e.key === "Escape") fechar(); }}
    >
      {children}
      {pos && createPortal(
        <span
          id={id}
          role="tooltip"
          style={{ left: pos.x, top: pos.y, width: LARGURA }}
          className="pointer-events-none fixed z-50 block rounded-md border-rule border-ink bg-card px-3 py-2.5 text-left font-sans text-sm font-normal normal-case tracking-normal whitespace-normal text-ink"
        >
          {titulo && <span className="mb-1 block font-mono text-3xs font-medium uppercase text-muted">{titulo}</span>}
          {texto}
        </span>,
        document.body,
      )}
    </span>
  );
}
