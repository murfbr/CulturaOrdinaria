/* Branding da festa Ponta de Lança (página /pontadelanca/): os tokens do
   design system da festa (https://claude.ai/artifact/7T25Qu7QpgEifbDSGyhszC),
   independentes do config da Central. As classes saem com o prefixo sdp:
   (sdp:bg-verde, sdp:font-display). Sem modo escuro: a festa não tem.
   Hoje nenhuma tela usa estas classes (o CSS em estilos.css ainda é o do
   artefato, com as mesmas cores); quando migrar, já nasce com a marca certa. */
export default {
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",

      // paleta da festa (proporção do manual: verde e marfim 30% cada, marrom 20%, pistache e turquesa 10%)
      verde: "#227C51",
      marfim: "#F5F1EA",
      marrom: "#715142",
      pistache: "#B6C075",
      turquesa: "#AED3CC",
      tinta: "#443E37",

      // superfícies e texto do painel (neutros derivados, fora da paleta)
      card: "#FFFDF8",
      zebra: "#F7F2EA",
      nota: "#EDE6D8",
      muted: "#6E655C",
      line: "#E3DCCF",
      input: { DEFAULT: "#FFFDF8", line: "#9A8D7C" },

      // estados (fora da paleta, de propósito: negativo continua vermelho)
      red: { DEFAULT: "#B23A2E", soft: "#F7E1DB" },
      amber: { DEFAULT: "#8A5A10", soft: "#F8EBD6" },
      ok: { DEFAULT: "#1F6B45", soft: "#E2EEE5" },
    },
    fontFamily: {
      sans: ["Poppins", "Segoe UI", "system-ui", "sans-serif"],
      // Better Faster quando a licença web chegar; até lá, Permanent Marker.
      display: ["Better Faster", "Permanent Marker", "Arial Narrow", "sans-serif"],
    },
    // base = corpo do painel (14px). display e hero são os títulos de pincel.
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
      display: "36px",
      hero: "52px",
      giant: "92px",
    },
    extend: {
      borderRadius: {
        cartao: "16px",
        painel: "26px",
      },
    },
  },
};
