/* Migração v3: converte o banco do formato antigo (projeto × edital =
   candidatura) para o novo (cada projeto é uma candidatura) e aplica o pacote
   de enriquecimento (editais do Mapa, formulários, pendências dos artistas,
   fichas). Em quatro passos, com backup obrigatório e prévia antes de gravar.
   Serve também para aplicar um pacote de enriquecimento depois da migração. */
import { useRef, useState, type ChangeEvent } from "react";
import { usarCentral } from "../../store/central";
import { exportarTudo } from "../../store/importarExportar";
import { aplicarMigracao, planejarMigracao } from "../../store/migracao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { toast } from "../../components/Toast";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Dica } from "../../components/ui/Dica";
import { GradeKpis, Kpi } from "../../components/ui/Kpi";
import { Painel } from "../../components/ui/Painel";
import { ESTILO_MONO } from "../../components/ui/estilos";
import type { DadosV3, Enriquecimento, RelatorioMigracao } from "../../lib/migracao/v3";

/** Lista do relatório da prévia (o que vai mudar, avisos). */
function ListaRelatorio({ linhas, prefixo = "" }: { linhas: string[]; prefixo?: string }) {
  return (
    <ul className="mb-3 mt-1.5 list-disc pl-[18px] text-sm text-muted">
      {linhas.map((l, i) => <li key={i} className="my-0.5">{prefixo}{l}</li>)}
    </ul>
  );
}

export function Migracao() {
  const { legado, painel } = usarCentral();
  const [backupFeito, setBackupFeito] = useState(false);
  const [enr, setEnr] = useState<Enriquecimento | null>(null);
  const [erro, setErro] = useState("");
  const [plano, setPlano] = useState<{ dados: DadosV3; relatorio: RelatorioMigracao } | null>(null);
  const [feito, setFeito] = useState<RelatorioMigracao | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
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

      <Painel titulo="Situação do banco">
        {pendente ? (
          <p className="m-0">
            Ainda há dados no formato antigo: <b>{legado.candidaturas.length}</b> candidatura(s) e{" "}
            <b>{legado.projetosV2}</b> projeto(s) sem status. Hoje são {painel.projetos.length} projeto(s) no banco.
          </p>
        ) : (
          <p className="m-0">✓ Nada no formato antigo. Esta tela ainda serve para aplicar um pacote de enriquecimento.</p>
        )}
      </Painel>

      <Painel titulo="1. Backup completo" acoes={backupFeito ? <Badge tom="ok">baixado</Badge> : undefined}>
        <Dica className="mb-3">Baixa o pacote .json com tudo o que está no banco agora. É o caminho de volta, se algo sair errado.</Dica>
        <Botao onClick={() => { exportarTudo(); setBackupFeito(true); }}>⤓ Baixar backup</Botao>
      </Painel>

      <Painel titulo="2. Pacote de enriquecimento (opcional)" acoes={enr ? <Badge tom="ok">carregado</Badge> : undefined}>
        <Dica className="mb-3">
          O arquivo <span className={ESTILO_MONO}>central-v3-enriquecimento.json</span> traz os editais do Mapa, os formulários
          mapeados, as pendências e perguntas dos artistas, as fichas novas e os registros que só existiam no artefato.
          Sem ele, a migração só converte candidaturas em projetos.
        </Dica>
        <Botao variante="fantasma" onClick={() => arquivoRef.current?.click()}>Escolher arquivo…</Botao>
        <input ref={arquivoRef} type="file" accept="application/json,.json" hidden onChange={lerPacote} />
        {enr && <Dica className="mt-2">{enr.descricao || "Pacote"} · gerado em {enr.gerado}</Dica>}
        {erro && <p className="m-0 mt-2 text-sm font-semibold text-no">{erro}</p>}
      </Painel>

      <Painel titulo="3. Prévia">
        <div className="flex flex-wrap items-center gap-2.5">
          <Botao disabled={!backupFeito} onClick={() => { setFeito(null); setPlano(planejarMigracao(enr)); }}>
            Ver o que vai mudar
          </Botao>
          {!backupFeito && <Dica>baixe o backup antes</Dica>}
        </div>
        {plano && (
          <>
            <GradeKpis className="mt-3">
              {contagem(plano.dados).map(([n, r]) => <Kpi key={r} n={n} rotulo={r} />)}
            </GradeKpis>
            <ListaRelatorio linhas={plano.relatorio.feito} />
            {plano.relatorio.avisos.length > 0 && (
              <>
                <Dica><b>Avisos</b> (não aplicados, precisam de olho):</Dica>
                <ListaRelatorio linhas={plano.relatorio.avisos} prefixo="⚠ " />
              </>
            )}
          </>
        )}
      </Painel>

      <Painel titulo="4. Migrar">
        <Dica className="mb-3">
          Grava a prévia no banco. Os projetos e candidaturas antigos (e as fichas que mudam de id) vão antes para a
          coleção <span className={ESTILO_MONO}>backup_v2</span>. Nada é apagado sem cópia.
        </Dica>
        <Botao disabled={!plano} onClick={migrar}>Migrar agora</Botao>
        {feito && <Dica className="mt-2">✓ Migração gravada. {feito.feito.length} ação(ões), {feito.avisos.length} aviso(s). Confira Projetos e Cadastros.</Dica>}
      </Painel>
    </>
  );
}
