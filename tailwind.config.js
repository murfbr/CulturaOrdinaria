/* Branding da Central do Coletivo (identidade de 07/10/2026): a única fonte
   de cores, fontes, tamanhos, raios, bordas, sombras, larguras e camadas.
   As telas usam as classes geradas daqui (bg-card, text-muted, text-sm,
   rounded-md, max-w-site, z-toast...). O que se repete em aparência vira
   bloco em src/components/ui/; a tela só compõe. Cada página própria de
   outra empresa tem o config dela na pasta dela (ver src/paginas). */
export default {
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",

      // texto
      ink: { DEFAULT: "#1F1A1E", hover: "#3A3038" },
      muted: "#574D59",
      faint: "#6E6270",
      // texto sobre fundo cheio (botão preto, item ativo do menu)
      "on-fill": "#F4EEE4",

      // superfícies
      bg: { DEFAULT: "#F4EEE4", sunk: "#EDE5D8", hover: "#E2D8C8" },
      card: "#FBF7F0",
      field: "#FFFDF9",
      overlay: "rgba(31, 26, 30, 0.5)",

      // linhas e detalhes
      line: { DEFAULT: "#D9CFC0", strong: "#8A7E88" },
      shade: "#C9BDAC",
      gold: "#D98B1F",

      // marca e estados (o vermelho diz "estou aqui", ligação e reprovado)
      accent: { DEFAULT: "#B3261E", soft: "#FBE7DF" },
      ok: { DEFAULT: "#006C4D", soft: "#D5EFE2" },
      warn: { DEFAULT: "#8A5A12", soft: "#FFEBD2" },
      no: { DEFAULT: "#B3261E", soft: "#FBE7DF" },

      // esferas dos editais
      fed: { DEFAULT: "#6E519D", soft: "#EBE4FA" },
      est: { DEFAULT: "#1F6B8C", soft: "#DDEBF2" },
      mun: { DEFAULT: "#8C541F", soft: "#F3E8DC" },
      priv: { DEFAULT: "#884B75", soft: "#F3E3EA" },
    },
    fontFamily: {
      sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "Helvetica", "Arial", "sans-serif"],
      mono: ["IBM Plex Mono", "ui-monospace", "Menlo", "monospace"],
      // "letra de cartaz": títulos de página, de seção, de ficha e de modal, e a marca
      display: ["Alfa Slab One", "Rockwell", "Georgia", "serif"],
    },
    // Uso: 3xs rótulo mono em caixa alta (eyebrow); 2xs selo; xs legenda;
    // sm texto auxiliar; base corpo; lg controles e menu; xl leitura corrida;
    // 2xl título de cartão; 3xl marca; 4xl título de seção; 5xl número grande
    // e título de ficha ou modal; 6xl título de página.
    fontSize: {
      "3xs": ["10.5px", { lineHeight: "14px", letterSpacing: "0.12em" }],
      "2xs": ["10.5px", { lineHeight: "14px", letterSpacing: "0.04em" }],
      xs: ["12px", { lineHeight: "16px" }],
      sm: ["12.5px", { lineHeight: "18px" }],
      base: ["13.5px", { lineHeight: "1.5" }],
      lg: ["14px", { lineHeight: "20px" }],
      xl: ["15px", { lineHeight: "1.65" }],
      "2xl": ["16px", { lineHeight: "20px" }],
      "3xl": ["18px", { lineHeight: "19px" }],
      "4xl": ["22px", { lineHeight: "26px" }],
      "5xl": ["26px", { lineHeight: "30px" }],
      "6xl": ["34px", { lineHeight: "36px" }],
    },
    // Cantos retos: sm 2 (selos), md 4 (tudo o mais), pill (chips e KPIs).
    // lg, xl e 2xl existem só para absorver usos antigos; código novo não os usa.
    borderRadius: {
      none: "0",
      sm: "2px",
      DEFAULT: "4px",
      md: "4px",
      lg: "4px",
      xl: "4px",
      "2xl": "4px",
      pill: "999px",
      full: "9999px",
    },
    extend: {
      borderWidth: {
        hair: "1px",
        rule: "2px",
        stamp: "3px",
      },
      // Sombra só no modal (dura, deslocada). Nada mais tem sombra.
      boxShadow: {
        hard: "5px 5px 0 #C9BDAC",
        "hard-sm": "3px 3px 0 #C9BDAC",
        foco: "0 0 0 2px #F4EEE4, 0 0 0 4px #1F1A1E",
      },
      maxWidth: {
        site: "1200px",
        texto: "70ch",
      },
      spacing: {
        gutter: "18px",
        lateral: "232px",
        principal: "36px",
      },
      zIndex: {
        abas: "5",
        menu: "20",
        gaveta: "30",
        modal: "50",
        toast: "60",
      },
    },
  },
};
