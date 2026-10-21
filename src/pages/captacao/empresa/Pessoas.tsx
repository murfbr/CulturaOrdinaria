/* Pessoas de contato dentro da empresa: nome, cargo, telefone e e-mail,
   editáveis na própria linha (grava ao sair do campo); incluir e tirar. */
import { useState } from "react";
import { Botao } from "../../../components/ui/Botao";
import { ESTILO_CONTROLE } from "../../../components/ui/Campo";
import { Painel } from "../../../components/ui/Painel";
import { Vazio } from "../../../components/ui/Vazio";
import type { Empresa, PessoaContato } from "../../../types";
import { uid } from "../../../utils";

interface Props { empresa: Empresa; alterar: (mudar: (e: Empresa) => void) => void }

const CAMPOS: [keyof Omit<PessoaContato, "id">, string][] = [["nome", "Nome"], ["cargo", "Cargo"], ["telefone", "Telefone"], ["email", "E-mail"]];
const VAZIA = { nome: "", cargo: "", telefone: "", email: "" };

export function Pessoas({ empresa, alterar }: Props) {
  const [nova, setNova] = useState(VAZIA);

  function incluir() {
    if (!nova.nome.trim()) return;
    alterar((e) => { e.pessoas.push({ id: uid("pe"), ...nova, nome: nova.nome.trim() }); });
    setNova(VAZIA);
  }

  const campo = "min-w-0 " + ESTILO_CONTROLE + " py-1 text-sm";

  return (
    <Painel titulo="Pessoas de contato" sub="quem a gente fala dentro da empresa">
      <div className="flex flex-col gap-2">
        {empresa.pessoas.map((p) => (
          <div key={p.id} className="grid grid-cols-2 gap-1.5 md:grid-cols-[1.3fr_1fr_1fr_1.2fr_auto]">
            {CAMPOS.map(([k, rotulo]) => (
              <input
                key={k} className={campo} defaultValue={p[k]} placeholder={rotulo} aria-label={rotulo}
                onBlur={(e) => { if (e.target.value !== p[k]) alterar((x) => { const q = x.pessoas.find((y) => y.id === p.id); if (q) q[k] = e.target.value; }); }}
              />
            ))}
            <Botao variante="quieto" tamanho="mini" className="self-center" onClick={() => alterar((x) => { x.pessoas = x.pessoas.filter((y) => y.id !== p.id); })}>tirar</Botao>
          </div>
        ))}
        {!empresa.pessoas.length && <Vazio emLinha>Nenhuma pessoa cadastrada.</Vazio>}
        <div className="grid grid-cols-2 gap-1.5 border-t border-line pt-2 md:grid-cols-[1.3fr_1fr_1fr_1.2fr_auto]">
          {CAMPOS.map(([k, rotulo]) => (
            <input
              key={k} className={campo} value={nova[k]} placeholder={rotulo} aria-label={"Nova pessoa: " + rotulo}
              onChange={(e) => setNova((v) => ({ ...v, [k]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") incluir(); }}
            />
          ))}
          <Botao variante="fantasma" tamanho="pequeno" onClick={incluir} disabled={!nova.nome.trim()}>Incluir</Botao>
        </div>
      </div>
    </Painel>
  );
}
