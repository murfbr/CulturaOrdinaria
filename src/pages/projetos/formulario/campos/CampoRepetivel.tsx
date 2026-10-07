/* Campo repetível (tipo "rep"): lista de itens com subcampos, como sócios da
   empresa ou a equipe da proposta. Cada item é uma caixa tracejada com os
   subcampos em grade. */
import { Botao } from "../../../../components/ui/Botao";
import { AreaTexto, Entrada, Selecao } from "../../../../components/ui/Campo";
import { ESTILO_MONO } from "../../../../components/ui/estilos";
import { cx } from "../../../../utils/classes";
import { ESTILO_TRACEJADA } from "./estilos";
import type { PropsCampo } from "../tipos";

export function CampoRepetivel({ r, c, alterar }: PropsCampo) {
  const v = r.valores[c.n];
  const itens = Array.isArray(v) ? (v as Record<string, string>[]) : [];

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {itens.map((item, i) => (
          <div className={cx(ESTILO_TRACEJADA, "grid gap-x-3 gap-y-2 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]")} key={i}>
            <div className="col-span-full flex items-center justify-between">
              <span className={ESTILO_MONO}>{i + 1}</span>
              <Botao variante="quieto" tamanho="mini" aria-label="remover"
                onClick={() => alterar((copia) => { (copia.valores[c.n] as unknown[]).splice(i, 1); }, true)}>×</Botao>
            </div>
            {(c.campos || []).map((sub) => {
              const valorSub = item[sub.n!] || "";
              const definirSub = (novo: string) => alterar((copia) => {
                const arr = copia.valores[c.n] as Record<string, string>[];
                (arr[i] = arr[i] || {})[sub.n!] = novo;
              });
              return (
                <label className="flex flex-col gap-1 text-sm font-medium text-muted" key={sub.n}>
                  <span>{sub.l}{sub.req ? <> <span className="text-gold">*</span></> : null}</span>
                  {sub.t === "ta"
                    ? <AreaTexto maxLength={sub.max || undefined} rows={3} value={valorSub} onChange={(e) => definirSub(e.target.value)} />
                    : sub.t === "sel"
                      ? (
                        <Selecao value={valorSub} onChange={(e) => definirSub(e.target.value)}>
                          <option value="" />
                          {(sub.opts || []).map((o) => <option key={o}>{o}</option>)}
                        </Selecao>
                      )
                      : <Entrada type={sub.t === "date" ? "date" : "text"} value={valorSub} onChange={(e) => definirSub(e.target.value)} />}
                </label>
              );
            })}
          </div>
        ))}
      </div>
      <Botao variante="fantasma" tamanho="pequeno" className="mt-2"
        onClick={() => alterar((copia) => {
          const arr = Array.isArray(copia.valores[c.n]) ? (copia.valores[c.n] as unknown[]) : (copia.valores[c.n] = []);
          (arr as Record<string, string>[]).push({});
        }, true)}>+ adicionar</Botao>
    </>
  );
}
