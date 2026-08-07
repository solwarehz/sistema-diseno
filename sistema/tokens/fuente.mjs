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

export const VERSION = '1.2.0';
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

export const semanticos = {
  // ── Superficies ──────────────────────────────────────────────────────────
  'fondo-pagina':      { claro: '#F8F8F6', oscuro: '#1E1D1C', origen: 'gris.50',  uso: 'Fondo detrás de las tarjetas' },
  'fondo-tarjeta':     { claro: '#FFFFFF', oscuro: '#242422', origen: 'gris.0',   uso: 'Tarjeta, panel, cuerpo de tabla, modal' },
  'fondo-encabezado':  { claro: '#F0EFEE', oscuro: '#2C2B29', origen: 'gris.100', uso: 'Encabezado de tabla' },
  'fondo-fila-alt':    { claro: '#F8F8F6', oscuro: '#242422', origen: 'gris.50',  uso: 'Fila alterna si se usa banda cebra' },
  'fondo-fila-hover':  { claro: '#E9F5FF', oscuro: '#363532', origen: 'azul.50',  uso: 'Fila bajo el cursor y fila seleccionada' },

  // ── Texto ────────────────────────────────────────────────────────────────
  'texto-principal':   { claro: '#2C2A25', oscuro: '#EFEEEB', origen: 'gris.900', uso: 'Contenido, títulos, celdas de tabla' },
  'texto-secundario':  { claro: '#6A6864', oscuro: '#C3C1BD', origen: 'gris.600', uso: 'Datos de apoyo, columnas no primarias' },
  // v1.1.0 — corregido SOLO en claro. En oscuro el #989692 del documento cumple
  // (5,26:1 sobre tarjeta), así que la jerarquía del placeholder SÍ es
  // expresable en oscuro y no en claro: el fondo oscuro deja más recorrido.
  'texto-pista':       { claro: '#6A6864', oscuro: '#989692', origen: 'gris.500/600', uso: 'Solo placeholder y ayuda. Nunca contenido real' },
  'texto-invertido':   { claro: '#FFFFFF', oscuro: '#20201E', origen: 'gris.0',   uso: 'Sobre acción y sobre marco' },

  // ── Bordes ───────────────────────────────────────────────────────────────
  'borde':             { claro: '#E0DFDE', oscuro: '#44423F', origen: 'gris.200', uso: 'Divisor de filas, contorno de tarjeta' },
  'borde-fuerte':      { claro: '#C8C6C4', oscuro: '#575451', origen: 'gris.300', uso: 'Hover de contorno, separadores con peso' },
  // v1.1.0 — corregido en claro. v1.2.0 — corregido también en oscuro.
  'borde-campo':       { claro: '#8B8985', oscuro: '#8A8681', origen: 'gris.500', uso: 'Contorno de input, select, textarea' },

  // ── Acción ───────────────────────────────────────────────────────────────
  // En oscuro la acción SE INVIERTE: azul claro con texto oscuro. Ningún azul
  // oscuro alcanza 4,5:1 sobre superficie oscura (§2.4).
  'accion':            { claro: '#0063CB', oscuro: '#6CB2FF', origen: 'azul.600', uso: 'Botón principal. UNO por pantalla' },
  'accion-hover':      { claro: '#004EB2', oscuro: '#A0D0FF', origen: 'azul.700', uso: 'Hover del botón principal' },
  'accion-activa':     { claro: '#003B91', oscuro: '#CFE8FF', origen: 'azul.800', uso: 'Estado presionado' },
  'accion-texto':      { claro: '#FFFFFF', oscuro: '#20201E', origen: 'gris.0',   uso: 'Texto dentro del botón principal' },
  'accion-deshabilitada': { claro: '#C8C6C4', oscuro: '#44423F', origen: 'gris.300', uso: 'Sin permiso o sin datos válidos' },
  'accion-texto-desh': { claro: '#8B8985', oscuro: '#989692', origen: 'gris.500', uso: 'Texto del botón deshabilitado' },
  'accion-2':          { claro: '#655000', oscuro: '#DFCA9C', origen: 'oro.700',  uso: 'Acción secundaria: borde y texto, sin relleno' },
  'enlace':            { claro: '#0063CB', oscuro: '#6CB2FF', origen: 'azul.600', uso: 'Enlaces y acciones de fila tipo «Editar»' },

  // ── Marco de aplicación ──────────────────────────────────────────────────
  // #2C3D71 se eligió por intensidad medida: separa navegación de contenido
  // sin borde y sin dominar la pantalla. En oscuro SE CONSERVA IDÉNTICO: se
  // distingue por diferencia de matiz, no de luminancia (§2.3).
  'marco-fondo':       { claro: '#2C3D71', oscuro: '#2C3D71', origen: 'directo',  uso: 'Barra de navegación. ÚNICO azul en superficie grande' },
  'marco-texto':       { claro: '#FFFFFF', oscuro: '#FFFFFF', origen: 'gris.0',   uso: 'Nombre del colegio e ítems de navegación' },
  'marco-acento':      { claro: '#DFCA9C', oscuro: '#DFCA9C', origen: 'oro.200',  uso: 'Ítem activo: texto y filete inferior. También avatar' },
  'marco-item-activo': { claro: '#1D3163', oscuro: '#1D3163', origen: 'directo',  uso: 'Fondo del ítem activo en desplegable' },

  // ── Foco ─────────────────────────────────────────────────────────────────
  // Son dos tokens y no uno por una razón medida: el ámbar oscuro no alcanza
  // 3:1 sobre el marco, y el ámbar claro no lo alcanza sobre blanco.
  // En oscuro el ámbar oscuro desaparece: `foco` se aclara a #F0C060 (§2.4).
  'foco':              { claro: '#BE7A14', oscuro: '#F0C060', origen: 'directo',  uso: 'Anillo sobre superficies de contenido' },
  'foco-en-marco':     { claro: '#F0C060', oscuro: '#F0C060', origen: 'directo',  uso: 'Anillo dentro del marco de navegación' },

  // ── Estados — siempre en pares fondo/texto (§2.5.2) ──────────────────────
  'exito-fondo':  { claro: '#E3F4E1', oscuro: '#233521', origen: 'directo', uso: 'Chip «Activo», confirmación' },
  'exito-texto':  { claro: '#14521A', oscuro: '#B3DCAE', origen: 'directo', uso: 'Texto sobre exito-fondo' },
  'exito-acento': { claro: '#338136', oscuro: '#5FA862', origen: 'directo', uso: 'Solo filete del borde. Adorno' },
  'aviso-fondo':  { claro: '#FFEBD6', oscuro: '#402C16', origen: 'directo', uso: 'Chip «Parcial», advertencia recuperable' },
  'aviso-texto':  { claro: '#6B3B00', oscuro: '#FBC894', origen: 'directo', uso: 'Texto sobre aviso-fondo' },
  'aviso-acento': { claro: '#A46300', oscuro: '#C88A3C', origen: 'directo', uso: 'Solo filete del borde. Adorno' },
  'error-fondo':  { claro: '#FFE6DF', oscuro: '#4D241F', origen: 'directo', uso: 'Chip «Deuda», validación fallida' },
  'error-texto':  { claro: '#8F1017', oscuro: '#FFB8A9', origen: 'directo', uso: 'Texto sobre error-fondo' },
  'error-acento': { claro: '#D63231', oscuro: '#E2665C', origen: 'directo', uso: 'Solo filete del borde. Adorno' },
  'info-fondo':   { claro: '#E9EEFF', oscuro: '#273048', origen: 'directo', uso: 'Aviso neutro, ayuda contextual' },
  'info-texto':   { claro: '#02468A', oscuro: '#BFD0FF', origen: 'directo', uso: 'Texto sobre info-fondo' },
  'info-acento':  { claro: '#2F71CE', oscuro: '#6D97DE', origen: 'directo', uso: 'Solo filete del borde. Adorno' },
};

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

  // Marco de aplicación
  ['marco-texto',      'marco-fondo',      4.5, 'Nombre e ítems de navegación'],
  ['marco-acento',     'marco-fondo',      4.5, 'Texto del ítem activo en el marco'],
  ['marco-acento',     'marco-item-activo',4.5, 'Ítem activo en desplegable'],
  ['marco-texto',      'marco-item-activo',4.5, 'Texto sobre ítem activo de desplegable'],

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
];
