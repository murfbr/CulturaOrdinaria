/* Upload e remoção de arquivos no Firebase Storage, no espaço da página:
   paginas/caminhosdoforro/arquivos/<cartão>/<versão>/<nome>. Em modo local
   não há Storage: só link. */
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { armazenamento } from "../../../services/firebase";
import { slug } from "../../../utils";
import { SLUG, type ArquivoGuardado } from "../tipos";

/** Há Storage ligado (modo nuvem)? */
export const temStorage = () => armazenamento != null;

/** Sobe o arquivo e devolve o registro com a URL de download. */
export async function enviarArquivo(cartaoId: string, versao: string, arquivo: File): Promise<ArquivoGuardado> {
  if (!armazenamento) throw new Error("Sem Storage em modo local.");
  const caminho = "paginas/" + SLUG + "/arquivos/" + cartaoId + "/" + slug(versao) + "/" + arquivo.name;
  const referencia = ref(armazenamento, caminho);
  await uploadBytes(referencia, arquivo, { contentType: arquivo.type || undefined });
  const url = await getDownloadURL(referencia);
  return { tipo: "storage", url, caminho, nomeOriginal: arquivo.name, tamanho: arquivo.size };
}

/** Apaga o objeto no Storage (links não têm o que apagar). Nunca lança: o registro some de todo jeito. */
export async function apagarArquivo(a: ArquivoGuardado) {
  if (a.tipo !== "storage" || !a.caminho || !armazenamento) return;
  try { await deleteObject(ref(armazenamento, a.caminho)); } catch { /* já não existia */ }
}

/** "1,2 MB", "340 KB". */
export function tamanhoLegivel(bytes?: number): string {
  if (!bytes) return "";
  if (bytes >= 1048576) return (bytes / 1048576).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}
