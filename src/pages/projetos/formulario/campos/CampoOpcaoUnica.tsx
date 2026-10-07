/* Campo de opção única (tipo "rad"), como os rádios da plataforma: em lista
   ou, quando a definição pede, em linha (cada opção numa caixinha). */
import { cx } from "../../../../utils/classes";
import { ESTILO_CAIXA, ESTILO_OPCAO } from "./estilos";
import type { PropsCampo } from "../tipos";

export function CampoOpcaoUnica({ r, c, alterar }: PropsCampo) {
  const v = r.valores[c.n];
  const emLinha = Boolean(c.inline);
  return (
    <div className={emLinha ? "flex flex-wrap gap-1.5" : "flex flex-col gap-0.5"}>
      {(c.opts || []).map((o) => (
        <label
          key={o}
          className={cx(
            "flex", ESTILO_OPCAO,
            emLinha
              ? cx("border px-3", o === v ? "border-accent bg-accent-soft" : "border-line-strong hover:bg-bg-sunk")
              : cx("px-2", o === v ? "bg-accent-soft" : "hover:bg-bg-sunk"),
          )}
        >
          <input type="radio" className={ESTILO_CAIXA} name={c.n} value={o} checked={o === v}
            onChange={() => alterar((copia) => { copia.valores[c.n] = o; })} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}
