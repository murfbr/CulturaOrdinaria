/* Equipe do coletivo: tabela com funções e e-mail (que alimenta os convites) —
   busca e ordenação. A linha inteira abre a edição; o botão "editar" da
   última coluna faz o mesmo. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { Botao } from "../../components/ui/Botao";
import { Chip } from "../../components/ui/Chip";
import { Avatar } from "../../components/ui/Avatar";
import { Tabela, Th, Td, Tr } from "../../components/ui/Tabela";
import { Vazio } from "../../components/ui/Vazio";
import { ESTILO_APAGADO } from "../../components/ui/estilos";
import { comparar } from "../../utils";

export function Equipe() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("");

  const equipe = painel.equipe.filter((p) =>
    !busca || [p.nome, p.nomeCompleto || "", p.email || "", ...(p.funcoes || [])].join(" ").toLowerCase().includes(busca.toLowerCase()));
  if (ordem === "nome") equipe.sort((a, b) => comparar(a.nome, b.nome));

  return (
    <>
      <CabecalhoSecao titulo="Equipe do coletivo" sub="pessoas a quem você designa tarefas; o e-mail alimenta os convites de reunião">
        <Botao onClick={() => abrirNovo("equipe")}>+ Pessoa</Botao>
      </CabecalhoSecao>

      <BarraFiltros mostrando={equipe.length} total={painel.equipe.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, função, e-mail…" />
        <SeletorFiltro valor={ordem} aoMudar={setOrdem} rotuloTodos="ordem do quadro"
          opcoes={[{ valor: "nome", rotulo: "nome A→Z" }]} />
      </BarraFiltros>

      <Tabela>
        <thead>
          <tr>
            <Th>Nome</Th>
            <Th>Funções</Th>
            <Th>E-mail</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {equipe.map((p) => (
            <Tr key={p.id} aoClicar={() => abrirEdicao("equipe", p.id)}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <Avatar iniciais={p.nome.slice(0, 1)} />
                  <div className="min-w-0">
                    <b>{p.nome}</b>
                    {p.nomeCompleto && <div className={ESTILO_APAGADO}>{p.nomeCompleto}</div>}
                  </div>
                </div>
              </Td>
              <Td>{(p.funcoes || []).map((f) => <Chip key={f}>{f}</Chip>)}</Td>
              <Td>
                {p.email
                  ? <span className="text-muted">✉ {p.email}</span>
                  : <span className={ESTILO_APAGADO}>sem e-mail — add p/ convites</span>}
              </Td>
              <Td className="text-right">
                <Botao variante="quieto" tamanho="mini" onClick={(e) => { e.stopPropagation(); abrirEdicao("equipe", p.id); }}>editar</Botao>
              </Td>
            </Tr>
          ))}
          {!equipe.length && <tr><Td colSpan={4}><Vazio emLinha>Ninguém com essa busca.</Vazio></Td></tr>}
        </tbody>
      </Tabela>
    </>
  );
}
