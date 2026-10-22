/* A página de um núcleo (o GT do plano de ação): cabeçalho com o escopo, o
   responsável e os membros; abas Painel, Orçamento (os itens classificados
   no núcleo) e Tarefas (as do núcleo), mais as abas próprias: Patrocínios e
   apoios na captação; no núcleo de comunicação, as frentes Redes, Design,
   Audiovisual e Contrapartidas entram entre o Painel e as Tarefas. A aba escolhida
   vale por núcleo enquanto a página está aberta; um atalho ("Patrocínios e
   apoios" no painel) pede a aba ao chegar. */
import { useState } from "react";
import { AbaAudiovisual } from "../comunicacao/AbaAudiovisual";
import { AbaContrapartidas } from "../comunicacao/AbaContrapartidas";
import { AbaDesign } from "../comunicacao/AbaDesign";
import { AbaRedes } from "../comunicacao/AbaRedes";
import { FRENTES } from "../comunicacao/frentes";
import { nomeCadastro, nucleoCaptacao, nucleoComunicacao } from "../calculo";
import { Detalhamento } from "../orcamento/Detalhamento";
import { TelaPatrocinios } from "../patrocinios/TelaPatrocinios";
import { TelaTarefas } from "../tarefas/TelaTarefas";
import type { Base, Nucleo } from "../tipos";
import { Abas } from "../ui/Abas";
import { CabecalhoVista } from "../ui/CabecalhoVista";
import { Tag } from "../ui/Tag";
import { abaNucleoPedida, pedirAbaNucleo, type AbaNucleo, type IrPara } from "../vista";
import { PainelNucleo } from "./PainelNucleo";

const abasLembradas: Record<string, AbaNucleo> = {};

interface Props { base: Base; nucleo: Nucleo; irPara: IrPara }

export function TelaNucleo({ base, nucleo: n, irPara }: Props) {
  const ehCaptacao = nucleoCaptacao(base)?.id === n.id;
  const ehComunicacao = nucleoComunicacao(base)?.id === n.id;
  const proprias: { id: AbaNucleo; nome: string; n?: number }[] = [
    ...(ehCaptacao ? [{ id: "patrocinios" as const, nome: "Patrocínios e apoios", n: Object.keys(base.patrocinios).length }] : []),
  ];
  const frentes: { id: AbaNucleo; nome: string }[] = ehComunicacao ? FRENTES.map((f) => ({ id: f.id, nome: f.nome })) : [];
  const existe = (a: AbaNucleo | null | undefined) => !!a && (a === "painel" || a === "orcamento" || a === "tarefas" || proprias.some((x) => x.id === a) || frentes.some((x) => x.id === a));

  const [aba, setAba] = useState<AbaNucleo>(() => {
    const pedida = abaNucleoPedida;
    pedirAbaNucleo(null);
    if (existe(pedida)) return pedida!;
    const lembrada = abasLembradas[n.id];
    return existe(lembrada) ? lembrada : "painel";
  });
  const mudar = (a: AbaNucleo) => { abasLembradas[n.id] = a; setAba(a); };

  const membros = (n.membros || []).filter((id) => base.cadastro[id]);
  const itensOrcamento = Object.values(base.orcamento_itens).filter((it) => it.nucleo === n.id).length;
  const tarefas = Object.values(base.tarefas).filter((t) => t.nucleo === n.id).length;

  return (
    <>
      <CabecalhoVista titulo={n.nome} lead={n.escopo || "Núcleo de trabalho do festival: o que ele cuida, o que gasta e o que tem para fazer."}>
        <p className="cdf:m-0 cdf:mt-3 cdf:flex cdf:flex-wrap cdf:items-center cdf:gap-x-3 cdf:gap-y-1.5 cdf:text-sm cdf:text-tinta-2">
          <span>{n.responsavel ? <>Responsável: <strong>{nomeCadastro(base, n.responsavel)}</strong></> : <span className="cdf:text-fraco">Sem responsável</span>}</span>
          {membros.length ? <span>{membros.map((id) => <Tag key={id}>{nomeCadastro(base, id)}</Tag>)}</span> : <span className="cdf:text-fraco">Sem membros ainda (Cadastro → Equipe e núcleos)</span>}
        </p>
      </CabecalhoVista>
      <Abas
        abas={[
          { id: "painel", nome: "Painel" },
          ...frentes,
          ...proprias,
          { id: "tarefas", nome: "Tarefas", n: tarefas },
          { id: "orcamento", nome: "Orçamento", n: itensOrcamento },
        ]}
        ativa={aba} aoMudar={mudar}
      />
      {aba === "painel" ? <PainelNucleo base={base} nucleo={n} irPara={irPara} abrirAba={mudar} />
        : aba === "orcamento" ? <AbaOrcamento base={base} nucleo={n} irPara={irPara} />
        : aba === "tarefas" ? <TelaTarefas base={base} nucleoFixo={n.id} />
        : aba === "patrocinios" ? <TelaPatrocinios base={base} irPara={irPara} semCabecalho />
        : aba === "redes" ? <AbaRedes base={base} nucleo={n} irPara={irPara} />
        : aba === "design" ? <AbaDesign base={base} nucleo={n} irPara={irPara} />
        : aba === "audiovisual" ? <AbaAudiovisual base={base} nucleo={n} irPara={irPara} />
        : <AbaContrapartidas base={base} nucleo={n} irPara={irPara} />}
    </>
  );
}

/** O orçamento do núcleo: o detalhamento filtrado nele, com o cenário em vigor e o link para a aba Orçamento. */
function AbaOrcamento({ base, nucleo: n, irPara }: Props) {
  return (
    <>
      <p className="cdf:m-0 cdf:mb-3 cdf:text-sm cdf:text-fraco">
        Só os itens classificados no núcleo {n.nome}, no cenário em vigor. Para trocar o cenário, ver o painel geral do orçamento ou o simulador,{" "}
        <button type="button" className="cdf:cursor-pointer cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:font-bold cdf:text-link cdf:underline" onClick={() => irPara("orcamento")}>abra a aba Orçamento</button>.
      </p>
      <Detalhamento base={base} nucleoFixo={n.id} />
    </>
  );
}
