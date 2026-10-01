/* O que está carregado na base: registros e "a revisar" por coleção, e o
   "Baixar a base em JSON" do artefato (mesmo formato, mais simulador e
   núcleos no config). */
import { baixarArquivo } from "../../../utils";
import { hojeIso } from "../calculo";
import { COLECOES, ROTULO_COLECAO, type Base } from "../tipos";
import { Bloco } from "../ui/Bloco";
import { Botao } from "../ui/Botao";
import { NUM, Tabela, Td, Th } from "../ui/Tabela";

function exportar(base: Base) {
  const { listas, nucleos, parametros, simulador } = base.pagina;
  const dados: Record<string, unknown> = { exportadoEm: new Date().toISOString(), config: { listas, nucleos, parametros, simulador } };
  for (const c of COLECOES) dados[c] = base[c];
  baixarArquivo("caminhos-do-forro-base-" + hojeIso() + ".json", JSON.stringify(dados, null, 2));
}

export function DadosNaBase({ base }: { base: Base }) {
  return (
    <Bloco titulo="Dados na base">
      <Tabela>
        <thead>
          <tr><Th>Conjunto</Th><Th className={NUM}>Registros</Th><Th className={NUM}>A revisar</Th></tr>
        </thead>
        <tbody>
          {COLECOES.map((c) => {
            const v = Object.values(base[c]) as { revisar?: boolean }[];
            const rev = v.filter((d) => d.revisar).length;
            return (
              <tr key={c}>
                <Td>{ROTULO_COLECAO[c]}</Td>
                <Td className={NUM}>{v.length}</Td>
                <Td className={NUM}>{rev || "—"}</Td>
              </tr>
            );
          })}
        </tbody>
      </Tabela>
      <p className="cdf:mb-2.5 cdf:mt-3.5 cdf:text-sm cdf:text-fraco">Para levar a base para outro lugar, baixe tudo num arquivo JSON com as mesmas coleções.</p>
      <Botao onClick={() => exportar(base)}>Baixar a base em JSON</Botao>
    </Bloco>
  );
}
