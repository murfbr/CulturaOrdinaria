/* Cor de cada referência nos gráficos, pela posição dela na rodada (a ordem das
   colunas do "Lado a lado"). Paleta categórica validada contra o cartão da
   Central (#FBF7F0): luminosidade, croma e separação para daltonismo passam;
   contraste fica abaixo de 3:1 em duas cores, então todo gráfico tem legenda
   com nome e a tabela ao lado. A cor marca o ponto, nunca o texto. */
export const CORES_REFERENCIA = ["#2a78d6", "#eb6834", "#1baf7a", "#6250d6", "#e87ba4", "#eda100", "#008300", "#e34948"];

/** Cor da referência na posição i (depois da 8ª, cinza: vira "outros"). */
export const corDa = (i: number) => CORES_REFERENCIA[i] ?? "#8A7E88";

/** Fio dos eixos e da grade: um passo fora do cartão. */
export const COR_GRADE = "#D9CFC0";
export const COR_EIXO = "#8A7E88";
export const COR_TEXTO = "#574D59";
export const COR_SUPERFICIE = "#FBF7F0";
