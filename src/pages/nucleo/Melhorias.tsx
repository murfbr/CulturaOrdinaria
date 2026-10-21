/* Núcleo do Coletivo, aba Melhorias: o caderno "Melhorias da Central" dentro
   da Central. À esquerda, Início, Levar ao Gustavo e as três seções (Central
   do Coletivo, Páginas anexo, Núcleo do Coletivo); as abas de cada seção são
   o que existe no site hoje: os ambientes da Central (mais "Transversal"),
   as páginas anexo do registro em código e as abas do Núcleo. À direita, a
   seção escolhida: tarefas (as melhorias, com a caixa de feita) e anotações,
   filtradas pelas abas, ou as duas telas calculadas. A aba já abre pronta
   para cadastrar; "trazer do artefato (JSON)" é só o atalho para importar o
   que já estava no artefato. Os itens moram na coleção `nucleo` (ver
   store/nucleo.ts). */
import { useEffect, useMemo, useState } from "react";
import { cadernoParaJson, iniciarNucleo, usarNucleo } from "../../store/nucleo";
import { usarCentral } from "../../store/central";
import { AMBIENTES } from "../../store/navegacao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { toast } from "../../components/Toast";
import { Botao } from "../../components/ui/Botao";
import { Dica } from "../../components/ui/Dica";
import { ABA_TRANSVERSAL, NOMES_SECAO, SECAO_CENTRAL, SECAO_GUSTAVO, SECAO_INICIO, SECAO_NUCLEO, SECAO_PAGINAS, type SecaoCaderno } from "../../types";
import { baixarArquivo } from "../../utils";
import { cx } from "../../utils/classes";
import { PAGINAS_PROPRIAS } from "../paginasProprias";
import { ItensDaSecao } from "./CadernoItens";
import { InicioDoCaderno, LevarAoGustavo } from "./CadernoVistas";
import { ImportarCaderno } from "./ImportarCaderno";

const CHAVE_SECAO = "central-caderno-secao";
const VISTAS = new Set([SECAO_INICIO, SECAO_GUSTAVO]);

/** As seções do caderno com as abas do site de hoje (não é lista à parte: muda quando o site muda). */
function secoesDoSite(): SecaoCaderno[] {
  const secao = (id: string, abas: string[]) => ({ id, nome: NOMES_SECAO[id], abas });
  const central = AMBIENTES.filter((a) => a.id !== "anexos" && a.id !== "nucleo").map((a) => a.rotulo);
  const nucleo = AMBIENTES.find((a) => a.id === "nucleo")?.abas.map(([, rotulo]) => rotulo) || [];
  return [
    secao(SECAO_INICIO, []),
    secao(SECAO_GUSTAVO, []),
    secao(SECAO_CENTRAL, [...central, ABA_TRANSVERSAL]),
    secao(SECAO_PAGINAS, Object.values(PAGINAS_PROPRIAS).map((p) => p.titulo)),
    secao(SECAO_NUCLEO, nucleo),
  ];
}

