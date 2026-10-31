/* Os dados do Mailing já juntos (eventos com as partes, pessoas por e-mail),
   recalculados só quando o banco muda. */
import { useMemo } from "react";
import { usarDivulgacao } from "../../../store/divulgacao";
import { juntarEventos, linhasDeEvento, pessoasDe } from "./calculoMailing";

export function usarDadosMailing() {
  const d = usarDivulgacao();
  const eventos = useMemo(() => juntarEventos(Object.values(d.eventos)), [d.eventos]);
  const descadastros = useMemo(() => Object.values(d.descadastros), [d.descadastros]);
  const pessoas = useMemo(() => pessoasDe(eventos, descadastros), [eventos, descadastros]);
  const linhas = useMemo(() => linhasDeEvento(eventos), [eventos]);
  return { d, eventos, descadastros, pessoas, linhas };
}
