#!/usr/bin/env node
/**
 * CANDADO DE LA PROMESA MUERTA — la clase que la hoja estiliza y NADIE emite.
 *
 *   node sistema/candado/verificar-promesa-muerta.mjs
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE
 *
 * El 2026-08-28 el equipo que usa el sistema reportó que el selector con
 * búsqueda no se veía como el catálogo. Tenían razón en nueve puntos, y **los
 * quince candados estaban en verde**. Dos de los nueve eran de esta forma
 * exacta:
 *
 *   · `.sel-caja.abierta .sel-chev .ic { transform: rotate(180deg) }` viajaba
 *     en el paquete de todos los productos, y el componente NUNCA emitía la
 *     clase `abierta`. El chevron no giraba en ninguna pantalla del mundo.
 *   · `.sel-notas p { … }` viajaba igual, y el componente emite
 *     `<span class="sel-notas">` con el texto dentro y sin ningún <p>.
 *
 * Y no era la primera vez: en la v1.82.0, `.sel-op.activa` — el React marcaba
 * con `activa` y la hoja estiliza `.sel-op.marcado`, así que navegar con
 * flechas no resaltaba nada en ningún producto.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ NO LO VE NINGUNO DE LOS OTROS
 *
 * · El de HUÉRFANAS pregunta si toda clase declarada se USA en algún sitio, y
 *   mira solo el PRIMER nombre del selector. `.sel-caja.abierta` no es huérfana
 *   porque `.sel-caja` sí se usa: la ceguera de prefijo.
 * · El de la PROMESA compara propiedades resueltas sobre el marcado estático
 *   del catálogo. Una lista que solo existe abierta no está en ese marcado, así
 *   que no hay nada que comparar.
 * · El de la OMISIÓN hace la pregunta CONTRARIA a esta: «¿el catálogo enseña la
 *   base sin el modificador?». Aquí se pregunta si el componente emite el
 *   modificador alguna vez.
 * · El del ELEMENTO compara etiquetas, no clases.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUÉ COMPRUEBA, EXACTAMENTE — y por qué NO comprueba más
 *
 * Un **modificador muerto sobre una base viva**: dos clases sobre el MISMO
 * elemento, donde el componente emite una y la otra no la emite nadie.
 * `.sel-caja.abierta` es el caso exacto — `.sel-caja` se emite en todas las
 * pantallas y `abierta` en ninguna—, y es justo lo que el candado de huérfanas
 * no puede ver, porque solo mira el primer nombre del selector.
 *
 * NO comprueba familias enteras que el React no implementa —`.btn-oro`,
 * `.fc-atajos`, `.pr-paso`—. Se probó, y salían 167: eso no es este defecto,
 * es la enfermedad R34 que ya está auditada y tiene su propio registro, y una
 * lista de 167 no la lee nadie. Un candado que grita en falso, o que grita
 * demasiado, se desactiva a la semana. Aquí el criterio es: si el elemento
 * existe de verdad en el producto, la regla que se le queda colgando es un
 * defecto vivo, no deuda conocida.
 *
 * SIN LISTA DE EXCEPCIONES A MANO. Lo que se salta se salta por una REGLA, y
 * cada regla está escrita abajo con su porqué. Una lista de excepciones que
 * nadie poda vuelve a ser el inventario a mano de siempre.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const VERSION = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).version;

const hoja = readFileSync(join(RAIZ, 'sistema/componentes/componentes.css'), 'utf8');
const SRC = join(RAIZ, 'componentes', 'src');

/* ── Lo que los TSX emiten ──────────────────────────────────────────────────
   Se barre el fuente entero de cada componente y se recogen TODOS los tokens
   en minúscula-con-guion. Es más grosero que analizar el JSX, y a propósito:
   el único error que hace daño aquí es **dar por muerta una clase que sí se
   emite**, y barriendo de más eso no puede pasar. Al revés —dejar pasar una
   muerta— solo cuesta que este candado no la cace, que es donde estábamos.

   Y se recogen los PREFIJOS, que es lo que faltaba en el primer intento: media
   docena de componentes arman la clase por interpolación —`avatar-${tamano}`,
   `av-${tipo}`— y sin esto salían cien falsos positivos que nadie leería. Un
   candado que grita en falso se desactiva a la semana. */
