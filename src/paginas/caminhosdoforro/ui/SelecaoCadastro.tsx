/* Select de um cadastro de certo tipo, com a opção de cadastrar um novo de
   dentro do modal (o `selectCadastro` do artefato). O valor NOVO pede o nome
   num campo ao lado; quem usa cria o cadastro ao salvar. Um cadastro já
   escolhido que não é mais do tipo continua aparecendo. */
import { cadastrosDoTipo } from "../calculo";
import type { Base } from "../tipos";
import { Selecao } from "./Campo";

export const NOVO = "__novo";

interface Props {
  base: Base;
  tipo: string;
  value: string;
  aoMudar: (id: string) => void;
  rotuloVazio: string;
  rotuloNovo: string;
  autoFocus?: boolean;
}

export function SelecaoCadastro({ base, tipo, value, aoMudar, rotuloVazio, rotuloNovo, autoFocus }: Props) {
  const lista = cadastrosDoTipo(base, tipo);
  const atual = value && value !== NOVO && base.cadastro[value] && !lista.some((c) => c.id === value) ? base.cadastro[value] : null;
  return (
    <Selecao autoFocus={autoFocus} value={value} onChange={(e) => aoMudar(e.target.value)}>
      <option value="">{rotuloVazio}</option>
      {atual && <option value={atual.id}>{atual.nome}</option>}
      {lista.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      <option value={NOVO}>{rotuloNovo}</option>
    </Selecao>
  );
}
