#!/usr/bin/env node
/**
 * CANDADO DEL TONO — que dos tonos del mismo componente SE DISTINGAN ENTRE SI
 *
 *   node sistema/candado/verificar-tono.mjs
 *
 * POR QUE EXISTE. Lo reporto Control Administrativos V2.0 en el R143, midiendo
 * en el navegador: su registro diario clasifica cada fila con cinco estados a la
 * vez, el sistema publica DIEZ tonos de chip, y solo encontraban cuatro que se
 * distinguieran. Tenian razon, y era peor de lo que contaban: los cuatro
 * `chip-identidad-N` y `chip-pend` pintaban EL MISMO relleno —CERO de distancia
 * perceptual entre ellos—. Cinco de los diez tonos publicados eran uno.
 *
 * Y llevaba asi desde el R88, con todo en verde.
 *
 * QUE NO PODIA VERLO, y por que hacia falta uno mas. Los dieciseis candados
 * anteriores comparan el sistema CONSIGO MISMO: que las dos hojas digan lo
 * mismo, que el catalogo ensene lo que se entrega, que el orden no decida
 * distinto. Los cuatro chips de identidad pasaban todos, porque los dos lados
 * coincidian perfectamente en pintarlos iguales. Una divergencia no es la unica
 * forma de estar mal: TAMBIEN SE PUEDE ESTAR MAL DE FORMA CONSISTENTE.
 *
 *   · verificar-contraste mide TEXTO SOBRE FONDO, que es otra pregunta. Los
 *     cuatro chips de identidad la pasaban —texto-principal sobre
 *     fondo-encabezado, 12,48:1 en claro y 12,19:1 en oscuro— precisamente porque
 *     los cuatro eran el mismo.
 *   · verificar-promesa, -empate y -elemento comparan las dos hojas. Iguales.
 *   · verificar-cascada mira lo que FALTA declarar. No faltaba nada.
 *
 * Nadie preguntaba si dos rellenos DISTINTOS se ven distintos. El catalogo
 * incluso lo tenia escrito como regla —«una paleta larga de colores decorativos
 * acaba con dos que nadie distingue»— y no lo comprobaba nadie.
 *
 * QUE MIDE. La razon de contraste de WCAG no sirve para esto: dos colores de la
 * misma luminancia y distinto tono dan 1,00:1, y esa vara no sabe decir si uno
 * es gris y el otro magenta. Se mide con CIEDE2000, cuyo umbral de percepcion
 * —el JND— esta publicado en 2,3. La matematica vive en
 * `sistema/tokens/distancia.mjs`, compartida con el catalogo para que la medida
 * que se publica y la que se vigila sean UNA.
 *
 * COMO. Los tonos NO se escriben aqui: se leen del componente que los publica
 * —el mapa `CLASE` de `Chip.tsx`—, asi que un tono nuevo entra vigilado el
 * mismo dia que nace. De cada tono se resuelve el relleno que gana en la
 * cascada, en LAS DOS HOJAS, y se convierte a hexadecimal por el token. Cada
 * par se mide en los dos modos.
 *
 * LIMITES, declarados:
 *   · SOLO EL CHIP. El avatar y el punto de leyenda usan los mismos cuatro
 *     colores de identidad y quedan cubiertos de rebote, pero el horario
 *     distingue sus bloques por el FILETE y eso aqui no se mide. Familia
 *     pendiente, con su daño: dos bloques de horario indistinguibles se leerian
 *     como un turno que no es.
 *   · Mide el RELLENO, no el conjunto relleno+texto+filete. Dos chips de
 *     relleno identico y filete distinto darian cero aqui — y es lo correcto:
 *     un filete de 3px no es como se distingue una etiqueta de otra a un metro
 *     de la pantalla. Que el filete exista lo vigila la cascada.
 *   · No sabe de daltonismo. Dos tonos separados en croma y no en claridad
 *     pasan aqui y pueden fundirse para quien no distinga ese eje. Por eso el
 *     texto del chip sigue siendo obligatorio (SC 1.4.1) y por eso esto es un
 *     suelo, no un certificado.
 *
 * Calculo puro. No toca red. No escribe nada.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, semanticos } from '../tokens/fuente.mjs';
import { de2000, JND } from '../tokens/distancia.mjs';
import { parsear, resolver, elem } from './verificar-cascada.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

const html = readFileSync(join(RAIZ, 'cascaron', 'index.html'), 'utf8');
const HOJAS = [
  ['catalogo', parsear(html.split('<style>')[1].split('</style>')[0])],
  ['entrega', parsear(readFileSync(join(RAIZ, 'sistema/componentes/componentes.css'), 'utf8'))],
];

// ── Los tonos los publica el componente, no este archivo ────────────────────

const chipTsx = readFileSync(join(RAIZ, 'componentes/src/Chip.tsx'), 'utf8');
const mapa = chipTsx.split('const CLASE')[1];
if (!mapa) {
  console.error('\n  Chip.tsx ya no declara `const CLASE`: este candado no sabe que medir.\n');
  process.exit(1);
}
/*
 * SE LEE EL MAPA ENTERO, CLAVE POR CLAVE, y no los literales sueltos.
 *
 * La primera version barria /'(chip-[a-z0-9-]+)'/ por el bloque. Con eso, un
 * tono declarado como `'identidad-5': 'chip-identidad-5 chip-macizo'` —dos
 * clases en el valor, que es JSX perfectamente valido— se leia como un nombre
 * imposible que ninguna regla casa... y el candado imprimia «10 nombres son 10
 * tonos» y salia en VERDE con un tono nuevo sin vigilar. Lo cazo una auditoria.
 * Fallar en silencio es lo unico que un candado no puede hacer.
 *
 * Ahora se cuentan las CLAVES y se exige que cada valor sea UNA clase. Si el
 * mapa cambia de forma, el candado se planta en vez de medir a medias.
 */
