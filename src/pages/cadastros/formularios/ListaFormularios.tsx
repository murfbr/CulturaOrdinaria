/* Formulários (Cadastros): a fonte da verdade dos campos. Cada formulário diz
   de onde veio — mapeado na plataforma real, campo a campo (Chrome), ou
   reconstruído dos documentos do edital (espelho, regulamento, página) — e
   serve de molde para os projetos. A antiga aba Plataformas mora aqui também. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { excluirFormulario } from "../../../store/mutacoes";
import { abrirDetalhe } from "../../../store/navegacao";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { PLATAFORMAS, nomePlataforma } from "../../../data";
import { nomeCurto } from "../../../lib/nomes";
import type { Formulario } from "../../../types";
import { comparar, url } from "../../../utils";
import { ModalImportarFormulario } from "./ModalImportarFormulario";

export const contarCampos = (f: Formulario) =>
  f.etapas.reduce((n, e) => n + e.blocos.reduce((m, b) => m + b.campos.filter((c) => c.n).length, 0), 0);

export function ListaFormularios() {
  const { painel, formularios } = usarCentral();
  const [vista, setVista] = useState<"formularios" | "plataformas">("formularios");
  const [importando, setImportando] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const todos = Object.values(formularios).sort((a, b) => comparar(a.nome, b.nome));
  const projetosNo = (id: string) => painel.projetos.filter((p) => p.formId === id).length;
  const editaisDe = (f: Formulario) => painel.editais.filter((e) =>
    e.formId === f.id || (e.formIds || []).includes(f.id) || (f.editais || []).includes(e.id));

  const tabela = (lista: Formulario[]) => (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr><th>Formulário</th><th>Edital</th><th>Plataforma</th><th>Etapas</th><th>Campos</th><th>Fonte</th><th>Projetos</th><th /></tr>
        </thead>
        <tbody>
          {lista.map((f) => {
            const eds = editaisDe(f);
            const n = projetosNo(f.id);
            return (
              <tr key={f.id}>
                <td><a className="lnk" onClick={() => abrirDetalhe("formulario", f.id)}>{f.nome}</a></td>
                <td>{eds.length ? eds.map((e, i) => <span key={e.id}>{i > 0 && ", "}<a className="lnk" onClick={() => abrirDetalhe("edital", e.id)}>{nomeCurto(e)}</a></span>) : <span className="muted">—</span>}</td>
                <td>{nomePlataforma(f.plataforma)}</td>
                <td className="num">{f.etapas.length}</td>
                <td className="num">{contarCampos(f)}</td>
                <td className="muted" style={{ fontSize: 12 }}>
                  {f.origem === "chrome" ? "plataforma" : ({ espelho_oficial: "espelho oficial", regulamento: "regulamento", web: "página do edital" } as Record<string, string>)[f.fonteTipo || ""] || "documento"}
                  {f.extraido ? " · " + f.extraido : ""}
                  {f.confianca && <span className={"conf conf-" + f.confianca} style={{ marginLeft: 6 }}>{f.confianca}</span>}
                </td>
                <td className="num">{n || ""}</td>
                <td>
                  {n === 0 && (
                    <button className="lnk-excluir" onClick={() => {
                      if (confirmando !== f.id) { setConfirmando(f.id); return; }
                      excluirFormulario(f.id);
                      setConfirmando(null);
                    }}>{confirmando === f.id ? "confirmar?" : "excluir"}</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const chrome = todos.filter((f) => f.origem !== "documento");
  const documento = todos.filter((f) => f.origem === "documento");

  return (
    <>
      <CabecalhoSecao titulo="Formulários" sub={`fonte da verdade dos campos: ${todos.length} formulário(s), cada um com a origem do mapeamento`}>
        <button className="btn" onClick={() => setImportando(true)}>Importar formulário</button>
      </CabecalhoSecao>

      <div className="pilulas">
        <button className={vista === "formularios" ? "on" : ""} onClick={() => setVista("formularios")}>Formulários</button>
        <button className={vista === "plataformas" ? "on" : ""} onClick={() => setVista("plataformas")}>Plataformas</button>
      </div>

      {vista === "formularios" ? (
        <>
          <div className="grupo-edital">Mapeados na plataforma <span className="muted">· {chrome.length} · campo a campo, com os códigos reais, pelo navegador</span></div>
          {chrome.length ? tabela(chrome) : <p className="muted">Nenhum ainda.</p>}
          <div className="grupo-edital" style={{ marginTop: 22 }}>Mapeados dos documentos <span className="muted">· {documento.length} · reconstruídos do espelho oficial, do regulamento ou da página; sem os códigos da plataforma</span></div>
          {documento.length ? tabela(documento) : <p className="muted">Nenhum ainda. Eles chegam pelo pacote da migração v3 (Gestão → Migração v3).</p>}
          <p className="hint">Formulário novo entra por "Importar formulário" (JSON de etapas, blocos e campos), sem precisar de nova versão do site. Excluir só aparece quando nenhum projeto usa o formulário.</p>
        </>
      ) : (
        <div className="grid g2">
          {PLATAFORMAS.map((p) => {
            const deles = todos.filter((f) => f.plataforma === p.id);
            return (
              <div className="card" key={p.id}>
                <h3>{p.nome}</h3>
                <p className="role">{p.orgao}</p>
                {p.url && <p style={{ margin: "0 0 8px" }}><a className="lnk" href={url(p.url)} target="_blank" rel="noopener noreferrer">{p.url} ↗</a></p>}
                {([["Arquitetura", p.arq], ["Porta de entrada", p.porta], ["Códigos de campo", p.codigos], ["Limites", p.limites], ["Anexos", p.anexos]] as [string, string][])
                  .filter(([, v]) => v).map(([k, v]) => (
                    <div className="row-line" key={k}><span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>{k}</span><span>{v}</span></div>
                  ))}
                {p.armadilhas && <div className="arm-painel"><b>Armadilhas:</b> {p.armadilhas}</div>}
                <div className="foot">
                  {deles.length ? deles.map((f, i) => <span key={f.id}>{i > 0 && " · "}<a className="lnk" onClick={() => abrirDetalhe("formulario", f.id)}>{f.nome}</a></span>) : "nenhum formulário mapeado"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {importando && <ModalImportarFormulario aoFechar={() => setImportando(false)} />}
    </>
  );
}
