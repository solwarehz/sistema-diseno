/**
 * FUENTE DE VERDAD DEL COLOR — Colegio Albert Einstein
 * Documento MMI-DS v1.0.0 · Color modo claro BLOQUEADO
 *
 * Este archivo es el único lugar donde se escribe un valor de color.
 * De aquí se generan, con `node sistema/tokens/generar.mjs`:
 *   · paleta.lock.json          contrato con contrastes medidos
 *   · tokens-light.css          variables CSS
 *   · tailwind-preset-color.ts  preset de Tailwind 3.4
 *
 * Cambiar un valor aquí obliga a regenerar y a subir versión (§2.5 regla 8).
 */

export const VERSION = '1.10.0';
export const NORMA = 'WCAG 2.2 AA';

/**
 * CORRECCIONES SOBRE MMI-DS v1.0.0
 *
 * v1.0.0 declara «26 pares verificados, cero fallos». Al verificar los 46 pares
 * que exige la composición base (§5.1) aparecieron dos tokens que no cumplen.
 * Ninguno de los dos estaba entre los 26 originales.
 *
 * §2.5 regla 8 obliga a subir versión y re-verificar. De ahí el 1.1.0.
 */
export const correcciones = [
  {
    token: 'borde-campo',
    antes: '#C8C6C4',
    despues: '#8B8985',
    origen: 'gris.300 → gris.500',
    medido: '1.70:1 sobre tarjeta → 3.48:1',
    criterio: 'WCAG 2.2 SC 1.4.11 exige 3:1 para el límite de un control',
    razon:
      'El contorno de input, select y textarea a 1.70:1 es imperceptible: los campos ' +
      'no se distinguen del fondo. Es el mismo descuido que el documento ya reporta ' +
      'en §1.3 sobre el foco de los filtros, en el mismo lugar. `borde-fuerte` conserva ' +
      '#C8C6C4 porque es divisor decorativo y no límite de control.',
  },
  {
    token: 'texto-pista',
    antes: '#8B8985',
    despues: '#6A6864',
    origen: 'gris.500 → gris.600',
    medido: '3.49:1 sobre tarjeta → 5.55:1',
    criterio: 'WCAG 2.2 SC 1.4.3. El placeholder es texto y no tiene exención',
    razon:
      'Se buscó el gris más claro de la rampa que alcanzara 4.5:1. Es #6E6C68, y queda ' +
      'a 1.06:1 de `texto-secundario`: indistinguible. Conclusión: la jerarquía del ' +
      'placeholder NO se puede expresar con color sin incumplir AA. Se iguala a ' +
      '`texto-secundario` y la jerarquía pasa a la regla de composición: la etiqueta ' +
      'siempre visible, el placeholder solo como ejemplo de formato, nunca como etiqueta. ' +
      'El token se conserva porque documenta la intención en el componente.',
  },
];

/**
 * REGISTRO DE CAMBIOS
 *
 * Lo que un consumidor necesita para decidir si actualiza. Existe porque la
 * entrega llevaba escrito «mira el Historial del catálogo: ahí está qué cambió
 * y por qué», y esa página tenía UNA fila, sobre otro artefacto. Era una
 * promesa falsa en cada ZIP entregado.
 *
 * Las altas y bajas de token se comprueban contra el historial de git, no se
 * escriben a mano. El porqué sí es prosa: eso no se deriva de nada.
 *
 * `rompe` marca los cambios que pueden partir a un consumidor. Los dos de la
 * v1.2.0 se declaran ahora, tarde: en su momento salieron como versión menor y
 * deberían haber sido mayor. Se dejan escritos en vez de disimularlos.
 */
