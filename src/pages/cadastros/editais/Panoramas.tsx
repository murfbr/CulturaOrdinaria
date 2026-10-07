/* Vistas panorâmicas dos editais (as do Mapa dos Editais): critérios por
   conceito, campos de formulário por conceito, lacunas por quem resolve e os
   alertas que mudam decisão. Tudo derivado dos registros de edital. As
   matrizes são tabelas largas com a coluna do edital presa ao rolar de lado. */
import type { ReactNode } from "react";
import { abrirDetalhe } from "../../../store/navegacao";
import { Badge } from "../../../components/ui/Badge";
import { Dica } from "../../../components/ui/Dica";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { ESTILO_APAGADO, ESTILO_LINK } from "../../../components/ui/estilos";
import { cx } from "../../../utils/classes";
import { nomeCurto } from "../../../lib/nomes";
import { alertaVencido, dataDoAlerta } from "../../../lib/prazos";
import {
  CONCEITOS_CAMPO, CONCEITOS_CRITERIO, QUEM_RESOLVE, type AlertaEdital, type Edital,
} from "../../../types";

const abrir = (id: string) => abrirDetalhe("edital", id);

/** Primeira coluna das matrizes: o nome abre a ficha e fica preso ao rolar de lado. */
function CelulaEdital({ e }: { e: Edital }) {
  return (
    <Td className="sticky left-0 bg-card whitespace-nowrap">
      <a className={ESTILO_LINK} onClick={() => abrir(e.id)}>{nomeCurto(e)}</a>
    </Td>
  );
}

/** Cabeçalho de conceito: nome longo que quebra linha, com largura mínima. */
function ThConceito({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Th className="min-w-[70px] align-bottom" title={title}>
      <span className="block whitespace-normal text-3xs">{children}</span>
    </Th>
  );
}

/** Critérios: pontos por conceito em cada edital (em % do total, para comparar). */
export function MatrizCriterios({ editais }: { editais: Edital[] }) {
  const com = editais.filter((e) => (e.criterios || []).some((c) => c.pontos));
  const conceitos = CONCEITOS_CRITERIO.filter(([k]) => com.some((e) => (e.criterios || []).some((c) => c.conceito === k)));
  if (!com.length) return <Vazio emLinha>Nenhum edital com critérios pontuados nesses filtros.</Vazio>;
  return (
    <>
      <Dica className="mb-3">
        Quanto cada conceito pesa na nota de cada edital, em % do total de pontos. Clique no nome para abrir o edital.
        Edital sem critério público (patrocínio, cadastro) fica fora.
      </Dica>
      <Tabela minima="min-w-[760px]">
        <thead>
          <tr>
            <Th className="sticky left-0">Edital</Th>
            {conceitos.map(([k, r]) => <ThConceito key={k} title={r}>{r}</ThConceito>)}
            <Th><span className="block text-right">Total</span></Th>
          </tr>
        </thead>
        <tbody>
          {com.map((e) => {
            const total = (e.criterios || []).reduce((s, c) => s + (c.pontos || 0), 0) || 1;
            return (
              <tr key={e.id}>
                <CelulaEdital e={e} />
                {conceitos.map(([k]) => {
                  const pts = (e.criterios || []).filter((c) => c.conceito === k).reduce((s, c) => s + (c.pontos || 0), 0);
                  const pct = Math.round((100 * pts) / total);
                  // A intensidade do laranja (accent) vem do dado: quanto mais o conceito pesa, mais forte.
                  return (
                    <Td key={k} numerico style={pts ? { background: `rgba(228,87,46,${Math.min(0.08 + pct / 120, 0.7)})` } : undefined}>
                      {pts ? pct + "%" : ""}
                    </Td>
                  );
                })}
                <Td numerico className="text-muted">{e.criteriosTotal ?? total}</Td>
              </tr>
            );
          })}
        </tbody>
      </Tabela>
    </>
  );
}

