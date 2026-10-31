/* Saída de lista nominal do Mailing: CSV que o Excel pt-BR abre direto, ou
   e-mails copiados. Toda saída deixa uma linha no registro de acesso, com o
   que saiu e quantos e-mails. */
import { copiarComAviso } from "../../../components/Toast";
import { gerarCsv } from "../../../lib/csv";
import { registrarMailing } from "../../../store/divulgacao";
import { baixarArquivo } from "../../../utils";

/** Baixa o CSV; `linhas` tem o cabeçalho na primeira. */
export function exportarCsv(nome: string, linhas: (string | number)[][], detalhe: string) {
  baixarArquivo(nome, gerarCsv(linhas), "text/csv");
  registrarMailing("exportou", detalhe + ": " + Math.max(0, linhas.length - 1) + " e-mail(s), CSV " + nome);
}

/** Copia os e-mails separados por vírgula (pra colar no Cco). */
export function copiarEmails(emails: string[], detalhe: string) {
  void copiarComAviso(emails.join(", "), emails.length + " e-mail(s) copiados");
  registrarMailing("exportou", detalhe + ": " + emails.length + " e-mail(s), copiados");
}
