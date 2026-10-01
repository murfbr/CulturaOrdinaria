/* Configuração do Vite: React + divisão de chunks no build.
   Sem a divisão, tudo vira um arquivo só de ~1,3 MB; separando as bibliotecas
   (React, Firebase) e os dados estáticos (formulários replicados, catálogos do
   Salic, sementes), cada parte é cacheada de forma independente pelo navegador
   e um deploy só invalida o que mudou. */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Caminho absoluto de um arquivo relativo a esta pasta. */
const aqui = (arquivo: string) => fileURLToPath(new URL(arquivo, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // O dev server aceita a porta via variável PORT (útil quando a 5173 está ocupada).
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    rollupOptions: {
      // Um HTML por endereço: a raiz (Central) e as páginas próprias, cada uma
      // com título, descrição, ícone e prévia de link (Open Graph) próprios. O
      // JavaScript é o mesmo; o App escolhe a página pelo caminho. Cada HTML
      // sai no dist no mesmo caminho em que está aqui (dist/sambadeponta/).
      input: {
        central: aqui("index.html"),
        sambadeponta: aqui("sambadeponta/index.html"),
        caminhosdoforro: aqui("caminhosdoforro/index.html"),
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("react")) return "vendor-react";
            return "vendor";
          }
          // Só os catálogos estáticos entram no chunk "dados" (carga inicial).
          // Sementes e formularios.json são import() dinâmico: cada um vira um
          // chunk próprio, baixado só na semeadura — agrupar aqui os traria de
          // volta ao carregamento inicial.
          if (id.includes("salic-dados.json") || id.includes("plataformas.json")) return "dados";
        },
      },
    },
  },
});
