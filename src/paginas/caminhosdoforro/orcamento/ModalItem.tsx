/* Novo ou editar item do orçamento: nome, categoria, núcleo, quantidade e
   unidade, quantas vezes em cada momento, unidade das vezes, os três valores
   unitários (um por cenário), o total ao vivo no cenário atual, status,
   fornecedor (do cadastro, ou cadastrar um novo), anotações, a revisar. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { CENARIOS, MOMENTOS, auditoria, brl, rotuloCenario } from "../calculo";
import { apagar, criarCadastroRapido, gravar, novoId } from "../dados";
import { opcoes, rotulo } from "../listas";
import type { Base, Cenario, ItemOrcamento, Momento } from "../tipos";
import { AreaTexto, Campo, Check, Entrada, Grupo, Opcoes, ROTULO, Selecao } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";
import { NOVO, SelecaoCadastro } from "../ui/SelecaoCadastro";

interface Props { base: Base; id: string | null; preset?: Partial<ItemOrcamento>; aoFechar: () => void }

const texto = (v: unknown) => (v == null || v === "" ? "" : String(v));

export function ModalItem({ base, id, preset, aoFechar }: Props) {
  const existente = id ? base.orcamento_itens[id] : undefined;
  const p = base.pagina;
  const cenario = p.simulador.cenario;
  const [d, setD] = useState<ItemOrcamento>(() => existente ? clonar(existente) : {
    id: novoId("orcamento_itens"), nome: "", categoria: "", nucleo: null, quantidade: 1, unidade: "", unidadeVezes: "",
    unitario: { E: 0, I: 0, X: 0 }, distribuicao: { pre: 0, mont: 0, d1: 0, d2: 0, d3: 0, pos: 0 },
    status: "previsto", fornecedor: null, anotacoes: "", revisar: false,
    ordem: Object.values(base.orcamento_itens).reduce((m, x) => Math.max(m, x.ordem || 0), 0) + 1,
    ...preset,
  });
  const [quantidade, setQuantidade] = useState(texto(d.quantidade));
  const [unitario, setUnitario] = useState<Record<Cenario, string>>({ E: texto(d.unitario?.E), I: texto(d.unitario?.I), X: texto(d.unitario?.X) });
  const [distribuicao, setDistribuicao] = useState<Record<Momento, string>>(
    Object.fromEntries(MOMENTOS.map((k) => [k, texto(d.distribuicao?.[k])])) as Record<Momento, string>,
  );
  const [novoNome, setNovoNome] = useState("");
  const mudar = (parte: Partial<ItemOrcamento>) => setD((a) => ({ ...a, ...parte }));

  const vezes = MOMENTOS.reduce((t, k) => t + (Number(distribuicao[k]) || 0), 0);
  const total = (Number(quantidade) || 0) * vezes * (Number(unitario[cenario]) || 0);

  function salvar() {
    const nome = d.nome.trim();
    if (!nome) { toast("Preencha o nome do item."); return; }
    if (!d.categoria) { toast("Escolha a categoria."); return; }
    let fornecedor = d.fornecedor;
    if (fornecedor === NOVO) {
      const n = novoNome.trim();
      if (!n) { toast("Escreva o nome do fornecedor."); return; }
      fornecedor = criarCadastroRapido(n, "fornecedor", d.nucleo || null);
    }
    const dist = Object.fromEntries(MOMENTOS.map((k) => [k, Math.max(0, Math.round(Number(distribuicao[k]) || 0))])) as Record<Momento, number>;
    const unit = Object.fromEntries(CENARIOS.map(([k]) => [k, Math.max(0, Number(unitario[k]) || 0)])) as Record<Cenario, number>;
    gravar("orcamento_itens", {
      ...d, nome, fornecedor: fornecedor || null, quantidade: Math.max(0, Number(quantidade) || 0),
      unidade: d.unidade.trim(), unidadeVezes: d.unidadeVezes.trim(), distribuicao: dist, unitario: unit, anotacoes: d.anotacoes.trim(),
    });
    aoFechar();
    toast(id ? "Item salvo." : "Item criado.");
  }

  function excluir() {
    apagar("orcamento_itens", id!);
    aoFechar();
    toast("Item excluído.");
  }

  const campoNumero = "cdf:px-2 cdf:py-1.5";

  return (
    <Modal titulo={id ? "Editar item do orçamento" : "Novo item do orçamento"} auditoria={auditoria(existente as (ItemOrcamento & { atualizadoPor?: string }) | undefined)} aoFechar={aoFechar} aoSalvar={salvar} aoExcluir={id ? excluir : undefined}>
      <Campo rotulo="Item" className={LINHA_INTEIRA}><Entrada autoFocus required value={d.nome} onChange={(e) => mudar({ nome: e.target.value })} /></Campo>
      <Campo rotulo="Categoria"><Selecao value={d.categoria} onChange={(e) => mudar({ categoria: e.target.value })}><Opcoes lista={opcoes(p, "categoriasOrcamento", "Escolha")} /></Selecao></Campo>
      <Campo rotulo="Núcleo"><Selecao value={d.nucleo || ""} onChange={(e) => mudar({ nucleo: e.target.value || null })}><Opcoes lista={opcoes(p, "nucleos", "Sem núcleo")} /></Selecao></Campo>
      <Campo rotulo="Quantos"><Entrada type="number" min={0} step={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} /></Campo>
      <Campo rotulo="Unidade"><Entrada value={d.unidade} onChange={(e) => mudar({ unidade: e.target.value })} placeholder="pessoas, grupos, diárias…" /></Campo>
      <Grupo rotulo="Quantas vezes em cada momento" className={LINHA_INTEIRA}>
        <div className="cdf:grid cdf:grid-cols-3 cdf:gap-2 cdf:md:grid-cols-6">
          {MOMENTOS.map((k) => (
            <label key={k} className="cdf:block cdf:min-w-0">
              <span className={ROTULO + " cdf:text-[12.5px] cdf:font-semibold"}>{rotulo(p, "momentos", k)}</span>
              <Entrada type="number" min={0} step={1} value={distribuicao[k]} onChange={(e) => setDistribuicao({ ...distribuicao, [k]: e.target.value })} className={campoNumero} />
            </label>
          ))}
        </div>
      </Grupo>
      <Campo rotulo="Unidade das vezes" className={LINHA_INTEIRA}><Entrada value={d.unidadeVezes} onChange={(e) => mudar({ unidadeVezes: e.target.value })} placeholder="dias, diárias, meses…" /></Campo>
      <div className={LINHA_INTEIRA + " cdf:grid cdf:grid-cols-1 cdf:gap-3 cdf:md:grid-cols-3"}>
        {CENARIOS.map(([k, nome]) => (
          <Campo key={k} rotulo={"Valor unitário " + nome.toLowerCase() + " (R$)"}>
            <Entrada type="number" min={0} step={10} value={unitario[k]} onChange={(e) => setUnitario({ ...unitario, [k]: e.target.value })} />
          </Campo>
        ))}
      </div>
      <p className={LINHA_INTEIRA + " cdf:m-0 cdf:rounded-lg cdf:bg-superficie-2 cdf:px-3 cdf:py-2.5 cdf:text-base"}>
        {Number(quantidade) || 0} × {vezes} vezes × {brl(Number(unitario[cenario]) || 0)} = <strong>{brl(total)}</strong> no cenário {rotuloCenario(cenario)}
      </p>
      <Campo rotulo="Status"><Selecao value={d.status} onChange={(e) => mudar({ status: e.target.value })}><Opcoes lista={opcoes(p, "statusOrcamento")} /></Selecao></Campo>
      <Campo rotulo="Fornecedor">
        <SelecaoCadastro base={base} tipo="fornecedor" value={d.fornecedor || ""} aoMudar={(fornecedor) => mudar({ fornecedor: fornecedor || null })} rotuloVazio="Sem fornecedor" rotuloNovo="Cadastrar novo fornecedor…" />
      </Campo>
      {d.fornecedor === NOVO && (
        <Campo rotulo="Nome do novo fornecedor" className={LINHA_INTEIRA}><Entrada autoFocus value={novoNome} onChange={(e) => setNovoNome(e.target.value)} /></Campo>
      )}
      <Campo rotulo="Anotações" className={LINHA_INTEIRA}><AreaTexto rows={3} value={d.anotacoes} onChange={(e) => mudar({ anotacoes: e.target.value })} /></Campo>
      <Check rotulo="A revisar" className={LINHA_INTEIRA} checked={d.revisar} onChange={(e) => mudar({ revisar: e.target.checked })} />
    </Modal>
  );
}