export function MelhoriasNucleo() {
  useEffect(() => { iniciarNucleo(); }, []);
  const { caderno } = usarNucleo();
  const { painel } = usarCentral();
  const [secaoId, setSecaoId] = useState(() => { try { return localStorage.getItem(CHAVE_SECAO) || SECAO_INICIO; } catch { return SECAO_INICIO; } });
  const [abas, setAbas] = useState<Record<string, string>>({});
  const [importando, setImportando] = useState(false);

  // As seções do site, mais uma por id desconhecido que apareça nos itens (caderno de outra versão).
  const secoes = useMemo(() => {
    const base = secoesDoSite();
    const conhecidas = new Set(base.map((s) => s.id));
    const extras = [...new Set([...caderno.notas, ...caderno.tarefas].map((i) => i.secao).filter((id) => !conhecidas.has(id)))];
    return [...base, ...extras.map((id): SecaoCaderno => ({ id, nome: id, abas: [] }))];
  }, [caderno.notas, caderno.tarefas]);
  const secao = secoes.find((s) => s.id === secaoId) || secoes[0];
  const pessoas = painel.equipe.map((p) => ({ id: p.id, nome: p.nome }));
  const vazio = !caderno.notas.length && !caderno.tarefas.length;
  const irPara = (id: string, aba?: string) => {
    setSecaoId(id);
    if (aba !== undefined) setAbas((a) => ({ ...a, [id]: aba }));
    try { localStorage.setItem(CHAVE_SECAO, id); } catch { /* sem localStorage */ }
  };
  const abertas = (id: string) => caderno.tarefas.filter((t) => t.secao === id && !t.feito).length;
  const baixar = () => {
    baixarArquivo("melhorias-da-central-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(cadernoParaJson(caderno, secoes), null, 2));
    toast("Caderno baixado");
  };

  const item = (s: SecaoCaderno) => {
    const n = VISTAS.has(s.id) ? 0 : abertas(s.id);
    return (
      <button
        key={s.id} type="button" onClick={() => irPara(s.id)}
        className={cx(
          "flex w-full cursor-pointer items-center justify-between border-0 border-l-stamp border-solid bg-transparent px-2.5 py-1.5 text-left text-base",
          s.id === secao.id ? "border-l-accent font-semibold text-ink" : "border-l-transparent text-muted hover:text-ink",
        )}
      >
        <span className="truncate">{s.nome}</span>
        {n > 0 && <span className="ml-2 font-mono text-2xs text-faint" title="tarefas abertas">{n}</span>}
      </button>
    );
  };

  return (
    <>
      <CabecalhoSecao titulo="Melhorias da Central" sub="o caderno do Núcleo: o que a Central precisa melhorar, por seção">
        <Botao variante="fantasma" tamanho="pequeno" onClick={baixar}>Baixar o caderno em JSON</Botao>
        <Botao variante="quieto" tamanho="pequeno" onClick={() => setImportando((v) => !v)}>{importando ? "fechar" : "trazer do artefato (JSON)"}</Botao>
      </CabecalhoSecao>

      {importando && <ImportarCaderno aoTerminar={() => setImportando(false)} />}

      {vazio && !importando && (
        <Dica className="mb-3">
          O caderno está vazio. Escolha uma seção à esquerda e use "+ Tarefa" para cadastrar uma melhoria (ou "+ Anotação" para uma nota); a caixa à esquerda de cada tarefa marca feita. Para trazer o que já estava no artefato, use "trazer do artefato (JSON)".
        </Dica>
      )}

      <div className="flex flex-col gap-3.5 md:flex-row md:items-start">
        <nav className="shrink-0 md:w-56">
          {secoes.filter((s) => VISTAS.has(s.id)).map(item)}
          <div className="my-2 border-t border-line" />
          {secoes.filter((s) => !VISTAS.has(s.id)).map(item)}
        </nav>
        <div className="min-w-0 flex-1">
          {secao.id === SECAO_INICIO
            ? <InicioDoCaderno caderno={caderno} secoes={secoes} irPara={irPara} />
            : secao.id === SECAO_GUSTAVO
              ? <LevarAoGustavo caderno={caderno} secoes={secoes} irPara={irPara} />
              : <ItensDaSecao secao={secao} caderno={caderno} pessoas={pessoas} aba={abas[secao.id] || ""} aoMudarAba={(aba) => setAbas((a) => ({ ...a, [secao.id]: aba }))} />}
        </div>
      </div>

      <Dica className="mt-3">
        Os itens moram na coleção do Núcleo: só quem tem o módulo lê; ficam fora do Exportar, da busca e da cópia local do navegador, e apagar é de vez. "Baixar o caderno em JSON" é a cópia, no mesmo formato do artefato.
      </Dica>
    </>
  );
}
