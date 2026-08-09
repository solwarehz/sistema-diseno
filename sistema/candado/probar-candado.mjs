#!/usr/bin/env node
/**
 * PRUEBA DEL CANDADO DE LINT
 *
 *   node sistema/candado/probar-candado.mjs
 *
 * `candado.eslint.config.mjs` llevaba SIETE versiones entregándose en cada ZIP
 * sin haberse ejecutado nunca —falta Docker para correr ESLint—, y su propia
 * línea 92 decía «Ver `probar-candado.mjs`» apuntando a un archivo que no
 * existía. El `patrones` que exporta se creó para esta prueba y nadie la
 * escribió.
 *
 * Esto la escribe. No necesita ESLint, ni instalar nada, ni Docker: los ocho
 * patrones son expresiones regulares y se pueden probar solas.
 *
 * NO sustituye a ESLint. Comprueba que cada patrón CAZA lo que debe y NO caza
 * lo que no debe; no comprueba que los selectores de esquery del config estén
 * bien formados. Eso sigue sin verificarse y está declarado en el reporte.
 *
 * Regla de la casa (§9): una prueba que no se ha visto fallar no protege nada.
 * Por eso cada patrón lleva casos que DEBEN cazar y casos que NO, y un patrón
 * que deje de cazar su propio ejemplo hace fallar esto con salida 1.
 */

import config, { patrones } from './candado.eslint.config.mjs';

// Para cada patrón: lo que tiene que cazar y lo que tiene que dejar pasar.
// Los «pasa» son la mitad que de verdad importa: un patrón demasiado ancho
// bloquea código legítimo y acaba desactivado, que es peor que no tenerlo.
const CASOS = [
  {
    nombre: 'hex crudo',
    caza: ['color: #fff', 'background:#0063CB', 'border-color: #ABC123'],
    pasa: ['color: var(--accion)', 'className="bg-accion"', 'id="#seccion"', 'texto sin almohadilla'],
  },
  {
    nombre: 'funciones de color',
    caza: ['rgb(0,0,0)', 'rgba(255,255,255,.5)', 'hsl(210 50% 40%)', 'color-mix(in srgb, red, blue)', 'oklch(70% .1 200)'],
    pasa: ['var(--accion)', 'translate(4px)', 'calc(100% - 8px)', 'grayscale(1)'],
  },
  {
    nombre: 'valor arbitrario de Tailwind',
    caza: ['bg-[#fff]', 'text-[13px]', 'border-[2px]', 'shadow-[0_1px_2px]'],
    pasa: ['bg-accion', 'text-s-cuerpo', 'grid-cols-[1fr]', 'w-[240px]'],
  },
  {
    nombre: 'tamaño de texto arbitrario',
    caza: ['text-[13px]', 'text-[1.2rem]', 'text-[0.9em]'],
    pasa: ['text-s-cuerpo', 'text-l-hero', 'text-[color:var(--accion)]'],
  },
  {
    nombre: 'outline none',
    caza: ['outline-none', 'outline: none', 'outline:none'],
    pasa: ['outline: 2px solid var(--foco)', 'outline-offset: 2px'],
  },
  {
    nombre: 'primitiva en componente',
    caza: ['bg-primitiva-azul-600', 'text-primitiva-gris-900'],
    pasa: ['bg-accion', 'text-texto-principal'],
  },
  {
    nombre: 'colores de campaña',
    caza: ['bg-marca-amarillo', 'text-marca-celeste', 'border-marca-amarillo'],
    pasa: ['text-marca-rojo', 'bg-marca-oro', 'bg-accion-2'],
  },
  {
    nombre: 'peso tipográfico prohibido',
    caza: ['font-thin', 'font-light', 'font-extrabold', 'font-black', 'font-extralight'],
    pasa: ['font-normal', 'font-medium', 'font-semibold', 'font-bold'],
  },
];

