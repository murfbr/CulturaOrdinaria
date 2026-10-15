/* Aba Pessoas de Cadastros: três sub-abas (Elenco / Colaboradores, Equipe,
   Contatos externos), cada uma com a tabela que já existia quando Pessoas
   era um ambiente próprio (até 15/10/2026). A sub-aba escolhida fica no
   localStorage para reabrir onde parou; a URL não a carrega. */
import { useState } from "react";
import { SubAbas } from "../../../components/ui/CabecalhoFicha";
import { Elenco } from "./Elenco";
import { Equipe } from "./Equipe";
import { Contatos } from "./Contatos";

const SUB_ABAS = [
  { id: "elenco", rotulo: "Elenco / Colaboradores" },
  { id: "equipe", rotulo: "Equipe" },
  { id: "contatos", rotulo: "Contatos externos" },
];

const CHAVE = "central-pessoas-aba";

function lembrada(): string {
  try {
    const v = localStorage.getItem(CHAVE) || "";
    return SUB_ABAS.some((a) => a.id === v) ? v : "elenco";
  } catch { return "elenco"; }
}

export function Pessoas() {
  const [aba, setAba] = useState(lembrada);
  const trocar = (id: string) => {
    setAba(id);
    try { localStorage.setItem(CHAVE, id); } catch { /* sem localStorage: só não lembra */ }
  };

  return (
    <>
      <SubAbas abas={SUB_ABAS} ativa={aba} aoTrocar={trocar} className="mb-4 border-b border-line" />
      {aba === "equipe" ? <Equipe /> : aba === "contatos" ? <Contatos /> : <Elenco />}
    </>
  );
}
