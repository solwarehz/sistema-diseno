#!/usr/bin/env node
/**
 * GENERADOR DEL ICONO DE REACT
 *
 *   node sistema/iconos/generar-react.mjs
 *
 * Escribe `componentes/src/Icono.tsx` a partir de los mismos `TRAZOS` que ya
 * usa el catálogo. **Una sola fuente para los dos**: si un trazo cambia aquí,
 * cambia en el catálogo y en el componente a la vez.
 *
 * POR QUÉ EXISTE. `icono()` devuelve una CADENA de SVG, que en una plantilla es
 * lo cómodo y en React obliga a `dangerouslySetInnerHTML`. Control
 * Administrativos V2.0 lo señaló con la razón correcta: hoy es inofensivo
 * —el contenido son constantes nuestras, nunca entrada de nadie— pero
 * **normaliza el patrón**. Doce usos de la puerta insegura en su código, y el
 * día que alguien meta ahí algo que venga de fuera, nadie se va a extrañar.
 *
 * Se resuelve generando ELEMENTOS DE REACT de verdad, no envolviendo la cadena:
 * envolverla habría escondido la puerta sin cerrarla. Así el conteo pasa de
 * doce a cero, dentro y fuera.
 *
 * ARCHIVO GENERADO. `Icono.tsx` lleva el aviso y no se edita a mano.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRAZOS, TAMANOS } from './iconos.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

/** `stroke-width` → `strokeWidth`. React no acepta el guion en atributos SVG. */
const camel = (a) => a.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Convierte el marcado del trazo en JSX. Se hace con una expresión regular y no
 * con un analizador de XML a propósito: los trazos son nuestros, de una sola
 * línea, y con tres formas —path, circle, rect—. Un analizador completo sería
 * una dependencia nueva para un problema que no la necesita.
 *
 * Si algún día un trazo trae algo que esto no entiende, el generador FALLA en
 * vez de emitir JSX roto: mejor no publicar que publicar un icono partido.
 */
function aJsx(trazo, nombre) {
  const piezas = [...trazo.matchAll(/<(path|circle|rect|line|polyline)\s+([^/>]*)\/?>/g)];
  const cubierto = piezas.reduce((n, p) => n + p[0].length, 0);
  if (!piezas.length || cubierto < trazo.replace(/\s+$/, '').length) {
    throw new Error(
      `El trazo de "${nombre}" trae algo que el generador no entiende. ` +
      `Añade la forma a la expresión o simplifica el trazo; lo que no se puede ` +
      `convertir no se publica a medias.`
    );
  }
  return piezas
    .map(([, etiqueta, attrs]) => {
      const props = [...attrs.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)]
        .map(([, k, v]) => `${camel(k)}="${v}"`)
        .join(' ');
      return `<${etiqueta} ${props} />`;
    })
    .join('');
}

const nombres = Object.keys(TRAZOS).sort();
const cuerpos = nombres.map((n) => `  ${n}: <>${aJsx(TRAZOS[n], n)}</>,`).join('\n');

const salida = `/**
 * ICONOS COMO COMPONENTE DE REACT
 *
 * ARCHIVO GENERADO. No editar a mano.
 * Fuente: sistema/iconos/iconos.mjs → node sistema/iconos/generar-react.mjs
 *
 * Los mismos ${nombres.length} trazos que usa el catálogo, como elementos de React.
 *
 * Existe para que NADIE tenga que usar \`dangerouslySetInnerHTML\`. El módulo
 * \`iconos.mjs\` devuelve cadenas de SVG —lo cómodo en una plantilla— y en React
 * eso obliga a la única puerta insegura del lenguaje. Hoy sería inofensivo,
 * porque el contenido son constantes nuestras; el problema es que normaliza el
 * patrón, y el día que alguien meta ahí algo de fuera nadie se extrañará.
 *
 * Lo reportó Control Administrativos V2.0, que tenía doce usos en su código.
 *
 *     import { Icono } from 'sistema-diseno-ae/componentes';
 *     <Icono nombre="candado" />                    // 18px, el de texto
 *     <Icono nombre="lupa" tam="control" />         // 16px
 *
 * El icono va SIEMPRE oculto al lector: quien nombra es el elemento que lo
 * lleva. Un botón de solo icono necesita \`aria-label\`, y \`Boton\` lo exige.
 */

export const TAMANOS_ICONO = ${JSON.stringify(TAMANOS)} as const;

export type NombreIcono = keyof typeof TRAZOS_REACT;
export type TamanoIcono = keyof typeof TAMANOS_ICONO;

const TRAZOS_REACT = {
${cuerpos}
} as const;

export type IconoProps = {
  nombre: NombreIcono;
  /** \`etiqueta\` 14 · \`control\` 16 · \`texto\` 18 · \`estado\` 32. No hay más. */
  tam?: TamanoIcono;
  className?: string;
};

export function Icono({ nombre, tam = 'texto', className }: IconoProps) {
  const px = TAMANOS_ICONO[tam];
  return (
    <svg
      className={['ic', className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Oculto al lector y fuera del tabulador: el nombre lo pone quien lo usa.
      aria-hidden="true"
      focusable="false"
    >
      {TRAZOS_REACT[nombre]}
    </svg>
  );
}

/** Los nombres, para listarlos o validarlos. */
export const NOMBRES_ICONO = Object.keys(TRAZOS_REACT) as NombreIcono[];
`;

writeFileSync(join(RAIZ, 'componentes/src/Icono.tsx'), salida);
console.log(`\n  Icono.tsx  ${nombres.length} iconos como elementos de React · 0 usos de dangerouslySetInnerHTML\n`);
