/* Barra lateral do artefato: a marca (logo por link ou a tipográfica), a
   contagem regressiva, as seções em quatro grupos com título não clicável
   (Painel e cadastro, Produtos e ferramentas, Núcleos, Apoio), "← Central"
   fechando o grupo Apoio, o estado do banco e o sair. No celular vira o topo
   da página, com as seções rolando de lado e os títulos dos grupos escondidos. */
import { useSyncExternalStore } from "react";
import { Banco, type StatusSalvamento } from "../../services/banco";
import { sair, usarSessao } from "../../services/sessao";
import { cx } from "../../utils/classes";
import { textoContagem } from "./calculo";
import { LogoTipo } from "./LogoTipo";
import { Sol } from "./Sol";
import type { Base } from "./tipos";
import { gruposDoMenu, type IrPara, type Vista } from "./vista";

function usarStatusBanco(): StatusSalvamento {
  return useSyncExternalStore((cb) => Banco.aoMudarStatus(cb), () => Banco.statusAtual());
}

const COR_PONTO: Record<StatusSalvamento["classe"], string> = {
  "": "cdf:bg-lateral-fraco", ok: "cdf:bg-logo", sv: "cdf:bg-conversa", er: "cdf:bg-destaque",
};

const ITEM =
  "cdf:flex cdf:w-full cdf:cursor-pointer cdf:items-baseline cdf:justify-between cdf:gap-2 cdf:whitespace-nowrap cdf:rounded-lg cdf:border-0 cdf:border-l-4 cdf:border-solid cdf:border-transparent cdf:bg-transparent cdf:px-2.5 cdf:py-[9px] cdf:text-left cdf:text-[15px] cdf:text-lateral-texto cdf:no-underline cdf:hover:bg-lateral-ativo";

const LISTA = "cdf:m-0 cdf:flex cdf:list-none cdf:gap-1 cdf:p-0 cdf:md:flex-col cdf:md:gap-0.5";

/** Título de grupo do menu: só no desktop, em caixa alta pequena. */
const GRUPO = "cdf:m-0 cdf:hidden cdf:px-2.5 cdf:pb-1 cdf:pt-3 cdf:text-[11px] cdf:font-semibold cdf:uppercase cdf:tracking-[.14em] cdf:text-lateral-fraco cdf:md:block";

interface Props { base: Base; vista: Vista; irPara: IrPara }

export function MenuLateral({ base, vista, irPara }: Props) {
  const status = usarStatusBanco();
  const sessao = usarSessao();
  const { parametros } = base.pagina;
  const contagem = textoContagem(parametros.inicio);

  const grupos = gruposDoMenu(base.pagina.nucleos);

  const item = (id: Vista, nome: string) => (
    <li key={id}>
      <button
        className={cx(ITEM, vista === id && "cdf:border-logo cdf:bg-lateral-ativo cdf:font-bold")}
        aria-current={vista === id ? "page" : undefined}
        onClick={() => irPara(id)}
      >
        <span>{nome}</span>
      </button>
    </li>
  );

  return (
    <aside className="cdf:relative cdf:isolate cdf:flex cdf:flex-col cdf:gap-3 cdf:overflow-hidden cdf:bg-lateral cdf:px-3.5 cdf:py-4 cdf:text-lateral-texto cdf:md:sticky cdf:md:top-0 cdf:md:h-dvh cdf:md:gap-[22px] cdf:md:overflow-x-hidden cdf:md:overflow-y-auto cdf:md:px-[18px] cdf:md:pb-6 cdf:md:pt-[30px]">
      <Sol />

      <div className="cdf:px-1.5 cdf:text-logo">
        {parametros.logo
          ? <img src={parametros.logo} alt="Caminhos do Forró" className="cdf:block cdf:max-h-[110px] cdf:max-w-[200px]" />
          : <LogoTipo className="cdf:text-[30px] cdf:md:text-[46px]" />}
        <span className="cdf:mt-2.5 cdf:block cdf:text-[11.5px] cdf:font-semibold cdf:uppercase cdf:tracking-[.14em] cdf:text-lateral-fraco">Central do festival</span>
      </div>

      {contagem && (
        <p className="cdf:m-0 cdf:flex cdf:items-baseline cdf:gap-2 cdf:border-y cdf:border-solid cdf:border-white/15 cdf:px-1.5 cdf:py-2 cdf:text-sm cdf:text-lateral-fraco cdf:md:block cdf:md:py-3.5" aria-live="polite">
          {contagem.numero && (
            <strong className="cdf:font-display cdf:text-[34px] cdf:font-black cdf:leading-[.95] cdf:text-logo cdf:md:mb-0.5 cdf:md:block cdf:md:text-giant">{contagem.numero}</strong>
          )}
          {contagem.texto}
        </p>
      )}

      {/* No celular as seções rolam de lado; no desktop o menu não rola sozinho (a barra inteira rola). */}
      <nav aria-label="Seções" className="cdf:flex cdf:gap-1 cdf:overflow-x-auto cdf:md:block cdf:md:shrink-0 cdf:md:overflow-visible">
        {grupos.map((g, i) => (
          <section key={g.titulo} aria-label={g.titulo} className={cx("cdf:flex cdf:gap-1 cdf:md:block", i > 0 && "cdf:md:mt-1.5 cdf:md:border-t cdf:md:border-solid cdf:md:border-white/15")}>
            <h2 className={GRUPO}>{g.titulo}</h2>
            <ul className={LISTA}>
              {g.itens.map((n) => item(n.id, n.nome))}
              {i === grupos.length - 1 && <li><a className={ITEM} href="/">← Central</a></li>}
            </ul>
          </section>
        ))}
      </nav>

      <div className="cdf:mt-auto cdf:hidden cdf:px-1.5 cdf:text-[12.5px] cdf:text-lateral-fraco cdf:md:block">
        <p className="cdf:m-0 cdf:flex cdf:items-center cdf:gap-1.5">
          <span className={cx("cdf:inline-block cdf:h-2 cdf:w-2 cdf:rounded-full", COR_PONTO[status.classe])} />
          {status.texto}
        </p>
        {sessao.usuario && (
          <button className="cdf:mt-1 cdf:cursor-pointer cdf:border-0 cdf:bg-transparent cdf:p-0 cdf:text-[12.5px] cdf:text-lateral-fraco cdf:underline" onClick={() => void sair()}>
            sair ({sessao.usuario.email})
          </button>
        )}
        <p className="cdf:m-0 cdf:mt-3">Versão MVP: fases 0 a 5<br />Identidade visual: Ana Colier</p>
      </div>
    </aside>
  );
}
