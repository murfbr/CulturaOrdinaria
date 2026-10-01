/* As listas de seleção: um editor por lista, com renomear, adicionar e
   remover. Renomear é seguro (os registros guardam o id); item em uso ou
   protegido não se remove; lista "fixa" só renomeia. Cada lista grava ao
   clicar em "Salvar lista", como o artefato; enquanto está suja, o que outra
   pessoa salvou não sobrescreve o que se está digitando. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { cx } from "../../../utils/classes";
import { alterarPagina } from "../dados";
import { LISTAS_META, idDeItem, usos, type MetaLista } from "../listas";
import type { Base, ItemLista } from "../tipos";
import { Bloco } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { Entrada } from "../ui/Campo";

export function Listas({ base }: { base: Base }) {
  return (
    <Bloco
      titulo="Listas de seleção"
      nota="Renomear é seguro: os registros guardam o código do item, não o nome. Um item em uso não pode ser removido; troque nos registros antes. Os núcleos ficam em Cadastro geral, na aba Equipe e núcleos."
    >
      <div className="cdf:grid cdf:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] cdf:gap-3.5">
        {LISTAS_META.map((m) => <EditorLista key={m.nome} meta={m} base={base} />)}
      </div>
    </Bloco>
  );
}

function EditorLista({ meta, base }: { meta: MetaLista; base: Base }) {
  const salvos = base.pagina.listas[meta.nome] || [];
  const [itens, setItens] = useState<ItemLista[]>(() => clonar(salvos));
  const [sujo, setSujo] = useState(false);

  // O que está salvo mudou (outra pessoa, ou o próprio salvar): recarrega se não há edição pendente.
  const chave = JSON.stringify(salvos);
  const ultimaChave = useRef(chave);
  useEffect(() => {
    if (chave === ultimaChave.current) return;
    ultimaChave.current = chave;
    if (sujo) toast("Alguém alterou a lista “" + meta.titulo + "”. Salve ou recarregue para ver.");
    else setItens(clonar(salvos));
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps

  const fixa = meta.protegidos === "fixa";
  const mudar = (i: number, nome: string) => { setItens((l) => l.map((it, k) => (k === i ? { ...it, nome } : it))); setSujo(true); };
  const adicionar = () => { setItens((l) => [...l, { id: "", nome: "" }]); setSujo(true); };
  const remover = (i: number) => { setItens((l) => l.filter((_, k) => k !== i)); setSujo(true); };

  function salvar(ev: FormEvent) {
    ev.preventDefault();
    if (itens.some((it) => !it.nome.trim())) { toast("Um item está sem nome."); return; }
    if (!itens.length) { toast("A lista precisa de pelo menos um item."); return; }
    const usados = new Set(itens.filter((it) => it.id).map((it) => it.id));
    const lista = itens.map((it) => ({ id: it.id || idDeItem(it.nome, usados), nome: it.nome.trim() }));
    alterarPagina((p) => { p.listas[meta.nome] = lista; });
    setSujo(false);
    toast("Lista salva.");
  }

  return (
    <form onSubmit={salvar} className={cx("cdf:flex cdf:flex-col cdf:rounded-xl cdf:border cdf:border-solid cdf:bg-superficie cdf:p-4", sujo ? "cdf:border-destaque" : "cdf:border-linha")}>
      <h3 className="cdf:m-0 cdf:mb-1 cdf:text-md cdf:font-bold">
        {meta.titulo}
        {sujo && <span className="cdf:text-[13px] cdf:font-normal cdf:text-conversa"> (não salva)</span>}
      </h3>
      {meta.descricao && <p className="cdf:m-0 cdf:mb-2.5 cdf:text-sm cdf:text-fraco">{meta.descricao}</p>}
      <ul className="cdf:m-0 cdf:mb-3 cdf:flex cdf:list-none cdf:flex-col cdf:gap-1.5 cdf:p-0">
        {itens.map((it, i) => {
          const n = it.id ? usos(base, meta.nome, it.id) : 0;
          const protegido = Array.isArray(meta.protegidos) && meta.protegidos.includes(it.id);
          const podeRemover = !fixa && !protegido && n === 0;
          const dica = protegido ? "Usado nas regras de cálculo" : n ? "Em uso: troque nos registros antes de remover" : "Remover item";
          return (
            <li key={it.id || "novo-" + i} className="cdf:flex cdf:items-center cdf:gap-1.5">
              <Entrada value={it.nome} onChange={(e) => mudar(i, e.target.value)} aria-label="Nome do item" required className="cdf:px-2 cdf:py-1.5 cdf:text-[14.5px]" />
              <span className="cdf:min-w-[56px] cdf:whitespace-nowrap cdf:text-right cdf:text-[12.5px] cdf:text-fraco">{n ? n + " em uso" : ""}</span>
              {!fixa && <Botao variante="fraco" mini disabled={!podeRemover} title={dica} onClick={() => remover(i)}>Remover</Botao>}
            </li>
          );
        })}
      </ul>
      <div className="cdf:mt-auto cdf:flex cdf:justify-between cdf:gap-2">
        {fixa ? <span /> : <Botao variante="fraco" onClick={adicionar}>Adicionar item</Botao>}
        <Botao type="submit">Salvar lista</Botao>
      </div>
    </form>
  );
}
