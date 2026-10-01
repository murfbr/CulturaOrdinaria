/* Branding do Festival Caminhos do Forró (identidade visual: Ana Colier):
   cores, fontes e tamanhos da página /caminhosdoforro/. Independente do
   config da Central. As classes saem com o prefixo cdf: (cdf:bg-superficie,
   cdf:font-display). As cinco cores da marca são fixas; as outras são tokens
   (var(--cdf-…)) com valor claro e escuro em estilos.css, então as classes
   não precisam de dark:. */
export default {
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",

      // as cinco cores da marca
      marca: { laranja: "#E55B28", terra: "#8B3226", marfim: "#F5F1EA", limao: "#E0D24A", azul: "#2A96A7" },

      // superfícies e texto (claro e escuro em estilos.css)
      fundo: "var(--cdf-fundo)",
      superficie: { DEFAULT: "var(--cdf-superficie)", 2: "var(--cdf-superficie-2)" },
      tinta: { DEFAULT: "var(--cdf-tinta)", 2: "var(--cdf-tinta-2)" },
      fraco: "var(--cdf-fraco)",
      linha: "var(--cdf-linha)",
      primaria: { DEFAULT: "var(--cdf-primaria)", texto: "var(--cdf-primaria-texto)", suave: "var(--cdf-primaria-suave)" },
      destaque: "var(--cdf-destaque)",
      link: "var(--cdf-link)",
      erro: "var(--cdf-erro)",

      // barra lateral
      lateral: { DEFAULT: "var(--cdf-lateral)", texto: "var(--cdf-lateral-texto)", fraco: "var(--cdf-lateral-fraco)", ativo: "var(--cdf-lateral-ativo)" },
      logo: "var(--cdf-logo)",
      sol: "var(--cdf-sol)",

      // status de contato e etapas do funil (texto e fundo)
      contatar: { DEFAULT: "var(--cdf-st-contatar)", bg: "var(--cdf-st-contatar-bg)" },
      conversa: { DEFAULT: "var(--cdf-st-conversa)", bg: "var(--cdf-st-conversa-bg)" },
      conf: { DEFAULT: "var(--cdf-st-conf)", bg: "var(--cdf-st-conf-bg)" },
      rec: { DEFAULT: "var(--cdf-st-rec)", bg: "var(--cdf-st-rec-bg)" },
    },
    fontFamily: {
      sans: ["Outfit", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      display: ["Londrina Solid", "Arial Rounded MT Bold", "Trebuchet MS", "sans-serif"],
      logo: ["Barlow Condensed", "Arial Narrow", "sans-serif"],
    },
    // base = corpo da página (15px). display, hero e giant são os títulos Londrina.
    fontSize: {
      xs: "12px",
      sm: "13.5px",
      base: "15px",
      md: "16px",
      lg: "18px",
      xl: "21px",
      "2xl": "26px",
      "3xl": "30px",
      display: "34px",
      hero: "48px",
      giant: "64px",
    },
    extend: {
      boxShadow: {
        card: "var(--cdf-sombra)",
      },
    },
  },
};
