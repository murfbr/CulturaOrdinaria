/* Aba Geral do projeto, parte 2: o que é só interno — anotações gerais, os
   agentes envolvidos e o cronograma interno de marcos. */
import { Botao } from "../../components/ui/Botao";
import { AreaTexto, CaixaMarcar, Entrada, Selecao } from "../../components/ui/Campo";
import { Painel } from "../../components/ui/Painel";
import type { Projeto } from "../../types";
import { cx } from "../../utils/classes";
import { alterarProjeto, BotaoRemover, ESTILO_LINHA_EDITAVEL } from "./GeralProjetoComum";

/** "hoje", "em 3 d" ou "2 d atrás" para a data de um marco. */
function diasAte(s: string): string {
  if (!s) return "";
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const d = Math.round((new Date(s + "T00:00:00").getTime() - hoje.getTime()) / 864e5);
  return d === 0 ? "hoje" : d < 0 ? `${-d} d atrás` : `em ${d} d`;
}

export function GeralProjetoInterno({ p }: { p: Projeto }) {
  const alterar = (fn: (c: Projeto) => void, rapido = true) => alterarProjeto(p, fn, rapido);
  return (
    <>
      <Painel titulo="Anotações gerais" sub={p.interno.anot.length + " / 3000"}>
        <AreaTexto className="min-h-[110px]" maxLength={3000} value={p.interno.anot}
          placeholder="ideias e pontos sobre o projeto, sem classificar"
          onChange={(e) => alterar((c) => { c.interno.anot = e.target.value; }, false)} />
      </Painel>

      <Painel titulo="Agentes envolvidos">
        <div>
          {p.interno.agentes.map((a, k) => (
            <div className={cx(ESTILO_LINHA_EDITAVEL, "md:grid-cols-[2fr_110px_150px_2fr_28px]")} key={k}>
              <Entrada value={a.nome} placeholder="nome"
                onChange={(e) => alterar((c) => { c.interno.agentes[k].nome = e.target.value; }, false)} />
              <Selecao value={a.tipo} onChange={(e) => alterar((c) => { c.interno.agentes[k].tipo = e.target.value; })}>
                {["pessoa", "empresa", "coletivo"].map((t) => <option key={t}>{t}</option>)}
              </Selecao>
              <Selecao value={a.vinc} onChange={(e) => alterar((c) => { c.interno.agentes[k].vinc = e.target.value; })}>
                {["do coletivo", "do projeto cultural", "externo"].map((t) => <option key={t}>{t}</option>)}
              </Selecao>
              <Entrada value={a.papel} placeholder="papel neste projeto"
                onChange={(e) => alterar((c) => { c.interno.agentes[k].papel = e.target.value; }, false)} />
              <BotaoRemover onClick={() => alterar((c) => { c.interno.agentes.splice(k, 1); })} />
            </div>
          ))}
        </div>
        <Botao variante="fantasma" tamanho="pequeno" className="mt-2"
          onClick={() => alterar((c) => { c.interno.agentes.push({ nome: "", tipo: "pessoa", vinc: "do coletivo", papel: "" }); })}>+ agente</Botao>
      </Painel>

      <Painel titulo="Cronograma interno" sub={`${p.interno.crono.filter((c) => c.ok).length} de ${p.interno.crono.length} feitos`}>
        <div>
          {p.interno.crono.map((marco, k) => (
            <div className={cx(ESTILO_LINHA_EDITAVEL, "md:grid-cols-[20px_130px_1fr_auto_28px]")} key={k}>
              <CaixaMarcar marcado={marco.ok} title="marcar feito"
                aoMudar={() => alterar((c) => { c.interno.crono[k].ok = !c.interno.crono[k].ok; })} />
              <Entrada type="date" value={marco.data || ""} onChange={(e) => alterar((c) => { c.interno.crono[k].data = e.target.value; })} />
              <Entrada className={marco.ok ? "opacity-60" : undefined} value={marco.m} placeholder="o que fechar até essa data"
                onChange={(e) => alterar((c) => { c.interno.crono[k].m = e.target.value; }, false)} />
              <span className="whitespace-nowrap text-xs text-faint tabular-nums">{marco.ok ? "feito" : diasAte(marco.data)}</span>
              <BotaoRemover onClick={() => alterar((c) => { c.interno.crono.splice(k, 1); })} />
            </div>
          ))}
        </div>
        <Botao variante="fantasma" tamanho="pequeno" className="mt-2"
          onClick={() => alterar((c) => { c.interno.crono.push({ data: "", m: "", ok: false }); })}>+ marco</Botao>
      </Painel>
    </>
  );
}
