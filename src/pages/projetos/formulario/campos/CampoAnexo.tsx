/* Campo de anexo avulso (tipo "anexo"): marca "arquivo pronto" e anota o nome
   ou link do arquivo — o upload é só na plataforma. */
import { Entrada, Marcacao } from "../../../../components/ui/Campo";
import { cx } from "../../../../utils/classes";
import { ESTILO_TRACEJADA } from "./estilos";
import type { PropsCampo } from "../tipos";

export function CampoAnexo({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <div className={cx(ESTILO_TRACEJADA, "flex flex-col gap-2")}>
      <Marcacao marcado={Boolean(r.anexos[c.n])} aoMudar={(v) => alterar((copia) => { copia.anexos[c.n] = v; })}>
        arquivo pronto <span className="text-faint">· upload só na plataforma</span>
      </Marcacao>
      <Entrada type="text" name={c.n} maxLength={190} placeholder="nome do arquivo ou link" value={texto}
        onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })} />
    </div>
  );
}