const fuentes = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? fuentes(join(dir, e.name))
      : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []);

/**
 * POR ARCHIVO, y no en un montón común. Es la corrección que hizo falta nada
 * más probarlo: `abierta` la emite `MarcoApp` en `.nav-rama.abierta`, así que
 * un montón global daba por viva `.sel-caja.abierta` — el defecto que este
 * candado nació para cazar salía en verde delante de sus narices.
 *
 * La pregunta correcta no es «¿alguien emite esta clase?», es **«¿alguien
 * emite las dos JUNTAS?»**: un modificador solo vale sobre su base, y si el
 * componente que pinta la base nunca escribe el modificador, la regla no casa
 * por mucho que otro componente use esa palabra para otra cosa.
 */
const PORARCHIVO = [];
for (const f of fuentes(SRC)) {
  const src = readFileSync(f, 'utf8');
  // Los comentarios se retiran: este archivo, y los componentes, nombran
  // clases muertas para CONTAR que no se emiten. Contarlo no puede ser
  // emitirlo, o el candado se cegaría con su propia documentación.
  const sinComentarios = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const clases = new Set();
  const prefijos = new Set();
  for (const m of sinComentarios.matchAll(/[a-z][a-z0-9-]*/g)) {
    // Un token que acaba en guion es una clase a medias: lo que seguía era una
    // interpolación. Vale como prefijo, no como clase.
    if (m[0].endsWith('-')) prefijos.add(m[0]);
    else clases.add(m[0]);
  }
  PORARCHIVO.push({ clases, prefijos });
}
const laEmite = (arch, c) =>
  arch.clases.has(c)
  || [...arch.prefijos].some((p) => c.startsWith(p) && c.length > p.length);

/** ¿Hay UN componente que emita todas las clases de la unidad a la vez? */
const alguienLasJunta = (cs) => PORARCHIVO.some((a) => cs.every((c) => laEmite(a, c)));
/** ¿La emite algún componente, aunque sea suelta? Sirve para saber si el
 *  elemento existe en algún sitio o si es una familia entera sin implementar. */
const laEmiteAlguien = (c) => PORARCHIVO.some((a) => laEmite(a, c));

/* ── Reglas de exención, cada una con su motivo ───────────────────────────── */

/** 1 · El estado lo pone el navegador o un atributo, no una clase del React.
 *  `.campo:disabled`, `.sel-op[aria-selected]`, `::placeholder`. */
const quitarEstados = (sel) =>
  sel.replace(/::?[a-z-]+(\([^)]*\))?/g, ' ').replace(/\[[^\]]*\]/g, ' ');

/** 2 · Clases que el PRODUCTO pone, no el sistema: el modo y el tema viven en
 *  <html>, y ningún componente los escribe. */
const DEL_ANFITRION = /^(oscuro|claro|tema-)/;

/** 3 · Los tokens y utilidades de `tokens.css` no se emiten desde un TSX: se
 *  aplican desde el marcado del producto. Se reconocen por su prefijo, que es
 *  el mismo con el que los genera `generar.mjs`. */
const DE_TOKENS = /^(token-|color-|texto-|fondo-|borde-|marco-|accion-)/;

const SALTADAS = { anfitrion: 0, tokens: 0, sinBase: 0 };

