/* Aba Histórico: quem mudou o quê num registro, lido do log de alterações
   (coleção `log_alteracoes`, gravada desde 27/09/2026, cada linha vale 90 dias).
   Recebe os ids do registro e dos que andam com ele (o projeto e as respostas
   do formulário; o artista e a ficha de contexto dele, que tem o mesmo id). */
import { useEffect, useState } from "react";
import { Banco, type LinhaLog } from "../services/banco";
import { usarCentral } from "../store/central";
import { rotuloColecao } from "./layout/ModalGravacoes";

const ACAO: Record<LinhaLog["acao"], string> = { novo: "criou", edicao: "editou", exclusao: "excluiu" };

/** Nomes legíveis dos campos que mais aparecem. O resto aparece como está no banco. */
const CAMPO: Record<string, string> = {
  status: "status", nome: "nome", proponente: "proponente", proponenteId: "proponente (cadastro)",
  valores: "respostas", notas: "notas das respostas", anexos: "anexos", interno: "anotações internas",
  docs: "documentos", producao: "produção", equipeIds: "equipe", respId: "responsável",
  artistaIds: "artistas", editalId: "edital", formId: "formulário", arquivado: "arquivamento",
  historico: "histórico de status", valorPedido: "valor pedido", valorAprovado: "valor aprovado", valorCaptado: "valor captado", inscricao: "nº de inscrição",
  det: "ficha do artista", alertas: "alertas", lacunas: "lacunas", prazo: "prazo", prazoIso: "prazo",
  vocabulario: "vocabulário", usados: "já foi dito", posicionamento: "posicionamento", argumentos: "argumentos",
};

function dataHora(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function Historico({ ids }: { ids: string[] }) {
  const { painel } = usarCentral();
  const [linhas, setLinhas] = useState<LinhaLog[] | null>(null);
  const [erro, setErro] = useState("");
  const chave = ids.filter(Boolean).join("|");

  useEffect(() => {
    let vivo = true;
    setLinhas(null);
    setErro("");
    Banco.historico(chave.split("|"))
      .then((l) => { if (vivo) setLinhas(l); })
      .catch((e) => { if (vivo) setErro(String((e as Error)?.message || e)); });
    return () => { vivo = false; };
  }, [chave]);

  const quem = (email: string) => {
    if (!email) return "alguém sem login";
    const p = painel.equipe.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
    return p ? p.nome : email;
  };

  if (Banco.modo === "local") {
    return <div className="vazio-msg">O histórico só existe no site online: no modo local nada é registrado.</div>;
  }

  return (
    <div className="panel">
      <h4>Histórico de alterações</h4>
      <p className="hint" style={{ marginTop: 0 }}>
        Registrado desde 27/09/2026; cada linha fica 90 dias. Mostra quem estava logado e quais campos mudaram
        (o conteúdo antigo fica nos backups do Drive).
      </p>
      {erro && <p className="aviso-linha">⚠ Não deu para ler o histórico agora ({erro}).</p>}
      {!erro && linhas === null && <p className="muted">carregando…</p>}
      {linhas && !linhas.length && <p className="muted">Nenhuma alteração registrada ainda.</p>}
      {linhas && linhas.length > 0 && (
        <table className="tab-historico">
          <thead><tr><th>Quando</th><th>Quem</th><th>O quê</th></tr></thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id}>
                <td className="nowrap">{dataHora(l.quando)}</td>
                <td>{quem(l.quem)}</td>
                <td>
                  {ACAO[l.acao] || l.acao} <span className="muted">{rotuloColecao(l.colecao).toLowerCase()}</span>
                  {l.campos.length > 0 && <span>: {l.campos.map((c) => CAMPO[c] || c).join(", ")}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
