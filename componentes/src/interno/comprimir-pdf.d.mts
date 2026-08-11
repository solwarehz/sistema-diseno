/**
 * TIPOS DEL COMPRESOR DE PDF
 *
 * POR QUÉ EXISTE ESTE ARCHIVO. `comprimir-pdf.mjs` es `.mjs` a propósito —el
 * catálogo lo inserta tal cual en su página, y un `.ts` obligaría a compilarlo
 * aparte o a reescribirlo—, pero `index.ts` lo reexporta. Dentro del paquete
 * eso no se notaba: nuestro `tsconfig.json` lleva `allowJs`, así que
 * TypeScript le deduce los tipos del código.
 *
 * Fuera no. Un producto que compila con `noImplicitAny` y sin `allowJs`
 * —lo normal— resolvía `./interno/comprimir-pdf.mjs` desde nuestro propio
 * `index.ts` y se le caía con **TS7016**, aunque no usara el compresor: le
 * bastaba con importar cualquier componente del paquete.
 *
 * Lo reportó Control Administrativos V2.0 con el apaño que habían tenido que
 * hacer —nombrar el archivo en `files` de su `tsconfig.json`, porque `exclude`
 * no filtra— y pidiendo el arreglo bueno, que es este: la declaración viaja con
 * el paquete y el apaño se retira.
 *
 * Las firmas salen del JSDoc del propio `.mjs`. Si una cambia allí, cambia aquí
 * — y `tsc --noEmit` del paquete lo dice, porque con la declaración presente
 * TypeScript deja de mirar el `.mjs`.
 */

/** Un nombre del formato: `/Tipo`. No es una cadena, y confundirlos corrompe. */
export class Nombre {
  constructor(v: string);
  v: string;
}

/** Una referencia indirecta: `12 0 R`. */
export class Ref {
  constructor(num: number, gen: number);
  num: number;
  gen: number;
}

/** Una cadena literal o hexadecimal. Viaja en bytes: el PDF no es UTF-8. */
export class Cadena {
  constructor(bytes: Uint8Array, hex?: boolean);
  bytes: Uint8Array;
  hex: boolean;
}

/** Un flujo: su diccionario y sus datos. */
export class Flujo {
  constructor(dic: Map<string, ValorPdf>, datos: Uint8Array);
  dic: Map<string, ValorPdf>;
  datos: Uint8Array;
}

/**
 * Un valor cualquiera del grafo de objetos de un PDF.
 *
 * Los diccionarios y las listas se dejan permisivos a propósito: el grafo es
 * heterogéneo y se referencia a sí mismo, y cerrarlo obligaría a un molde en
 * cada lectura. Quien navega este grafo es `analizarPdf`, que existe para las
 * pruebas; la API que usa un producto —las cuatro funciones de abajo— sí está
 * cerrada.
 */
export type ValorPdf =
  | Nombre
  | Ref
  | Cadena
  | Flujo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | Map<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | any[]
  | number
  | boolean
  | string
  | null;

/** Lo que hay dentro de un objeto numerado del archivo. */
export type ObjetoPdf = {
  valor: ValorPdf;
  flujo?: Uint8Array | null;
  fin?: number;
};

/** Cuánto se ganó y por dónde. Lo que `CargaPdf` enseña en «detalle». */
export type DetalleCompresion = {
  paginas: number;
  /** Cuántas imágenes se volvieron a codificar. */
  imagenes: number;
  /** Cuánto se ganó solo con ellas. */
  bytesImagen?: number;
  /** Flujos que viajaban en crudo. */
  desinflados: number;
  /** Objetos que ya no alcanzaba nadie. */
  tirados: number;
  /** XMP y `/PieceInfo` retirados. */
  metadatosFuera: number;
  /** `true` si no había `canvas` — en Node las imágenes no se tocan. */
  imagenesOmitidas?: boolean;
};

export type ResultadoCompresion = {
  archivo: Blob;
  pesoInicial: number;
  pesoFinal: number;
  comprimido: boolean;
  /** `cifrado` · `no-es-pdf` · `ilegible` · `no-verificado` · `sin-ganancia` */
  motivo: string | null;
  detalle: Partial<DetalleCompresion>;
};

export type OpcionesCompresion = {
  anchoMaximoImagen?: number;
  calidadImagen?: number;
  recomprimirImagenes?: boolean;
};

/**
 * Comprime un PDF. Tres promesas, cada una con prueba: nunca devuelve algo más
 * grande, nunca devuelve algo que no sepa releer, y nunca toca uno cifrado.
 */
export function comprimirPdf(
  entrada: Blob | ArrayBuffer | Uint8Array,
  opciones?: OpcionesCompresion,
): Promise<ResultadoCompresion>;

/** Analiza un PDF y devuelve lo que hay dentro. Es lo que relee la salida. */
export function analizarPdf(bytes: Uint8Array): Promise<{
  objetos: Map<number, ObjetoPdf>;
  raiz: Map<string, ValorPdf> | null;
  info: Map<string, ValorPdf> | null;
  cifrado: boolean;
  /** `-1` si no se halló el catálogo. */
  paginas: number;
}>;

/** El peso como se dice en voz alta: «1,4 MB», «428 KB», «—» si no se sabe. */
export function formatearPeso(bytes: number): string;

/** El ahorro en porcentaje entero. Nunca negativo: si no se ganó, es 0. */
export function ahorro(pesoInicial: number, pesoFinal: number): number;

/** Que sea PDF de verdad: la extensión miente y el `type` del navegador también. */
export function esPdf(archivo: Blob): Promise<boolean>;

export function desinflar(bytes: Uint8Array): Promise<Uint8Array>;

/** Devuelve `null` si no se puede inflar: quien llama decide, nadie revienta. */
export function inflar(bytes: Uint8Array): Promise<Uint8Array | null>;