/* ── DEUDA DECLARADA ────────────────────────────────────────────────────────
   Las nueve que este candado encontró el día que se escribió. Están
   verificadas a mano —`grep` contra `componentes/src`, ningún TSX las emite— y
   se declaran con su daño real en vez de arreglarse a la carrera, que es como
   nació el candado del elemento y por la misma razón: protege ya de las nuevas
   y no finge que las viejas no existen.

   Arreglar una es QUITAR SU LÍNEA. Si se arregla y no se poda, el candado
   también falla: una lista de excepciones que nadie poda vuelve a ser el
   inventario a mano de siempre. */
const DEUDA = new Map([
  ['cf-aviso',   'Confirmación en línea · la variante de aviso de la banda. El componente emite `.cf-banda` a secas, así que la confirmación con tono de advertencia —su caja y su texto— no se puede pedir desde ningún producto.'],
  ['chip-punto', 'Chip · el punto que acompaña al texto. Es la enfermedad R34, ya auditada el 2026-08-10: el catálogo lo pinta y el React entrega solo texto. Duele más que las demás porque el punto existe para NO depender del color (SC 1.4.1).'],
  ['corto',      'Estados · la línea corta del esqueleto de carga. Sin ella, todas las líneas salen del mismo ancho y el esqueleto no se parece al texto que va a sustituir.'],
  ['fc-activo',  'RangoFecha · qué extremo del rango se está editando. Ningún producto puede resaltar el campo activo, así que con el calendario abierto no se ve si se está poniendo el desde o el hasta.'],
  ['fijo',       'MarcoApp · el grupo de navegación clavado abierto. No hay forma de fijarlo desde ningún producto.'],
  ['mono-lista', 'Utilidades · la variante de lista del bloque monoespaciado. Solo viaja el bloque suelto.'],
  ['tb-detalle', 'TablaDatos · el detalle plegable de la fila. Declarado PENDIENTE en `comportamiento.md` (R16 y R17 de la tabla): el componente no lo hace todavía, y la hoja ya lo lleva.'],
  ['tb-grupo',   'TablaDatos · las filas agrupadas. Misma familia que el detalle: la hoja viaja y el componente no las emite.'],
  ['tb-orden',   'TablaDatos · marcado VIEJO del indicador de orden. El componente ordena de verdad, pero con `.tb-th-btn` y `.tb-th-flecha`; `.tb-orden.activo` es de una versión anterior y nadie la ha podado.'],
]);

/* ── Barrido de la hoja ─────────────────────────────────────────────────────
   Se guarda, por clase, el selector donde apareció: un aviso que no dice
   DÓNDE está la regla obliga a buscarla a mano, y entonces no se arregla. */
const muertas = new Map();
let selectores = 0;
let clases = 0;
let compuestas = 0;

for (const bloque of hoja.split('}')) {
  const i = bloque.lastIndexOf('{');
  if (i === -1) continue;
  const cabecera = bloque.slice(0, i).replace(/\/\*[\s\S]*?\*\//g, '').split('\n').pop().trim();
  if (!cabecera || cabecera.startsWith('@') || cabecera.startsWith(':root')) continue;

  for (const parte of cabecera.split(',')) {
    const sel = parte.trim();
    if (!sel || sel.startsWith('@')) continue;
    selectores++;

    /* Un selector se parte en UNIDADES COMPUESTAS: los trozos que se aplican
       al mismo elemento. `.a .b.c > .d` son tres unidades, y solo la del medio
       pide dos clases a la vez. Los combinadores separan elementos distintos,
       así que `.sel-lista .sel-op` no es un modificador de nada. */
    for (const unidad of quitarEstados(sel).split(/[\s>+~]+/)) {
      const enUnidad = [...unidad.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]);
      if (enUnidad.length < 2) continue;   // sin base + modificador no hay caso
      compuestas++;

      clases += enUnidad.length;

      const propias = enUnidad.filter(
        (c) => !(DEL_ANFITRION.test(c) && ++SALTADAS.anfitrion)
            && !(DE_TOKENS.test(c) && ++SALTADAS.tokens),
      );
      if (propias.length < 2) continue;

      // Alguien las emite todas juntas: la regla casa de verdad en su producto.
      if (alguienLasJunta(propias)) continue;

      const vivas = propias.filter((c) => laEmiteAlguien(c));
      // Sin ninguna viva, el elemento entero no existe en ningún producto: eso
      // es la enfermedad R34, que ya está auditada y tiene su propio registro.
      if (!vivas.length) { SALTADAS.sinBase++; continue; }

      // Las que no emite NADIE son las muertas de libro. Si todas se emiten
      // por separado pero nunca juntas, la muerta es la que no acompaña a la
      // base: se señala la que no comparte archivo con ella.
      const nadie = propias.filter((c) => !laEmiteAlguien(c));
      const culpables = nadie.length ? nadie : propias.filter((c) => c !== vivas[0]);
      for (const c of culpables) {
        if (!muertas.has(c)) muertas.set(c, new Set());
        muertas.get(c).add(`${sel}   ← la base .${vivas[0]} sí se emite`);
      }
    }
  }
}

