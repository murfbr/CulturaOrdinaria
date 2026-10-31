/* Mailing › Eventos: o que já foi importado e o que falta (os eventos da conta
   do Sympla), com as três perguntas por evento: quem volta, de onde veio e
   quem retirou e não fez check-in. A ficha (#/comunicacao/mailing/me-<id>)
   abre um evento. */
import { useEffect, useMemo } from "react";
import { BotaoExcluir } from "../../../components/BotaoExcluir";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { Badge } from "../../../components/ui/Badge";
import { Barra } from "../../../components/ui/Barra";
import { Botao } from "../../../components/ui/Botao";
import { CabecalhoFicha } from "../../../components/ui/CabecalhoFicha";
import { Grade } from "../../../components/ui/Grade";
import { GradeKpis, Kpi } from "../../../components/ui/Kpi";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { apagarEventoMailing, iniciarDivulgadores, usarDivulgacao } from "../../../store/divulgacao";
import { abrirNaComunicacao, definirBibliotecaAberta } from "../../../store/navegacao";
import { EVENTOS_SYMPLA, linkParticipantesSympla } from "../../../types";
import { diaMes, formatar } from "../biblioteca/calculo";
import { agrupar, catalogoComImportados, distribuicaoRetorno, rotuloOrigem, type EventoCompleto } from "./calculoMailing";
import { exportarCsv } from "./exportar";
import { usarDadosMailing } from "./usarMailing";

const dataLonga = (d: string) => (d ? diaMes(d) + "/" + d.slice(0, 4) : "");
const pct = (n: number, de: number) => (de ? formatar(n / de, "pct") : "—");

/** Abre a importação já com o evento escolhido. */
export const importarEvento = (symplaId: string) => {
  try { sessionStorage.setItem("central-mailing-importar", symplaId); } catch { /* sem sessionStorage: escolhe na tela */ }
  definirBibliotecaAberta("importar");
};

