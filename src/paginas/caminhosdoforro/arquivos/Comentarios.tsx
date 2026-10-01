/* Comentários de um cartão de arquivo: a lista (mais recente primeiro, com
   remover em dois cliques) e o formulário, no mesmo desenho do histórico de
   contatos do cadastro: data, quem (equipe) e o texto. */
import { useState, type FormEvent } from "react";
import { toast } from "../../../components/Toast";
import { cadastrosDoTipo, dataBr, hojeIso, nomeCadastro } from "../calculo";
import { apagar, gravar, novoId } from "../dados";
import type { Base } from "../tipos";
import { Botao } from "../ui/Botao";
import { BotaoArmado } from "../ui/BotaoArmado";
import { AreaTexto, Campo, Entrada, Selecao } from "../ui/Campo";

export function Comentarios({ base, sobre }: { base: Base; sobre: string }) {
  const lista = Object.values(base.comentarios).filter((c) => c.sobre === sobre)
    .sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")) || (b.em || 0) - (a.em || 0));
  const equipe = cadastrosDoTipo(base, "equipe");
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState(hojeIso());
  const [por, setPor] = useState("");
  const [texto, setTexto] = useState("");

  function comentar(ev: FormEvent) {
    ev.preventDefault();
    const t = texto.trim();
    if (!t) return;
    gravar("comentarios", { id: novoId("comentarios"), sobre, data: data || hojeIso(), por: por || null, texto: t, em: Date.now() });
    setTexto("");
    toast("Comentário registrado.");
  }

  return (
    <div className="cdf:mt-3 cdf:border-t cdf:border-solid cdf:border-linha cdf:pt-3">
      <div className="cdf:flex cdf:items-baseline cdf:gap-2">
        <h4 className="cdf:m-0 cdf:text-sm cdf:font-bold cdf:text-tinta-2">Comentários{lista.length ? " (" + lista.length + ")" : ""}</h4>
        <Botao variante="fraco" mini onClick={() => setAberto(!aberto)}>{aberto ? "Fechar" : lista.length ? "Ver e comentar" : "Comentar"}</Botao>
      </div>
      {aberto && (
        <>
          {lista.length > 0 && (
            <ul className="cdf:m-0 cdf:mb-3 cdf:mt-2 cdf:flex cdf:list-none cdf:flex-col cdf:gap-2 cdf:p-0">
              {lista.map((c) => (
                <li key={c.id} className="cdf:rounded-[10px] cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie-2 cdf:px-3 cdf:py-2">
                  <div className="cdf:flex cdf:items-baseline cdf:gap-2.5 cdf:text-[13px] cdf:text-fraco">
                    <time>{dataBr(c.data)}</time>
                    <b className="cdf:text-tinta">{c.por ? nomeCadastro(base, c.por) : "Sem autor"}</b>
                    <BotaoArmado variante="fraco" mini confirmar="Confirmar" className="cdf:ml-auto" onClick={() => { apagar("comentarios", c.id); toast("Comentário removido."); }}>Remover</BotaoArmado>
                  </div>
                  <p className="cdf:m-0 cdf:mt-0.5 cdf:whitespace-pre-line cdf:text-sm">{c.texto}</p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={comentar} className="cdf:mt-2 cdf:grid cdf:grid-cols-1 cdf:items-end cdf:gap-2 cdf:md:grid-cols-[150px_1fr]">
            <Campo rotulo="Data"><Entrada type="date" value={data} onChange={(e) => setData(e.target.value)} /></Campo>
            <Campo rotulo="Quem">
              <Selecao value={por} onChange={(e) => setPor(e.target.value)}>
                <option value="">Escolha</option>
                {equipe.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </Selecao>
            </Campo>
            <Campo rotulo="Comentário" className="cdf:md:col-span-2"><AreaTexto rows={2} required value={texto} onChange={(e) => setTexto(e.target.value)} /></Campo>
            <div><Botao type="submit">Registrar comentário</Botao></div>
          </form>
        </>
      )}
    </div>
  );
}
