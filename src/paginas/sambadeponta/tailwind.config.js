/* Branding do Samba de Ponta (festa Ponta de Lança): cores, fontes e tamanhos
   da página /sambadeponta/. Independente do config da Central. As classes
   saem com o prefixo sdp: (sdp:bg-card, sdp:font-display) e a versão escura
   de cada cor termina em -dark, para usar com dark: (sdp:dark:bg-card-dark). */
export default {
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",

      // marca
      green: "#006837",
      lime: "#97C230",
      cream: { DEFAULT: "#FFFFCB", dark: "#F4F4C4" },
      dark: "#00311B",

      // superfícies e texto (claro / escuro)
      paper: { DEFAULT: "#F5F7F2", dark: "#0D1812" },
      card: { DEFAULT: "#FFFFFF", dark: "#15241B" },
      zebra: { DEFAULT: "#F5FAF1", dark: "#182A20" },
      ink: { DEFAULT: "#0B1F16", dark: "#E9F0E6" },
      muted: { DEFAULT: "#63736A", dark: "#9DAEA2" },
      line: { DEFAULT: "#DCE4DA", dark: "#26382D" },
      nav: { DEFAULT: "#006837", dark: "#03301C" },
      input: { DEFAULT: "#FFFFFF", dark: "#0F1C15", line: "#B9C7BC", "line-dark": "#3B5044" },

      // estados
      red: { DEFAULT: "#B23A2E", soft: "#F9E4E1", dark: "#F08A7C", "soft-dark": "#3A1E1B" },
      amber: { DEFAULT: "#9A6212", soft: "#FBEEDC", dark: "#E8B45A", "soft-dark": "#3A2B12" },
      ok: { DEFAULT: "#3D6B16", soft: "#E4F0DA", dark: "#B9E07A", "soft-dark": "#1F3A17" },
    },
    fontFamily: {
      sans: ["Poppins", "Segoe UI", "system-ui", "sans-serif"],
      display: ["Anton", "Poppins", "sans-serif"],
    },
    // base = corpo da página (14px). display, hero e giant são os títulos Anton.
    fontSize: {
      "3xs": "10px",
      "2xs": "11px",
      xs: "12px",
      sm: "13px",
      base: "14px",
      lg: "16px",
      xl: "18px",
      "2xl": "22px",
      "3xl": "28px",
      display: "34px",
      hero: "46px",
      giant: "64px",
    },
    extend: {
      boxShadow: {
        card: "0 6px 24px rgba(0,49,27,.10)",
        "card-dark": "0 6px 24px rgba(0,0,0,.35)",
      },
    },
  },
};