// ── Ejecución ───────────────────────────────────────────────────────────────

if (patrones.length !== CASOS.length) {
  console.error(`\n  El candado tiene ${patrones.length} patrones y hay ${CASOS.length} juegos de casos.`);
  console.error('  Si añadiste una regla, añade también sus casos. Un patrón sin');
  console.error('  prueba es un patrón que nadie ha visto funcionar.\n');
  process.exit(1);
}

const fallos = [];
console.log(`\n  Candado de lint — ${patrones.length} patrones\n`);

patrones.forEach(({ patron, mensaje }, i) => {
  const caso = CASOS[i];
  const escapados = [];

  for (const texto of caso.caza) {
    patron.lastIndex = 0;
    if (!patron.test(texto)) escapados.push(`NO caza  ${JSON.stringify(texto)}`);
  }
  for (const texto of caso.pasa) {
    patron.lastIndex = 0;
    if (patron.test(texto)) escapados.push(`caza de más  ${JSON.stringify(texto)}`);
  }

  const n = caso.caza.length + caso.pasa.length;
  console.log(`  ${escapados.length ? '✗' : '✓'} ${caso.nombre.padEnd(32)} ${n} casos`);
  escapados.forEach((e) => {
    console.log(`      ${e}`);
    fallos.push(`${caso.nombre}: ${e}`);
  });

  // Un patrón sin mensaje es un fallo que no se puede corregir: quien lo
  // encuentre no sabrá qué poner en su lugar.
  if (!mensaje || mensaje.length < 20) fallos.push(`${caso.nombre}: mensaje ausente o demasiado corto`);
});

// ── El patrón, YA INCRUSTADO EN EL SELECTOR ─────────────────────────────────
//
// Esta es la mitad que faltaba, y la que de verdad rompió. Probar el patrón
// suelto no sirve de nada si al meterlo en el selector de esquery cambia de
// significado: durante siete versiones `\b` se convertía en «barra invertida
// seguida de b» y el candado no cazaba nada, en silencio.
//
// Aquí se extrae el patrón del selector generado y se comprueba que reconstruya
// EXACTAMENTE el original. Lo reportó el equipo de Control Administrativos V2.0
// usándolo en producción; el sistema debería haberlo cazado solo.

console.log('  El patrón, ya dentro del selector\n');

const reglas = config.at(-1)?.rules?.['no-restricted-syntax'] ?? [];
const selectoresLiteral = reglas
  .filter((r) => typeof r === 'object' && /^Literal\[value=\//.test(r.selector || ''))
  .map((r) => r.selector);

if (selectoresLiteral.length !== patrones.length) {
  fallos.push(`hay ${patrones.length} patrones y ${selectoresLiteral.length} selectores de Literal`);
  console.log(`  ✗ ${patrones.length} patrones → ${selectoresLiteral.length} selectores`);
} else {
  patrones.forEach(({ patron }, i) => {
    const dentro = selectoresLiteral[i].replace(/^Literal\[value=\//, '').replace(/\/\]$/, '');
    let veredicto;
    try {
      // Se deshace solo el escape de barra, que es lo único que se escapa.
      const rehecho = new RegExp(dentro.replace(/\\\//g, '/'));
      veredicto = rehecho.source === patron.source ? null : `reconstruye "${rehecho.source.slice(0, 40)}"`;
    } catch (e) {
      veredicto = `no compila: ${e.message}`;
    }
    console.log(`  ${veredicto ? '✗' : '✓'} ${patron.source.slice(0, 40).padEnd(42)}${veredicto || 'idéntico'}`);
    if (veredicto) fallos.push(`selector ${i}: ${veredicto}`);
  });
}

const total = CASOS.reduce((n, c) => n + c.caza.length + c.pasa.length, 0) + patrones.length;
console.log(`\n  ${total} casos, ${fallos.length} fallos\n`);
if (fallos.length) process.exit(1);
