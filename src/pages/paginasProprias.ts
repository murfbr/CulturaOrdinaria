/* Registro em código das páginas próprias de projeto: slug → tela. Os dados
   de cada página (projeto, título, tipo) ficam em `presets/paginas` no banco;
   aqui só o que precisa ser código, qual componente desenha. O App abre
   /<slug>/ quando o slug está aqui. */
import type { ComponentType } from "react";
import { PaginaSambaDePonta } from "./sambadeponta/PaginaSambaDePonta";

export const PAGINAS_PROPRIAS: Record<string, ComponentType> = {
  sambadeponta: PaginaSambaDePonta,
};
