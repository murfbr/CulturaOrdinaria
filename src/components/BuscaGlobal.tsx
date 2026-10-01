/* Paleta de busca global: abre com Ctrl+K (ou pelo botão do cabeçalho),
   procura em todas as coleções e navega direto para o resultado.
   Vive no App, como o Toast; qualquer lugar chama `abrirBusca()`. */
import { useEffect, useMemo, useRef, useState } from "react";
import { usarCentral } from "../store/central";
import { filtrar, montarIndice, type ResultadoBusca } from "../lib/busca";
import { cx } from "../utils/classes";
import { Overlay } from "./Modal";
import { Badge } from "./ui/Badge";

let abrirFora: (() => void) | null = null;
/** Abre a paleta de busca de qualquer lugar. */
export function abrirBusca() { abrirFora?.(); }

export function BuscaGlobal() {
  const estado = usarCentral();
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [ativo, setAtivo] = useState(0);
  const caixa = useRef<HTMLInputElement>(null);
  const linhaAtiva = useRef<HTMLDivElement>(null);

  useEffect(() => {
    abrirFora = () => { setAberta(true); setTermo(""); setAtivo(0); };
    const atalho = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); abrirFora?.(); }
    };
    window.addEventListener("keydown", atalho);
    return () => { abrirFora = null; window.removeEventListener("keydown", atalho); };
  }, []);

  const indice = useMemo(() => (aberta ? montarIndice(estado) : []), [aberta, estado]);
  const resultados = useMemo(() => filtrar(indice, termo), [indice, termo]);

  useEffect(() => { if (aberta) caixa.current?.focus(); }, [aberta]);
  useEffect(() => { setAtivo(0); }, [termo]);
  useEffect(() => { linhaAtiva.current?.scrollIntoView({ block: "nearest" }); }, [ativo, resultados]);

  if (!aberta) return null;

  const escolher = (x: ResultadoBusca) => { setAberta(false); x.abrir(); };

  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAtivo((i) => Math.min(i + 1, resultados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAtivo((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && resultados[ativo]) escolher(resultados[ativo]);
    else if (e.key === "Escape") setAberta(false);
  };

  return (
    <Overlay aoFechar={() => setAberta(false)}>
      <div className="w-full max-w-[580px] overflow-hidden rounded-xl border border-line bg-card shadow-modal" role="dialog" aria-label="Busca global">
        <input
          ref={caixa} type="search" value={termo}
          className="w-full border-0 border-b border-solid border-line bg-transparent px-4 py-3.5 text-lg text-ink outline-none"
          placeholder="buscar em tudo: artistas, editais, projetos, tarefas, formulários…"
          onChange={(e) => setTermo(e.target.value)} onKeyDown={teclas}
        />
        <div className="max-h-[min(430px,62vh)] overflow-auto p-1.5">
          {resultados.map((x, i) => (
            <div
              key={i} ref={i === ativo ? linhaAtiva : undefined}
              className={cx("flex cursor-pointer items-baseline gap-2 rounded-lg px-2.5 py-2 text-sm", i === ativo && "bg-accent-soft")}
              // onMouseMove (não Enter): rolar a lista sob o cursor parado não rouba a seleção do teclado
              onMouseMove={() => ativo !== i && setAtivo(i)} onClick={() => escolher(x)}
            >
              <Badge mini className="flex-none">{x.grupo}</Badge>
              <span className="truncate font-semibold">{x.titulo}</span>
              {x.detalhe && <span className="ml-auto max-w-[42%] flex-none truncate text-xs text-muted">{x.detalhe}</span>}
            </div>
          ))}
          {termo.trim() !== "" && !resultados.length && (
            <div className="px-4 py-3.5 text-sm text-muted">nada encontrado para “{termo}”</div>
          )}
          {termo.trim() === "" && (
            <div className="px-4 py-3.5 text-sm text-muted">digite para buscar · ↑↓ navega · Enter abre · Esc fecha</div>
          )}
        </div>
      </div>
    </Overlay>
  );
}
