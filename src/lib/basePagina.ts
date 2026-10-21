/* A base de uma página anexo em JSON, lida na hora do banco: o documento da
   página (`config`) e cada subcoleção que o registro em código declara, como
   id → registro, no formato das diretrizes. Serve de cópia e de semente. Usada
   pela aba Backup de Páginas anexo e pelo botão da própria página. Os
   arquivos enviados ao Storage não entram: só os links e caminhos gravados
   nos registros. */
import { Banco } from "../services/banco";
import { baixarArquivo } from "../utils";

export interface BaseDaPagina { base: Record<string, unknown>; contagens: Record<string, number> }

/** Lê o documento da página e as subcoleções e monta o arquivo; null quando a página não existe no banco. */
export async function montarBaseDaPagina(slug: string, titulo: string, colecoes: readonly string[]): Promise<BaseDaPagina | null> {
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

/** Monta e baixa `<slug>-base-<data>.json`; devolve as contagens por lista, ou null quando a página não existe no banco. */
export async function baixarBaseDaPagina(slug: string, titulo: string, colecoes: readonly string[]): Promise<Record<string, number> | null> {
  const r = await montarBaseDaPagina(slug, titulo, colecoes);
  if (!r) return null;
  baixarArquivo(slug + "-base-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(r.base, null, 2));
  return r.contagens;
}
