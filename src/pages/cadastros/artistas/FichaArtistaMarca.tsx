/* Sub-aba Marca da ficha do artista: manual de marca (cores, logo, fonte,
   observações e link do manual), fotos (contagem e pasta no Drive) e links. */
import { BlocoEditavel } from "../../../components/BlocoEditavel";
import { ESTILO_CONTROLE } from "../../../components/ui/Campo";
import { Dado, Dados } from "../../../components/ui/Dados";
import { Dica } from "../../../components/ui/Dica";
import { Painel } from "../../../components/ui/Painel";
import { ESTILO_LINK } from "../../../components/ui/estilos";
import { url } from "../../../utils";
import { cx } from "../../../utils/classes";
import { LinhaMarcada, VAZIO_ACERVO, linhasDe, partes, type PropsAcervo } from "./FichaArtistaBase";

export function FichaArtistaMarca({ d, alterarDet }: PropsAcervo) {
  const m = d.marca;
  return (
    <>
      <BlocoEditavel titulo="Manual de marca"
        dica='linhas "cores:" (vírgula), "logo:", "fonte:", "obs:" e "manual:" (link do manual completo)'
        valor={[
          "cores: " + (m?.cores || []).join(", "),
          "logo: " + (m?.logo || ""),
          "fonte: " + (m?.fonte || ""),
          "obs: " + (m?.obs || ""),
          "manual: " + (m?.manual || ""),
        ].join("\n")}
        aoSalvar={(t) => alterarDet((det) => {
          const marca = { cores: [] as string[], logo: "", fonte: "", obs: "", ...(det.marca || {}) };
          linhasDe(t).forEach((l) => {
            const dois = l.indexOf(":");
            if (dois < 0) return;
            const chave = l.slice(0, dois).trim().toLowerCase();
            const valor = l.slice(dois + 1).trim();
            if (chave === "cores") marca.cores = valor.split(",").map((x) => x.trim()).filter(Boolean);
            else if (chave === "logo") marca.logo = valor;
            else if (chave === "fonte") marca.fonte = valor;
            else if (chave === "obs") marca.obs = valor;
            else if (chave === "manual") marca.manual = valor;
          });
          det.marca = marca;
        })}>
        {m ? (
          <>
            <div className="mb-3.5 flex flex-wrap gap-3">
              {(m.cores || []).map((c) => (
                <span className="inline-flex flex-col items-center gap-1" key={c}>
                  {/* a cor vem do manual de marca do artista: não há token para ela */}
                  <span className="size-[52px] rounded-lg border border-ink/10" style={{ background: c }} />
                  <span className="text-2xs text-muted">{c}</span>
                </span>
              ))}
            </div>
            <Dados>
              <Dado rotulo="Logo" forte>{m.logo}</Dado>
              <Dado rotulo="Tipografia" forte>{m.fonte}</Dado>
              <Dado rotulo="Observações">{m.obs}</Dado>
              {m.manual && <Dado rotulo="Manual"><a className={ESTILO_LINK} href={url(m.manual)} target="_blank" rel="noopener noreferrer">abrir ↗</a></Dado>}
            </Dados>
          </>
        ) : VAZIO_ACERVO}
      </BlocoEditavel>

      <Painel titulo="Fotos">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Dica>quantidade no acervo:</Dica>
          <input type="number" min={0} className={cx("w-[90px] flex-none", ESTILO_CONTROLE)} value={d.fotos || 0}
            onChange={(e) => alterarDet((det) => { det.fotos = Math.max(0, Number(e.target.value) || 0); }, false)} />
          <input className={cx("min-w-0 flex-1", ESTILO_CONTROLE)} value={m?.pastaFotos || ""} placeholder="link da pasta de fotos no Drive"
            onChange={(e) => alterarDet((det) => {
              det.marca = { cores: [], logo: "", fonte: "", obs: "", ...(det.marca || {}), pastaFotos: e.target.value };
            }, false)} />
          {m?.pastaFotos && <a className={cx(ESTILO_LINK, "text-xs")} href={url(m.pastaFotos)} target="_blank" rel="noopener noreferrer">abrir ↗</a>}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
          {Array.from({ length: Math.min(d.fotos || 0, 12) }).map((_, i) => (
            <div key={i} className="flex aspect-[4/3] items-end rounded-lg bg-gradient-to-br from-mun to-priv p-2 text-2xs font-semibold text-white even:from-est even:to-fed [&:nth-child(3n)]:from-accent [&:nth-child(3n)]:to-gold">
              Foto {i + 1}
            </div>
          ))}
        </div>
        <Dica className="mt-2.5">Contagem de referência: as fotos em si vivem na pasta do Drive.</Dica>
      </Painel>

      <BlocoEditavel titulo="Links" dica='por linha: rótulo | url (ex.: "Instagram | instagram.com/bloco")'
        valor={(d.links || []).map((l) => l.rotulo + " | " + l.url).join("\n")}
        aoSalvar={(t) => alterarDet((det) => {
          det.links = linhasDe(t).map((l) => {
            const p = partes(l);
            return { rotulo: p[0] || "link", url: p.slice(1).join(" | ") };
          });
        })}>
        {(d.links || []).length ? (d.links || []).map((l, i) => (
          <LinhaMarcada key={i} marca="↗" estreita>
            <b>{l.rotulo}</b>{" "}
            <a className="break-all text-muted hover:underline" href={url(l.url)} target="_blank" rel="noopener noreferrer">{l.url}</a>
          </LinhaMarcada>
        )) : VAZIO_ACERVO}
      </BlocoEditavel>
    </>
  );
}
