/* Campo de texto longo (tipo "ta"), com contador e o limite real da plataforma. */
import { AreaTexto } from "../../../../components/ui/Campo";
import { Contador, RodapeCampo } from "../Contador";
import type { PropsCampo } from "../tipos";

export function CampoTextoLongo({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <>
      <AreaTexto name={c.n} rows={(c.max || 0) > 1500 ? 9 : (c.max || 0) > 600 ? 6 : 4} value={texto}
        onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })} />
      <RodapeCampo>
        <Contador atual={texto.length} max={c.max} />
        {c.max && <span>{c.n.startsWith("doc__") ? "limite do edital" : "limite real da plataforma"}</span>}
      </RodapeCampo>
    </>
  );
}
