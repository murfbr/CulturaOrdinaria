/* Mailing › Importar: a lista de participantes exportada do Sympla entra aqui,
   lida no navegador (o arquivo vai do computador direto pro banco da Central,
   sem passar por mais nada). Quatro passos na mesma tela: o evento, o arquivo,
   as colunas (com palpite pelo nome do cabeçalho) e a conferência. Só e-mail,
   nome e participação entram; as outras colunas da planilha ficam de fora.
   Importar de novo o mesmo evento substitui a lista anterior. */
import { useEffect, useMemo, useState } from "react";
import { toast } from "../../../components/Toast";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Campo, Entrada, Linhas, Selecao } from "../../../components/ui/Campo";
import { GradeKpis, Kpi } from "../../../components/ui/Kpi";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { decodificarTexto, lerCsv } from "../../../lib/csv";
import { lerXlsx, type Aba } from "../../../lib/xlsx";
import { gravarEventoMailing, usarDivulgacao, type MetaEventoMailing } from "../../../store/divulgacao";
import { definirBibliotecaAberta } from "../../../store/navegacao";
import { EVENTOS_SYMPLA, linkParticipantesSympla } from "../../../types";
import { diaMes, formatar } from "../biblioteca/calculo";
import {
  CAMPOS_LISTA, acharCabecalho, lerParticipantes, palpiteDeColunas, totaisDe, type CampoLista, type MapaColunas,
} from "./listaSympla";

const META_VAZIA: MetaEventoMailing = { symplaId: "", titulo: "", data: "", local: "", organizador: "", plano: "", ciclo: "" };
const CHAVE_PRE = "central-mailing-importar";

/** Tabela de um .html disfarçado de .xls (alguns sistemas exportam assim). */
function lerTabelaHtml(texto: string): Aba[] {
  const docHtml = new DOMParser().parseFromString(texto, "text/html");
  const tabelas = Array.from(docHtml.querySelectorAll("table"));
  return tabelas.map((t, i) => ({
    nome: "Tabela " + (i + 1),
    linhas: Array.from(t.querySelectorAll("tr")).map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim())),
  }));
}

/** Arquivo → abas, pelo conteúdo (não só pela extensão). */
async function lerArquivo(arquivo: File): Promise<Aba[]> {
  const buf = await arquivo.arrayBuffer();
  const b = new Uint8Array(buf.slice(0, 8));
  if (b[0] === 0x50 && b[1] === 0x4b) return lerXlsx(buf); // zip: .xlsx
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) {
    throw new Error("Este é um .xls antigo, que o navegador não lê. Abra no Excel (ou no Google Planilhas) e salve como .xlsx ou .csv.");
  }
  const texto = decodificarTexto(buf);
  if (/^\s*</.test(texto) && /<table/i.test(texto)) {
    const abas = lerTabelaHtml(texto);
    if (abas.length) return abas;
  }
  return [{ nome: arquivo.name, linhas: lerCsv(texto) }];
}

