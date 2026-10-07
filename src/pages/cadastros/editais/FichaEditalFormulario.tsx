/* Sub-aba Formulário da ficha do edital: plataforma, como o Mapa leu o
   formulário, os formulários mapeados na Central e os campos que o
   formulário pede, com limite e conceito. */
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Chip } from "../../../components/ui/Chip";
import { Dados } from "../../../components/ui/Dados";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { ESTILO_APAGADO, ESTILO_LINK } from "../../../components/ui/estilos";
import { usarCentral } from "../../../store/central";
import { abrirDetalhe } from "../../../store/navegacao";
import { CONCEITOS_CAMPO, type Edital } from "../../../types";
import { DadoEdital, rotuloConceito } from "./FichaEditalBase";

/** Como o Mapa dos Editais chegou aos campos do formulário. */
const ORIGEM_FORM: Record<string, string> = {
  central: "réplica da Central (mapeada na plataforma)", espelho_oficial: "espelho oficial do formulário",
  regulamento: "reconstruído do regulamento", web: "página do edital", nao_descrito: "nenhum documento descreve os campos",
};

export function FichaEditalFormulario({ e, aoNovoProjeto }: { e: Edital; aoNovoProjeto: () => void }) {
  const { formularios } = usarCentral();
  const forms = [...new Set([...(e.formIds || []), ...(e.formId ? [e.formId] : [])])];
  const campos = e.formCampos || [];

  return (
    <>
      <Painel titulo="Formulário" acoes={<Botao tamanho="pequeno" onClick={aoNovoProjeto}>+ Novo projeto neste edital</Botao>}>
        <Dados>
          <DadoEdital rotulo="Plataforma">{e.plataforma || e.comoInscrever}</DadoEdital>
          <DadoEdital rotulo="Como o Mapa leu">{ORIGEM_FORM[e.formOrigem || ""] || e.formOrigem}</DadoEdital>
          <DadoEdital rotulo="Na Central">
            {forms.length ? forms.map((f) => (
              <span key={f} className="mr-2.5 inline-flex flex-wrap items-center gap-1.5">
                <a className={ESTILO_LINK} onClick={() => abrirDetalhe("formulario", f)}>{formularios[f]?.nome || f}</a>
                {formularios[f] && (
                  <Badge tom={formularios[f].origem === "chrome" ? "ok" : "neutro"}>
                    {formularios[f].origem === "chrome" ? "mapeado na plataforma" : "mapeado dos documentos"}
                  </Badge>
                )}
              </span>
            )) : <span className="text-muted">sem formulário: projetos neste edital nascem Livres</span>}
          </DadoEdital>
        </Dados>
      </Painel>

      {campos.length > 0 && (
        <Painel titulo="Campos que o formulário pede" sub={`${campos.length} campos lidos pelo Mapa`}>
          <Tabela simples>
            <thead><tr><Th>Etapa</Th><Th>Campo</Th><Th>Limite</Th><Th>Conceito</Th></tr></thead>
            <tbody>
              {campos.map((c, i) => (
                <tr key={i}>
                  <Td className="text-muted">{c.etapa}</Td>
                  <Td>
                    <b>{c.campo}</b>{c.obrigatorio ? <span className="text-muted"> *</span> : null}
                    {c.instrucao && <div className={ESTILO_APAGADO}>{c.instrucao}</div>}
                  </Td>
                  <Td numerico>{c.limite ? c.limite.toLocaleString("pt-BR") + " " + (c.unidade || "") : "—"}</Td>
                  <Td><Chip>{rotuloConceito(CONCEITOS_CAMPO, c.conceito)}</Chip></Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </Painel>
      )}
    </>
  );
}
