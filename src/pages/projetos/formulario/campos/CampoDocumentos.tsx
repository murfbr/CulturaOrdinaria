/* Checklist de anexos da plataforma (tipo "docs"): marque o que já está
   pronto — o upload em si é só na plataforma oficial. */
import { RodapeCampo } from "../Contador";
import { cx } from "../../../../utils/classes";
import { ESTILO_CAIXA, ESTILO_DOCUMENTO, ESTILO_OBRIGATORIO } from "./estilos";
import type { PropsCampo } from "../tipos";

export function CampoDocumentos({ r, c, alterar }: PropsCampo) {
  const v = r.valores[c.n];
  const marcados = v && typeof v === "object" ? (v as Record<string, boolean>) : {};

  return (
    <>
      <div>
        {(c.opts || []).map((o) => {
          const obrigatorio = o.endsWith("*");
          const nome = o.replace(/\*$/, "");
          return (
            <label className={ESTILO_DOCUMENTO} key={o}>
              <input type="checkbox" className={ESTILO_CAIXA} checked={Boolean(marcados[nome])}
                onChange={(e) => alterar((copia) => {
                  const d = (copia.valores[c.n] = (copia.valores[c.n] && typeof copia.valores[c.n] === "object" ? copia.valores[c.n] : {}) as Record<string, boolean>);
                  d[nome] = e.target.checked;
                })} />
              <span className={cx(marcados[nome] && "text-muted")}>{nome}</span>
              {obrigatorio && <span className={ESTILO_OBRIGATORIO}>obrigatório</span>}
            </label>
          );
        })}
      </div>
      <RodapeCampo><span>marque o que já está pronto; o upload é só na plataforma</span></RodapeCampo>
    </>
  );
}
