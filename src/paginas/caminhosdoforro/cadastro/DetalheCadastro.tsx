/* A linha expandida de um cadastro: histórico de contatos (com o formulário
   para registrar mais um e remover com dois cliques) e os detalhes (e-mail,
   telefone, documento, carta, anotações), a auditoria e os botões. */
import { useState, type FormEvent } from "react";
import { toast } from "../../../components/Toast";
import { clonar } from "../../../utils";
import { auditoria, cadastrosDoTipo, dataBr, hojeIso, nomeCadastro } from "../calculo";
import { gravar } from "../dados";
import { rotulo } from "../listas";
import type { Base, Cadastro } from "../tipos";
import { LinkArquivo } from "../ui/Arquivo";
import { Botao } from "../ui/Botao";
import { BotaoArmado } from "../ui/BotaoArmado";
import { AreaTexto, Campo, Entrada, Selecao } from "../ui/Campo";
import { H3 } from "../ui/classes";

interface Props { base: Base; d: Cadastro; aoEditar: () => void }

const DT = "cdf:text-sm cdf:text-fraco";
const DD = "cdf:m-0 cdf:whitespace-pre-line cdf:[overflow-wrap:anywhere]";

export function DetalheCadastro({ base, d, aoEditar }: Props) {
  const c = d.contato || { nome: "", email: "", telefone: "" };
  const historico = [...(d.historico || [])].sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")) || (b.em || 0) - (a.em || 0));
  const equipe = cadastrosDoTipo(base, "equipe");
  const [data, setData] = useState(hojeIso());
  const [por, setPor] = useState("");
  const [texto, setTexto] = useState("");

  function registrar(ev: FormEvent) {
    ev.preventDefault();
    const t = texto.trim();
    if (!t) return;
    const novo = { id: Math.random().toString(36).slice(2, 10), data: data || hojeIso(), por: por || null, texto: t, em: Date.now() };
    gravar("cadastro", { ...clonar(d), historico: [...(d.historico || []), novo] });
    setTexto("");
    toast("Contato registrado.");
  }
  function remover(hid: string) {
    gravar("cadastro", { ...clonar(d), historico: (d.historico || []).filter((h) => h.id !== hid) });
    toast("Contato removido do histórico.");
  }
  function revisado() {
    gravar("cadastro", { ...clonar(d), revisar: false });
    toast("Marcado como revisado.");
  }

  return (
    <div className="cdf:grid cdf:grid-cols-1 cdf:gap-7 cdf:md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <section>
        <h3 className={H3}>Histórico de contatos</h3>
        {historico.length ? (
          <ul className="cdf:m-0 cdf:mb-3.5 cdf:flex cdf:list-none cdf:flex-col cdf:gap-2.5 cdf:p-0">
            {historico.map((x) => (
              <li key={x.id} className="cdf:rounded-[10px] cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:px-3 cdf:py-2.5">
                <div className="cdf:flex cdf:items-baseline cdf:gap-2.5 cdf:text-sm cdf:text-fraco">
                  <time>{dataBr(x.data)}</time>
                  <b className="cdf:text-tinta">{x.por ? nomeCadastro(base, x.por) : "Sem responsável"}</b>
                  <BotaoArmado variante="fraco" mini confirmar="Confirmar" className="cdf:ml-auto" onClick={() => remover(x.id)}>Remover</BotaoArmado>
                </div>
                <p className="cdf:m-0 cdf:mt-1 cdf:whitespace-pre-line cdf:text-base">{x.texto}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="cdf:m-0 cdf:mb-3.5 cdf:text-fraco">Nenhum contato registrado ainda.</p>
        )}
        <form onSubmit={registrar} className="cdf:grid cdf:grid-cols-1 cdf:items-end cdf:gap-2.5 cdf:md:grid-cols-[150px_1fr]">
          <Campo rotulo="Data"><Entrada type="date" value={data} onChange={(e) => setData(e.target.value)} /></Campo>
          <Campo rotulo="Quem falou">
            <Selecao value={por} onChange={(e) => setPor(e.target.value)}>
              <option value="">Escolha</option>
              {equipe.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="O que foi conversado" className="cdf:md:col-span-2"><AreaTexto rows={2} required value={texto} onChange={(e) => setTexto(e.target.value)} /></Campo>
          <div><Botao type="submit">Registrar contato</Botao></div>
        </form>
      </section>
      <section>
        <h3 className={H3}>Detalhes</h3>
        <dl className="cdf:m-0 cdf:mb-3.5 cdf:grid cdf:grid-cols-[auto_1fr] cdf:gap-x-3.5 cdf:gap-y-1.5 cdf:text-base">
          <dt className={DT}>E-mail</dt><dd className={DD}>{c.email || "—"}</dd>
          <dt className={DT}>Telefone</dt><dd className={DD}>{c.telefone || "—"}</dd>
          <dt className={DT}>CPF ou CNPJ</dt><dd className={DD}>{d.documento || "—"}</dd>
          <dt className={DT}>Carta de anuência</dt>
          <dd className={DD}>{rotulo(base.pagina, "cartaAnuencia", d.carta)}{d.cartaArquivo && <><br /><LinkArquivo arquivo={d.cartaArquivo} /></>}</dd>
          <dt className={DT}>Anotações</dt><dd className={DD}>{d.anotacoes || "—"}</dd>
        </dl>
        <p className="cdf:m-0 cdf:mb-2.5 cdf:text-[13px] cdf:text-fraco">{auditoria(d as Cadastro & { atualizadoPor?: string })}</p>
        <div className="cdf:flex cdf:flex-wrap cdf:gap-2">
          {d.revisar && <Botao onClick={revisado}>Marcar como revisado</Botao>}
          <Botao onClick={aoEditar}>Editar</Botao>
        </div>
      </section>
    </div>
  );
}
