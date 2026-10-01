/* Um campo do editor de registros, desenhado a partir da especificação.
   Recebe o valor atual e devolve mudanças pelo `definir` — o estado vive no
   FormularioRegistro. */
import type { CampoSpec } from "./tipos";
import { usarCentral } from "../store/central";
import type { ColecaoPainel } from "../types";
import { AreaTexto, Entrada, Selecao } from "../components/ui/Campo";

interface Props {
  campo: CampoSpec;
  valor: unknown;
  definir: (valor: unknown) => void;
  /** Opções do vínculo polimórfico (tarefa → projeto/edital/reunião). */
  opcoesOrigem: [valor: string, rotulo: string][];
}

export function CampoDoFormulario({ campo: c, valor: v, definir, opcoesOrigem }: Props) {
  const { painel } = usarCentral();
  const listaDe = (colecao: ColecaoPainel) =>
    painel[colecao] as { id: string; nome?: string; titulo?: string }[];
  const id = "campo-" + c.chave;

  switch (c.tipo) {
    case "textarea":
      return <AreaTexto id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)} />;

    case "date":
      return <Entrada id={id} type="date" value={String(v ?? "")} onChange={(e) => definir(e.target.value)} />;

    case "numero":
      return (
        <Entrada id={id} type="number" min={0} value={v === "" || v == null ? "" : String(v)}
          onChange={(e) => definir(e.target.value === "" ? "" : Number(e.target.value))} />
      );

    case "select":
      return (
        <Selecao id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)}>
          {(v == null || v === "") && <option value="" />}
          {(c.fonte as string[]).map((o) => <option key={o} value={o}>{o}</option>)}
        </Selecao>
      );

    case "opts": {
      const opcoes = typeof c.fonte === "function" ? c.fonte() : (c.fonte as [string, string][]);
      return (
        <Selecao id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)}>
          {opcoes.map(([val, rot]) => <option key={val} value={val}>{rot}</option>)}
        </Selecao>
      );
    }

    case "ref": {
      const lista = listaDe(c.fonte as ColecaoPainel);
      return (
        <Selecao id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)}>
          {c.vazio != null ? <option value="">{c.vazio}</option> : (v == null || v === "") && <option value="">—</option>}
          {lista.map((o) => <option key={o.id} value={o.id}>{o.nome || o.titulo || o.id}</option>)}
        </Selecao>
      );
    }

    case "origem":
      return (
        <Selecao id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)}>
          {opcoesOrigem.map(([val, rot]) => <option key={val} value={val}>{rot}</option>)}
        </Selecao>
      );

    case "csv":
      // Enquanto digita é texto; ao sair do campo vira lista limpa.
      return (
        <Entrada id={id} value={Array.isArray(v) ? (v as string[]).join(", ") : String(v ?? "")}
          onChange={(e) => definir(e.target.value)}
          onBlur={(e) => definir(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
      );

    case "lines":
      return (
        <AreaTexto id={id} className="min-h-24"
          value={Array.isArray(v) ? (v as string[]).join("\n") : String(v ?? "")}
          onChange={(e) => definir(e.target.value)}
          onBlur={(e) => definir(e.target.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))} />
      );

    case "multi": {
      const selecionados = Array.isArray(v) ? (v as string[]) : [];
      const lista = listaDe(c.fonte as ColecaoPainel);
      return (
        <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 py-1">
          {lista.map((o) => (
            <label key={o.id} className="inline-flex items-center gap-[5px] text-sm font-medium text-ink">
              <input type="checkbox" className="w-auto accent-accent" checked={selecionados.includes(o.id)}
                onChange={(e) => definir(e.target.checked
                  ? [...selecionados, o.id]
                  : selecionados.filter((x) => x !== o.id))} />
              {o.nome}
            </label>
          ))}
          {!lista.length && <span className="text-xs text-muted">nada cadastrado ainda</span>}
        </div>
      );
    }

    default:
      return <Entrada id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)} />;
  }
}
