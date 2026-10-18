/* Captadores: quem capta patrocínio para o festival sem ser da equipe do
   evento (parceiros só desta frente). São cadastros do tipo captador; aqui
   ficam o status da conversa com cada um, o contato, as empresas que cada
   um está cuidando (campo "Quem capta" do patrocínio) e as anotações. */
import { useState } from "react";
import { captadores, nomeCadastro } from "../calculo";
import { classeStatus, rotulo } from "../listas";
import type { Base } from "../tipos";
import { Vazio } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { ACOES, BARRA, NOTA, SUB, TEXTO_LONGO } from "../ui/classes";
import { Tabela, Td, Th } from "../ui/Tabela";
import { Pilula, Revisar } from "../ui/Tag";
import { ModalCadastro } from "../cadastro/ModalCadastro";

export function Captadores({ base }: { base: Base }) {
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const p = base.pagina;
  const lista = captadores(base);
  const tipoCaptador = p.listas.tiposCadastro.find((t) => /^captador/.test(t.id))?.id;
  const nucleoCaptacao = p.nucleos.find((n) => n.id === "captacao") || p.nucleos.find((n) => /capta/i.test(n.nome));
  const patrocinios = Object.values(base.patrocinios);

  return (
    <>
      <div className={BARRA}>
        <p className={NOTA}>Captadores são parceiros desta frente, não da equipe do evento. O status vem do cadastro; as empresas vêm do campo “Quem capta” de cada patrocínio.</p>
        <Botao variante="primario" className="cdf:md:ml-auto" disabled={!tipoCaptador} title={tipoCaptador ? undefined : "Crie o tipo de cadastro “Captador(a)” em Configuração → Listas"} onClick={() => setModal({ id: null })}>Nova pessoa captadora</Botao>
      </div>
      {!lista.length ? (
        <Vazio>Ninguém cadastrado como captador(a) ainda. {tipoCaptador ? "Use “Nova pessoa captadora” ou marque o tipo Captador(a) num cadastro existente." : "Crie o tipo de cadastro “Captador(a)” em Configuração → Listas e marque-o nas pessoas."}</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr><Th>Quem</Th><Th>Status</Th><Th>Contato</Th><Th>Empresas que cuida</Th><Th>Anotações</Th><Th><span className="cdf:sr-only">Ações</span></Th></tr>
          </thead>
          <tbody>
            {lista.map((c) => {
              const suas = patrocinios.filter((x) => x.captador === c.id).sort((a, b) => nomeCadastro(base, a.empresa).localeCompare(nomeCadastro(base, b.empresa), "pt"));
              return (
                <tr key={c.id}>
                  <Td>
                    <strong>{c.nome}</strong>{c.revisar && <Revisar />}
                    {c.nucleo && <small className={SUB}>{rotulo(p, "nucleos", c.nucleo)}</small>}
                  </Td>
                  <Td><Pilula classe={classeStatus(c.status)}>{rotulo(p, "statusContato", c.status)}</Pilula></Td>
                  <Td>
                    {c.contato?.telefone || c.contato?.email ? (
                      <>
                        {c.contato.telefone && <span className="cdf:block">{c.contato.telefone}</span>}
                        {c.contato.email && <small className={SUB}>{c.contato.email}</small>}
                      </>
                    ) : <span className="cdf:text-fraco">—</span>}
                  </Td>
                  <Td>
                    {suas.length
                      ? <div className={TEXTO_LONGO}>{suas.map((x) => nomeCadastro(base, x.empresa) + " (" + rotulo(p, "etapasFunil", x.etapa) + ")").join(", ")}</div>
                      : <span className="cdf:text-fraco">nenhuma marcada</span>}
                  </Td>
                  <Td><div className={TEXTO_LONGO}>{c.anotacoes || "—"}</div></Td>
                  <Td className={ACOES}><Botao mini onClick={() => setModal({ id: c.id })}>Editar</Botao></Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}
      {modal && (
        <ModalCadastro
          base={base} id={modal.id}
          preset={modal.id || !tipoCaptador ? undefined : { tipos: [tipoCaptador], status: "em_conversa", nucleo: nucleoCaptacao?.id || null }}
          aoFechar={() => setModal(null)}
        />
      )}
    </>
  );
}
