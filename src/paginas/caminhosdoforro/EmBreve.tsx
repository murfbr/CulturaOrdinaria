/* Aviso no lugar de uma vista que ainda não existe: as da Fase 6 do artefato
   (Painel geral, Apresentações, Contexto) e as que chegam nas próximas etapas
   da construção da página. */
import type { Base } from "./tipos";
import { CabecalhoVista } from "./ui/CabecalhoVista";
import { DOCUMENTO_DE_TRABALHO, ETAPA_DA_VISTA, FUTURAS, TITULOS, type Vista } from "./vista";

export function EmBreve({ vista, base }: { vista: Vista; base: Base }) {
  const futura = FUTURAS[vista];
  const [titulo, lead] = TITULOS[vista] || [vista, ""];
  const etapa = ETAPA_DA_VISTA[vista];
  const n = (etapa?.colecoes || []).reduce((t, c) => t + Object.keys(base[c]).length, 0);
  return (
    <>
      <CabecalhoVista titulo={futura ? futura.titulo : titulo} lead={futura ? futura.texto : lead} />
      <div className="cdf:mt-6 cdf:max-w-[720px] cdf:rounded-xl cdf:border cdf:border-dashed cdf:border-linha cdf:bg-superficie cdf:p-6 cdf:[&_p]:m-0 cdf:[&_p+p]:mt-2.5">
        {futura ? (
          <>
            <p><strong>Esta tela chega na Fase {futura.fase}.</strong></p>
            <p>Até lá, use o <a href={DOCUMENTO_DE_TRABALHO} target="_blank" rel="noopener">documento de trabalho atual</a>.</p>
          </>
        ) : (
          <>
            <p><strong>Esta tela chega na etapa {etapa?.etapa} da construção da página.</strong></p>
            {n > 0 && <p>Os {n} registros já estão carregados na base e vão aparecer aqui.</p>}
          </>
        )}
      </div>
    </>
  );
}
