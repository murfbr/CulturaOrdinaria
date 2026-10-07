/* Campo de múltipla escolha (tipo "chk"): caixas em grade, grupos com
   cabeçalho e caixa de filtro nas listas longas (como as 78 áreas
   socioeconômicas). */
import { useState } from "react";
import { Entrada } from "../../../../components/ui/Campo";
import { Rotulo } from "../../../../components/ui/Rotulo";
import { cx } from "../../../../utils/classes";
import { ESTILO_CAIXA, ESTILO_OPCAO, LARGURA_CAMPO } from "./estilos";
import type { PropsCampo } from "../tipos";

export function CampoMultiplaEscolha({ r, c, alterar }: PropsCampo) {
  const [filtro, setFiltro] = useState("");
  const v = r.valores[c.n];
  const selecionados = Array.isArray(v) ? (v as string[]) : [];
  const grupos = c.grupos || [{ g: null, op: c.opts || [] }];
  const filtroAtivo = filtro.toLowerCase();

  const alternar = (opcao: string, marcado: boolean) =>
    alterar((copia) => {
      const atual = new Set(Array.isArray(copia.valores[c.n]) ? (copia.valores[c.n] as string[]) : []);
      if (marcado) atual.add(opcao); else atual.delete(opcao);
      copia.valores[c.n] = [...atual];
    });

  return (
    <>
      {Boolean(c.filter) && (
        <Entrada type="text" className={cx("mb-2", LARGURA_CAMPO.medio)} placeholder="filtrar opções…" value={filtro}
          onChange={(e) => setFiltro(e.target.value)} />
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-x-3 gap-y-0.5">
        {grupos.map((g, gi) => (
          <span className="contents" key={gi}>
            {g.g && <Rotulo className="col-span-full mt-2">{g.g}</Rotulo>}
            {g.op.map((o) => {
              const escondida = Boolean(filtroAtivo) && !o.toLowerCase().includes(filtroAtivo);
              const marcada = selecionados.includes(o);
              return (
                <label className={cx(escondida ? "hidden" : "flex", ESTILO_OPCAO, "px-2", marcada ? "bg-accent-soft" : "hover:bg-sand")} key={o}>
                  <input type="checkbox" className={ESTILO_CAIXA} checked={marcada} onChange={(e) => alternar(o, e.target.checked)} />
                  <span>{o}</span>
                </label>
              );
            })}
          </span>
        ))}
      </div>
    </>
  );
}
