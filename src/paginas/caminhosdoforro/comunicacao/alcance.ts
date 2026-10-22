/* A conta de alcance das redes: só atrações e parceiros entram na soma (a
   mesma conta do "+450 mil" das apresentações); patrocinadores ficam fora.
   Usada pelo painel do núcleo (os indicadores) e pela aba Redes (a tabela). */
import { porNome, temTipo } from "../calculo";
import { TIPOS_ATRACAO, type Base, type Cadastro } from "../tipos";

export const comAlcance = (d: Cadastro) => Number(d.seguidores) > 0;

/** Os grupos da tabela de redes, na ordem da tela; cada cadastro cai no primeiro grupo em que um tipo seu aparece. */
export const GRUPOS: { id: string; titulo: string; tipos: string[]; soma: boolean; nota?: string }[] = [
  { id: "atracoes", titulo: "Atrações", tipos: TIPOS_ATRACAO, soma: true },
  { id: "parceiros", titulo: "Parceiros", tipos: ["parceiro_institucional", "parceiro_cultural", "gastronomia", "fornecedor"], soma: true },
  { id: "patrocinio", titulo: "Patrocinadores e empresas em prospecção", tipos: ["patrocinador"], soma: false, nota: "Fora da soma: é o público da marca, não do festival. Serve para marcar a empresa nas peças e para conhecer o tamanho de quem se procura." },
  { id: "equipe", titulo: "Equipe e captação", tipos: ["equipe", "captador"], soma: false },
];
export const grupoDe = (d: Cadastro) => GRUPOS.find((g) => g.tipos.some((t) => temTipo(d, t)))?.id || "outros";
export const contaNaSoma = (d: Cadastro) => !!GRUPOS.find((g) => g.id === grupoDe(d))?.soma;
export const porSeguidores = (a: Cadastro, b: Cadastro) => (Number(b.seguidores) || 0) - (Number(a.seguidores) || 0) || porNome(a, b);
export const somar = (lista: Cadastro[]) => lista.filter(comAlcance).reduce((t, d) => t + Number(d.seguidores), 0);

/** Os números do alcance: confirmados, ainda não confirmados e confirmados sem Instagram. */
export function alcance(base: Base) {
  const todos = Object.values(base.cadastro);
  const naSoma = todos.filter(contaNaSoma);
  const confirmados = naSoma.filter((d) => d.status === "confirmado");
  const emConversa = naSoma.filter((d) => d.status !== "confirmado" && d.status !== "recusou");
  return {
    todos,
    confirmados: somar(confirmados), perfisConfirmados: confirmados.filter(comAlcance).length,
    possivel: somar(emConversa), perfisPossiveis: emConversa.filter(comAlcance).length,
    semInstagram: confirmados.filter((d) => !d.instagram).sort(porNome),
    comInstagram: todos.filter((d) => d.instagram).length,
  };
}
