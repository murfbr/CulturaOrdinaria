/* Junta classes condicionais: cx("a", ativo && "b", null) → "a b". */
export function cx(...partes: (string | false | null | undefined)[]): string {
  return partes.filter(Boolean).join(" ");
}
