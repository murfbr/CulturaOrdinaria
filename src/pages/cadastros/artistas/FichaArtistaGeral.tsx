/* Sub-aba Geral da ficha do artista: pendências e perguntas em aberto (com a
   linha para adicionar e o "ver resolvidas"), correções propostas pela
   pesquisa, dados gerais do acervo e o bloco "Sobre" (bio, tags,
   formalização, liga). */
import type { Dispatch, SetStateAction } from "react";
import { BlocoEditavel } from "../../../components/BlocoEditavel";
import { Botao } from "../../../components/ui/Botao";
import { CaixaMarcar, ESTILO_CONTROLE, Entrada, Marcacao } from "../../../components/ui/Campo";
import { Chip } from "../../../components/ui/Chip";
import { Dado, Dados } from "../../../components/ui/Dados";
import { Dica } from "../../../components/ui/Dica";
import { Grade } from "../../../components/ui/Grade";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_APAGADO } from "../../../components/ui/estilos";
import type { PendenciaArtista } from "../../../types";
import { cx } from "../../../utils/classes";
import { VAZIO_ACERVO, linhasDe, partes, type PropsAcervo } from "./FichaArtistaBase";

export type NovaPendencia = { texto: string; tipo: PendenciaArtista["tipo"] };

interface Props extends PropsAcervo {
  novaPend: NovaPendencia;
  setNovaPend: Dispatch<SetStateAction<NovaPendencia>>;
  verResolvidas: boolean;
  setVerResolvidas: (v: boolean) => void;
}

