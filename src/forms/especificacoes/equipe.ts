/* Formulário de Pessoa da equipe (quem recebe tarefas e convites de reunião).
   RG e CPF não entram (regra r24): ficam no Drive. O e-mail deve ser o mesmo do
   login na Central: é por ele que o histórico mostra quem alterou o quê. */
import type { EntidadeSpec } from "../tipos";

export const equipe: EntidadeSpec = {
  titulo: "Pessoa da equipe", colecao: "equipe", prefixoId: "eq",
  campos: [
    { chave: "nome", rotulo: "Nome artístico / como é chamado(a)" },
    { chave: "nomeCompleto", rotulo: "Nome completo" },
    { chave: "email", rotulo: "E-mail (o mesmo do login na Central)" },
    { chave: "nascimento", rotulo: "Data de nascimento", tipo: "date" },
    { chave: "funcoes", rotulo: "Funções (vírgula)", tipo: "csv" },
  ],
};
