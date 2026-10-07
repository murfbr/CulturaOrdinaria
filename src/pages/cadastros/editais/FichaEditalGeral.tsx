/* Sub-aba Geral da ficha do edital: alertas que mudam decisão, o que o
   edital quer, dados e quem pode (lado a lado), valores e linhas, exigências
   e contrapartidas e os links oficiais. */
import { Badge } from "../../../components/ui/Badge";
import { Chip } from "../../../components/ui/Chip";
import { Dados } from "../../../components/ui/Dados";
import { Grade } from "../../../components/ui/Grade";
import { Linha } from "../../../components/ui/Linha";
import { Painel } from "../../../components/ui/Painel";
import { Tabela, Td, Th } from "../../../components/ui/Tabela";
import { ESTILO_LINK } from "../../../components/ui/estilos";
import { alertaVencido } from "../../../lib/prazos";
import { CATEGORIAS_EDITAL, ESFERAS, type CategoriaEdital, type Edital } from "../../../types";
import { url } from "../../../utils";
import { cx } from "../../../utils/classes";
import { DadoEdital, TRACO, Texto } from "./FichaEditalBase";

const simNao = (v: boolean | null | undefined) => (v == null ? "não diz" : v ? "sim" : "não");

export function FichaEditalGeral({ e }: { e: Edital }) {
  const esf = ESFERAS[e.esfera] || { rotulo: "—", classe: "" };
  const cat = CATEGORIAS_EDITAL[(e.categoria || "edital") as CategoriaEdital];
  const alertas = e.alertas || [];
  const linhas = e.linhas || [];
  const links = e.links || [];

  return (
    <>
      {alertas.length > 0 && (
        <Painel alerta titulo="Muda decisão">
          {alertas.map((a, i) => {
            const passou = alertaVencido(a, e);
            return (
              <Linha topo compacta key={i} apagada={passou}>
                <div>
                  <b>{a.titulo}</b>
                  {a.quando && <Badge tom="ur-d7" className="ml-1.5">{a.quando}</Badge>}
                  {passou && <Badge className="ml-1.5">data já passou</Badge>}
                </div>
                <div className="mt-0.5">{a.texto}</div>
                {a.fazer && <div className="mt-0.5 text-accent-ink"><b>Fazer:</b> {a.fazer}</div>}
              </Linha>
            );
          })}
        </Painel>
      )}

      <Painel titulo="O que o edital quer">
        <Texto t={e.estimula || e.objeto} />
        {e.estimula && e.objeto && (
          <p className="m-0 mt-2.5 max-w-texto border-l-[3px] border-line py-2 pl-3 text-sm italic text-muted">{e.objeto}</p>
        )}
      </Painel>

      <Grade colunas={2}>
        <Painel titulo="Dados">
          <Dados>
            <DadoEdital rotulo="Órgão / promotor">{e.orgao}</DadoEdital>
            <DadoEdital rotulo="Categoria">{cat?.rotulo}{cat && <span className="text-muted"> · {cat.dica}</span>}</DadoEdital>
            <DadoEdital rotulo="Esfera">{esf.rotulo}</DadoEdital>
            <DadoEdital rotulo="Mecanismo">{e.mec}</DadoEdital>
            <DadoEdital rotulo="Prazo">{e.prazo}</DadoEdital>
            <DadoEdital rotulo="Ciclo">{e.ciclo}</DadoEdital>
            <DadoEdital rotulo="Área">{e.area}</DadoEdital>
            <DadoEdital rotulo="Verificado em">{e.verif}</DadoEdital>
          </Dados>
        </Painel>
        <Painel titulo="Quem pode">
          <Texto t={e.publico} />
          <div className="mt-2">
            <Chip>pessoa física: {simNao(e.aceitaPf)}</Chip>
            <Chip>MEI: {simNao(e.aceitaMei)}</Chip>
            <Chip>coletivo sem CNPJ: {simNao(e.aceitaColetivo)}</Chip>
          </div>
          {(e.eleg || []).length > 0 && <div className="mt-1.5">{(e.eleg || []).map((x) => <Chip key={x}>{x}</Chip>)}</div>}
        </Painel>
      </Grade>

      <Painel titulo="Valores">
        <Texto t={e.teto} />
        {linhas.length > 0 && (
          <Tabela simples className="mt-2.5">
            <thead><tr><Th>Linha / categoria</Th><Th>Valor</Th><Th>Vagas</Th><Th>Obs.</Th></tr></thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={i}><Td><b>{l.nome}</b></Td><Td>{l.valor}</Td><Td>{l.vagas}</Td><Td className="text-muted">{l.obs}</Td></tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Painel>

      <Painel titulo="Exigências e contrapartidas"><Texto t={[e.exigencias, e.contrapartidas].filter(Boolean).join("\n\n")} /></Painel>

      <Painel titulo="Links oficiais">
        {links.length ? links.map((l, i) => (
          <Linha compacta key={i}>
            <div className="flex gap-2.5">
              <span className="flex-none text-xs font-bold text-accent">↗</span>
              <a className={cx(ESTILO_LINK, "break-all")} href={url(l.url)} target="_blank" rel="noopener noreferrer">{l.rotulo}</a>
            </div>
          </Linha>
        )) : e.linkEdital
          ? <a className={cx(ESTILO_LINK, "break-all")} href={url(e.linkEdital)} target="_blank" rel="noopener noreferrer">↗ {e.linkEdital}</a>
          : TRACO}
      </Painel>
    </>
  );
}