const cuerpoMapa = mapa.split('};')[0];
const entradas = [...cuerpoMapa.matchAll(/^\s*'?([a-zA-Z0-9_-]+)'?\s*:\s*(.+?),\s*$/gm)];
const TONOS = [];
for (const [, clave, crudo] of entradas) {
  const lit = /^'([^']*)'$/.exec(crudo.trim());
  if (!lit) {
    console.error(`\n  El tono «${clave}» de Chip.tsx no es un literal de una comilla: ${crudo.trim()}`);
    console.error('  Este candado no sabe medir lo que no puede leer, y medir a medias es peor');
    console.error('  que no medir: saldria en verde delante de un tono sin vigilar.\n');
    process.exit(1);
  }
  const clases = lit[1].trim().split(/\s+/);
  if (clases.length !== 1) {
    console.error(`\n  El tono «${clave}» de Chip.tsx emite ${clases.length} clases: ${lit[1]}`);
    console.error('  Un tono es UNA clase. Con dos, lo que resuelve la cascada depende de cual');
    console.error('  de las dos gane, y esto mediria la equivocada — o ninguna.\n');
    process.exit(1);
  }
  TONOS.push(clases[0]);
}

if (TONOS.length < 2) {
  console.error('\n  No se han leido tonos de Chip.tsx. Sin tonos no hay nada que medir.\n');
  process.exit(1);
}
if (TONOS.length !== new Set(TONOS).size) {
  console.error('\n  Dos tonos de Chip.tsx emiten la MISMA clase. Son un tono con dos nombres.\n');
  process.exit(1);
}

// ── El relleno que gana, por tono y por hoja ────────────────────────────────

const ANCHO = 1280;          // el relleno de un chip no depende del ancho
const problemas = [];

/** `var(--identidad-1)` → el token. Cualquier otra cosa se declara y no se inventa. */
function aToken(valor) {
  const m = /^var\(\s*--([a-z0-9-]+)\s*\)$/.exec(valor.trim());
  return m ? m[1] : null;
}

/*
 * CADA MODO SE RESUELVE SOBRE LA HOJA DE ESE MODO, no sobre el token.
 *
 * La primera version resolvia el relleno UNA vez, sacaba el nombre del token y
 * leia `semanticos[token].claro/.oscuro`. Eso mide los dos modos DEL TOKEN, no
 * los dos modos de la hoja — y solo coincide mientras el oscuro sea cien por
 * cien variables. La hoja ya tiene cuatro reglas que no lo son
 * (`[data-tema='oscuro'] select.campo` y compania), asi que una sola regla de
 * esa forma sobre un chip devolvia el defecto R143 entero EN OSCURO con el
 * candado en verde. Lo reprodujo una auditoria.
 *
 * Ahora se resuelve con el <html> del modo colgando de la cadena: en claro sin
 * atributo, en oscuro con `data-tema='oscuro'`. Lo que una regla de tema pise,
 * se ve.
 */
