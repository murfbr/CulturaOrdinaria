/* Formulários (Cadastros): a fonte da verdade dos campos. Cada formulário diz
   de onde veio — mapeado na plataforma real, campo a campo (Chrome), ou
   reconstruído dos documentos do edital (espelho, regulamento, página) — e
   serve de molde para os projetos. Uma tabela por origem; a linha abre a
   ficha. A antiga aba Plataformas mora aqui também. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { excluirFormulario } from "../../../store/mutacoes";
import { abrirDetalhe } from "../../../store/navegacao";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { CartaoLista } from "../../../components/ui/CartaoLista";
import { Dado, Dados } from "../../../components/ui/Dados";
import { Dica } from "../../../components/ui/Dica";
import { Grade } from "../../../components/ui/Grade";
import { Pilulas } from "../../../components/ui/Pilulas";
import { Tabela, Td, Th, Tr } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_AUXILIAR, ESTILO_LINK } from "../../../components/ui/estilos";
import { PLATAFORMAS, nomePlataforma } from "../../../data";
import { nomeCurto } from "../../../lib/nomes";
import type { Formulario } from "../../../types";
import { comparar, url } from "../../../utils";
import { ModalImportarFormulario } from "./ModalImportarFormulario";

export const contarCampos = (f: Formulario) =>
  f.etapas.reduce((n, e) => n + e.blocos.reduce((m, b) => m + b.campos.filter((c) => c.n).length, 0), 0);

/** Confiança do levantamento (alta / media / baixa) como etiqueta pequena.
    Serve aqui e na lista de editais; candidata a bloco se as fichas precisarem. */
const TOM_CONFIANCA: Record<string, string> = { alta: "ok", media: "aviso", baixa: "erro" };
export function BadgeConfianca({ nivel, className }: { nivel: string; className?: string }) {
  return (
    <Badge mini caixaAlta tom={TOM_CONFIANCA[nivel] || "neutro"} title="confiança do levantamento" className={className}>{nivel}</Badge>
  );
}

const ROTULO_FONTE: Record<string, string> = { espelho_oficial: "espelho oficial", regulamento: "regulamento", web: "página do edital" };

const VISTAS = [{ id: "formularios", rotulo: "Formulários" }, { id: "plataformas", rotulo: "Plataformas" }];

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
    <Tabela minima="min-w-[760px]">
      <thead>
        <tr>
          <Th>Formulário</Th>
          <Th>Edital</Th>
          <Th>Plataforma</Th>
          <Th><span className="block text-right">Etapas</span></Th>
          <Th><span className="block text-right">Campos</span></Th>
          <Th>Fonte</Th>
          <Th><span className="block text-right">Projetos</span></Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {lista.map((f) => {
          const eds = editaisDe(f);
          const n = projetosNo(f.id);
          return (
            <Tr key={f.id} aoClicar={() => abrirDetalhe("formulario", f.id)}>
              <Td className="font-semibold">{f.nome}</Td>
              <Td>
                {eds.length
                  ? eds.map((e, i) => (
                    <span key={e.id}>
                      {i > 0 && ", "}
                      <a className={ESTILO_LINK} onClick={(ev) => { ev.stopPropagation(); abrirDetalhe("edital", e.id); }}>{nomeCurto(e)}</a>
                    </span>
                  ))
                  : <span className="text-muted">—</span>}
              </Td>
              <Td>{nomePlataforma(f.plataforma)}</Td>
              <Td numerico>{f.etapas.length}</Td>
              <Td numerico>{contarCampos(f)}</Td>
              <Td className={ESTILO_AUXILIAR}>
                {f.origem === "chrome" ? "plataforma" : ROTULO_FONTE[f.fonteTipo || ""] || "documento"}
                {f.extraido ? " · " + f.extraido : ""}
                {f.confianca && <BadgeConfianca nivel={f.confianca} className="ml-1.5" />}
              </Td>
              <Td numerico>{n || ""}</Td>
              <Td className="text-right">
                {n === 0 && (
                  <Botao variante="apagar" tamanho="mini" onClick={(ev) => {
                    ev.stopPropagation();
                    if (confirmando !== f.id) { setConfirmando(f.id); return; }
                    excluirFormulario(f.id);
                    setConfirmando(null);
                  }}>{confirmando === f.id ? "confirmar?" : "excluir"}</Botao>
                )}
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Tabela>
  );

  const chrome = todos.filter((f) => f.origem !== "documento");
  const documento = todos.filter((f) => f.origem === "documento");

  return (
    <>
      <CabecalhoSecao titulo="Formulários" sub={`fonte da verdade dos campos: ${todos.length} formulário(s), cada um com a origem do mapeamento`}>
        <Botao onClick={() => setImportando(true)}>Importar formulário</Botao>
      </CabecalhoSecao>

      <Pilulas opcoes={VISTAS} ativa={vista} aoEscolher={(id) => setVista(id as "formularios" | "plataformas")} />

      {vista === "formularios" ? (
        <>
          <CabecalhoSecao titulo="Mapeados na plataforma" sub={`${chrome.length} · campo a campo, com os códigos reais, pelo navegador`} />
          {chrome.length ? tabela(chrome) : <Vazio emLinha>Nenhum ainda.</Vazio>}
          <CabecalhoSecao titulo="Mapeados dos documentos" sub={`${documento.length} · reconstruídos do espelho oficial, do regulamento ou da página; sem os códigos da plataforma`} />
          {documento.length ? tabela(documento) : <Vazio emLinha>Nenhum ainda. Eles chegam pelo pacote da migração v3 (Gestão → Migração v3).</Vazio>}
          <Dica className="mt-3">
            Formulário novo entra por "Importar formulário" (JSON de etapas, blocos e campos), sem precisar de nova versão do site.
            Excluir só aparece quando nenhum projeto usa o formulário.
          </Dica>
        </>
      ) : (
        <Grade colunas={2}>
          {PLATAFORMAS.map((p) => {
            const deles = todos.filter((f) => f.plataforma === p.id);
            return (
              <CartaoLista
                key={p.id}
                titulo={p.nome}
                sub={p.orgao}
                rodape={
                  <span className="min-w-0">
                    {deles.length
                      ? deles.map((f, i) => <span key={f.id}>{i > 0 && " · "}<a className={ESTILO_LINK} onClick={() => abrirDetalhe("formulario", f.id)}>{f.nome}</a></span>)
                      : "nenhum formulário mapeado"}
                  </span>
                }
              >
                {p.url && (
                  <p className="m-0 mb-2 text-sm">
                    <a className={ESTILO_LINK} href={url(p.url)} target="_blank" rel="noopener noreferrer">{p.url} ↗</a>
                  </p>
                )}
                <Dados>
                  {([["Arquitetura", p.arq], ["Porta de entrada", p.porta], ["Códigos de campo", p.codigos], ["Limites", p.limites], ["Anexos", p.anexos]] as [string, string][])
                    .filter(([, v]) => v).map(([k, v]) => <Dado key={k} rotulo={k}>{v}</Dado>)}
                  {p.armadilhas && <Dado rotulo="Armadilhas" className="text-muted">{p.armadilhas}</Dado>}
                </Dados>
              </CartaoLista>
            );
          })}
        </Grade>
      )}

      {importando && <ModalImportarFormulario aoFechar={() => setImportando(false)} />}
    </>
  );
}
