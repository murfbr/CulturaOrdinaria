/* Campo de linha única (tipo "txt"), com o limite real da plataforma. */
import { Entrada } from "../../../../components/ui/Campo";
import { Contador, RodapeCampo } from "../Contador";
import { LARGURA_CAMPO } from "./estilos";
import type { PropsCampo } from "../tipos";

export function CampoTexto({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <>
      <Entrada type="text" name={c.n} className={c.cls ? LARGURA_CAMPO[c.cls] : undefined} maxLength={c.max || 190} value={texto}
        placeholder={c.ro ? "preenchido pela plataforma" : undefined}
        onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })} />
      {c.max && <RodapeCampo><Contador atual={texto.length} max={c.max} /></RodapeCampo>}
    </>
  );
}