/** Campos do formulário por conceito: onde o mesmo texto se repete, e com que limite. */
export function MatrizCampos({ editais }: { editais: Edital[] }) {
  const com = editais.filter((e) => (e.formCampos || []).length);
  const conceitos = CONCEITOS_CAMPO.filter(([k]) => !["cadastro", "declaracao", "anexo", "enquadramento"].includes(k))
    .map(([k, r]) => ({ k, r, n: com.filter((e) => (e.formCampos || []).some((c) => c.conceito === k)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  if (!com.length) return <Vazio emLinha>Nenhum edital com campos de formulário mapeados nesses filtros.</Vazio>;
  const celula = (e: Edital, k: string) => {
    const cs = (e.formCampos || []).filter((c) => c.conceito === k);
    if (!cs.length) return "";
    const limites = cs.map((c) => (c.limite ? c.limite.toLocaleString("pt-BR") + (c.unidade === "palavras" ? "p" : c.unidade === "páginas" ? "pg" : "") : "livre"));
    return limites.join(" + ");
  };
  return (
    <>
      <Dica className="mb-3">
        Os textos que os formulários pedem, por conceito (colunas ordenadas pelo quanto se repetem), com o limite de
        caracteres de cada campo (p = palavras, pg = páginas). É a base dos textos-mestres: escrever uma vez, ajustar o tamanho.
      </Dica>
      <Tabela minima="min-w-[760px]">
        <thead>
          <tr>
            <Th className="sticky left-0">Edital</Th>
            {conceitos.map((c) => (
              <ThConceito key={c.k} title={c.r + " · aparece em " + c.n}>
                {c.r} <span className="font-medium normal-case text-faint">({c.n})</span>
              </ThConceito>
            ))}
          </tr>
        </thead>
        <tbody>
          {com.map((e) => (
            <tr key={e.id}>
              <CelulaEdital e={e} />
              {conceitos.map((c) => {
                const v = celula(e, c.k);
                return <Td key={c.k} numerico className={v ? "bg-ok-soft" : undefined}>{v}</Td>;
              })}
            </tr>
          ))}
        </tbody>
      </Tabela>
    </>
  );
}

/** O que falta saber de cada edital, agrupado por quem consegue resolver. */
export function QuemResolve({ editais }: { editais: Edital[] }) {
  const itens = editais.flatMap((e) => (e.lacunas || []).filter((l) => l.status !== "fechada").map((l) => ({ e, l })));
  const grupos = Object.keys(QUEM_RESOLVE).filter((c) => c !== "fechada" && itens.some((x) => x.l.cat === c));
  if (!itens.length) return <Vazio emLinha>Nenhuma lacuna aberta nesses filtros.</Vazio>;
  return (
    <>
      {grupos.map((c) => (
        <Painel key={c} titulo={QUEM_RESOLVE[c]} acoes={<Badge tom="st-prev">{itens.filter((x) => x.l.cat === c).length}</Badge>}>
          {itens.filter((x) => x.l.cat === c).map(({ e, l }, i) => (
            <Linha key={e.id + i} topo compacta>
              <div>
                <a className={ESTILO_LINK} onClick={() => abrir(e.id)}>{nomeCurto(e)}</a> · <b>{l.lacuna}</b>{" "}
                <span className="text-muted">({l.status})</span>
              </div>
              {l.achado && <div className="mt-0.5">{l.achado}</div>}
              {l.por_que && <div className={cx(ESTILO_APAGADO, "mt-0.5")}>{l.por_que}</div>}
            </Linha>
          ))}
        </Painel>
      ))}
    </>
  );
}

type AlertaComDonos = AlertaEdital & { donos: Edital[] };

/** Alertas que mudam decisão, sem repetir o mesmo alerta de editais diferentes. */
export function ListaAlertas({ editais }: { editais: Edital[] }) {
  const vistos = new Set<string>();
  const alertas: AlertaComDonos[] = [];
  for (const e of editais) {
    for (const a of e.alertas || []) {
      if (vistos.has(a.titulo)) { alertas.find((x) => x.titulo === a.titulo)?.donos.push(e); continue; }
      vistos.add(a.titulo);
      alertas.push({ ...a, donos: [e] });
    }
  }
  if (!alertas.length) return <Vazio emLinha>Nenhum alerta nesses filtros.</Vazio>;
  const passou = (a: AlertaComDonos) => alertaVencido(a, a.donos[0]);
  const vigentes = alertas.filter((a) => !passou(a))
    .sort((x, y) => (dataDoAlerta(x, x.donos[0]) || "9999").localeCompare(dataDoAlerta(y, y.donos[0]) || "9999"));
  const antigos = alertas.filter(passou);
  const cartao = (a: AlertaComDonos) => (
    <Painel alerta key={a.titulo} className={passou(a) ? "opacity-60" : undefined}>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <b className="text-base">{a.titulo}</b>
        {a.quando && <Badge tom="ur-d7" className="ml-auto">{a.quando}</Badge>}
      </div>
      <p className="m-0 mb-1.5 max-w-texto">{a.texto}</p>
      {a.fazer && <p className="m-0 mb-1.5 max-w-texto"><b>Fazer:</b> {a.fazer}</p>}
      <div className={ESTILO_APAGADO}>
        {a.donos.map((e, i) => <span key={e.id}>{i > 0 && ", "}<a className={ESTILO_LINK} onClick={() => abrir(e.id)}>{nomeCurto(e)}</a></span>)}
        {a.fonte && <> · fonte: {a.fonte}</>}
      </div>
    </Painel>
  );
  return (
    <>
      <Dica className="mb-3">Do "O que muda decisão" do Mapa dos Editais, do mais próximo ao mais distante. Confira a data antes de agir.</Dica>
      {vigentes.map(cartao)}
      {!vigentes.length && <Vazio emLinha className="mb-3">Nenhum alerta com data ainda valendo.</Vazio>}
      {antigos.length > 0 && (
        <details className="my-2.5">
          <summary className="mb-2 cursor-pointer text-sm text-muted">{antigos.length} alerta(s) com data que já passou</summary>
          {antigos.map(cartao)}
        </details>
      )}
    </>
  );
}