const MODOS = [
  ['claro', elem('html')],
  ['oscuro', elem('html', [], { 'data-tema': 'oscuro' })],
];

const medidas = new Map();   // hoja → tono → { claro, oscuro }

for (const [nombreHoja, reglas] of HOJAS) {
  const porTono = new Map();
  for (const tono of TONOS) {
    const valores = {};
    for (const [modo, raiz] of MODOS) {
      const cadena = [raiz, elem('span', ['chip', tono])];
      const ganador = resolver(reglas, cadena, 'background', ANCHO);
      if (!ganador) {
        problemas.push(`[${nombreHoja}/${modo}] .${tono} no recibe NINGUN background.`
          + '\n        Un tono sin relleno propio es el mismo tono que su vecino.');
        continue;
      }
      const token = aToken(ganador.valor);
      if (!token) {
        problemas.push(`[${nombreHoja}/${modo}] .${tono} pinta «${ganador.valor}», que no es var(--token).`
          + '\n        Sin token no se puede medir, y lo que no se mide no se vigila.');
        continue;
      }
      const t = semanticos[token];
      if (!t) {
        problemas.push(`[${nombreHoja}/${modo}] .${tono} usa --${token}, que no es un token semantico.`);
        continue;
      }
      valores[modo] = t[modo];
    }
    if (valores.claro && valores.oscuro) porTono.set(tono, valores);
  }
  medidas.set(nombreHoja, porTono);
}

// ── Cada par, en los dos modos ──────────────────────────────────────────────

const tabla = [];            // [dE, modo, hoja, a, b, hexA, hexB]

for (const [nombreHoja, porTono] of medidas) {
  const tonos = [...porTono.keys()];
  for (const modo of ['claro', 'oscuro']) {
    for (let i = 0; i < tonos.length; i++) {
      for (let j = i + 1; j < tonos.length; j++) {
        const A = porTono.get(tonos[i]);
        const B = porTono.get(tonos[j]);
        tabla.push([de2000(A[modo], B[modo]), modo, nombreHoja, tonos[i], tonos[j], A[modo], B[modo]]);
      }
    }
  }
}

tabla.sort((a, b) => a[0] - b[0]);

console.log(`\n  Candado del tono — MMI-DS v${VERSION}\n`);
console.log(`  ${TONOS.length} tonos leidos de Chip.tsx · ${tabla.length} pares medidos en CIEDE2000`);
console.log(`  Suelo: ${JND.toFixed(1)} — el umbral de percepcion publicado.\n`);

const debajo = tabla.filter(([d]) => d < JND);

console.log('  Los cinco pares mas cercanos:\n');
for (const [d, modo, hoja, a, b, hexA, hexB] of tabla.slice(0, 5)) {
  console.log(`    ${d.toFixed(1).padStart(5)}  [${hoja}/${modo}] .${a} ${hexA} / .${b} ${hexB}`);
}
console.log('');

// ── Y LO QUE EL CATALOGO PUBLICA, MEDIDO OTRA VEZ ──────────────────────────
//
// La pagina del chip publica una tabla con la distancia de cada tono a su
// vecino mas cercano. Una cifra publicada que nadie recalcula envejece sola —es
// lo que le paso a «34 pruebas» y a «los 17 candados»—, asi que aqui se vuelven
// a medir TODAS sobre el HTML que se entrega.

const publicadas = [...html.matchAll(
  /<tr data-tono="([^"]+)" data-claro-vecino="([^"]+)" data-claro-de="([^"]+)"\s*data-oscuro-vecino="([^"]+)" data-oscuro-de="([^"]+)">([\s\S]*?)<\/tr>/g
)];

/*
 * Y SE MIRA LA CIFRA QUE SE VE, no solo la del atributo.
 *
 * La primera version revalidaba unicamente `data-*`. Cambiando el <b>11,4</b>
 * visible por <b>99,9</b> y dejando el atributo quieto, el candado salia en
 * verde — mientras el catalogo promete tres lineas mas abajo que «verificar-tono
 * las vuelve a medir sobre este mismo HTML». Hoy las dos salen del mismo
 * calculo del generador, asi que el riesgo es bajo; pero una promesa que solo
 * es cierta de la copia invisible no es una promesa. Lo cazo una auditoria.
 */
