/* Reconhece links do Google Drive/Docs e devolve o endereço de visualização
   que o Google aceita dentro de um iframe (o ".../preview"). Pasta do Drive e
   qualquer outro endereço devolvem null: esses seguem abrindo em aba nova. */

const ARQUIVO = /^https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/i;
const POR_ID = /^https?:\/\/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([\w-]+)/i;
const DOCS = /^https?:\/\/docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\/([\w-]+)/i;

export function urlDePreview(u: string): string | null {
  const m1 = ARQUIVO.exec(u) || POR_ID.exec(u);
  if (m1) return `https://drive.google.com/file/d/${m1[1]}/preview`;
  const m2 = DOCS.exec(u);
  if (m2) return `https://docs.google.com/${m2[1]}/d/${m2[2]}/preview`;
  return null;
}
