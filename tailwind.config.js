/* Branding da Central do Coletivo: cores, fontes e tamanhos de fonte.
   É a única fonte desses valores. As telas usam as classes geradas daqui
   (bg-card, text-muted, text-sm, font-mono...). Cada página própria de outra
   empresa tem o config dela na pasta dela (ver src/paginas/sambadeponta). */
export default {
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",

      // texto
      ink: "#221E1B",
      muted: "#6E655D",
      faint: "#9A9089",

      // superfícies
      bg: "#F6F2EC",
      card: "#FFFFFF",
      sand: "#F0EAE1",
      line: { DEFAULT: "#E7DFD5", strong: "#D5CBBE" },

      // marca
      brand: { DEFAULT: "#1F2A33", soft: "#AEB8C0", faint: "#7E8A93" },
      accent: { DEFAULT: "#E4572E", soft: "#FBE7DF", ink: "#B8431F" },
      gold: "#D9A441",

      // estados
      ok: { DEFAULT: "#2E9E5B", soft: "#E1F1E7", ink: "#1E6E3E" },
      no: { DEFAULT: "#C0392B", soft: "#F7E4E1", ink: "#992217" },
      warn: { DEFAULT: "#E08A1E", soft: "#FBEED8", ink: "#8A5A12" },

      // esferas dos editais
      fed: "#5B6CB4",
      est: "#2E9E8E",
      mun: "#C87A2B",
      priv: "#8E5AA6",

      // formulário do projeto e contexto
      code: { DEFAULT: "#4A5A8A", soft: "#EEF1F8" },
      vazio: "#B8B0A8",
      rev: { DEFAULT: "#2E7DB8", soft: "#DCEBF6" },
      proib: { DEFAULT: "#B3261E", soft: "#F9E3E1" },
      obrig: { DEFAULT: "#7B2D4E", soft: "#F3E3EA" },
      prior: { DEFAULT: "#1F6B8C", soft: "#DDEBF2" },
      estilo: { DEFAULT: "#5B5F9E", soft: "#E5E6F4" },
      dica: { DEFAULT: "#4E7A44", soft: "#E2EEDF" },
    },
    fontFamily: {
      sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      mono: ["ui-monospace", "Menlo", "Consolas", "monospace"],
    },
    // base = corpo do site (14px). O resto desce e sobe a partir dele.
    fontSize: {
      "3xs": "10px",
      "2xs": "11px",
      xs: "12px",
      sm: "13px",
      base: "14px",
      lg: "16px",
      xl: "18px",
      "2xl": "20px",
      "3xl": "24px",
      "4xl": "28px",
    },
    extend: {
      boxShadow: {
        card: "0 1px 2px rgba(34,30,27,.05), 0 4px 14px rgba(34,30,27,.05)",
        modal: "0 20px 60px rgba(0,0,0,.3)",
      },
    },
  },
};
