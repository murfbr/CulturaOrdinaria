/* Mailing › Descadastros e Registro.
   Descadastro: quem pediu pra não receber. Todo e-mail enviado leva o jeito
   de sair (responder "sair"); quem pedir entra aqui e some de toda exportação.
   Registro: cada abertura, importação, exportação, exclusão e descadastro,
   com quem e quando. As regras do banco só deixam acrescentar linhas. */
import { useState } from "react";
import { BarraFiltros, SeletorFiltro } from "../../../components/Filtros";
import { Badge } from "../../../components/ui/Badge";
import { Botao } from "../../../components/ui/Botao";
import { Entrada } from "../../../components/ui/Campo";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { Vazio } from "../../../components/ui/Vazio";
import { descadastrar, recadastrar, usarDivulgacao } from "../../../store/divulgacao";
import { ACOES_REGISTRO } from "../../../types";
import { diaMes } from "../biblioteca/calculo";

const dataHora = (iso: string) => (iso ? diaMes(iso.slice(0, 10)) + "/" + iso.slice(0, 4) + " " + new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

export function DescadastrosMailing() {
  const d = usarDivulgacao();
  const [email, setEmail] = useState("");
  const [motivo, setMotivo] = useState("");
  const lista = Object.values(d.descadastros).sort((a, b) => b.data.localeCompare(a.data) || a.email.localeCompare(b.email));

  return (
    <>
      <Painel titulo="Descadastrar" sub="quem pediu pra não receber sai de toda exportação e cópia de e-mails, em qualquer evento">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm"><span className="text-muted">e-mail</span>
            <Entrada type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@exemplo.com" /></label>
          <label className="flex flex-1 flex-col gap-1 text-sm"><span className="text-muted">como pediu (opcional)</span>
            <Entrada value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="respondeu o e-mail de 30/10" /></label>
          <Botao onClick={() => { if (descadastrar(email, motivo)) { setEmail(""); setMotivo(""); } }}>Descadastrar</Botao>
        </div>
        <p className="m-0 mt-3 max-w-texto text-sm text-muted">
          Todo e-mail enviado pra lista leva no rodapé o jeito de sair (por exemplo: "pra não receber mais, responda SAIR").
          Quem pedir entra aqui no mesmo dia.
        </p>
      </Painel>
      {!lista.length ? <Vazio>Ninguém pediu descadastro ainda.</Vazio> : (
        <Tabela>
          <thead><tr><Th>E-mail</Th><Th>Desde</Th><Th>Como pediu</Th><Th>Quem anotou</Th><Th /></tr></thead>
          <tbody>
            {lista.map((x) => (
              <tr key={x.id}>
                <Td className="break-all">{x.email}</Td>
                <Td className="whitespace-nowrap">{diaMes(x.data)}/{x.data.slice(0, 4)}</Td>
                <Td>{x.motivo}</Td>
                <Td className="text-sm text-muted">{x.quem}</Td>
                <Td><Botao tamanho="mini" variante="quieto" title="a pessoa pediu pra voltar a receber" onClick={() => recadastrar(x.id)}>recadastrar</Botao></Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}

const TOM: Record<string, string> = { exportou: "aviso", importou: "ok", apagou: "erro", descadastrou: "info", recadastrou: "info", contou: "neutro", abriu: "neutro" };

export function RegistroDoMailing() {
  const d = usarDivulgacao();
  const [acao, setAcao] = useState("");
  const todas = Object.values(d.registro).sort((a, b) => b.quando.localeCompare(a.quando));
  const lista = acao ? todas.filter((r) => r.acao === acao) : todas;
  return (
    <>
      <BarraFiltros mostrando={lista.length} total={todas.length}>
        <SeletorFiltro valor={acao} aoMudar={setAcao} rotuloTodos="todas as ações" opcoes={[...ACOES_REGISTRO]} />
      </BarraFiltros>
      {!lista.length ? <Vazio>Nenhuma linha no registro.</Vazio> : (
        <Tabela minima="min-w-[720px]">
          <thead><tr><Th>Quando</Th><Th>Quem</Th><Th>Ação</Th><Th>O quê</Th></tr></thead>
          <tbody>
            {lista.slice(0, 500).map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{dataHora(r.quando)}</Td>
                <Td className="text-sm">{r.quem}</Td>
                <Td><Badge mini tom={TOM[r.acao] || "neutro"}>{r.acao}</Badge></Td>
                <Td className="text-sm">{r.detalhe}</Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
      <p className="m-0 mt-2 max-w-texto text-sm text-muted">
        O registro só recebe linhas novas: nem o site nem as contas da Central conseguem mudar ou apagar uma linha (regra do banco).
      </p>
    </>
  );
}
