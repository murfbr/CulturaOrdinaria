/* Comunicação › Mailing: a base de quem retirou ingresso nos eventos do
   Sympla (doc 02 da metodologia, seção 7b; referência 12). Só para quem tem o
   módulo "mailing" (ou master). A lista entra pela vista Importar, direto do
   arquivo exportado do Sympla, no navegador; as contas (quem volta, de onde
   veio, quem retirou e não veio) saem aqui. Toda abertura, importação,
   exportação, exclusão e descadastro fica no Registro.
   Endereços: #/comunicacao/mailing (eventos) · /pessoas · /importar · /descadastros · /registro · /me-<id do Sympla> */
import { useEffect } from "react";
import { CabecalhoSecao } from "../../../components/CabecalhoSecao";
import { Painel } from "../../../components/ui/Painel";
import { Pilulas } from "../../../components/ui/Pilulas";
import { iniciarMailing, pararMailing, temMailing, usarDivulgacao } from "../../../store/divulgacao";
import { definirBibliotecaAberta, usarNavegacao } from "../../../store/navegacao";
import { usarAcesso } from "../../../services/acesso";
import { DescadastrosMailing, RegistroDoMailing } from "./DescadastrosRegistro";
import { EventosMailing, FichaEventoMailing } from "./EventosMailing";
import { ImportarMailing } from "./ImportarMailing";
import { PessoasMailing } from "./PessoasMailing";

const VISTAS = [
  { id: "eventos", rotulo: "Eventos" },
  { id: "pessoas", rotulo: "Pessoas" },
  { id: "importar", rotulo: "Importar" },
  { id: "descadastros", rotulo: "Descadastros" },
  { id: "registro", rotulo: "Registro" },
];

export function Mailing() {
  usarAcesso(); // redesenha quando o acesso chega
  const pode = temMailing();
  useEffect(() => {
    if (!pode) return;
    iniciarMailing();
    return () => pararMailing();
  }, [pode]);
  const d = usarDivulgacao();
  const nav = usarNavegacao();
  const aberta = nav.bibliotecaAberta || "eventos";
  const ficha = aberta.startsWith("me-") ? aberta.slice(3) : "";
  const vista = ficha ? "" : VISTAS.some((v) => v.id === aberta) ? aberta : "eventos";

  const cabecalho = (
    <CabecalhoSecao titulo="Mailing" sub="quem retirou ingresso nos nossos eventos do Sympla · só a gestão, com registro de acesso" />
  );

  if (!pode) {
    return (
      <>
        {cabecalho}
        <Painel alerta titulo="Sem acesso ao Mailing">
          <p className="m-0 text-base">
            O Mailing guarda nome e e-mail de quem retirou ingresso, por isso só abre para a gestão: contas master ou com o
            módulo Mailing marcado em Núcleo › Acessos.
          </p>
        </Painel>
      </>
    );
  }

  if (d.mailingSemAcesso) {
    return (
      <>
        {cabecalho}
        <Painel alerta titulo="O banco recusou o Mailing">
          <p className="m-0 text-base">
            As regras do Firestore ainda não têm as coleções do Mailing (mailingEventos, mailingDescadastros, mailingRegistro).
            O arquivo firestore.rules do repositório tem as linhas: publicar pelo console do Firebase.
          </p>
        </Painel>
      </>
    );
  }

  if (ficha) return <FichaEventoMailing symplaId={ficha} />;

  return (
    <>
      {cabecalho}
      <Pilulas opcoes={VISTAS} ativa={vista} aoEscolher={(id) => definirBibliotecaAberta(id === "eventos" ? null : id)} />
      {vista === "importar" ? <ImportarMailing />
        : !d.mailingPronto ? <div className="py-10 text-center text-lg text-muted">carregando o Mailing…</div>
          : vista === "pessoas" ? <PessoasMailing />
            : vista === "descadastros" ? <DescadastrosMailing />
              : vista === "registro" ? <RegistroDoMailing />
                : <EventosMailing />}
    </>
  );
}
