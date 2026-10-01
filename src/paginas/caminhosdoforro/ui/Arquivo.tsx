/* Link de um arquivo anexado (carta de anuência, proposta). O artefato também
   aceitava upload; aqui o arquivo é sempre um link, e o que veio como upload
   do artefato aparece como indisponível. */
import type { Arquivo } from "../tipos";

export function LinkArquivo({ arquivo }: { arquivo: Arquivo | null | undefined }) {
  if (!arquivo) return <span className="cdf:text-fraco">Nenhum arquivo</span>;
  if (arquivo.tipo !== "link" || !arquivo.url) return <span className="cdf:text-fraco">{arquivo.nome || "arquivo"} (upload do artefato, indisponível aqui)</span>;
  return <a href={arquivo.url} target="_blank" rel="noopener">{arquivo.nome || "Abrir arquivo"}</a>;
}

/** Monta o arquivo a partir do link digitado (vazio = sem arquivo). */
export const arquivoDoLink = (url: string): Arquivo | null => {
  const u = url.trim();
  return u ? { tipo: "link", url: u, nome: u.replace(/^https?:\/\//i, "").slice(0, 60) } : null;
};

/** O link precisa começar com http:// ou https:// (vazio vale). */
export const linkValido = (url: string) => !url.trim() || /^https?:\/\//i.test(url.trim());
