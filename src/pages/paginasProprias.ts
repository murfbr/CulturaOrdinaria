/* Registro em código das páginas anexo: slug → tela, título de reserva, as
   subcoleções da página no banco e se a página lê a Central. Os dados de cada
   página (título, tipo) ficam em `presets/paginas` no banco; aqui só o que
   precisa ser código: qual componente desenha, o título a usar enquanto o
   banco não tem o registro (a seção Páginas anexo lista daqui), quais
   subcoleções de `paginas/<slug>/` a aba Backup lê, e se a página depende das
   coleções do coletivo (a tela Acessos avisa: uma conta sem módulo da Central
   não consegue abri-la). O App abre /<slug>/ quando o slug está aqui e a conta
   tem o módulo "pagina:<slug>". As páginas moram em src/paginas/<slug>/, fora
   de src/pages (que é só a Central). */
import type { ComponentType } from "react";
import { PaginaPontaDeLanca } from "../paginas/pontadelanca/PaginaPontaDeLanca";
import { SUBCOLECOES as SUBCOLECOES_PONTA } from "../paginas/pontadelanca/semente";
import { PaginaCaminhosDoForro } from "../paginas/caminhosdoforro/PaginaCaminhosDoForro";
import { COLECOES as COLECOES_FORRO } from "../paginas/caminhosdoforro/tipos";

export interface PaginaAnexo {
  tela: ComponentType;
  titulo: string;
  /** Subcoleções de `paginas/<slug>/` (um documento por registro), para o backup. */
  colecoes: readonly string[];
  /** Lê coleções da Central (tarefas, contatos, equipe...): só abre para conta com módulo da Central. */
  leACentral: boolean;
}

export const PAGINAS_PROPRIAS: Record<string, PaginaAnexo> = {
  pontadelanca: { tela: PaginaPontaDeLanca, titulo: "Ponta de Lança", colecoes: SUBCOLECOES_PONTA, leACentral: true },
  caminhosdoforro: { tela: PaginaCaminhosDoForro, titulo: "Caminhos do Forró", colecoes: COLECOES_FORRO, leACentral: false },
};

/** Endereços antigos de página → endereço atual (o App redireciona no servidor de
    desenvolvimento; em produção o vercel.json faz o mesmo, em definitivo). O Ponta de
    Lança nasceu em /sambadeponta/ (até 20/10/2026) e os dados moraram nessa chave até
    21/10/2026; a página copia os dados antigos na primeira abertura. */
export const ENDERECOS_ANTIGOS: Record<string, string> = { sambadeponta: "pontadelanca" };
