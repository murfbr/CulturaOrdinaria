/* Barra de ferramentas: nota sobre o modo de salvamento + os modais de
   exportar (pacote completo ou planilhas por coleção) e importar (pacote .json
   ou planilha .csv, com prévia antes de gravar). */
import { useState } from "react";
import { Banco } from "../../services/banco";
import { ModalExportar } from "../ferramentas/ModalExportar";
import { ModalImportar } from "../ferramentas/ModalImportar";
import { Botao } from "../ui/Botao";

export function BarraFerramentas() {
  const [modal, setModal] = useState<"" | "exportar" | "importar">("");

  return (
    <div className="mx-auto mt-3 flex max-w-[1200px] flex-wrap items-center gap-2.5 px-[18px]">
      <span className="text-xs text-faint">
        {Banco.modo === "nuvem"
          ? "Tudo o que você edita aqui fica salvo no banco do coletivo e aparece para quem mais estiver no site. Exportar baixa backup completo ou planilhas; Importar aceita .json e .csv."
          : "Sem Firebase configurado: tudo fica salvo só neste navegador. Configure o .env para sincronizar com o coletivo."}
      </span>
      <span className="ml-auto flex gap-2">
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => setModal("exportar")}>⤓ Exportar</Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => setModal("importar")}>⤒ Importar</Botao>
      </span>
      {modal === "exportar" && <ModalExportar aoFechar={() => setModal("")} />}
      {modal === "importar" && <ModalImportar aoFechar={() => setModal("")} />}
    </div>
  );
}
