/* Migração v3: converte o banco do formato antigo (projeto × edital =
   candidatura) para o novo (cada projeto é uma candidatura) e aplica o pacote
   de enriquecimento (editais do Mapa, formulários, pendências dos artistas,
   fichas). Em quatro passos, com backup obrigatório e prévia antes de gravar.
   Serve também para aplicar um pacote de enriquecimento depois da migração. */
import { useState, type ChangeEvent } from "react";
import { usarCentral } from "../../store/central";
import { exportarTudo } from "../../store/importarExportar";
import { aplicarMigracao, planejarMigracao } from "../../store/migracao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { toast } from "../../components/Toast";
import type { DadosV3, Enriquecimento, RelatorioMigracao } from "../../lib/migracao/v3";

export function Migracao() {
  const { legado, painel } = usarCentral();
  const [backupFeito, setBackupFeito] = useState(false);
  const [enr, setEnr] = useState<Enriquecimento | null>(null);
  const [erro, setErro] = useState("");
  const [plano, setPlano] = useState<{ dados: DadosV3; relatorio: RelatorioMigracao } | null>(null);
  const [feito, setFeito] = useState<RelatorioMigracao | null>(null);
  const pendente = legado.candidaturas.length > 0 || legado.projetosV2 > 0;

  function lerPacote(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro(""); setPlano(null);
    arquivo.text().then((t) => {
      try {
        const j = JSON.parse(t);
        if (j.tipo !== "central-enriquecimento") throw new Error("Este arquivo não é um pacote de enriquecimento da Central.");
        setEnr(j as Enriquecimento);
      } catch (x) { setErro((x as Error).message); }
    });
  }

  function migrar() {
    if (!plano) return;
    const n = aplicarMigracao(plano.dados, plano.relatorio);
    setFeito(plano.relatorio);
    setPlano(null);
    toast(`Migração gravada: ${n} documento(s)`);
  }

  const contagem = (d: DadosV3) => [
    [d.painel.projetos.length, "projetos"], [d.painel.editais.length, "editais"],
    [Object.keys(d.formularios).length, "formulários no pacote"], [d.painel.artistas.length, "artistas"],
    [Object.keys(d.contexto.fichas).length, "fichas de contexto"], [Object.keys(d.contexto.regras).length, "regras"],
    [d.painel.tarefas.length, "tarefas"],
  ] as [number, string][];

  return (
    <>
      <CabecalhoSecao titulo="Migração v3" sub="do modelo com candidaturas para o modelo em que cada projeto é uma candidatura" />

      <div className="panel">
        <h4>Situação do banco</h4>
        {pendente ? (
          <p style={{ margin: 0 }}>
            Ainda há dados no formato antigo: <b>{legado.candidaturas.length}</b> candidatura(s) e{" "}
            <b>{legado.projetosV2}</b> projeto(s) sem status. Hoje são {painel.projetos.length} projeto(s) no banco.
          </p>
        ) : (
          <p style={{ margin: 0 }}>✓ Nada no formato antigo. Esta tela ainda serve para aplicar um pacote de enriquecimento.</p>
        )}
      </div>

      <div className="panel">
        <h4>1. Backup completo <span className="act">{backupFeito && <span className="badge st-ok">baixado</span>}</span></h4>
        <p className="hint" style={{ marginTop: 0 }}>Baixa o pacote .json com tudo o que está no banco agora. É o caminho de volta, se algo sair errado.</p>
        <button className="btn" onClick={() => { exportarTudo(); setBackupFeito(true); }}>⤓ Baixar backup</button>
      </div>

      <div className="panel">
        <h4>2. Pacote de enriquecimento (opcional) <span className="act">{enr && <span className="badge st-ok">carregado</span>}</span></h4>
        <p className="hint" style={{ marginTop: 0 }}>
          O arquivo <span className="mono-mini">central-v3-enriquecimento.json</span> traz os editais do Mapa, os formulários
          mapeados, as pendências e perguntas dos artistas, as fichas novas e os registros que só existiam no artefato.
          Sem ele, a migração só converte candidaturas em projetos.
        </p>
        <label className="btn ghost" style={{ display: "inline-block" }}>
          Escolher arquivo…
          <input type="file" accept="application/json,.json" hidden onChange={lerPacote} />
        </label>
        {enr && <p className="hint">{enr.descricao || "Pacote"} · gerado em {enr.gerado}</p>}
        {erro && <p className="erro-import">{erro}</p>}
      </div>

      <div className="panel">
        <h4>3. Prévia</h4>
        <button className="btn" disabled={!backupFeito} onClick={() => { setFeito(null); setPlano(planejarMigracao(enr)); }}>
          Ver o que vai mudar
        </button>
        {!backupFeito && <span className="hint" style={{ marginLeft: 10 }}>baixe o backup antes</span>}
        {plano && (
          <>
            <div className="kpis" style={{ marginTop: 12 }}>
              {contagem(plano.dados).map(([n, r]) => <div className="kpi" key={r}><div className="n">{n}</div><div className="l">{r}</div></div>)}
            </div>
            <ul className="import-lista">{plano.relatorio.feito.map((l, i) => <li key={i}>{l}</li>)}</ul>
            {plano.relatorio.avisos.length > 0 && (
              <>
                <p className="hint"><b>Avisos</b> (não aplicados, precisam de olho):</p>
                <ul className="import-lista">{plano.relatorio.avisos.map((l, i) => <li key={i}>⚠ {l}</li>)}</ul>
              </>
            )}
          </>
        )}
      </div>

      <div className="panel">
        <h4>4. Migrar</h4>
        <p className="hint" style={{ marginTop: 0 }}>
          Grava a prévia no banco. Os projetos e candidaturas antigos (e as fichas que mudam de id) vão antes para a
          coleção <span className="mono-mini">backup_v2</span>. Nada é apagado sem cópia.
        </p>
        <button className="btn" disabled={!plano} onClick={migrar}>Migrar agora</button>
        {feito && <p className="hint">✓ Migração gravada. {feito.feito.length} ação(ões), {feito.avisos.length} aviso(s). Confira Projetos e Cadastros.</p>}
      </div>
    </>
  );
}