export const CAMBIOS = [
  {
    v: '1.10.0', fecha: '2026-08-09',
    que: 'Seis rampas nuevas, y el token declara el escalón en vez del hexadecimal',
    porque:
      'Solo existían las cuatro rampas de la MARCA, y el resto del sistema elegía ' +
      'valores sueltos verificados uno a uno: 29 de 53 salían de rampa en claro y ' +
      '11 de 53 en oscuro. Funcionaba, pero no era derivable, y por eso pedir un ' +
      'rojo para el interruptor no tenía respuesta: la única fuente era una ' +
      'primitiva prohibida o un token de marca prohibido. Ahora son 49 de 53 en los ' +
      'DOS modos. Las seis rampas se construyeron hacia atrás alrededor de los ' +
      'valores ya verificados, así que ningún color cambió.',
    tokens: { alta: [], baja: [] },
    rompe: [
      '`semanticos` declara el ESCALÓN —`ambar_900`— en vez del hexadecimal, y ' +
        '`origen` se deriva en vez de escribirse. Quien lea `./fuente` en crudo verá ' +
        'referencias en lugar de valores; los valores resueltos siguen igual en ' +
        '`./lock`, en `tokens.css` y en el preset, que es lo que consume un proyecto',
    ],
  },
  {
    v: '1.9.0', fecha: '2026-08-08',
    que: 'Los componentes se entregan, y el candado de lint por fin funciona',
    porque:
      'Control Administrativos V2.0 adoptó la v1.7.0 en una aplicación real y midió ' +
      'el coste: construyeron 3.983 líneas para consumir 1.464. Ahora se entregan ' +
      'componentes.css con 627 reglas de 20 elementos y comportamiento.md con el ' +
      'contrato de comportamiento. Además reportaron que el candado de ESLint no ' +
      'funcionaba tal como se distribuía: duplicaba las barras invertidas al ' +
      'incrustar el patrón en el selector, y siete de los ocho patrones cambiaban de ' +
      'significado mientras el octavo hacía reventar a ESLint. Fallaba en silencio ' +
      'desde la v1.1.0. Nueve iconos más, que el catálogo usaba y el módulo no publicaba.',
    tokens: { alta: [], baja: [] },
    rompe: [],
  },
  {
    v: '1.8.0', fecha: '2026-08-08',
    que: 'El origen de cada token se verifica en vez de documentarse',
    porque:
      'Una auditoría demostró, ejecutándolo, que un token podía declarar `origen` ' +
      'apuntando a una familia de color inexistente y todo el sistema salía en verde. ' +
      '`origen` pasa de cadena a { claro, oscuro } y el generador comprueba que la ' +
      'primitiva exista Y que su valor coincida. `texto-invertido` entra en el contrato: ' +
      'era el único token cuyo contraste no se verificaba nunca.',
    tokens: { alta: [], baja: [] },
    rompe: ['`origen` cambia de cadena a objeto en `paleta.lock.json` y en `./fuente`'],
  },
  {
    v: '1.7.0', fecha: '2026-08-08',
    que: 'Identidad, iconografía con regla, séptimo estado y densidad',
    porque:
      'Cuatro requerimientos del proyecto Control de Asistencia. La paleta de identidad ' +
      'es nueva porque no se podía reutilizar la de estado: un avatar rojo diría que esa ' +
      'persona tiene un problema.',
    tokens: { alta: ['identidad-1', 'identidad-2', 'identidad-3', 'identidad-4', 'identidad-texto'], baja: [] },
    rompe: [],
  },
  {
    v: '1.6.0', fecha: '2026-08-07',
    que: 'Capas del marco de aplicación',
    porque: 'El marco es una superficie oscura y encima había que apilar niveles sin perder contraste.',
    tokens: { alta: ['marco-nivel-1', 'marco-nivel-2', 'marco-borde', 'marco-texto-tenue'], baja: [] },
    rompe: [],
  },
  {
    v: '1.5.0', fecha: '2026-08-07',
    que: 'La cebra existe en modo oscuro',
    porque: '`fondo-fila-alt` valía lo mismo que `fondo-tarjeta` en oscuro: 1:1. No había banda cebra.',
    tokens: { alta: [], baja: [] },
    rompe: [],
  },
  {
    v: '1.4.0', fecha: '2026-08-07',
    que: 'Botones tonales: relleno más borde',
    porque: 'El borde es quien identifica el control; el relleno solo acompaña y no alcanza 3:1 a propósito.',
    tokens: { alta: ['accion-2-fondo', 'neutra-fondo', 'neutra-texto'], baja: [] },
    rompe: [],
  },
  {
    v: '1.3.0', fecha: '2026-08-07',
    que: 'Botón destructivo',
    porque: 'Eliminar y anular no pueden compartir color con la acción principal.',
    tokens: { alta: ['destructiva', 'destructiva-hover', 'destructiva-texto'], baja: [] },
    rompe: [],
  },
  {
    v: '1.2.0', fecha: '2026-08-07',
    que: 'Cascarón navegable con los dos modos',
    porque: 'Primer catálogo consultable, con conmutador de tema.',
    tokens: { alta: [], baja: [] },
    rompe: [
      'El objeto `marca` pasó de `{ valor }` a `{ claro, oscuro }`. **La clave `valor` se eliminó**: quien la leyera obtiene `undefined` sin error de compilación',
      'El archivo entregado `sistema/tokens/tokens-light.css` pasó a llamarse `tokens.css`. Ruta pública retirada sin aviso',
    ],
  },
  {
    v: '1.1.0', fecha: '2026-08-07',
    que: 'Motor de tokens y candado de contraste',
    porque:
      'Primera versión del código. Corrige dos valores de MMI-DS v1.0.0 que no cumplían: ' +
      '`borde-campo` a 1,70:1 y `texto-pista` a 3,49:1. Ver `correcciones`.',
    tokens: { alta: ['38 tokens iniciales'], baja: [] },
    rompe: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVAS — escalas completas. PROHIBIDO usarlas en un componente (§2.5.1).
// Existen para que los semánticos tengan de dónde elegir.
// ─────────────────────────────────────────────────────────────────────────────

export const primitivas = {
  // Azul — derivado de #004AAD con corrección de matiz.
  // Sin la corrección los tonos claros derivan a violeta.
  azul: {
    50: '#E9F5FF', 100: '#CFE8FF', 200: '#A0D0FF', 300: '#6CB2FF', 400: '#3A92F4',
    500: '#1A79E1', 600: '#0063CB', 700: '#004EB2', 800: '#003B91', 900: '#002A6F',
  },
  // Rojo — derivado de #E30613, el rojo real del escudo (medido en el archivo).
  rojo: {
    50: '#FFECE5', 100: '#FFD5C6', 200: '#FFAD95', 300: '#FF7D62', 400: '#FF4C37',
    500: '#EE1F1B', 600: '#D40006', 700: '#B40000', 800: '#930000', 900: '#700000',
  },
  // Oro — derivado de #DEBD68 (mediana del degradado del escudo).
  // En interfaz siempre plano: el degradado metálico no se reproduce.
  oro: {
    50: '#F9F3E7', 100: '#F1E4CA', 200: '#DFCA9C', 300: '#C6AB6B', 400: '#AA8E41',
    500: '#917724', 600: '#7B630D', 700: '#655000', 800: '#4F3E00', 900: '#3B2D00',
  },
  // ── v1.10.0 · LAS RAMPAS QUE FALTABAN ─────────────────────────────────────
  // Hasta aquí solo existían las cuatro de la MARCA —azul, rojo y oro del
  // escudo, más el gris cálido derivado del oro—, y el resto del sistema
  // elegía valores sueltos que se verificaban uno a uno. Funcionaba, con 0
  // fallos, pero NO ERA DERIVABLE: cuando hacía falta un tono nuevo no había
  // de dónde sacarlo, y la única fuente era una primitiva prohibida (§2.5.1) o
  // un token de marca prohibido en interfaz (§2.3).
  //
  // Las seis se construyeron HACIA ATRÁS, alrededor de los valores que ya
  // estaban verificados: ninguno cambia de valor, solo queda colocado en su
  // escalón. Por eso esto no obliga a re-verificar nada.

  // Verde. NO está en la marca: existe porque «éxito» lo necesita.
  // Anclas claras 50·700·900 y oscuras 200·500·950 — los dos modos en la
  // MISMA familia, que es lo que faltaba.
  verde: {
    50: '#E3F4E1', 100: '#D3EDCF', 200: '#B3DCAE', 300: '#96CC92',
    400: '#78BB78', 500: '#5FA862', 600: '#46974A', 700: '#338136',
    800: '#226B27', 900: '#14521A', 950: '#233521',
  },
  // Ámbar de advertencia y de foco. Distinto del oro de marca —tono 31-40
  // frente a 46-48—: comparten familia, no papel.
  ambar: {
    50: '#FFEBD6', 100: '#FEDFBF', 200: '#FBC894', 300: '#F0C060',
    400: '#DFA54B', 500: '#C88A3C', 600: '#BE7A14', 700: '#A46300',
    800: '#884E00', 900: '#6B3B00', 950: '#402C16',
  },
  // Índigo del marco de aplicación. No es el azul de acción: aquel dice «pulsa
  // aquí» y este es una superficie grande de navegación.
  // Anclas: 200 texto-tenue · 500 borde · 600 nivel-2 · 700 nivel-1 · 800 fondo · 900 item-activo.
  indigo: {
    50: '#F8F9FC', 100: '#E5E8F2', 200: '#B9C2DC', 300: '#8D9BC6', 400: '#6174B0',
    500: '#45558A', 600: '#41507F', 700: '#39497A', 800: '#2C3D71', 900: '#1D3163',
  },
  // Rojo de alerta. Misma familia que el rojo de marca, distinto papel: este
  // está afinado para leerse sobre fondo teñido, no para el escudo.
  alerta: {
    50: '#FFE6DF', 100: '#FFB8A9', 200: '#F99B8C', 300: '#EF8072',
    400: '#E2665C', 500: '#D63231', 600: '#C32123', 700: '#AA181D',
    800: '#8F1017', 900: '#4D241F', 950: '#33231F',
  },
  // Azul de información. Mismo caso que el rojo: el de marca es de acción.
  informacion: {
    50: '#E9EEFF', 100: '#BFD0FF', 200: '#9FBAF9', 300: '#84A7EE',
    400: '#6D97DE', 500: '#2F71CE', 600: '#1C63BC', 700: '#0D55A5',
    800: '#02468A', 900: '#273048', 950: '#303030',
  },
  // Negro cálido — LOS NEUTROS DEL MODO OSCURO. Es la familia que faltaba, y
  // la razón de que el modo oscuro fuera una lista de excepciones en vez de un
  // sistema: sus 13 valores estaban sueltos, uno a uno.
  //
  // Lleva cuatro escalones de más —650, 750, 850 y 950— y no es capricho.
  // Entre el 26 % y el 11 % de luz viven OCHO superficies que tienen que
  // distinguirse entre sí: la cebra necesita 1,06:1 contra la tarjeta, y esa
  // diferencia no cabe entre dos escalones de década. En el extremo oscuro el
  // contraste se comprime, y una escala que lo ignore obliga a inventar valores
  // fuera de ella —que es justo lo que pasaba—.
  //
  // Salvo el 400, TODOS los escalones son valores que el sistema ya usaba y
  // tenía verificados. La rampa no inventó ninguno: los ordenó.
  negro: {
    50: '#EFEEEB', 100: '#C3C1BD', 200: '#989692', 300: '#8A8681', 400: '#6E6B67',
    500: '#575451', 600: '#44423F', 650: '#3A3835', 700: '#363532',
    750: '#2C2B29', 800: '#2A2927', 850: '#242422', 900: '#20201E', 950: '#1E1D1C',
  },

  // Gris cálido — matiz del oro, croma mínimo. No es neutro: el azul frío sobre
  // gris cálido es lo que evita la interfaz administrativa genérica.
  gris: {
    0: '#FFFFFF', 50: '#F8F8F6', 100: '#F0EFEE', 200: '#E0DFDE', 300: '#C8C6C4',
    400: '#A7A6A3', 500: '#8B8985', 600: '#6A6864', 700: '#5C5955', 800: '#474440', 900: '#2C2A25',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SEMÁNTICOS — lo único que un componente consume.
// `origen` documenta de qué primitiva sale, o 'directo' si es un valor propio.
// ─────────────────────────────────────────────────────────────────────────────

const declarados = {
  // ── Superficies ──────────────────────────────────────────────────────────
  'fondo-pagina':      { claro: 'gris_50', oscuro: 'negro_950',  uso: 'Fondo detrás de las tarjetas' },
  'fondo-tarjeta':     { claro: 'gris_0', oscuro: 'negro_850',   uso: 'Tarjeta, panel, cuerpo de tabla, modal' },
  'fondo-encabezado':  { claro: 'gris_100', oscuro: 'negro_750', uso: 'Encabezado de tabla' },
  // v1.5.0 — En oscuro valía #242422, idéntico a `fondo-tarjeta`: 1:1. No había
  // cebra en modo oscuro. Ahora da 1,06 contra la tarjeta, la misma sutileza
  // que la cebra en claro, y 1,18 contra el hover.
  'fondo-fila-alt':    { claro: 'gris_50', oscuro: 'negro_800', uso: 'Fila alterna de la banda cebra' },
  // v1.5.0 — Se probó reforzarlo a azul-100 #CFE8FF porque sobre la fila
  // alterna solo daba 1,04:1. El candado lo rechazó: `texto-secundario` caía a
  // 4,40:1. El valor más fuerte que aún cumple es #D4EAFF, y da 1,16 sobre la
  // alterna — perceptualmente casi lo mismo que 1,04.
  //
  // Conclusión: la cebra y el resaltado compiten en el mismo canal, la
  // luminancia del fondo, y ahí no hay margen. El resaltado se resuelve con un
  // FILETE de 3px en `accion`, igual que el chip y la tarjeta de persona: un
  // signo estructural es inequívoco sobre cualquier fondo y no cuesta contraste.
  // El valor se queda en azul-50, que da 5,02:1 con `texto-secundario`.
  'fondo-fila-hover':  { claro: 'azul_50', oscuro: 'negro_700', uso: 'Fila bajo el cursor y fila seleccionada. Acompañado de filete `accion` de 3px' },

  // ── Texto ────────────────────────────────────────────────────────────────
  'texto-principal':   { claro: 'gris_900', oscuro: 'negro_50', uso: 'Contenido, títulos, celdas de tabla' },
  'texto-secundario':  { claro: 'gris_600', oscuro: 'negro_100', uso: 'Datos de apoyo, columnas no primarias' },
  // v1.1.0 — corregido SOLO en claro. En oscuro el #989692 del documento cumple
  // (5,26:1 sobre tarjeta), así que la jerarquía del placeholder SÍ es
  // expresable en oscuro y no en claro: el fondo oscuro deja más recorrido.
  'texto-pista':       { claro: 'gris_600', oscuro: 'negro_200', uso: 'Solo placeholder y ayuda. Nunca contenido real' },
  'texto-invertido':   { claro: 'gris_0', oscuro: 'negro_900',   uso: 'Sobre acción. NUNCA sobre el marco: ahí va marco-texto' },

  // ── Bordes ───────────────────────────────────────────────────────────────
  'borde':             { claro: 'gris_200', oscuro: 'negro_600', uso: 'Divisor de filas, contorno de tarjeta' },
  'borde-fuerte':      { claro: 'gris_300', oscuro: 'negro_500', uso: 'Hover de contorno, separadores con peso' },
  // v1.1.0 — corregido en claro. v1.2.0 — corregido también en oscuro.
  'borde-campo':       { claro: 'gris_500', oscuro: 'negro_300', uso: 'Contorno de input, select, textarea' },

  // ── Acción ───────────────────────────────────────────────────────────────
  // En oscuro la acción SE INVIERTE: azul claro con texto oscuro. Ningún azul
  // oscuro alcanza 4,5:1 sobre superficie oscura (§2.4).
  'accion':            { claro: 'azul_600', oscuro: 'azul_300', uso: 'Botón principal. UNO por pantalla' },
  'accion-hover':      { claro: 'azul_700', oscuro: 'azul_200', uso: 'Hover del botón principal' },
  'accion-activa':     { claro: 'azul_800', oscuro: 'azul_100', uso: 'Estado presionado' },
  'accion-texto':      { claro: 'gris_0', oscuro: 'negro_900',   uso: 'Texto dentro del botón principal' },
  'accion-deshabilitada': { claro: 'gris_300', oscuro: 'negro_600', uso: 'Sin permiso o sin datos válidos' },
  'accion-texto-desh': { claro: 'gris_500', oscuro: 'negro_200', uso: 'Texto del botón deshabilitado' },
  'accion-2':          { claro: 'oro_700', oscuro: 'oro_200',  uso: 'Acción secundaria: borde y texto, sin relleno' },
  'enlace':            { claro: 'azul_600', oscuro: 'azul_300', uso: 'Enlaces y acciones de fila tipo «Editar»' },

  // v1.3.0 — El sistema no tenía botón destructivo. «Eliminar» no puede ir en
  // `accion` azul: el azul no significa peligro. Se elige rojo-600 y no
  // `error-acento` (#D63231) porque este último da 4,81:1 con blanco, que pasa
  // pero sin margen. rojo-600 da 5,52:1 y sale de la rampa primitiva.
  // En oscuro se invierte igual que la acción principal (§2.4).
  // v1.4.0 — Secundaria y neutra pasan a TONAL: relleno suave + borde.
  // Ningún relleno tonal alcanza 3:1 contra la tarjeta (oro-100 da 1,25:1),
  // así que el relleno NO puede ser lo que identifica el control. Por eso el
  // borde se conserva: es él quien cumple SC 1.4.11. Relleno y borde, no uno
  // de los dos.
  'accion-2-fondo':     { claro: 'oro_100', oscuro: 'oro_800',  uso: 'Relleno de la acción secundaria. El borde sigue siendo obligatorio' },
  'neutra-fondo':       { claro: 'gris_100', oscuro: 'negro_650', uso: 'Relleno de la acción neutra. El borde sigue siendo obligatorio' },
  'neutra-texto':       { claro: 'gris_900', oscuro: 'negro_50', uso: 'Texto de la acción neutra' },

  'destructiva':        { claro: 'rojo_600', oscuro: 'rojo_300', uso: 'Botón de acción irreversible: Eliminar, Anular' },
  'destructiva-hover':  { claro: 'rojo_700', oscuro: 'rojo_200', uso: 'Hover del botón destructivo' },
  'destructiva-texto':  { claro: 'gris_0', oscuro: 'negro_900',   uso: 'Texto dentro del botón destructivo' },

  // ── Marco de aplicación ──────────────────────────────────────────────────
  // #2C3D71 se eligió por intensidad medida: separa navegación de contenido
  // sin borde y sin dominar la pantalla. En oscuro SE CONSERVA IDÉNTICO: se
  // distingue por diferencia de matiz, no de luminancia (§2.3).
  'marco-fondo':       { claro: 'indigo_800', oscuro: 'indigo_800',  uso: 'Barra de navegación. ÚNICO azul en superficie grande' },
  'marco-texto':       { claro: 'gris_0', oscuro: 'gris_0',   uso: 'Nombre del colegio e ítems de navegación' },
  'marco-acento':      { claro: 'oro_200', oscuro: 'oro_200',  uso: 'Ítem activo: texto y filete inferior. También avatar' },
  'marco-item-activo': { claro: 'indigo_900', oscuro: 'indigo_900',  uso: 'Fondo del ítem activo en desplegable' },

  // v1.6.0 — Cierra el hueco P-11. El marco es una superficie oscura y encima
  // vivían tres cosas sin token: los niveles de anidamiento del menú, el
  // separador y el texto atenuado. Hasta ahora se resolvían con blanco y alfa.
  //
  // El TECHO lo pone el acento dorado, no el texto blanco: aclarando el marco
  // hacia blanco, `marco-acento` cae por debajo de 4,5:1 pasado el 10 %.
  // Por eso hay sitio para exactamente dos niveles y no para tres.
  'marco-nivel-1':     { claro: 'indigo_700', oscuro: 'indigo_700', uso: 'Fondo de las subopciones de primer nivel del menú' },
  'marco-nivel-2':     { claro: 'indigo_600', oscuro: 'indigo_600', uso: 'Fondo de las subopciones de segundo nivel. No hay tercero: el acento dejaría de cumplir' },
  'marco-borde':       { claro: 'indigo_500', oscuro: 'indigo_500', uso: 'Separador dentro del marco' },
  'marco-texto-tenue': { claro: 'indigo_200', oscuro: 'indigo_200', uso: 'Correo del usuario y textos de apoyo dentro del marco' },

  // ── Foco ─────────────────────────────────────────────────────────────────
  // Son dos tokens y no uno por una razón medida: el ámbar oscuro no alcanza
  // 3:1 sobre el marco, y el ámbar claro no lo alcanza sobre blanco.
  // En oscuro el ámbar oscuro desaparece: `foco` se aclara a #F0C060 (§2.4).
  'foco':              { claro: 'ambar_600', oscuro: 'ambar_300',  uso: 'Anillo sobre superficies de contenido' },
  'foco-en-marco':     { claro: 'ambar_300', oscuro: 'ambar_300',  uso: 'Anillo dentro del marco de navegación' },

  // ── Estados — siempre en pares fondo/texto (§2.5.2) ──────────────────────
  'exito-fondo':  { claro: 'verde_50', oscuro: 'verde_950', uso: 'Chip «Activo», confirmación' },
  'exito-texto':  { claro: 'verde_900', oscuro: 'verde_200', uso: 'Texto sobre exito-fondo' },
  'exito-acento': { claro: 'verde_700', oscuro: 'verde_500', uso: 'Solo filete del borde. Adorno' },
  'aviso-fondo':  { claro: 'ambar_50', oscuro: 'ambar_950', uso: 'Chip «Parcial», advertencia recuperable' },
  'aviso-texto':  { claro: 'ambar_900', oscuro: 'ambar_200', uso: 'Texto sobre aviso-fondo' },
  'aviso-acento': { claro: 'ambar_700', oscuro: 'ambar_500', uso: 'Solo filete del borde. Adorno' },
  'error-fondo':  { claro: 'alerta_50', oscuro: 'alerta_900', uso: 'Chip «Deuda», validación fallida' },
  'error-texto':  { claro: 'alerta_800', oscuro: 'alerta_100', uso: 'Texto sobre error-fondo' },
  'error-acento': { claro: 'alerta_500', oscuro: 'alerta_400', uso: 'Solo filete del borde. Adorno' },
  'info-fondo':   { claro: 'informacion_50', oscuro: 'informacion_900', uso: 'Aviso neutro, ayuda contextual' },
  'info-texto':   { claro: 'informacion_800', oscuro: 'informacion_100', uso: 'Texto sobre info-fondo' },
  'info-acento':  { claro: 'informacion_500', oscuro: 'informacion_400', uso: 'Solo filete del borde. Adorno' },

  // ── IDENTIDAD · v1.7.0 ────────────────────────────────────────────────────
  // Colores del avatar sin foto. Existen porque NO se puede reutilizar la
  // paleta de estado: un avatar rojo diría que esa persona tiene un problema
  // sin que nadie lo haya dicho. Estos no significan NADA: son ayuda de
  // reconocimiento y nunca informan, agrupan ni filtran.
  //
  // Son cuatro y no seis porque cuatro es lo que la paleta de estado deja
  // libre. Medido en tono: estado ocupa rojo (0°/358°), ámbar (36°/48°), verde
  // (122°) y azul (211°/215°/225°). Cada identidad queda a 30° o más del tono
  // de estado más cercano, salvo pizarra, que va al 17 % de saturación y por
  // eso se lee como ausencia de color y no como uno.
  //
  // Mismo valor en los dos modos, como el marco: es un disco relleno con texto
  // blanco encima, y cambiarlo por tema no aporta nada.
  'identidad-1':     { claro: '#0E6F63', oscuro: '#0E6F63', uso: 'Avatar sin foto. Verde azulado, tono 173°' },
  'identidad-2':     { claro: '#6A3FA0', oscuro: '#6A3FA0', uso: 'Avatar sin foto. Violeta, tono 267°' },
  'identidad-3':     { claro: '#9B3B6E', oscuro: '#9B3B6E', uso: 'Avatar sin foto. Magenta, tono 328°' },
  'identidad-4':     { claro: '#4A5568', oscuro: '#4A5568', uso: 'Avatar sin foto. Pizarra, saturación 17 %' },
  // Blanco en los DOS modos. texto-invertido no sirve: en oscuro vale #20201E
  // y las iniciales quedarían oscuras sobre un disco oscuro.
  'identidad-texto': { claro: 'gris_0', oscuro: 'gris_0',  uso: 'Iniciales sobre cualquier color de identidad' },
};

// ─────────────────────────────────────────────────────────────────────────────
// RESOLUTOR
//
// Un token declara el ESCALON —`ambar_900`— y aqui se convierte en su valor.
// Antes declaraba el hexadecimal y ademas un `origen` que decia de donde
// salia: dos datos para lo mismo, y el segundo podia mentir.
//
// Cambiar un token de ambar_800 a ambar_900 es ahora editar UNA PALABRA. Antes
// habia que copiar el hexadecimal a mano y confiar en no equivocarse.
//
// Se admite un valor literal para lo que no esta en ninguna rampa —los cuatro
// colores de identidad, que son de un solo paso a proposito—. Cualquier otra
// cosa que no resuelva hace fallar la generacion: una referencia que nadie
// puede resolver es un comentario, no una referencia.
// ─────────────────────────────────────────────────────────────────────────────

const REF = /^([a-z]+)_(\d+)$/;

const resolver = (v, token, modo) => {
  if (v.startsWith('#')) return v;
  const m = REF.exec(v);
  const paso = m && primitivas[m[1]]?.[m[2]];
  if (!paso) {
    throw new Error(
      `${token}.${modo} apunta a ${v}, que no existe. Los escalones se llaman ` +
      `familia_paso: ambar_900, negro_950, azul_600.`
    );
  }
  return paso;
};

export const semanticos = Object.fromEntries(
  Object.entries(declarados).map(([k, t]) => [
    k,
    {
      claro: resolver(t.claro, k, 'claro'),
      oscuro: resolver(t.oscuro, k, 'oscuro'),
      // El origen ya no se escribe: se deriva de lo declarado. Si es literal,
      // se dice que no tiene rampa en vez de inventarle una.
      origen: {
        claro: t.claro.startsWith('#') ? 'directo' : t.claro,
        oscuro: t.oscuro.startsWith('#') ? 'directo' : t.oscuro,
      },
      uso: t.uso,
    },
  ])
);


// ─────────────────────────────────────────────────────────────────────────────
// MARCA — fuera del sistema. Prohibidos en interfaz (§2.3).
// Se exponen aparte para que el candado pueda distinguirlos.
// ─────────────────────────────────────────────────────────────────────────────

export const marca = {
  // En oscuro el titular sube a rojo-400: el #E30613 sobre página oscura
  // pierde legibilidad y el panel de marca se aplana (§2.4).
  'marca-rojo':       { claro: '#E30613', oscuro: '#FF4C37', uso: 'Escudo, titulares de landing, impresos', prohibidoEn: 'Interfaz' },
  'marca-rojo-panel': { claro: '#E30613', oscuro: '#930000', uso: 'Panel de marca de la landing',           prohibidoEn: 'Interfaz' },
  'marca-oro':        { claro: '#DEBD68', oscuro: '#DEBD68', uso: 'Escudo, filete de landing',              prohibidoEn: 'Interfaz. En sistema usar accion-2 o marco-acento' },
  'marca-amarillo':   { claro: '#FDF200', oscuro: '#FDF200', uso: 'Campaña, afiches, redes',                prohibidoEn: 'Todo el sistema. 1,2:1 — no admite texto' },
  'marca-celeste':    { claro: '#01ADED', oscuro: '#01ADED', uso: 'Campaña',                                prohibidoEn: 'Todo el sistema. 2,6:1 — no admite texto' },
};

// ─────────────────────────────────────────────────────────────────────────────
// PARES A VERIFICAR — el contrato.
// minimo 4.5 = texto normal · 3.0 = texto grande, control o adorno estructural
// informativo = se mide y se reporta, pero no bloquea (estados deshabilitados
// están exentos de WCAG 2.2, y los acentos son adorno §2.3)
// ─────────────────────────────────────────────────────────────────────────────

export const pares = [
  // Texto sobre superficies
  ['texto-principal',  'fondo-tarjeta',    4.5, 'Contenido y celdas sobre tarjeta'],
  ['texto-principal',  'fondo-pagina',     4.5, 'Contenido sobre fondo de página'],
  ['texto-principal',  'fondo-encabezado', 4.5, 'Encabezado de tabla'],
  ['texto-principal',  'fondo-fila-hover', 4.5, 'Celda en fila bajo el cursor'],
  ['texto-principal',  'fondo-fila-alt',   4.5, 'Celda en banda cebra'],
  ['texto-secundario', 'fondo-fila-alt',   4.5, 'Dato de apoyo en banda cebra'],
  ['fondo-fila-alt',   'fondo-tarjeta',    'informativo', 'Cebra: debe distinguirse de la fila blanca'],
  ['fondo-fila-hover', 'fondo-fila-alt',   'informativo', 'El hover debe verse también sobre la fila alterna'],
  ['texto-secundario', 'fondo-tarjeta',    4.5, 'Dato de apoyo sobre tarjeta'],
  ['texto-secundario', 'fondo-pagina',     4.5, 'Dato de apoyo sobre página'],
  ['texto-secundario', 'fondo-encabezado', 4.5, 'Etiqueta de columna no primaria'],
  ['texto-secundario', 'fondo-fila-hover', 4.5, 'Dato de apoyo en fila activa'],
  ['texto-pista',      'fondo-tarjeta',    4.5, 'Placeholder dentro de campo'],
  ['texto-pista',      'fondo-pagina',     4.5, 'Texto de ayuda sobre página'],

  // Acción
  ['accion-texto',     'accion',           4.5, 'Texto del botón principal'],
  ['accion-texto',     'accion-hover',     4.5, 'Texto del botón en hover'],
  ['accion-texto',     'accion-activa',    4.5, 'Texto del botón presionado'],
  ['accion',           'fondo-tarjeta',    3.0, 'Superficie del botón contra la tarjeta'],
  ['accion',           'fondo-pagina',     3.0, 'Superficie del botón contra la página'],
  ['accion-2',         'fondo-tarjeta',    4.5, 'Texto de la acción secundaria en oro'],
  ['accion-2',         'fondo-pagina',     4.5, 'Acción secundaria sobre página'],
  ['enlace',           'fondo-tarjeta',    4.5, 'Enlace «Editar» en celda de tabla'],
  ['enlace',           'fondo-pagina',     4.5, 'Enlace sobre página'],
  ['enlace',           'fondo-fila-hover', 4.5, 'Enlace «Editar» en fila bajo el cursor'],

  // Secundaria y neutra tonales
  ['accion-2',         'accion-2-fondo',   4.5, 'Texto de la secundaria sobre su relleno'],
  ['accion-2',         'fondo-tarjeta',    3.0, 'Borde de la secundaria: es quien identifica el control'],
  ['neutra-texto',     'neutra-fondo',     4.5, 'Texto de la neutra sobre su relleno'],
  ['borde-campo',      'neutra-fondo',     'informativo', 'Borde de la neutra contra su propio relleno'],
  ['accion-2-fondo',   'fondo-tarjeta',    'informativo', 'Relleno tonal: NO alcanza 3:1 y no debe hacerlo. Identifica el borde'],
  ['neutra-fondo',     'fondo-tarjeta',    'informativo', 'Relleno tonal: NO alcanza 3:1 y no debe hacerlo. Identifica el borde'],

  // Destructiva
  ['destructiva-texto','destructiva',      4.5, 'Texto del botón destructivo'],
  ['destructiva-texto','destructiva-hover',4.5, 'Texto del botón destructivo en hover'],
  ['destructiva',      'fondo-tarjeta',    3.0, 'Superficie del botón destructivo contra la tarjeta'],
  ['destructiva',      'fondo-pagina',     3.0, 'Superficie del botón destructivo contra la página'],

  // Marco de aplicación
  ['marco-texto',      'marco-fondo',      4.5, 'Nombre e ítems de navegación'],
  ['marco-acento',     'marco-fondo',      4.5, 'Texto del ítem activo en el marco'],
  ['marco-acento',     'marco-item-activo',4.5, 'Ítem activo en desplegable'],
  ['marco-texto',      'marco-item-activo',4.5, 'Texto sobre ítem activo de desplegable'],

  // Capas del marco — v1.6.0
  ['marco-texto',      'marco-nivel-1',    4.5, 'Texto en subopción de primer nivel'],
  ['marco-acento',     'marco-nivel-1',    4.5, 'Ítem activo en subopción de primer nivel'],
  ['marco-texto',      'marco-nivel-2',    4.5, 'Texto en subopción de segundo nivel'],
  ['marco-acento',     'marco-nivel-2',    4.5, 'Ítem activo en subopción de segundo nivel — es el techo del anidamiento'],
  ['marco-texto-tenue','marco-fondo',      4.5, 'Correo del usuario dentro del marco'],
  ['marco-texto-tenue','marco-nivel-1',    4.5, 'Texto de apoyo en primer nivel'],
  ['marco-nivel-1',    'marco-fondo',      'informativo', 'El nivel 1 debe distinguirse del marco'],
  ['marco-nivel-2',    'marco-nivel-1',    'informativo', 'El nivel 2 debe distinguirse del nivel 1'],
  ['marco-borde',      'marco-fondo',      'informativo', 'Separador dentro del marco. Adorno'],

  // Foco — anillo: contraste de componente, mínimo 3:1
  ['foco',             'fondo-tarjeta',    3.0, 'Anillo de foco sobre tarjeta'],
  ['foco',             'fondo-pagina',     3.0, 'Anillo de foco sobre página'],
  ['foco',             'fondo-encabezado', 3.0, 'Anillo de foco sobre encabezado'],
  ['foco-en-marco',    'marco-fondo',      3.0, 'Anillo de foco dentro del marco'],

  // Bordes de control — 3:1 (límite de componente identificable)
  ['borde-campo',      'fondo-tarjeta',    3.0, 'Contorno de input sobre tarjeta'],
  ['borde-campo',      'fondo-pagina',     3.0, 'Contorno de input sobre página'],

  // Estados — pares fondo/texto
  ['exito-texto',      'exito-fondo',      4.5, 'Chip «Activo»'],
  ['aviso-texto',      'aviso-fondo',      4.5, 'Chip «Parcial»'],
  ['error-texto',      'error-fondo',      4.5, 'Chip «Deuda»'],
  ['info-texto',       'info-fondo',       4.5, 'Aviso neutro'],
  ['exito-fondo',      'fondo-tarjeta',    'informativo', 'Chip contra la tarjeta'],
  ['aviso-fondo',      'fondo-tarjeta',    'informativo', 'Chip contra la tarjeta'],
  ['error-fondo',      'fondo-tarjeta',    'informativo', 'Chip contra la tarjeta'],
  ['info-fondo',       'fondo-tarjeta',    'informativo', 'Chip contra la tarjeta'],
  ['exito-acento',     'exito-fondo',      'informativo', 'Filete del chip. Adorno, exento'],
  ['aviso-acento',     'aviso-fondo',      'informativo', 'Filete del chip. Adorno, exento'],
  ['error-acento',     'error-fondo',      'informativo', 'Filete del chip. Adorno, exento'],
  ['info-acento',      'info-fondo',       'informativo', 'Filete del chip. Adorno, exento'],

  // Deshabilitado — WCAG 2.2 exime a los controles inactivos (1.4.3)
  ['accion-texto-desh','accion-deshabilitada', 'informativo', 'Botón deshabilitado. Exento por 1.4.3'],

  // Divisores — adorno, no son límite de control
  ['borde',            'fondo-tarjeta',    'informativo', 'Divisor de fila. Adorno'],
  ['borde-fuerte',     'fondo-tarjeta',    'informativo', 'Separador con peso'],

  // texto-invertido era el UNICO token que no aparecia en ningun par: su
  // contraste no se verificaba jamas. Estaba cubierto por accidente porque en
  // claro coincide con accion-texto, que si se verifica.
  ['texto-invertido',  'accion',           4.5, 'Texto dentro del boton principal, por su propio token'],

  // Identidad — las iniciales son texto de verdad y se leen. 4,5 sin rebaja.
  ['identidad-texto',  'identidad-1',      4.5, 'Iniciales del avatar sobre verde azulado'],
  ['identidad-texto',  'identidad-2',      4.5, 'Iniciales del avatar sobre violeta'],
  ['identidad-texto',  'identidad-3',      4.5, 'Iniciales del avatar sobre magenta'],
  ['identidad-texto',  'identidad-4',      4.5, 'Iniciales del avatar sobre pizarra'],
];
