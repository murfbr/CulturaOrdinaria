/* Modal genérico de campos, o `form()` do artefato: recebe a lista de campos
   e os valores atuais, devolve o objeto preenchido no Aplicar. Excluir é
   opcional. Cada tela usa `usarModalCampos()` e chama `abrir(pedido)`. */
import { useEffect, useState, type ReactNode } from "react";
import { num } from "./calculo";

export type TipoCampo = "texto" | "numero" | "data" | "select" | "textarea";

export interface CampoModal {
  k: string;
  label: string;
  type?: TipoCampo;
  /** select: opções como texto (valor = rótulo) ou pares [valor, rótulo]. */
  opts?: (string | [string, string])[];
  /** Placeholder. */
  ph?: string;
  /** Ocupa a linha inteira do formulário. */
  full?: boolean;
}

export interface PedidoModal {
  titulo: string;
  campos: CampoModal[];
  valores: Record<string, unknown>;
  aoAplicar: (saida: Record<string, unknown>) => void;
  aoExcluir?: () => void;
}

const par = (o: string | [string, string]): [string, string] => (Array.isArray(o) ? o : [o, o]);

function valoresIniciais(pedido: PedidoModal): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const c of pedido.campos) {
    const v = pedido.valores[c.k];
    let texto = v == null ? "" : String(v);
    // Select sem valor correspondente mostra (e devolve) a primeira opção, como um <select> nativo.
    if (c.type === "select" && c.opts?.length && !c.opts.some((o) => par(o)[0] === texto)) texto = par(c.opts[0])[0];
    saida[c.k] = texto;
  }
  return saida;
}

export function ModalCampos({ pedido, aoFechar }: { pedido: PedidoModal; aoFechar: () => void }) {
  const [valores, setValores] = useState<Record<string, string>>(() => valoresIniciais(pedido));

  useEffect(() => {
    const aoTeclar = (ev: KeyboardEvent) => { if (ev.key === "Escape") aoFechar(); };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const mudar = (k: string, v: string) => setValores((atual) => ({ ...atual, [k]: v }));

  function aplicar() {
    const saida: Record<string, unknown> = {};
    for (const c of pedido.campos) saida[c.k] = c.type === "numero" ? num(valores[c.k]) : valores[c.k].trim();
    aoFechar();
    pedido.aoAplicar(saida);
  }

  return (
    <div className="sdp-modalbg" onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="sdp-modal" role="dialog" aria-modal="true">
        <h3>{pedido.titulo}</h3>
        <div className="form">
          {pedido.campos.map((c, i) => {
            const id = "sdp-f-" + c.k;
            let campo: ReactNode;
            if (c.type === "select") {
              campo = (
                <select id={id} value={valores[c.k]} onChange={(e) => mudar(c.k, e.target.value)}>
                  {(c.opts || []).map((o) => { const [v, rotulo] = par(o); return <option key={v} value={v}>{rotulo}</option>; })}
                </select>
              );
            } else if (c.type === "textarea") {
              campo = <textarea id={id} value={valores[c.k]} onChange={(e) => mudar(c.k, e.target.value)} />;
            } else {
              campo = (
                <input id={id} autoFocus={i === 0}
                  type={c.type === "numero" ? "number" : c.type === "data" ? "date" : "text"}
                  step={c.type === "numero" ? "any" : undefined}
                  value={valores[c.k]} placeholder={c.ph}
                  onChange={(e) => mudar(c.k, e.target.value)} />
              );
            }
            return (
              <div className={"f" + (c.full ? " full" : "")} key={c.k}>
                <label htmlFor={id}>{c.label}</label>
                {campo}
              </div>
            );
          })}
        </div>
        <div className="mact">
          <div>
            {pedido.aoExcluir && (
              <button className="sdp-btn danger" onClick={() => { aoFechar(); pedido.aoExcluir!(); }}>Excluir</button>
            )}
          </div>
          <div className="r">
            <button className="sdp-btn" onClick={aoFechar}>Cancelar</button>
            <button className="sdp-btn primary" onClick={aplicar}>Aplicar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Estado do modal de uma tela: `abrir(pedido)` e o `elemento` para renderizar. */
export function usarModalCampos() {
  const [pedido, setPedido] = useState<PedidoModal | null>(null);
  return {
    abrir: (p: PedidoModal) => setPedido(p),
    elemento: pedido ? <ModalCampos pedido={pedido} aoFechar={() => setPedido(null)} /> : null,
  };
}
