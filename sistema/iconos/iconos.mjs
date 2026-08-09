/**
 * ICONOGRAFÍA DEL SISTEMA — MMI-DS §8.1
 *
 * Retícula de 24×24, trazo de 1,5px, extremos y uniones redondeados. Heredan
 * `currentColor`: el icono toma el color del texto que acompaña, siempre.
 *
 * POR QUÉ NO EMOJI. Medido sobre los 13 que había antes: 0 heredaban el color,
 * colgaban 5px bajo la línea base, ocupaban el 139 % de la altura de una letra
 * y cambiaban de dibujo según el sistema operativo, porque son mapas de bits.
 *
 * ── LA REGLA DE SIGNIFICADO ──────────────────────────────────────────────────
 *
 * Todo icono sale con `aria-hidden="true"` y `focusable="false"`. No es un
 * descuido: es la regla.
 *
 *   · Icono JUNTO A TEXTO visible → oculto. El texto ya lo nombra, y con los
 *     dos puestos el lector de pantalla lo dice dos veces.
 *   · Icono SOLO dentro de un control → el CONTROL lleva `aria-label`. El icono
 *     sigue oculto: quien nombra es el control, no su dibujo.
 *   · Icono que aporta información QUE NO ESTÁ EN EL TEXTO → no vale solo el
 *     icono. Necesita equivalente textual (SC 1.4.1). Nunca se resuelve
 *     poniéndole un nombre accesible al icono y dejándolo como único canal.
 *
 * ── LOS TAMAÑOS ──────────────────────────────────────────────────────────────
 *
 * Cuatro pasos, y el criterio NO es la rejilla de espaciado: es el texto al que
 * acompaña el icono. Un icono se alinea con la letra que tiene al lado, no con
 * el margen que tiene debajo.
 *
 *   etiqueta 14  junto a texto de 12px — chevrones, flechas de paginación
 *   control  16  junto a texto de 13px — botones, filas de menú, selectores
 *   texto    18  junto a texto de 15px — menú de navegación, tablas, campos
 *   estado   32  sin texto al lado — estados de pantalla, vacíos
 *
 * Antes de v1.7.0 convivían seis tamaños sin regla —13, 14, 15, 16, 18 y 32—.
 * Los sueltos se absorbieron: 13 → 14 y 15 → 16.
 */

/** Cuatro pasos. El nombre dice a qué texto acompaña, no cuánto mide. */
export const TAMANOS = { etiqueta: 14, control: 16, texto: 18, estado: 32 };

/** Envuelve un trazo en el SVG del sistema. `tam` es un paso de TAMANOS. */
export const ic = (d, tam = TAMANOS.texto) =>
  `<svg class="ic" viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" ` +
  `stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ` +
  `aria-hidden="true" focusable="false">${d}</svg>`;

/**
 * Los trazos, sin envolver. Se exponen para poder dibujar el mismo icono a otro
 * tamaño sin duplicar la geometría.
 */
export const TRAZOS = {
  panel: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  matricula: '<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/>',
  asistencia: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  usuarios: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M17 6a3 3 0 0 1 0 6M18 20c0-2-1-3.5-2.5-4.5"/>',
  comunicaciones: '<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="13" width="4" height="6" rx="1.5"/><rect x="18" y="13" width="4" height="6" rx="1.5"/>',
  administracion: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  tesoreria: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  academico: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M12 15v6"/>',
  configuracion: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  chevronIzq: '<path d="m15 18-6-6 6-6"/>',
  chevronDer: '<path d="m9 18 6-6-6-6"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  sobre: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
  campana: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  panelIzq: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  hamburguesa: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  luna: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  escritorio: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  movil: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  atras: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  mas: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  libro: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  descargar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  capas: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  // v1.7.0 — fallo de dibujado. Es el único icono de alarma del conjunto y por
  // eso va aparte: no se usa decorativamente en ningún otro sitio.
  roto: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',

  // ── v1.9.0 · los que el catálogo usaba y este módulo no publicaba ─────────
  // Reportados por Control Administrativos V2.0: salían en la demostración y no
  // se podían importar, así que eran huecos en pantallas reales. Hicieron bien
  // en NO dibujarlos: un trazo hecho a mano se separa del conjunto a la primera
  // revisión, y entonces hay dos iconos distintos para la misma idea.
  candado: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  visto: '<path d="m5 12 5 5L20 7"/>',
  alerta: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/>',
  // Los de la tabla, por el mismo motivo: sin ellos no se puede reconstruir.
  filtro: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
  columnas: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
  ordenar: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
  descargar2: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  camara: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>',
  filas: '<rect x="3" y="4" width="18" height="5" rx="1"/><rect x="3" y="13" width="18" height="5" rx="1"/>',
  filasFinas: '<rect x="3" y="4" width="18" height="3" rx="1"/><rect x="3" y="10" width="18" height="3" rx="1"/><rect x="3" y="16" width="18" height="3" rx="1"/>',
};

/** El conjunto ya dibujado al tamaño de texto, que es el caso más común. */
export const ICONOS = Object.fromEntries(
  Object.entries(TRAZOS).map(([nombre, trazo]) => [nombre, ic(trazo)])
);

/** El mismo icono a otro paso: `icono('chevron', TAMANOS.etiqueta)`. */
export const icono = (nombre, tam) => ic(TRAZOS[nombre], tam);
