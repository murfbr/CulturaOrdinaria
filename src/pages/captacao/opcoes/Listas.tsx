/* As quatro listas de escolha da Captação (presets/captacao): renomear sempre;
   incluir onde faz sentido; apagar só o que não está em uso e não é um id que
   o código interpreta. Base da comissão não ganha nem perde item: cada opção
   muda a conta. */
import { useState } from "react";
import { Banco } from "../../../services/banco";
import { presetCaptacao, usarCentral } from "../../../store/central";
import { toast } from "../../../components/Toast";
import { Botao } from "../../../components/ui/Botao";
import { ESTILO_CONTROLE } from "../../../components/ui/Campo";
import { Dica } from "../../../components/ui/Dica";
import { Painel } from "../../../components/ui/Painel";
import { ESTILO_MONO } from "../../../components/ui/estilos";
import { IDS_PROTEGIDOS_CAPTACAO, ROTULO_LISTA_CAPTACAO, type ItemListaCaptacao, type NomeListaCaptacao } from "../../../types";
import { slug } from "../../../utils";

const NOTA: Record<NomeListaCaptacao, string> = {
  etapas: "“Confirmado” soma no confirmado do projeto e gera comissão; “Perdido” sai das contas; “Proposta enviada” e “Negociação” somam em “com proposta enviada”.",
  mecanismos: "Só informativo.",
  situacaoProjeto: "Só os projetos “aberto” entram no resumo e no inventário de cotas.",
  baseComissao: "Cada opção muda a conta da comissão, por isso não dá para incluir nem apagar.",
};

export function Listas() {
  const { painel } = usarCentral();
  const preset = presetCaptacao();
  const [novo, setNovo] = useState<Record<string, string>>({});

  const emUso = (lista: NomeListaCaptacao, id: string) =>
    lista === "etapas" ? painel.negociacoes.some((n) => n.etapa === id)
      : lista === "mecanismos" ? painel.portfolio.some((p) => p.mecanismo === id)
        : lista === "situacaoProjeto" ? painel.portfolio.some((p) => p.situacao === id)
          : true;

  function gravar(lista: NomeListaCaptacao, itens: ItemListaCaptacao[]) {
    Banco.gravar("presets", "captacao", { ...preset, id: "captacao", listas: { ...preset.listas, [lista]: itens } }, true);
  }

  function renomear(lista: NomeListaCaptacao, id: string, nome: string) {
    const n = nome.trim();
    if (!n) return;
    gravar(lista, preset.listas[lista].map((i) => (i.id === id ? { ...i, nome: n } : i)));
  }

  function incluir(lista: NomeListaCaptacao) {
    const nome = (novo[lista] || "").trim();
    if (!nome) return;
    let id = slug(nome).replace(/-/g, "_") || "item";
    if (preset.listas[lista].some((i) => i.id === id)) id += "_" + Math.floor(Math.random() * 90 + 10);
    gravar(lista, [...preset.listas[lista], { id, nome }]);
    setNovo((v) => ({ ...v, [lista]: "" }));
  }

  function tirar(lista: NomeListaCaptacao, item: ItemListaCaptacao) {
    if (emUso(lista, item.id)) { toast(`“${item.nome}” está em uso e não pode ser apagado.`); return; }
    gravar(lista, preset.listas[lista].filter((i) => i.id !== item.id));
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {(Object.keys(ROTULO_LISTA_CAPTACAO) as NomeListaCaptacao[]).map((lista) => {
        const fixa = lista === "baseComissao";
        return (
          <Painel key={lista} titulo={ROTULO_LISTA_CAPTACAO[lista]} className="mb-0">
            <Dica className="mb-2">{NOTA[lista]}</Dica>
            <div className="flex flex-col gap-1.5">
              {preset.listas[lista].map((item) => {
                const protegido = fixa || IDS_PROTEGIDOS_CAPTACAO[lista].includes(item.id);
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      className={ESTILO_CONTROLE + " min-w-0 flex-1 py-1 text-sm"} defaultValue={item.nome} aria-label="Nome do item"
                      onBlur={(e) => { if (e.target.value.trim() !== item.nome) { renomear(lista, item.id, e.target.value); toast("Nome atualizado"); } }}
                    />
                    <code className={ESTILO_MONO}>{item.id}</code>
                    {!protegido && (
                      <Botao variante="quieto" tamanho="mini" onClick={() => tirar(lista, item)} aria-label={"Apagar " + item.nome}>×</Botao>
                    )}
                  </div>
                );
              })}
            </div>
            {!fixa && (
              <div className="mt-2 flex gap-2">
                <input
                  className={ESTILO_CONTROLE + " min-w-0 flex-1 py-1 text-sm"} placeholder="Novo item" aria-label="Novo item"
                  value={novo[lista] || ""} onChange={(e) => setNovo((v) => ({ ...v, [lista]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") incluir(lista); }}
                />
                <Botao variante="fantasma" tamanho="pequeno" onClick={() => incluir(lista)}>Incluir</Botao>
              </div>
            )}
          </Painel>
        );
      })}
    </div>
  );
}
