/* Páginas anexo, aba Backup: uma cópia de cada página anexo em JSON, gerada
   na hora a partir do banco: o documento da página e as subcoleções que o
   registro em código declara, no formato das diretrizes (`config` com o
   documento da página e cada lista como id → registro). Lê sob demanda, sem
   escuta permanente. O Exportar da Central (as coleções do coletivo) fica ao
   lado. Os arquivos enviados ao Storage (apresentações, cartas, contexto)
   não entram: só os links e caminhos gravados nos registros. */
import { useState } from "react";
import { Banco } from "../../services/banco";
import { usarCentral } from "../../store/central";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { ModalExportar } from "../../components/ferramentas/ModalExportar";
import { toast } from "../../components/Toast";
import { Botao } from "../../components/ui/Botao";
import { Dica } from "../../components/ui/Dica";
import { Painel } from "../../components/ui/Painel";
import { baixarArquivo } from "../../utils";
import { PAGINAS_PROPRIAS } from "../paginasProprias";

const hojeIso = () => new Date().toISOString().slice(0, 10);

/** Lê o documento da página e as subcoleções e monta o arquivo; null quando a página não existe no banco. */
async function montarBase(slug: string, titulo: string, colecoes: readonly string[]) {
  const pagina = await Banco.carregarDocumento("paginas", slug);
  if (!pagina) return null;
  const base: Record<string, unknown> = {
    exportadoEm: new Date().toISOString(), origem: "Central do Coletivo · /" + slug + "/", slug, titulo, config: pagina,
  };
  const contagens: Record<string, number> = {};
  for (const c of colecoes) {
    const mapa = await Banco.carregarColecao("paginas/" + slug + "/" + c);
    base[c] = mapa;
    contagens[c] = Object.keys(mapa).length;
  }
  return { base, contagens };
}

export function BackupAnexos() {
  const { presets } = usarCentral();
  const [exportar, setExportar] = useState(false);
  const [lendo, setLendo] = useState("");
  const [contagens, setContagens] = useState<Record<string, Record<string, number>>>({});
  const registro = presets.paginas?.paginas || [];

  async function baixar(slug: string, titulo: string, colecoes: readonly string[]) {
    setLendo(slug);
    try {
      const r = await montarBase(slug, titulo, colecoes);
      if (!r) { toast("A página ainda não tem dados no banco."); return; }
      setContagens((c) => ({ ...c, [slug]: r.contagens }));
      baixarArquivo(slug + "-base-" + hojeIso() + ".json", JSON.stringify(r.base, null, 2));
      toast("Base baixada");
    } catch (e) {
      toast("Não deu para ler a página: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLendo("");
    }
  }

  return (
    <>
      <CabecalhoSecao titulo="Backup" sub="uma cópia de cada página anexo em JSON, gerada na hora a partir do banco">
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => setExportar(true)}>Exportar da Central</Botao>
      </CabecalhoSecao>

      {Object.entries(PAGINAS_PROPRIAS).map(([slug, p]) => {
        const titulo = registro.find((r) => r.slug === slug)?.titulo || p.titulo;
        const c = contagens[slug];
        return (
          <Painel key={slug} titulo={titulo}
            sub={"/" + slug + "/ · " + p.colecoes.length + (p.colecoes.length === 1 ? " lista: " : " listas: ") + p.colecoes.join(", ")}
            acoes={<Botao tamanho="pequeno" disabled={lendo === slug} onClick={() => void baixar(slug, titulo, p.colecoes)}>{lendo === slug ? "lendo o banco…" : "Baixar a base em JSON"}</Botao>}>
            <Dica className="text-sm">O arquivo leva o documento da página (<code>config</code>) e cada lista como id → registro, no formato das diretrizes: serve de cópia e de semente, se a página tiver que nascer de novo.</Dica>
            {c && <p className="m-0 mt-2 text-sm text-muted">Último arquivo: {Object.entries(c).map(([k, n]) => n + " em " + k).join(" · ")}.</p>}
          </Painel>
        );
      })}

      <Dica>Os arquivos enviados ao Storage (apresentações, cartas, contexto) não entram no backup: só os links e caminhos gravados nos registros. O Exportar da Central cobre as coleções do coletivo (artistas, projetos, tarefas, contatos…), não as páginas.</Dica>

      {exportar && <ModalExportar aoFechar={() => setExportar(false)} />}
    </>
  );
}
