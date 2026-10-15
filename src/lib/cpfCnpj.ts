/* Conferência dos dígitos verificadores de CPF e CNPJ, para pegar erro de
   digitação antes de gravar. Só confere a forma: não consulta base nenhuma.
   O CNPJ aceita o formato alfanumérico (desde julho de 2026 a Receita emite
   CNPJ com letras nas 12 primeiras posições; os dois dígitos verificadores
   continuam numéricos e o cálculo usa o código ASCII menos 48). Texto que não
   parece número de documento ("a confirmar", "—") passa sem aviso. */

/** Tira pontuação e espaços; letras em maiúscula. */
export const limparDocumento = (s: string) => (s || "").replace(/[.\-/\s]/g, "").toUpperCase();

const todosIguais = (d: string) => /^(.)\1+$/.test(d);

export function cpfValido(cpf: string): boolean {
  const d = limparDocumento(cpf);
  if (!/^\d{11}$/.test(d) || todosIguais(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

export function cnpjValido(cnpj: string): boolean {
  const d = limparDocumento(cnpj);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(d) || todosIguais(d)) return false;
  const valor = (c: string) => c.charCodeAt(0) - 48;
  const dv = (n: number) => {
    let peso = n - 7;
    let soma = 0;
    for (let i = 0; i < n; i++) {
      soma += valor(d[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
}

export type TipoDocumento = "cpf" | "cnpj" | "documento";

/** Aviso para mostrar embaixo do campo, ou "" quando está em branco, bate ou
    é texto livre. "documento" decide pelo tamanho: 11 é CPF, 14 é CNPJ. */
export function avisoDocumento(valor: string, tipo: TipoDocumento): string {
  const d = limparDocumento(valor);
  if (!d || !/^[A-Z0-9]+$/.test(d)) return "";
  if (tipo === "documento") {
    if (d.length === 11) tipo = "cpf";
    else if (d.length === 14) tipo = "cnpj";
    else return `CPF tem 11 números e CNPJ tem 14; este tem ${d.length}.`;
  }
  if (tipo === "cpf") {
    if (d.length !== 11 || !/^\d+$/.test(d)) return `CPF tem 11 números; este tem ${d.length} caractere(s).`;
    return cpfValido(d) ? "" : "CPF não confere: os dígitos verificadores não batem. Confira a digitação.";
  }
  if (d.length !== 14) return `CNPJ tem 14 caracteres; este tem ${d.length}.`;
  return cnpjValido(d) ? "" : "CNPJ não confere: os dígitos verificadores não batem. Confira a digitação.";
}
