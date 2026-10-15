/* Limite de erro da área de conteúdo: um erro de renderização em qualquer tela
   derruba só a tela, com a mensagem e um caminho de volta. Barra lateral,
   cabeçalho, busca e toast continuam de pé. Componente de classe porque o
   React só entrega getDerivedStateFromError e componentDidCatch em classe. */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { irParaAmbiente } from "../store/navegacao";
import { Botao } from "./ui/Botao";
import { Painel } from "./ui/Painel";

interface Props {
  /** Identifica a tela atual; quando muda, o limite esquece o erro e renderiza de novo. */
  rota: string;
  children: ReactNode;
}

interface Estado {
  erro: Error | null;
}

export class LimiteDeErro extends Component<Props, Estado> {
  state: Estado = { erro: null };

  static getDerivedStateFromError(erro: Error): Estado {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error("tela quebrou:", erro, info.componentStack);
  }

  componentDidUpdate(anterior: Props) {
    if (this.state.erro && anterior.rota !== this.props.rota) this.setState({ erro: null });
  }

  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;
    return (
      <Painel alerta titulo="Esta tela quebrou">
        <p className="m-0 mb-2 text-sm">
          Um erro impediu a tela de abrir. O resto da Central continua funcionando; o registro que
          causou isso pode ser corrigido por outra tela ou pela importação.
        </p>
        <pre className="m-0 mb-3 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted">{erro.message}</pre>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={() => this.setState({ erro: null })}>Tentar de novo</Botao>
          <Botao variante="fantasma" onClick={() => { irParaAmbiente("painel", "resumo"); this.setState({ erro: null }); }}>
            Voltar ao Resumo
          </Botao>
        </div>
      </Painel>
    );
  }
}
