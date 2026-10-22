/* Aba Audiovisual do núcleo de comunicação: o plano de cobertura (foto,
   vídeo e tempo real) por momento do festival, o que se decide antes de
   contratar e, no fim, as tarefas e o orçamento desta frente (a categoria
   Foto e vídeo do orçamento). */
import { brl, calcularOrcamento, valorItem } from "../calculo";
import type { Base, Nucleo } from "../tipos";
import { SECAO, TEXTO_LONGO } from "../ui/classes";
import { Resumo } from "../ui/Resumo";
import { Tabela, Td, Th } from "../ui/Tabela";
import type { AbaNucleo, IrPara } from "../vista";
import { BlocoFrente } from "./BlocoFrente";
import { itensDaFrente, tarefasDaFrente } from "./frentes";

interface Props { base: Base; nucleo: Nucleo; irPara: IrPara; abrirAba: (a: AbaNucleo) => void }

const MOMENTOS: [string, string, string][] = [
  ["Antes", "Teasers, bastidores da montagem, anúncio do line-up e das oficinas", "Fotos e vídeos curtos das atrações (pedir às bandas o material próprio) e registro das oficinas-piloto, se houver"],
  ["Durante", "Cobertura em tempo real nas redes, registro dos shows, oficinas, rodas e do público", "Fotógrafo e videomaker por dia; stories do dia a dia; registro das marcas aplicadas (prova para as contrapartidas)"],
  ["Depois", "Aftermovie, galeria por atração, relatório de resultados aos patrocinadores", "Edição e entregas pós-evento; material para a 2ª edição e para os editais"],
];

export function AbaAudiovisual({ base, nucleo, abrirAba }: Props) {
  const conta = calcularOrcamento(base);
  const itens = itensDaFrente(base, nucleo.id, "audiovisual");
  const total = itens.reduce((t, it) => t + valorItem(it, conta.cenario), 0);
  const tarefas = tarefasDaFrente(base, nucleo.id, "audiovisual");
  const abertas = tarefas.filter((t) => t.status !== "concluido").length;

  return (
    <>
      <Resumo
        itens={[
          { titulo: "Orçamento de foto e vídeo", valor: total ? brl(total) : "—", sub: itens.length + (itens.length === 1 ? " item" : " itens") + " no cenário em vigor" },
          { titulo: "Tarefas da frente", valor: abertas, sub: tarefas.length ? tarefas.length - abertas + " concluídas de " + tarefas.length : "nenhuma no plano" },
          { titulo: "Plano de cobertura", valor: tarefas.some((t) => /cobertura/i.test(t.frente || t.titulo) && t.status === "concluido") ? "pronto" : "a fazer", sub: "briefing de foto, vídeo e tempo real (COM-010)", classeValor: "cdf:text-conversa" },
        ]}
      />

      <h2 className={SECAO}>Cobertura por momento</h2>
      <p className="cdf:m-0 cdf:mb-2.5 cdf:max-w-[820px] cdf:text-sm cdf:text-fraco">Proposta de partida para o briefing de cobertura (COM-010). O núcleo ajusta e, decidido, vira tarefas por momento.</p>
      <Tabela>
        <thead><tr><Th>Momento</Th><Th>O que sai</Th><Th>O que precisa</Th></tr></thead>
        <tbody>
          {MOMENTOS.map(([m, sai, precisa]) => <tr key={m}><Td><strong>{m}</strong></Td><Td>{sai}</Td><Td>{precisa}</Td></tr>)}
        </tbody>
      </Tabela>

      <h2 className={SECAO}>Para decidir antes de contratar</h2>
      <div className={TEXTO_LONGO + " cdf:max-w-[820px]"}>
        <ul className="cdf:m-0 cdf:list-disc cdf:pl-5">
          <li><strong>Quem cobre.</strong> Equipe contratada, parceria com escola ou coletivo de foto, ou mistura. Os itens Fotografia e Vídeo do orçamento são o teto por cenário.</li>
          <li><strong>Direitos de imagem.</strong> O que a carta de anuência dos artistas já autoriza e o que falta (uso do registro em redes, aftermovie, material de captação da 2ª edição).</li>
          <li><strong>Entregas aos patrocinadores.</strong> Fotos das marcas aplicadas e do público viram a prova do relatório pós-evento (aba Contrapartidas).</li>
          <li><strong>Acessibilidade.</strong> Legendas nos vídeos e descrição das imagens nas redes, conforme o plano de comunicação acessível (COM-020).</li>
        </ul>
      </div>

      <BlocoFrente base={base} nucleo={nucleo} frente="audiovisual" abrirAba={abrirAba} />
    </>
  );
}
