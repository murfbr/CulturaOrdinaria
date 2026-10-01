/* Parâmetros do festival: meta de captação, primeiro e último dia e a logo
   (por link; no artefato era upload). Grava no documento da página ao
   salvar, como o artefato. O formulário remonta quando o que está salvo muda
   (key no pai), então o que outra pessoa salvou aparece aqui. */
import { useState, type FormEvent } from "react";
import { toast } from "../../../components/Toast";
import { alterarPagina } from "../dados";
import { LogoTipo } from "../LogoTipo";
import type { Parametros as ParametrosFestival } from "../tipos";
import { Bloco } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { Campo, Entrada } from "../ui/Campo";

export function Parametros({ parametros }: { parametros: ParametrosFestival }) {
  return (
    <Bloco titulo="Parâmetros do festival">
      <Formulario key={JSON.stringify(parametros)} parametros={parametros} />
    </Bloco>
  );
}

const CAIXA = "cdf:rounded-xl cdf:border cdf:border-solid cdf:border-linha cdf:bg-superficie cdf:p-4";

function Formulario({ parametros }: { parametros: ParametrosFestival }) {
  const [meta, setMeta] = useState(parametros.metaCaptacao == null ? "" : String(parametros.metaCaptacao));
  const [inicio, setInicio] = useState(parametros.inicio || "");
  const [fim, setFim] = useState(parametros.fim || "");
  const [logo, setLogo] = useState(parametros.logo || "");

  function salvar(ev: FormEvent) {
    ev.preventDefault();
    const url = logo.trim();
    if (url && !/^https?:\/\//i.test(url)) { toast("O link da logo precisa começar com http:// ou https://"); return; }
    alterarPagina((p) => {
      p.parametros = { metaCaptacao: meta === "" ? null : Number(meta), inicio: inicio || null, fim: fim || null, logo: url || null };
    });
    toast("Parâmetros salvos.");
  }

  return (
    <form onSubmit={salvar} className={"cdf:flex cdf:flex-wrap cdf:items-end cdf:gap-3 " + CAIXA}>
      <Campo rotulo="Meta de captação (R$)" className="cdf:basis-[200px]">
        <Entrada type="number" min={0} step={1000} value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="A definir" />
      </Campo>
      <Campo rotulo="Primeiro dia" className="cdf:basis-[200px]">
        <Entrada type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
      </Campo>
      <Campo rotulo="Último dia" className="cdf:basis-[200px]">
        <Entrada type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
      </Campo>
      <Botao type="submit" variante="primario">Salvar parâmetros</Botao>

      <div className="cdf:flex cdf:basis-full cdf:flex-wrap cdf:items-center cdf:gap-3.5 cdf:border-t cdf:border-solid cdf:border-linha cdf:pt-3">
        <div>
          <span className="cdf:mb-[5px] cdf:block cdf:text-sm cdf:font-bold cdf:text-tinta-2">Logo do festival</span>
          <div className="cdf:flex cdf:min-h-[70px] cdf:min-w-[180px] cdf:items-center cdf:rounded-[10px] cdf:bg-marca-terra cdf:px-4 cdf:py-3 cdf:text-marca-limao">
            {parametros.logo
              ? <img src={parametros.logo} alt="Caminhos do Forró" className="cdf:block cdf:max-h-[70px] cdf:max-w-[220px]" />
              : <LogoTipo className="cdf:text-[30px]" />}
          </div>
        </div>
        <Campo rotulo="Link da logo oficial (PNG ou SVG com fundo transparente)" className="cdf:flex-1 cdf:basis-[260px]">
          <Entrada type="url" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://… (vazio = versão tipográfica provisória)" />
        </Campo>
      </div>
    </form>
  );
}
