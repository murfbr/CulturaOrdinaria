/* Captação · Empresas: o cadastro único do coletivo, reaproveitado em todos os
   projetos. Busca por nome, setor, CNPJ, pessoa ou anotação; os selos dizem em
   que projeto e etapa cada empresa está; clicar abre a ficha. Na visão de uma
   captadora, a empresa em conversa só com outras mostra "com outra captadora". */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca } from "../../components/Filtros";
import { Badge } from "../../components/ui/Badge";
import { Botao } from "../../components/ui/Botao";
import { Tabela, Th, Td, Tr } from "../../components/ui/Tabela";
import { Vazio } from "../../components/ui/Vazio";
import { comparar } from "../../utils";
import { nomeCaptadora, nomeItem, nomeProjeto, tomEtapa } from "./apoio";
import { empresaFechada, normalizar, restrita } from "./calculo";
import { CartaoEmpresa } from "./empresa/CartaoEmpresa";
import { ModalEmpresa } from "./empresa/ModalEmpresa";
import { usarComo } from "./visao";

export function Empresas() {
  const { painel } = usarCentral();
  const como = usarComo();
  const [busca, setBusca] = useState("");
  const [nova, setNova] = useState(false);

  const q = normalizar(busca);
  const empresas = painel.empresas
    .filter((e) => !q || normalizar([e.nome, e.setor, e.cnpj, e.obs, ...e.pessoas.map((p) => p.nome)].join(" ")).includes(q))
    .sort((a, b) => comparar(a.nome, b.nome));

  return (
    <>
      <CabecalhoSecao titulo="Empresas" sub="cadastro único do coletivo, reaproveitado em todos os projetos — abra uma empresa para ver as pessoas, o histórico e as abordagens">
        <Botao onClick={() => setNova(true)}>+ Empresa</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={empresas.length} total={painel.empresas.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar empresa, setor, CNPJ, pessoa…" />
      </BarraFiltros>

      {/* Celular: um cartão por empresa; tela larga: a tabela. */}
      <div className="flex flex-col gap-2 md:hidden">
        {empresas.map((e) => (
          <CartaoEmpresa key={e.id} e={e} negociacoes={painel.negociacoes} como={como} aoAbrir={() => abrirDetalhe("empresa", e.id)} />
        ))}
        {!empresas.length && <Vazio>Nenhuma empresa encontrada.</Vazio>}
      </div>

      <Tabela className="hidden md:block">
        <thead>
          <tr><Th>Empresa</Th><Th>Projetos</Th><Th>Contato</Th></tr>
        </thead>
        <tbody>
          {empresas.map((e) => {
            const negs = painel.negociacoes.filter((n) => n.empresaId === e.id);
            const fechada = empresaFechada(e.id, painel.negociacoes, como);
            const pessoa = e.pessoas[0];
            return (
              <Tr key={e.id} aoClicar={() => abrirDetalhe("empresa", e.id)}>
                <Td><b>{e.nome}</b>{e.setor && <div className="text-sm text-muted">{e.setor}</div>}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {negs.map((n) => restrita(n, como)
                      ? <Badge key={n.id} tom="neutro">{nomeProjeto(n.projetoId)} · com {nomeCaptadora(n.captadoraId)}</Badge>
                      : <Badge key={n.id} tom={tomEtapa(n.etapa)}>{nomeProjeto(n.projetoId)} · {nomeItem("etapas", n.etapa)}</Badge>)}
                    {!negs.length && <span className="text-sm text-muted">nenhuma ainda</span>}
                  </div>
                </Td>
                <Td className="text-sm text-muted">
                  {fechada ? "com outra captadora" : pessoa ? [pessoa.nome, pessoa.telefone || pessoa.email].filter(Boolean).join(" · ") : "—"}
                </Td>
              </Tr>
            );
          })}
          {!empresas.length && <tr><Td colSpan={3}><Vazio emLinha>Nenhuma empresa encontrada.</Vazio></Td></tr>}
        </tbody>
      </Tabela>

      {nova && <ModalEmpresa aoFechar={() => setNova(false)} aoSalvar={(id) => abrirDetalhe("empresa", id)} />}
    </>
  );
}
