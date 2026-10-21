/* Registro em código das páginas anexo: slug → tela e título de reserva. Os
   dados de cada página (título, tipo) ficam em `presets/paginas` no banco;
   aqui só o que precisa ser código: qual componente desenha, e o título a
   usar enquanto o banco não tem o registro (a seção Páginas anexo lista
   daqui). O App abre /<slug>/ quando o slug está aqui. As páginas moram em
   src/paginas/<slug>/, fora de src/pages (que é só a Central). */
import type { ComponentType } from "react";
import { PaginaSambaDePonta } from "../paginas/sambadeponta/PaginaSambaDePonta";
import { PaginaCaminhosDoForro } from "../paginas/caminhosdoforro/PaginaCaminhosDoForro";

export const PAGINAS_PROPRIAS: Record<string, { tela: ComponentType; titulo: string }> = {
  // Ponta de Lança: o endereço é /pontadelanca/; o antigo /sambadeponta/ redireciona
  // (vercel.json em produção, App.tsx no servidor de desenvolvimento). A chave dos
  // dados no banco segue "sambadeponta".
  pontadelanca: { tela: PaginaSambaDePonta, titulo: "Ponta de Lança" },
  caminhosdoforro: { tela: PaginaCaminhosDoForro, titulo: "Caminhos do Forró" },
};

/** Endereços antigos de página → endereço atual (o App redireciona no servidor de
    desenvolvimento; em produção o vercel.json faz o mesmo). */
export const ENDERECOS_ANTIGOS: Record<string, string> = { sambadeponta: "pontadelanca" };
