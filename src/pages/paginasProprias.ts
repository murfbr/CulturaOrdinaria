/* Registro em código das páginas anexo: slug → tela e título de reserva. Os
   dados de cada página (título, tipo) ficam em `presets/paginas` no banco;
   aqui só o que precisa ser código: qual componente desenha, e o título a
   usar enquanto o banco não tem o registro (a seção Páginas anexo lista
   daqui). O App abre /<slug>/ quando o slug está aqui. As páginas moram em
   src/paginas/<slug>/, fora de src/pages (que é só a Central). */
import type { ComponentType } from "react";
import { PaginaPontaDeLanca } from "../paginas/pontadelanca/PaginaPontaDeLanca";
import { PaginaCaminhosDoForro } from "../paginas/caminhosdoforro/PaginaCaminhosDoForro";

export const PAGINAS_PROPRIAS: Record<string, { tela: ComponentType; titulo: string }> = {
  pontadelanca: { tela: PaginaPontaDeLanca, titulo: "Ponta de Lança" },
  caminhosdoforro: { tela: PaginaCaminhosDoForro, titulo: "Caminhos do Forró" },
};

/** Endereços antigos de página → endereço atual (o App redireciona no servidor de
    desenvolvimento; em produção o vercel.json faz o mesmo, em definitivo). O Ponta de
    Lança nasceu em /sambadeponta/ (até 20/10/2026) e os dados moraram nessa chave até
    21/10/2026; a página copia os dados antigos na primeira abertura. */
export const ENDERECOS_ANTIGOS: Record<string, string> = { sambadeponta: "pontadelanca" };