console.log(`\n  Candado de la promesa muerta — MMI-DS v${VERSION}\n`);
console.log(`  Hoja medida:      sistema/componentes/componentes.css   (la que VIAJA)`);
console.log(`  Selectores:            ${selectores}`);
console.log(`  Unidades compuestas:   ${compuestas} — dos clases sobre el MISMO elemento`);
console.log(`  Clases en ellas:       ${clases}`);
console.log(`  Componentes leídos:    ${PORARCHIVO.length} — cada uno con SU juego de clases`);
console.log(`  Saltadas por regla:      ${SALTADAS.anfitrion} del anfitrión · ${SALTADAS.tokens} de tokens\n`);

/* La deuda que YA NO diverge se poda o el candado falla. Una excepción que
   sobrevive a su defecto vuelve a ser el inventario a mano de siempre. */
const arregladas = [...DEUDA.keys()].filter((c) => !muertas.has(c));
const nuevas = new Map([...muertas].filter(([c]) => !DEUDA.has(c)));

console.log(`  Deuda declarada:       ${DEUDA.size}\n`);

if (DEUDA.size - arregladas.length) {
  console.log('  Promesa muerta DECLARADA, pendiente de arreglo:\n');
  for (const [c, porque] of DEUDA) {
    if (arregladas.includes(c)) continue;
    console.log(`    .${c}`);
    console.log(`      ${porque}\n`);
  }
}

if (arregladas.length) {
  console.error('  Deuda declarada que ya NO diverge — hay que podarla:\n');
  for (const c of arregladas) console.error(`    .${c}`);
  console.error('\n  Se arregló y la línea sigue en la lista. Quítala de DEUDA: una lista');
  console.error('  de excepciones que nadie poda deja de ser una lista y pasa a ser ruido.\n');
  process.exit(1);
}

if (nuevas.size) {
  console.error('  Reglas NUEVAS que VIAJAN y que ningún componente puede activar:\n');
  for (const [c, sels] of [...nuevas].sort()) {
    console.error(`    .${c}`);
    for (const s of [...sels].sort().slice(0, 4)) console.error(`        ${s}`);
    if (sels.size > 4) console.error(`        … y ${sels.size - 4} selector(es) más`);
  }
  console.error('\n  Cada una de estas reglas se entrega a todos los productos y no puede');
  console.error('  casar en ninguno. El catálogo la enseña; la pantalla no la recibe.');
  console.error('\n  Tres salidas, y las tres son honestas:');
  console.error('    · que el componente emita la clase —es lo que casi siempre falta—;');
  console.error('    · que la regla deje de viajar, si era mobiliario del catálogo:');
  console.error('      se le pone «-demo-» en el nombre y el extractor la corta sola;');
  console.error('    · que se borre, si ya no la quiere nadie.\n');
  process.exit(1);
}

console.log('  Ninguna promesa muerta NUEVA. Lo que viaja lo puede activar alguien,');
console.log('  salvo la deuda declarada de arriba.\n');