export function FichaArtistaGeral({ a, d, alterarDet, novaPend, setNovaPend, verResolvidas, setVerResolvidas }: Props) {
  const propostas = (d.propostas || []).map((x, i) => ({ ...x, i })).filter((x) => x.status === "aberta");

  function adicionarPendencia() {
    const texto = novaPend.texto.trim();
    if (!texto) return;
    alterarDet((det) => { det.pendencias = [...(det.pendencias || []), { texto, tipo: novaPend.tipo, status: "aberta" }]; });
    setNovaPend({ ...novaPend, texto: "" });
  }

  /** Lista de pendências de um tipo (pendência ou pergunta). */
  const listaPendencias = (tipo: PendenciaArtista["tipo"]) => {
    const todas = (d.pendencias || []).map((x, i) => ({ ...x, i })).filter((x) => x.tipo === tipo);
    const visiveis = todas.filter((x) => verResolvidas || x.status !== "resolvida");
    if (!visiveis.length) return <Vazio emLinha className="mt-1">{todas.length ? "tudo resolvido" : "nada em aberto"}</Vazio>;
    return visiveis.map((x) => {
      const resolvida = x.status === "resolvida";
      return (
        <Linha topo compacta key={x.i}
          direita={<Botao variante="quieto" tamanho="mini" title="remover" onClick={() => alterarDet((det) => { det.pendencias!.splice(x.i, 1); })}>×</Botao>}>
          <div className="flex items-start gap-2.5">
            <CaixaMarcar marcado={resolvida} title={resolvida ? "reabrir" : "marcar como resolvida"}
              aoMudar={() => alterarDet((det) => { det.pendencias![x.i].status = resolvida ? "aberta" : "resolvida"; })} />
            <div className="min-w-0 flex-1">
              <div className={cx(resolvida && "text-faint line-through")}>{x.texto}</div>
              {(x.resposta != null || resolvida) && (
                <Entrada className="mt-1" value={x.resposta || ""} placeholder={tipo === "perguntar" ? "resposta do artista" : "como foi resolvido"}
                  onChange={(e) => alterarDet((det) => { det.pendencias![x.i].resposta = e.target.value; }, false)} />
              )}
              {x.resposta == null && !resolvida && (
                <Botao variante="link" tamanho="mini" className="mt-1" onClick={() => alterarDet((det) => { det.pendencias![x.i].resposta = ""; })}>
                  + {tipo === "perguntar" ? "resposta" : "anotar"}
                </Botao>
              )}
              {x.fonte && <div className={cx("mt-0.5", ESTILO_APAGADO)}>{x.fonte}</div>}
            </div>
          </div>
        </Linha>
      );
    });
  };

  return (
    <>
      <Grade colunas={2}>
        <Painel titulo="Pendências" sub="o que o coletivo precisa resolver">{listaPendencias("pendencia")}</Painel>
        <Painel titulo="Perguntar" sub="só o artista responde">{listaPendencias("perguntar")}</Painel>
      </Grade>
      <div className="-mt-1 mb-3.5 flex flex-wrap items-center gap-2">
        <select className={cx("flex-none", ESTILO_CONTROLE)} value={novaPend.tipo}
          onChange={(e) => setNovaPend({ ...novaPend, tipo: e.target.value as PendenciaArtista["tipo"] })}>
          <option value="pendencia">pendência</option>
          <option value="perguntar">pergunta</option>
        </select>
        <input className={cx("min-w-0 flex-1", ESTILO_CONTROLE)} value={novaPend.texto} placeholder="o que falta resolver ou perguntar"
          onChange={(e) => setNovaPend({ ...novaPend, texto: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter") adicionarPendencia(); }} />
        <Botao tamanho="pequeno" onClick={adicionarPendencia}>+ adicionar</Botao>
        <Marcacao marcado={verResolvidas} aoMudar={setVerResolvidas}>ver resolvidas</Marcacao>
      </div>

      {propostas.length > 0 && (
        <Painel titulo="Correções propostas pela pesquisa" sub="confirme antes de aplicar no cadastro">
          <Tabela simples>
            <thead><tr><Th>Campo</Th><Th>Hoje</Th><Th>Passa a ser</Th><Th>Por quê</Th><Th /></tr></thead>
            <tbody>
              {propostas.map((x) => (
                <tr key={x.i}>
                  <Td><b>{x.campo}</b></Td>
                  <Td className="text-muted">{x.de}</Td>
                  <Td>{x.para}</Td>
                  <Td className={ESTILO_APAGADO}>{x.motivo}</Td>
                  <Td className="whitespace-nowrap">
                    <span className="flex gap-1.5">
                      <Botao variante="fantasma" tamanho="pequeno" title="marca como aplicada (edite o campo no cadastro)"
                        onClick={() => alterarDet((det) => { det.propostas![x.i].status = "aplicada"; })}>aplicada</Botao>
                      <Botao variante="fantasma" tamanho="pequeno" onClick={() => alterarDet((det) => { det.propostas![x.i].status = "descartada"; })}>descartar</Botao>
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </Painel>
      )}

      <BlocoEditavel titulo="Dados gerais" dica='por linha: rótulo | valor (ex.: "Local | Pedra do Leme")'
        valor={Object.entries(d.geral || {}).map(([k, v]) => k + " | " + v).join("\n")}
        aoSalvar={(t) => alterarDet((det) => {
          det.geral = Object.fromEntries(linhasDe(t).map((l) => {
            const p = partes(l);
            return [p[0] || "—", p.slice(1).join(" | ")];
          }));
        })}>
        {Object.keys(d.geral || {}).length ? (
          <Dados>{Object.entries(d.geral || {}).map(([k, v]) => <Dado key={k} rotulo={k} forte>{v}</Dado>)}</Dados>
        ) : VAZIO_ACERVO}
      </BlocoEditavel>

      <Painel titulo="Sobre">
        <p className="m-0 max-w-texto">{a.bio}</p>
        <div className="mt-2">{(a.tags || []).map((t) => <Chip key={t}>{t}</Chip>)}</div>
        <Dados className="mt-2">
          <Dado rotulo="Formalização" forte>{a.formalizacao || "—"}{a.cnpj ? " · " + a.cnpj : ""}</Dado>
          <Dado rotulo="Liga" forte>{a.liga || "—"}</Dado>
          {a.enq && <Dado rotulo="Enquadramento (antigo)"><span className="text-muted">{a.enq}</span></Dado>}
        </Dados>
        <Dica className="mt-2.5">Bio, tags, formalização e liga são do cadastro: botão Editar lá em cima. Quem assina cada inscrição fica no projeto (proponente).</Dica>
      </Painel>
    </>
  );
}