export function EventosMailing() {
  const { eventos, pessoas, linhas, descadastros } = usarDadosMailing();
  const catalogo = catalogoComImportados(eventos).reverse(); // o mais recente em cima
  const linhaDe = new Map(linhas.map((l) => [l.evento.symplaId, l]));
  const distribuicao = distribuicaoRetorno(pessoas);
  const voltaram = pessoas.filter((p) => p.eventos.length > 1).length;
  const importados = catalogo.filter((c) => c.importado).length;

  return (
    <>
      <GradeKpis>
        <Kpi n={importados + "/" + catalogo.length} rotulo="eventos importados" />
        <Kpi n={formatar(pessoas.length, "int")} rotulo="e-mails únicos" />
        <Kpi n={pct(voltaram, pessoas.length)} rotulo="estiveram em 2 ou mais" />
        <Kpi n={descadastros.length} rotulo="descadastros" aoClicar={() => definirBibliotecaAberta("descadastros")} />
      </GradeKpis>

      {!eventos.length && (
        <Painel titulo="Comece pela importação">
          <p className="m-0 max-w-texto text-base">
            Nenhuma lista importada ainda. Na tabela abaixo, cada evento tem o link pra página de participantes no Sympla
            (botão <b>Exportar participantes</b>) e o botão <b>importar</b>, que abre a vista Importar já com o evento escolhido.
            O arquivo vai do seu computador direto pro banco da Central.
          </p>
        </Painel>
      )}

      {pessoas.length > 0 && (
        <Painel titulo="Quem volta" sub={"em quantos eventos importados cada e-mail esteve (" + importados + " eventos)"}>
          <div className="flex max-w-[640px] flex-col gap-2">
            {distribuicao.map((f) => (
              <div key={f.rotulo} className="grid grid-cols-[110px_1fr_120px] items-center gap-3 text-base">
                <span>{f.rotulo}</span>
                <Barra pct={pessoas.length ? (100 * f.n) / pessoas.length : 0} />
                <span className="text-right tabular-nums">{formatar(f.n, "int")} · {pct(f.n, pessoas.length)}</span>
              </div>
            ))}
          </div>
        </Painel>
      )}

      <CabecalhoSecao titulo="Os eventos" sub="da conta do Samba de Ponta no Sympla, mais os importados de fora dela" />
      <Tabela minima="min-w-[1000px]">
        <thead>
          <tr>
            <Th>Evento</Th>
            <Th>Data</Th>
            <Th numerico>Ingressos</Th>
            <Th numerico>E-mails</Th>
            <Th numerico>Já tinham vindo</Th>
            <Th numerico>Voltaram depois</Th>
            <Th numerico>Check-in</Th>
            <Th numerico>Com UTM</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {catalogo.map((c) => {
            const l = linhaDe.get(c.symplaId);
            const ev = c.importado;
            const diferenca = ev && c.retiradas ? Math.abs(ev.totais.ingressos - c.retiradas) / c.retiradas : 0;
            return (
              <tr key={c.symplaId}>
                <Td>
                  {ev ? (
                    <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-accent hover:underline"
                      onClick={() => definirBibliotecaAberta("me-" + c.symplaId)}>{c.titulo}</button>
                  ) : <span className="font-semibold text-muted">{c.titulo}</span>}
                  <div className="text-xs text-muted">{[c.plano, c.ciclo, c.organizador].filter(Boolean).join(" · ")}</div>
                </Td>
                <Td className="whitespace-nowrap">{dataLonga(c.data)}</Td>
                <Td numerico>
                  {ev ? formatar(ev.totais.ingressos, "int") : <span className="text-faint">{c.retiradas != null ? formatar(c.retiradas, "int") + " no Sympla" : "—"}</span>}
                  {ev && diferenca > 0.02 && <div className="text-xs text-warn" title="a lista importada não bate com as retiradas que o Sympla mostrava">Sympla: {formatar(c.retiradas, "int")}</div>}
                  {ev?.incompleto && <div className="text-xs text-warn">faltam partes</div>}
                </Td>
                <Td numerico>{l ? formatar(l.emails, "int") : ""}</Td>
                <Td numerico>{l ? pct(l.jaVieram, l.emails) : ""}</Td>
                <Td numerico>{l ? pct(l.voltaramDepois, l.emails) : ""}</Td>
                <Td numerico>{!ev ? "" : l?.semCheckin == null ? <span className="text-faint">sem check-in</span> : pct(ev.totais.checkins, ev.totais.ingressos)}</Td>
                <Td numerico>{ev ? pct(ev.totais.comUtm, ev.totais.ingressos) : ""}</Td>
                <Td className="whitespace-nowrap">
                  {!ev && <Botao tamanho="mini" variante="fantasma" onClick={() => importarEvento(c.symplaId)}>importar</Botao>}
                  {" "}
                  <a href={linkParticipantesSympla(c.symplaId)} target="_blank" rel="noreferrer" className="text-sm text-muted hover:text-ink"
                    title="participantes do evento na área do produtor do Sympla">Sympla ↗</a>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Tabela>
      <p className="m-0 mt-2 max-w-texto text-sm text-muted">
        "Já tinham vindo": e-mails do evento que aparecem em algum evento anterior importado. "Voltaram depois": que aparecem
        em algum evento posterior. As duas contas crescem conforme mais eventos entram. O e-mail é de quem fez o pedido (até 3
        ingressos por pedido), então conta pedidos, não cada pessoa da roda.
      </p>
    </>
  );
}

/** Um evento importado: números, origem, tipo de ingresso, check-in e as listas pra exportar. */
export function FichaEventoMailing({ symplaId }: { symplaId: string }) {
  useEffect(() => { iniciarDivulgadores(); }, []);
  const { eventos, linhas, pessoas, d } = usarDadosMailing();
  const { divulgadores } = usarDivulgacao();
  const ev: EventoCompleto | undefined = eventos.find((e) => e.symplaId === symplaId);
  const linha = linhas.find((l) => l.evento.symplaId === symplaId);
  const voltar = () => definirBibliotecaAberta(null);
  const catalogo = EVENTOS_SYMPLA.find((c) => c.symplaId === symplaId);
  const porPerfil = useMemo(() => new Map(Object.values(divulgadores).map((dv) => [dv.instagram, dv])), [divulgadores]);

  if (!ev) {
    return (
      <>
        <CabecalhoFicha rotuloVoltar="Eventos" aoVoltar={voltar} titulo={catalogo?.titulo || "Evento " + symplaId} />
        {d.mailingPronto ? (
          <Vazio>
            A lista deste evento ainda não foi importada.{" "}
            <Botao tamanho="pequeno" variante="fantasma" onClick={() => importarEvento(symplaId)}>importar agora</Botao>
          </Vazio>
        ) : <div className="py-10 text-center text-lg text-muted">carregando o Mailing…</div>}
      </>
    );
  }

  const primeiraVez = new Set(pessoas.filter((p) => p.eventos[0]?.symplaId === symplaId).map((p) => p.email));
  const fora = new Set(Object.values(d.descadastros).map((x) => x.email));
  const origens = agrupar(ev.participantes, rotuloOrigem);
  const tipos = agrupar(ev.participantes, (p) => p.tipo || "(sem tipo)");
  const teveCheckin = linha?.semCheckin != null;
  const porEmail = (filtro: (email: string, checkin: boolean) => boolean) => {
    const vistos = new Map<string, { nome: string; checkin: boolean }>();
    for (const p of ev.participantes) {
      const atual = vistos.get(p.email);
      vistos.set(p.email, { nome: atual?.nome || p.nome || "", checkin: Boolean(atual?.checkin || p.checkin) });
    }
    return [...vistos.entries()].filter(([email, v]) => !fora.has(email) && filtro(email, v.checkin));
  };
  const naoVieram = teveCheckin ? porEmail((_, checkin) => !checkin) : [];
  const exportar = (rotulo: string, lista: [string, { nome: string }][]) => exportarCsv(
    "mailing-" + symplaId + "-" + rotulo.replace(/\s+/g, "-") + ".csv",
    [["email", "nome"], ...lista.map(([email, v]) => [email, v.nome])],
    rotulo + " de " + ev.titulo + " (" + ev.data + ")",
  );

  return (
    <>
      <CabecalhoFicha rotuloVoltar="Eventos" aoVoltar={voltar} titulo={ev.titulo}
        sub={<>
          {dataLonga(ev.data)}{ev.local ? " · " + ev.local : ""}{ev.organizador ? " · no Sympla de " + ev.organizador : ""}
          {ev.plano ? " · " + ev.plano + (ev.ciclo ? ", " + ev.ciclo : "") : ""}
          <span className="block text-sm text-muted">
            importado em {dataLonga(ev.importadoEm.slice(0, 10))} por {ev.importadoPor} · arquivo {ev.arquivo}
            {ev.descartadas ? " · " + ev.descartadas + " linha(s) sem e-mail ficaram de fora" : ""}
          </span>
        </>}
        acoes={<a href={linkParticipantesSympla(symplaId)} target="_blank" rel="noreferrer" className="text-sm text-muted hover:text-ink">participantes no Sympla ↗</a>} />

      {ev.incompleto && (
        <Painel alerta titulo="Faltam partes desta lista">
          A lista foi gravada em partes e alguma não está no banco (gravação interrompida?). Importe o arquivo de novo.
        </Painel>
      )}

      <GradeKpis>
        <Kpi n={formatar(ev.totais.ingressos, "int")} rotulo="ingressos" />
        <Kpi n={formatar(ev.totais.pedidos, "int")} rotulo="pedidos" />
        <Kpi n={formatar(ev.totais.emails, "int")} rotulo="e-mails" />
        <Kpi n={teveCheckin ? pct(ev.totais.checkins, ev.totais.ingressos) : "—"} rotulo={teveCheckin ? "fizeram check-in" : "sem check-in na porta"} />
        <Kpi n={formatar(primeiraVez.size, "int")} rotulo="vieram pela primeira vez" />
        {linha && <Kpi n={pct(linha.jaVieram, linha.emails)} rotulo="já tinham vindo" />}
      </GradeKpis>

      <Grade>
        <Painel titulo="De onde veio" sub="pelas etiquetas (UTM) do link de cada ingresso: source / medium / content" className="mb-0">
          <Tabela simples>
            <thead><tr><Th>Origem</Th><Th numerico>Ingressos</Th><Th numerico>E-mails</Th></tr></thead>
            <tbody>
              {origens.map((o) => {
                const conteudo = o.rotulo.split(" / ")[2]?.toLowerCase() || "";
                const dv = conteudo ? porPerfil.get(conteudo) : undefined;
                return (
                  <tr key={o.rotulo}>
                    <Td>
                      {o.rotulo}
                      {dv && (
                        <button type="button" className="ml-2 cursor-pointer border-0 bg-transparent p-0 text-sm text-accent hover:underline"
                          onClick={() => abrirNaComunicacao("divulgadores", dv.id)}>divulgador: {dv.nome || "@" + dv.instagram}</button>
                      )}
                    </Td>
                    <Td numerico>{formatar(o.ingressos, "int")} <span className="text-xs text-muted">{pct(o.ingressos, ev.totais.ingressos)}</span></Td>
                    <Td numerico>{formatar(o.emails, "int")}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
          <p className="m-0 mt-2 text-sm text-muted">"sem UTM": quem chegou ao Sympla sem link etiquetado (procurou o evento sozinho, link copiado sem as etiquetas).</p>
        </Painel>
        <Painel titulo="Tipo de ingresso" className="mb-0">
          <Tabela simples>
            <thead><tr><Th>Tipo</Th><Th numerico>Ingressos</Th><Th numerico>E-mails</Th></tr></thead>
            <tbody>
              {tipos.map((t) => (
                <tr key={t.rotulo}><Td>{t.rotulo}</Td><Td numerico>{formatar(t.ingressos, "int")}</Td><Td numerico>{formatar(t.emails, "int")}</Td></tr>
              ))}
            </tbody>
          </Tabela>
        </Painel>
      </Grade>

      <CabecalhoSecao titulo="Listas deste evento" sub="em CSV (e-mail e nome), sem quem pediu descadastro; cada exportação fica no registro" />
      <Grade colunas={3}>
        <Painel titulo="Todos" className="mb-0">
          <p className="m-0 mb-2 text-base">{formatar(porEmail(() => true).length, "int")} e-mails</p>
          <Botao tamanho="pequeno" variante="fantasma" onClick={() => exportar("todos", porEmail(() => true))}>Exportar CSV</Botao>
        </Painel>
        <Painel titulo="Retirou e não fez check-in" className="mb-0">
          {teveCheckin ? (
            <>
              <p className="m-0 mb-2 text-base">{formatar(naoVieram.length, "int")} e-mails sem nenhum ingresso com check-in</p>
              <Botao tamanho="pequeno" variante="fantasma" onClick={() => exportar("sem check-in", naoVieram)}>Exportar CSV</Botao>
            </>
          ) : <p className="m-0 text-base text-muted">Este evento não teve check-in na porta (nenhum ingresso marcado).</p>}
        </Painel>
        <Painel titulo="Primeira vez" className="mb-0">
          <p className="m-0 mb-2 text-base">{formatar(primeiraVez.size, "int")} e-mails que não aparecem em nenhum evento anterior importado</p>
          <Botao tamanho="pequeno" variante="fantasma" onClick={() => exportar("primeira vez", porEmail((e) => primeiraVez.has(e)))}>Exportar CSV</Botao>
        </Painel>
      </Grade>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-4 text-sm text-muted">
        <span>Tirar esta lista do Mailing (as pessoas que só estiveram aqui somem junto):</span>
        <BotaoExcluir aoConfirmar={() => { apagarEventoMailing(symplaId, ev.titulo); voltar(); }} />
        <span className="ml-auto">
          <Badge mini>{ev.participantes.length} linhas</Badge>
        </span>
      </div>
    </>
  );
}