const visibles = (celdas) =>
  [...celdas.matchAll(/<td class="num mono">\.([a-z0-9-]+) <b>([\d,]+)<\/b><\/td>/g)]
    .map((m) => [m[1], m[2]]);

const catalogo = medidas.get('catalogo');
const vistos = new Set();

for (const [, tono, vClaro, dClaro, vOscuro, dOscuro, celdas] of publicadas) {
  vistos.add(tono);
  const alaVista = visibles(celdas);
  if (alaVista.length !== 2) {
    problemas.push(`[catalogo] la fila de .${tono} publica ${alaVista.length} cifras a la vista`
      + ' y deberia publicar dos: la de claro y la de oscuro.');
  } else {
    for (const [i, [modo, vDicho, dDicho]] of [['claro', vClaro, dClaro], ['oscuro', vOscuro, dOscuro]].entries()) {
      const [vVisto, dVisto] = alaVista[i];
      const esperado = Number(dDicho).toFixed(1).replace('.', ',');
      if (vVisto !== vDicho || dVisto !== esperado) {
        problemas.push(`[catalogo/${modo}] .${tono} ENSENA «.${vVisto} ${dVisto}» y en el atributo`
          + `\n        dice «.${vDicho} ${esperado}». Lo que se lee y lo que se revalida no son lo mismo.`);
      }
    }
  }
  if (!catalogo.has(tono)) {
    problemas.push(`[catalogo] la tabla publica .${tono}, que la hoja no pinta.`);
    continue;
  }
  for (const [modo, vDicho, dDicho] of [['claro', vClaro, dClaro], ['oscuro', vOscuro, dOscuro]]) {
    const mio = [...catalogo.keys()]
      .filter((t) => t !== tono)
      .map((t) => [t, de2000(catalogo.get(tono)[modo], catalogo.get(t)[modo])])
      .sort((a, b) => a[1] - b[1])[0];
    if (!mio) continue;
    if (mio[0] !== vDicho) {
      problemas.push(`[catalogo/${modo}] .${tono} publica que su vecino mas cercano es .${vDicho},`
        + `\n        y midiendolo es .${mio[0]}.`);
    } else if (Math.abs(mio[1] - Number(dDicho)) > 0.005) {
      problemas.push(`[catalogo/${modo}] .${tono} publica ${dDicho} de distancia a .${vDicho},`
        + `\n        y midiendolo son ${mio[1].toFixed(2)}.`);
    }
  }
}

for (const tono of TONOS) {
  if (!vistos.has(tono)) {
    problemas.push(`[catalogo] .${tono} existe en Chip.tsx y la tabla de distancias NO lo publica.`
      + '\n        Un tono que el catalogo no ensena es un tono que nadie ha mirado nunca.');
  }
}

console.log(`  ${publicadas.length} distancias publicadas en el catalogo, vueltas a medir aqui.\n`);

if (debajo.length) {
  console.error(`  ${debajo.length} par(es) por DEBAJO del umbral de percepcion:\n`);
  for (const [d, modo, hoja, a, b, hexA, hexB] of debajo) {
    console.error(`    ${d.toFixed(1).padStart(5)}  [${hoja}/${modo}] .${a} ${hexA} / .${b} ${hexB}`);
  }
  console.error('\n  Dos tonos que no se distinguen son UN tono con dos nombres, y quien');
  console.error('  los use para separar dos cosas creera que las ha separado.');
  console.error('\n  No se arregla anadiendo un color: se arregla pintando con los que ya');
  console.error('  hay. Ampliar la paleta autorizada no es decision del agente.\n');
}

if (problemas.length) {
  const unicos = [...new Set(problemas)];
  console.error(`  ${unicos.length} tono(s) que no se pueden medir o que el catalogo cuenta mal:\n`);
  for (const p of unicos) console.error(`    ${p}`);
  console.error('');
}

if (debajo.length || problemas.length) process.exit(1);

console.log('  Ningun par de tonos cae por debajo del umbral, en ninguna hoja ni modo.');
console.log(`  ${TONOS.length} nombres son ${TONOS.length} tonos.\n`);
