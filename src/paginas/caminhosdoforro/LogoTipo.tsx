/* A marca tipográfica provisória ("Caminhos / do — Forró", Barlow Condensed
   com o filtro "grunge"), usada enquanto não há a logo oficial por link. O
   tamanho vem de fora, pela classe de fonte. */
import { cx } from "../../utils/classes";

export function LogoTipo({ className }: { className?: string }) {
  return (
    <span
      role="img" aria-label="Caminhos do Forró"
      className={cx("cdf:inline-flex cdf:flex-col cdf:font-logo cdf:font-bold cdf:uppercase cdf:leading-[.86] cdf:tracking-[.005em] cdf:[filter:url(#cdf-grunge)]", className)}
    >
      <span>Caminhos</span>
      <span className="cdf:flex cdf:items-end cdf:gap-[.06em]">
        <span className="cdf:pb-[.08em] cdf:text-[.6em] cdf:normal-case cdf:italic cdf:leading-none">do</span>
        <span className="cdf:mb-[.1em] cdf:inline-block cdf:h-[.075em] cdf:w-[.62em] cdf:bg-current" aria-hidden="true" />
        <span>Forró</span>
      </span>
    </span>
  );
}
