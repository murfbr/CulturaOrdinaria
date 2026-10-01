/* Barras horizontais proporcionais (custo por categoria, composição do
   resultado): rótulo, barra e valor. */
import { R } from "../calculo";

/** [rótulo, valor, classe da barra opcional]. */
export type LinhaBarra = [string, number, string?];

export function Barras({ linhas, max, classe }: { linhas: LinhaBarra[]; max: number; classe?: string }) {
  return (
    <div className="bars">
      {linhas.map(([rotulo, v, c]) => (
        <div className="sdp-bar" key={rotulo}>
          <span className="lbl" title={rotulo}>{rotulo}</span>
          <div className="track">
            <div className={"fill " + (c || classe || "")} style={{ width: Math.min(100, (Math.abs(v) / max) * 100) + "%" }} />
          </div>
          <span className="val">{R(v)}</span>
        </div>
      ))}
    </div>
  );
}
