/* Registro em código das páginas próprias de projeto: slug → tela. Os dados
   de cada página (projeto, título, tipo) ficam em `presets/paginas` no banco;
   aqui só o que precisa ser código, qual componente desenha. O App abre
   /<slug>/ quando o slug está aqui. As páginas moram em src/paginas/<slug>/,
   fora de src/pages (que é só a Central). */
import type { ComponentType } from "react";
import { PaginaSambaDePonta } from "../paginas/sambadeponta/PaginaSambaDePonta";
import { PaginaCaminhosDoForro } from "../paginas/caminhosdoforro/PaginaCaminhosDoForro";

export const PAGINAS_PROPRIAS: Record<string, ComponentType> = {
  sambadeponta: PaginaSambaDePonta,
  caminhosdoforro: PaginaCaminhosDoForro,
};
