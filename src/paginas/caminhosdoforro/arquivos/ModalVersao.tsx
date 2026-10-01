/* Nova versão de um cartão de arquivo: enviar um arquivo (Storage, só em
   modo nuvem) ou colar um link, mais o nome da versão e a data. O upload
   roda ao salvar; o modal fica "Enviando…" até terminar. */
import { useState } from "react";
import { toast } from "../../../components/Toast";
import { emailSessao } from "../../../services/sessao";
import { clonar } from "../../../utils";
import { hojeIso } from "../calculo";
import { gravar } from "../dados";
import type { ArquivoBase, ArquivoGuardado, VersaoArquivo } from "../tipos";
import { linkValido } from "../ui/Arquivo";
import { Campo, Entrada, Grupo } from "../ui/Campo";
import { LINHA_INTEIRA, Modal } from "../ui/Modal";
import { Segmentado } from "../ui/Segmentado";
import { enviarArquivo, temStorage } from "./armazenamento";

interface Props { cartao: ArquivoBase; aoFechar: () => void }

export function ModalVersao({ cartao, aoFechar }: Props) {
  const comStorage = temStorage();
  const [modo, setModo] = useState<"arquivo" | "link">(comStorage ? "arquivo" : "link");
  const [versao, setVersao] = useState("v" + (cartao.versoes.length + 1));
  const [data, setData] = useState(hojeIso());
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    const v = versao.trim();
    if (!v) { toast("Dê um nome à versão (v1, V12, final…)."); return; }
    let guardado: ArquivoGuardado;
    if (modo === "arquivo") {
      if (!arquivo) { toast("Escolha o arquivo."); return; }
      setEnviando(true);
      try { guardado = await enviarArquivo(cartao.id, v, arquivo); }
      catch { setEnviando(false); toast("Não foi possível enviar o arquivo. Confira a conexão e as regras do Storage."); return; }
      setEnviando(false);
    } else {
      if (!link.trim()) { toast("Cole o link do arquivo."); return; }
      if (!linkValido(link)) { toast("O link precisa começar com http:// ou https://"); return; }
      guardado = { tipo: "link", url: link.trim() };
    }
    const nova: VersaoArquivo = { versao: v, data: data || hojeIso(), por: emailSessao(), arquivo: guardado };
    gravar("arquivos", { ...clonar(cartao), versoes: [...cartao.versoes, nova] });
    aoFechar();
    toast("Versão " + v + " guardada.");
  }

  return (
    <Modal titulo={"Nova versão: " + cartao.nome} aoFechar={aoFechar} aoSalvar={() => void salvar()} ocupado={enviando}>
      <Grupo rotulo="Como guardar" className={LINHA_INTEIRA}>
        <Segmentado rotulo="Como guardar" opcoes={[["arquivo", "Enviar arquivo"], ["link", "Colar link"]]} valor={modo} aoMudar={setModo} />
        {!comStorage && <p className="cdf:m-0 cdf:mt-1.5 cdf:text-sm cdf:text-fraco">Em modo local não há Storage: só link (Drive, por exemplo).</p>}
      </Grupo>
      {modo === "arquivo" ? (
        <Campo rotulo="Arquivo (PDF, PPTX, DOCX, XLSX, imagem…)" className={LINHA_INTEIRA}>
          <Entrada type="file" disabled={!comStorage} onChange={(e) => setArquivo(e.target.files?.[0] || null)} className="cdf:cursor-pointer cdf:py-1.5" />
        </Campo>
      ) : (
        <Campo rotulo="Link do arquivo" className={LINHA_INTEIRA}><Entrada autoFocus type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" /></Campo>
      )}
      <Campo rotulo="Versão"><Entrada value={versao} onChange={(e) => setVersao(e.target.value)} placeholder="v1, V12, final…" /></Campo>
      <Campo rotulo="Data"><Entrada type="date" value={data} onChange={(e) => setData(e.target.value)} /></Campo>
    </Modal>
  );
}
