/* Histórico de contato da empresa: entradas datadas, com quem registrou
   (o login, automático) e o que aconteceu. A mais recente em cima. */
import { useState } from "react";
import { emailSessao } from "../../../services/sessao";
import { BotaoExcluir } from "../../../components/BotaoExcluir";
import { Botao } from "../../../components/ui/Botao";
import { AreaTexto, Entrada } from "../../../components/ui/Campo";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Vazio } from "../../../components/ui/Vazio";
import { hojeIso } from "../../../lib/prazos";
import type { Empresa } from "../../../types";
import { uid } from "../../../utils";
import { dataBr, quemFala } from "../apoio";

interface Props { empresa: Empresa; alterar: (mudar: (e: Empresa) => void) => void }

export function HistoricoContato({ empresa, alterar }: Props) {
  const [data, setData] = useState(hojeIso());
  const [texto, setTexto] = useState("");

  function registrar() {
    const t = texto.trim();
    if (!t) return;
    alterar((e) => { e.historico.push({ id: uid("h"), data: data || hojeIso(), quem: emailSessao(), texto: t }); });
    setTexto("");
  }

  const entradas = [...empresa.historico].sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));

  return (
    <Painel titulo="Histórico de contato" sub="o que aconteceu em cada conversa">
      <div className="mb-3 flex flex-col gap-2 border-b border-line pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Entrada type="date" className="w-auto" value={data} onChange={(e) => setData(e.target.value)} aria-label="Data do contato" />
          <Botao variante="fantasma" tamanho="pequeno" onClick={registrar} disabled={!texto.trim()}>Registrar</Botao>
        </div>
        <AreaTexto rows={2} value={texto} placeholder="o que aconteceu: ligação, reunião, e-mail, o que ficou combinado…" onChange={(e) => setTexto(e.target.value)} />
      </div>
      {entradas.map((h) => (
        <Linha key={h.id} topo direita={<BotaoExcluir aoConfirmar={() => alterar((e) => { e.historico = e.historico.filter((x) => x.id !== h.id); })} />}>
          <div className="text-xs text-muted"><b className="tabular-nums text-ink">{dataBr(h.data)}</b> · {quemFala(h.quem)}</div>
          <div className="whitespace-pre-wrap">{h.texto}</div>
        </Linha>
      ))}
      {!entradas.length && <Vazio emLinha>Nenhum contato registrado.</Vazio>}
    </Painel>
  );
}