export function ImportarMailing() {
  const d = usarDivulgacao();
  const [meta, setMeta] = useState<MetaEventoMailing>(META_VAZIA);
  const [escolha, setEscolha] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [abas, setAbas] = useState<Aba[]>([]);
  const [abaIdx, setAbaIdx] = useState(0);
  const [linhaCab, setLinhaCab] = useState(0);
  const [mapa, setMapa] = useState<MapaColunas | null>(null);
  const [erro, setErro] = useState("");
  const [lendo, setLendo] = useState(false);

  const escolher = (id: string) => {
    setEscolha(id);
    const c = EVENTOS_SYMPLA.find((e) => e.symplaId === id);
    setMeta(c ? { symplaId: c.symplaId, titulo: c.titulo, data: c.data, local: c.local, organizador: c.organizador, plano: c.plano, ciclo: c.ciclo } : META_VAZIA);
  };
  // Vindo do botão "importar" da lista de eventos: o evento já chega escolhido.
  useEffect(() => {
    try {
      const pre = sessionStorage.getItem(CHAVE_PRE);
      if (pre) { sessionStorage.removeItem(CHAVE_PRE); escolher(pre); }
    } catch { /* sem sessionStorage */ }
  }, []);

  const aba = abas[abaIdx];
  const usarAba = (lista: Aba[], i: number) => {
    const linhas = lista[i]?.linhas || [];
    const cab = acharCabecalho(linhas);
    setAbaIdx(i);
    setLinhaCab(cab);
    setMapa(palpiteDeColunas(linhas[cab] || []));
  };

  async function aoEscolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro("");
    setLendo(true);
    try {
      const lidas = (await lerArquivo(arquivo)).filter((a) => a.linhas.length);
      if (!lidas.length) throw new Error("O arquivo não tem nenhuma linha.");
      setNomeArquivo(arquivo.name);
      setAbas(lidas);
      // A aba com cabeçalho de e-mail, se houver mais de uma.
      const comEmail = lidas.findIndex((a) => palpiteDeColunas(a.linhas[acharCabecalho(a.linhas)] || []).email >= 0);
      usarAba(lidas, Math.max(0, comEmail));
    } catch (e) {
      setAbas([]);
      setMapa(null);
      setErro(String((e as Error)?.message || e));
    } finally {
      setLendo(false);
    }
  }

  const cabecalho = aba?.linhas[linhaCab] || [];
  const exemplo = aba?.linhas[linhaCab + 1] || [];
  const lida = useMemo(() => (aba && mapa && mapa.email >= 0 ? lerParticipantes(aba.linhas, linhaCab, mapa) : null), [aba, mapa, linhaCab]);
  const totais = lida ? totaisDe(lida.participantes) : null;
  const catalogo = EVENTOS_SYMPLA.find((e) => e.symplaId === meta.symplaId);
  const anterior = Object.values(d.eventos).find((e) => e.symplaId === meta.symplaId && e.parte === 1);
  const metaOk = Boolean(meta.symplaId && meta.titulo.trim() && /^\d{4}-\d{2}-\d{2}$/.test(meta.data));
  const pronto = metaOk && lida && lida.participantes.length > 0;

  function gravar() {
    if (!pronto || !lida || !totais) return;
    const partes = gravarEventoMailing({ ...meta, titulo: meta.titulo.trim() }, lida.participantes, totais, nomeArquivo, lida.descartadas);
    if (!partes) return;
    toast("Lista gravada no Mailing: " + totais.ingressos + " ingressos, " + totais.emails + " e-mails" + (partes > 1 ? " (" + partes + " partes)" : "") + ".");
    setAbas([]);
    setMapa(null);
    setNomeArquivo("");
    definirBibliotecaAberta("me-" + meta.symplaId);
  }

  const mudarMapa = (campo: CampoLista, i: number) => mapa && setMapa({ ...mapa, [campo]: i });

  return (
    <>
      <Painel titulo="1. O evento">
        <Linhas>
          <Campo rotulo="Evento da conta do Sympla">
            <Selecao value={escolha} onChange={(e) => escolher(e.target.value)}>
              <option value="">escolha…</option>
              {[...EVENTOS_SYMPLA].reverse().map((c) => (
                <option key={c.symplaId} value={c.symplaId}>
                  {diaMes(c.data)}/{c.data.slice(2, 4)} · {c.titulo}{Object.values(d.eventos).some((e) => e.symplaId === c.symplaId) ? " (já importado)" : ""}
                </option>
              ))}
              <option value="outro">outro evento…</option>
            </Selecao>
          </Campo>
          <Campo rotulo="Id do evento no Sympla">
            <Entrada value={meta.symplaId} placeholder="o número no fim do link do evento"
              onChange={(e) => setMeta({ ...meta, symplaId: (e.target.value.match(/\d{5,}/g) || [e.target.value.replace(/\D/g, "")]).pop() || "" })} />
          </Campo>
        </Linhas>
        {escolha && (
          <>
            <Linhas colunas={3}>
              <Campo rotulo="Título"><Entrada value={meta.titulo} onChange={(e) => setMeta({ ...meta, titulo: e.target.value })} /></Campo>
              <Campo rotulo="Data do evento"><Entrada type="date" value={meta.data} onChange={(e) => setMeta({ ...meta, data: e.target.value })} /></Campo>
              <Campo rotulo="Dono no Sympla"><Entrada value={meta.organizador} onChange={(e) => setMeta({ ...meta, organizador: e.target.value })} /></Campo>
            </Linhas>
            <Linhas colunas={3}>
              <Campo rotulo="Plano"><Entrada value={meta.plano} placeholder="Samba de Ponta, Ponta de Lança…" onChange={(e) => setMeta({ ...meta, plano: e.target.value })} /></Campo>
              <Campo rotulo="Ciclo (edição)"><Entrada value={meta.ciclo} onChange={(e) => setMeta({ ...meta, ciclo: e.target.value })} /></Campo>
              <Campo rotulo="Local"><Entrada value={meta.local} onChange={(e) => setMeta({ ...meta, local: e.target.value })} /></Campo>
            </Linhas>
          </>
        )}
        {anterior && (
          <p className="m-0 text-base text-warn">
            Este evento já foi importado em {diaMes(anterior.importadoEm.slice(0, 10))} ({formatar(anterior.totais.ingressos, "int")} ingressos).
            Gravar de novo substitui a lista anterior.
          </p>
        )}
      </Painel>

      <Painel titulo="2. O arquivo" sub="a lista exportada do Sympla (.xlsx ou .csv)">
        <ol className="m-0 mb-3 max-w-texto pl-5 text-base">
          <li>
            No Sympla, abra os participantes do evento
            {meta.symplaId ? <> (<a href={linkParticipantesSympla(meta.symplaId)} target="_blank" rel="noreferrer" className="text-accent">abrir no Sympla ↗</a>)</> : " (área do produtor › evento › Participantes)"}
            {" "}e clique em <b>Exportar participantes</b>. O e-mail só vem na exportação, não aparece na tela do Sympla.
          </li>
          <li>Escolha o arquivo baixado aqui embaixo. Ele é lido neste navegador e vai direto pro banco da Central.</li>
        </ol>
        <input type="file" accept=".xlsx,.csv,.xls,.txt" disabled={lendo}
          onChange={(e) => { void aoEscolherArquivo(e.target.files?.[0]); e.target.value = ""; }} />
        {lendo && <span className="ml-3 text-sm text-muted">lendo…</span>}
        {nomeArquivo && !erro && <span className="ml-3 text-sm text-muted">{nomeArquivo} · {aba?.linhas.length || 0} linhas na aba</span>}
        {erro && <p className="m-0 mt-2 text-base text-accent">{erro}</p>}
      </Painel>

      {aba && mapa && (
        <Painel titulo="3. As colunas" sub="o palpite vem do nome do cabeçalho; confira e troque o que estiver errado">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
            {abas.length > 1 && (
              <label className="flex items-center gap-1.5">aba
                <Selecao className="w-auto py-1 text-sm" value={abaIdx} onChange={(e) => usarAba(abas, Number(e.target.value))}>
                  {abas.map((a, i) => <option key={i} value={i}>{a.nome} ({a.linhas.length} linhas)</option>)}
                </Selecao>
              </label>
            )}
            <label className="flex items-center gap-1.5">cabeçalho na linha
              <Selecao className="w-auto py-1 text-sm" value={linhaCab}
                onChange={(e) => { const i = Number(e.target.value); setLinhaCab(i); setMapa(palpiteDeColunas(aba.linhas[i] || [])); }}>
                {aba.linhas.slice(0, 15).map((_, i) => <option key={i} value={i}>{i + 1}</option>)}
              </Selecao>
            </label>
            <span className="text-muted">Só os campos abaixo entram no banco. CPF, telefone e respostas do formulário ficam de fora.</span>
          </div>
          <Tabela simples minima="min-w-[640px]">
            <thead><tr><Th>Campo</Th><Th>Coluna da planilha</Th><Th>Exemplo (1ª linha)</Th></tr></thead>
            <tbody>
              {CAMPOS_LISTA.map((c) => (
                <tr key={c.campo}>
                  <Td>
                    <b className="font-semibold">{c.rotulo}</b>{c.obrigatorio && <span className="text-accent"> *</span>}
                    {c.ajuda && <div className="text-xs text-muted">{c.ajuda}</div>}
                  </Td>
                  <Td>
                    <Selecao className="py-1 text-sm" value={mapa[c.campo]} onChange={(e) => mudarMapa(c.campo, Number(e.target.value))}>
                      <option value={-1}>— nenhuma —</option>
                      {cabecalho.map((h, i) => <option key={i} value={i}>{h || "(coluna " + (i + 1) + ")"}</option>)}
                    </Selecao>
                  </Td>
                  <Td className="break-all text-sm text-muted">{mapa[c.campo] >= 0 ? exemplo[mapa[c.campo]] || "" : ""}</Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </Painel>
      )}

      {aba && mapa && (
        <Painel titulo="4. Conferência" alerta={!pronto}>
          {mapa.email < 0 ? <p className="m-0 text-base">Escolha a coluna do e-mail.</p> : lida && totais && (
            <>
              <GradeKpis>
                <Kpi n={formatar(totais.ingressos, "int")} rotulo="ingressos" />
                <Kpi n={formatar(totais.pedidos, "int")} rotulo="pedidos" />
                <Kpi n={formatar(totais.emails, "int")} rotulo="e-mails únicos" />
                <Kpi n={mapa.checkin >= 0 || mapa.checkinEm >= 0 ? formatar(totais.checkins, "int") : "—"} rotulo="check-ins" />
                <Kpi n={formatar(totais.comUtm, "int")} rotulo="com UTM" />
              </GradeKpis>
              <ul className="m-0 mb-3 max-w-texto pl-5 text-base">
                {catalogo?.retiradas != null && (
                  <li className={Math.abs(totais.ingressos - catalogo.retiradas) / catalogo.retiradas > 0.02 ? "text-warn" : ""}>
                    O Sympla mostrava {formatar(catalogo.retiradas, "int")} retiradas; a lista tem {formatar(totais.ingressos, "int")} ingressos.
                  </li>
                )}
                {lida.descartadas > 0 && (
                  <li className="text-warn">
                    {lida.descartadas} linha(s) sem e-mail válido ficam de fora (ex.: {lida.exemplosDescartados.join(", ")}). Linha de total no fim da planilha conta aqui.
                  </li>
                )}
                {mapa.checkin < 0 && mapa.checkinEm < 0 && <li>Sem coluna de check-in: o evento fica como "sem check-in na porta".</li>}
                {totais.comUtm === 0 && <li>Nenhum ingresso com UTM: confira se as colunas utm_* estão marcadas.</li>}
                {!metaOk && <li className="text-accent">Falta escolher o evento (id do Sympla, título e data).</li>}
              </ul>
              <Tabela simples minima="min-w-[760px]">
                <thead><tr><Th>E-mail</Th><Th>Nome</Th><Th>Pedido</Th><Th>Tipo</Th><Th>Retirada</Th><Th>Check-in</Th><Th>UTM</Th></tr></thead>
                <tbody>
                  {lida.participantes.slice(0, 5).map((p, i) => (
                    <tr key={i}>
                      <Td className="break-all">{p.email}</Td><Td>{p.nome || ""}</Td><Td>{p.pedido || ""}</Td><Td>{p.tipo || ""}</Td>
                      <Td className="whitespace-nowrap">{(p.retirada || "").replace("T", " ")}</Td>
                      <Td>{p.checkin == null ? "" : p.checkin ? <Badge mini tom="ok">sim{p.checkinEm ? " " + p.checkinEm.slice(11) : ""}</Badge> : "não"}</Td>
                      <Td className="text-sm">{[p.utmSource, p.utmMedium, p.utmCampaign, p.utmContent].filter(Boolean).join(" / ")}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
              <p className="m-0 mt-1 text-sm text-muted">As 5 primeiras linhas, como vão ser gravadas.</p>
            </>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Botao onClick={gravar} disabled={!pronto}>Gravar no Mailing</Botao>
            <span className="text-sm text-muted">Fica no registro: quem importou, quando, qual arquivo e quantas linhas.</span>
          </div>
        </Painel>
      )}
    </>
  );
}
