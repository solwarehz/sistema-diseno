/**
 * GENERADOR DE ARTEFACTOS DE COLOR
 *
 *   node sistema/tokens/generar.mjs
 *
 * Lee `fuente.mjs` y escribe:
 *   · paleta.lock.json      contrato con contrastes medidos
 *   · tokens-light.css      variables CSS
 *   · tailwind-preset.ts    preset de Tailwind 3.4
 *
 * Cálculo puro. No toca red. Escribe solo en esta carpeta.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, NORMA, primitivas, categoricas, escalones, autorizados, semanticos, marca, pares, correcciones , CAMBIOS } from './fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));

// ── WCAG 2.2 — luminancia relativa y razón de contraste ────────────────────
// https://www.w3.org/TR/WCAG22/#dfn-relative-luminance

const canal = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminancia = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
};

const contraste = (a, b) => {
  const [la, lb] = [luminancia(a), luminancia(b)];
  const [alto, bajo] = la > lb ? [la, lb] : [lb, la];
  return (alto + 0.05) / (bajo + 0.05);
};

// Redondeo a 2 decimales hacia abajo: nunca reportar 4.50 cuando es 4.499
const medir = (a, b) => Math.floor(contraste(a, b) * 100) / 100;

// ── Verificación de los pares ──────────────────────────────────────────────

const MODOS = ['claro', 'oscuro'];

const verificar = (modo) =>
  pares.map(([frente, fondo, minimo, motivo]) => {
    const hexFrente = semanticos[frente][modo];
    const hexFondo = semanticos[fondo][modo];
    const ratio = medir(hexFrente, hexFondo);
    const bloqueante = minimo !== 'informativo';
    return {
      modo,
      frente,
      fondo,
      hexFrente,
      hexFondo,
      ratio,
      minimo,
      motivo,
      cumple: bloqueante ? ratio >= minimo : null,
    };
  });

const porModo = Object.fromEntries(MODOS.map((m) => [m, verificar(m)]));
const resultados = MODOS.flatMap((m) => porModo[m]);

const fallos = resultados.filter((r) => r.cumple === false);
const verificados = resultados.filter((r) => r.cumple !== null);

// ── paleta.lock.json ───────────────────────────────────────────────────────

const lock = {
  documento: 'MMI-DS',
  version: VERSION,
  norma: NORMA,
  generado: 'node sistema/tokens/generar.mjs',
  modos: MODOS,
  aviso:
    'Archivo generado. No editar a mano. La fuente es sistema/tokens/fuente.mjs. ' +
    'Cambiar un valor exige regenerar, re-verificar y subir versión (§2.5 regla 8).',
  resumen: {
    paresTotales: resultados.length,
    paresBloqueantes: verificados.length,
    paresInformativos: resultados.length - verificados.length,
    fallos: fallos.length,
    porModo: Object.fromEntries(
      MODOS.map((m) => [
        m,
        {
          bloqueantes: porModo[m].filter((r) => r.cumple !== null).length,
          fallos: porModo[m].filter((r) => r.cumple === false).length,
        },
      ])
    ),
  },
  correcciones,
  primitivas,
  semanticos: Object.fromEntries(
    Object.entries(semanticos).map(([k, v]) => [
      k,
      { claro: v.claro, oscuro: v.oscuro, origen: v.origen, uso: v.uso },
    ])
  ),
  marca,
  contrastes: resultados,
};

writeFileSync(join(AQUI, 'paleta.lock.json'), JSON.stringify(lock, null, 2) + '\n');

// ── tokens-light.css ───────────────────────────────────────────────────────

const bloque = (titulo, lineas) =>
  `  /* ${titulo} */\n${lineas.map((l) => `  ${l}`).join('\n')}\n`;

const grupos = {
  Superficies: ['fondo-pagina', 'fondo-tarjeta', 'fondo-encabezado', 'fondo-fila-alt', 'fondo-fila-hover'],
  Texto: ['texto-principal', 'texto-secundario', 'texto-pista', 'texto-invertido'],
  Bordes: ['borde', 'borde-fuerte', 'borde-campo'],
  Acción: ['accion', 'accion-hover', 'accion-activa', 'accion-texto', 'accion-deshabilitada', 'accion-texto-desh', 'accion-2', 'accion-2-fondo', 'neutra-fondo', 'neutra-texto', 'enlace', 'destructiva', 'destructiva-hover', 'destructiva-texto'],
  'Marco de aplicación': ['marco-fondo', 'marco-texto', 'marco-acento', 'marco-item-activo', 'marco-nivel-1', 'marco-nivel-2', 'marco-borde', 'marco-texto-tenue'],
  Foco: ['foco', 'foco-en-marco'],
  'Estados — siempre en pares fondo/texto': [
    'exito-fondo', 'exito-texto', 'exito-acento',
    'aviso-fondo', 'aviso-texto', 'aviso-acento',
    'error-fondo', 'error-texto', 'error-acento',
    'info-fondo', 'info-texto', 'info-acento',
  ],
  'Interruptor apagado — es un estado elegido, no un error': [
    'apagado-fondo', 'apagado-borde', 'apagado-bolita',
  ],
  'Identidad — avatar. NO significan nada': [
    'identidad-1', 'identidad-2', 'identidad-3', 'identidad-4', 'identidad-texto',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CANDADO DEL AGRUPADO
//
// `grupos` se escribe a mano y `tokens.css` se arma SOLO desde ahí. Un token
// que exista en `semanticos` pero no esté en ningún grupo se verifica en el
// contrato, aparece en el preset... y NUNCA llega al CSS. En silencio.
//
// Pasó de verdad con los cinco tokens de identidad en v1.7.0: el verificador
// daba 0 fallos, el contrato los contaba, y en pantalla el avatar salía
// transparente porque `var(--identidad-1)` no existía.
//
// Un token que no llega al CSS es un token que no existe. Esto lo convierte en
// fallo de generación en vez de en un rato de depuración.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// CANDADO DEL ORIGEN
//
// `origen` decía de qué primitiva sale cada token, y NADIE lo comprobaba. Se
// demostró ejecutándolo: poniendo `origen: 'unicornio.999'` —una familia de
// color que no existe— el generador salía con 0, el contrato lo daba por bueno
// y el verificador imprimía «El contrato es fiel a los valores». Una referencia
// que nadie resuelve no es una referencia: es un comentario disfrazado.
//
// Además mentía por omisión. Nueve tokens declaraban su primitiva de modo claro
// y callaban la de oscuro: `accion` decía `azul.600` cuando en oscuro vale
// `azul.300`. Y cinco usaban una sintaxis compuesta inventada —`gris.500/600`,
// `oro.100/800`— que no tiene gramática y nada podía interpretar.
//
// Ahora `origen` es `{ claro, oscuro }` y esto comprueba lo FUERTE: no solo que
// la primitiva exista, sino que su valor COINCIDA con el del token en ese modo.
// Existir no basta —apuntar a `azul.500` teniendo el valor de `azul.600` sería
// igual de falso y saldría en verde—.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// CANDADO DEL REGISTRO DE CAMBIOS
//
// Un registro de cambios que se queda atrás es peor que no tenerlo: dice que no
// pasó nada. Esto obliga a que la versión en curso tenga entrada, y a que las
// altas de token declaradas existan de verdad en `semanticos`.
// ─────────────────────────────────────────────────────────────────────────────
const malCambios = [];
if (!CAMBIOS.length || CAMBIOS[0].v !== VERSION) {
  malCambios.push(`la versión en curso es ${VERSION} y la primera entrada de CAMBIOS es ${CAMBIOS[0]?.v ?? '(ninguna)'}`);
}
for (const c of CAMBIOS) {
  for (const t of c.tokens.alta) {
    // La entrada de 1.1.0 resume los 38 iniciales en una frase; no es un token.
    if (/^\d/.test(t)) continue;
    if (!semanticos[t]) malCambios.push(`${c.v} declara el alta de "${t}", que no existe en semanticos`);
  }
}
if (malCambios.length) {
  console.error('\n  El registro de cambios no cuadra:\n');
  malCambios.forEach((m) => console.error(`    ${m}`));
  console.error('\n  Añade la entrada de esta versión en CAMBIOS, dentro de fuente.mjs.\n');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// CANDADO DEL HEXADECIMAL SUELTO — ahora vive en `fuente.mjs`
//
// Hasta la v1.10.1 esto recorría siete grupos buscando `origen === 'directo'`,
// y dejaba fuera a propósito los de identidad y los de marca. Un candado con
// lista de exentos protege lo que ya estaba bien y calla justo donde falla:
// los ocho hexadecimales sueltos del sistema estaban TODOS en los exentos.
//
// Se sustituyó por algo más simple y sin excepciones: el resolutor de
// `fuente.mjs` ya no acepta literales de ninguna clase, así que un token sin
// escalón no llega hasta aquí —revienta al importar—. `identidad` y `marca`
// pasaron a ser familias categóricas y se nombran igual que todo lo demás.
//
// Lo que este archivo NO puede ver es el hexadecimal escrito en una hoja de
// estilos o en un `style=`. De eso se ocupa `candado/verificar-color.mjs`.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CANDADO DE LOS COLORES AUTORIZADOS
//
// El usuario fijó la regla: no se añade ningún color AUTORIZADO sin permiso
// suyo. Nombrar sí es libre —un valor puede entrar en `marca`, que es conocida
// y no autorizada, para que el candado pueda vigilarlo—; autorizar no.
//
// Una regla que solo está escrita se salta sin querer, así que la lista va
// congelada en `autorizados.lock.json` y esto compara. Aparecer un escalón
// nuevo detiene la generación.
//
// No pretende ser infranqueable: quien añada el color puede regenerar el
// archivo. Lo que garantiza es que NO PASE POR DESCUIDO, y que quede escrito
// en el diff con su fecha. Es la misma garantía que el candado del registro
// de cambios, y ha bastado.
// ─────────────────────────────────────────────────────────────────────────────
const RUTA_AUT = join(AQUI, 'autorizados.lock.json');
const congelado = existsSync(RUTA_AUT) ? JSON.parse(readFileSync(RUTA_AUT, 'utf8')) : null;

if (congelado) {
  const antes = new Set(Object.keys(congelado.escalones));
  const ahora = new Map(autorizados);
  const nuevos = [...ahora.keys()].filter((k) => !antes.has(k));
  const idos = [...antes].filter((k) => !ahora.has(k));
  const movidos = [...ahora].filter(([k, v]) => antes.has(k) && congelado.escalones[k] !== v);

  if (nuevos.length || idos.length || movidos.length) {
    console.error('\n  La lista de COLORES AUTORIZADOS ha cambiado.\n');
    nuevos.forEach((k) => console.error(`    + ${k}  ${ahora.get(k)}   nuevo`));
    idos.forEach((k) => console.error(`    - ${k}  ${congelado.escalones[k]}   desaparece`));
    movidos.forEach(([k, v]) => console.error(`    ~ ${k}  ${congelado.escalones[k]} → ${v}`));
    console.error('\n  Autorizar un color es decisión del usuario, no del agente.');
    console.error('  Si NO hay autorización: deshaz el cambio. Si el color hace falta');
    console.error('  pero no se usa, va a `categoricas.marca` —conocida y no');
    console.error('  autorizada—, que sí puede crecer sin permiso.');
    console.error('\n  Con autorización: regenera el congelado y que se vea en el diff.');
    console.error('    node sistema/tokens/congelar-autorizados.mjs\n');
    process.exit(1);
  }
}

const agrupados = new Set(Object.values(grupos).flat());
const huerfanos = Object.keys(semanticos).filter((k) => !agrupados.has(k));
const inventados = [...agrupados].filter((k) => !semanticos[k]);

if (huerfanos.length || inventados.length) {
  console.error('\n  El agrupado de tokens no cuadra con la fuente:\n');
  huerfanos.forEach((k) =>
    console.error(`    sin grupo      ${k}  → existe en semanticos y NO llegaría al CSS`)
  );
  inventados.forEach((k) =>
    console.error(`    no existe      ${k}  → está en grupos y no en semanticos`)
  );
  console.error('\n  Añádelos a `grupos` en este archivo. Un token que no llega al');
  console.error('  CSS es un token que no existe.\n');
  process.exit(1);
}

const variables = (modo) =>
  Object.entries(grupos)
    .map(([titulo, claves]) =>
      bloque(
        titulo,
        claves.map((k) => `--${k}: ${semanticos[k][modo]};`)
      )
    )
    .join('\n');

const totalEscalones = escalones.length;

const css = `/* ───────────────────────────────────────────────────────────────────────────
   TOKENS DE COLOR — Colegio Albert Einstein · MMI-DS v${VERSION}
   ${NORMA} · ${verificados.length} pares verificados en los dos modos, ${fallos.length} fallos

   ARCHIVO GENERADO. No editar a mano.
   Fuente: sistema/tokens/fuente.mjs → node sistema/tokens/generar.mjs

   El modo se conmuta con el atributo \`data-tema\` en <html>:
       <html data-tema="claro">   ó   <html data-tema="oscuro">
   Sin atributo, se respeta la preferencia del sistema operativo.
   ─────────────────────────────────────────────────────────────────────────── */

:root,
[data-tema='claro'] {
${variables('claro')}
  /* Marca — FUERA del sistema. Prohibidos en interfaz (§2.3) */
${Object.entries(marca)
  .map(([k, v]) => `  --${k}: ${v.claro};`)
  .join('\n')}
}

[data-tema='oscuro'] {
${variables('oscuro')}
  /* Marca en oscuro. El titular sube a rojo-400; el panel de marca baja
     a #930000 porque el rojo del escudo se aplana contra la página (§2.4). */
${Object.entries(marca)
  .map(([k, v]) => `  --${k}: ${v.oscuro};`)
  .join('\n')}
}

/* Si nadie ha elegido, se respeta el sistema operativo. */
@media (prefers-color-scheme: dark) {
  :root:not([data-tema]) {
${variables('oscuro')
  .split('\n')
  .map((l) => (l.trim() ? `  ${l}` : l))
  .join('\n')}
${Object.entries(marca)
  .map(([k, v]) => `    --${k}: ${v.oscuro};`)
  .join('\n')}
  }
}

/* Anillo de foco — 2px con desplazamiento de 2px (§2.3).
   Prohibido \`outline: none\` sin reemplazo de contraste equivalente (§2.5.7). */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--foco);
  outline-offset: 2px;
}

/* SOBRE EL MARCO EL ANILLO CAMBIA DE TOKEN. No es un matiz: medido, el ámbar
   oscuro da 2,48:1 sobre marco-nivel-1 y 2,97:1 sobre marco-fondo, por debajo
   del 3:1 que exige SC 1.4.11. \`foco-en-marco\` da 5,16:1.

   El token existía desde el principio y estaba medido; lo que faltaba era
   enchufarlo. El candado de contraste no podía verlo porque verifica PARES DE
   TOKENS, no qué token se aplica a qué elemento —esa distancia es justo lo que
   separa «el contrato cumple» de «la página cumple» (§5.2.2)—.

   Esta regla se entrega en tokens.css, así que cualquier proyecto que ponga
   navegación sobre \`marco-fondo\` la hereda sin tener que saberla. */
:where([data-marco], .marco, .lat) :where(a, button, input, select, textarea, [tabindex]):focus-visible,
:where([data-marco], .marco, .lat):focus-visible {
  outline-color: var(--foco-en-marco);
}

/* ───────────────────────────────────────────────────────────────────────────
   RAMPAS Y FAMILIAS CATEGÓRICAS — el inventario completo, ${totalEscalones} escalones.

   Un solo deletreo en todo el sistema. El escalón se llama \`ambar_900\` y esa
   MISMA cadena es la variable \`--ambar_900\` y la clase \`.color-ambar_900\`.
   No hay que traducir guiones bajos a guiones en ningún sitio.

   ESTO NO ES PARA MAQUETAR. En interfaz se usan los tokens semánticos de
   arriba: son los que están medidos contra un fondo concreto y los que el
   candado de contraste protege. Una primitiva no sabe sobre qué la vas a
   poner, así que nadie puede garantizar que se lea (§2.5.1, y el candado de
   lint lo bloquea en \`componentes/\`).

   Existen por dos razones legítimas:
     · el catálogo tiene que PINTAR la rampa para poder elegir un escalón;
     · un token nuevo necesita ver qué escalones hay antes de apuntar a uno.
   ─────────────────────────────────────────────────────────────────────────── */

:root {
${escalones.map(([n, v]) => `  --${n}: ${v};`).join('\n')}
}

${escalones.map(([n]) => `.color-${n} { background-color: var(--${n}); }`).join('\n')}
`;

writeFileSync(join(AQUI, 'tokens.css'), css);

// ── tailwind-preset.ts ─────────────────────────────────────────────────────
// Extiende la configuración, no la reemplaza (§7).

// El preset consume las VARIABLES CSS, no los hex: así el mismo build sirve
// para los dos modos y el tema se conmuta con `data-tema` sin recompilar.
const colorSemantico = Object.fromEntries(
  Object.keys(semanticos).map((k) => [k, `var(--${k})`])
);
const colorMarca = Object.fromEntries(Object.keys(marca).map((k) => [k, `var(--${k})`]));

const preset = `/* ───────────────────────────────────────────────────────────────────────────
   PRESET DE TAILWIND 3.4 — Colegio Albert Einstein · MMI-DS v${VERSION}

   ARCHIVO GENERADO. No editar a mano.
   Fuente: sistema/tokens/fuente.mjs → node sistema/tokens/generar.mjs

   Uso en el proyecto consumidor:
     import preset from './sistema/tokens/tailwind-preset';
     export default { presets: [preset], content: [...] } satisfies Config;

   Extiende la configuración de Tailwind, no la reemplaza.
   ─────────────────────────────────────────────────────────────────────────── */

import type { Config } from 'tailwindcss';

/** Primitivas. PROHIBIDO consumirlas en un componente (§2.5.1).
 *  Se exponen solo para el catálogo /diseño. El candado bloquea el resto. */
export const primitivas = ${JSON.stringify(primitivas, null, 2)} as const;

/** Semánticos. Lo único que un componente consume. */
export const semanticos = ${JSON.stringify(colorSemantico, null, 2)} as const;

/** Marca. Fuera del sistema: landing, impresos, escudo. Nunca en interfaz. */
export const marca = ${JSON.stringify(colorMarca, null, 2)} as const;

const preset = {
  content: [],
  theme: {
    extend: {
      colors: {
        ...semanticos,
        ...marca,
        primitiva: primitivas,
      },

      fontFamily: {
        // IBM Plex Sans para todo. IBM Plex Mono para identificadores (§3).
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },

      // Cuatro pesos y ninguno más (§3.2).
      // Thin, ExtraLight, Light y ExtraBold quedan prohibidos.
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // Escala del sistema (§3.4). Prohibido \`text-[Npx]\` (§3.6.3).
      // Móvil bajo 640px se resuelve con las variantes \`s-\` de abajo.
      fontSize: {
        's-titulo-pantalla': ['28px', { lineHeight: '1.2',  fontWeight: '600' }],
        's-titulo-seccion':  ['20px', { lineHeight: '1.3',  fontWeight: '500' }],
        's-cuerpo':          ['16px', { lineHeight: '1.6',  fontWeight: '400' }],
        's-interfaz':        ['15px', { lineHeight: '1.45', fontWeight: '400' }],
        's-encabezado':      ['15px', { lineHeight: '1.45', fontWeight: '500' }],
        's-etiqueta':        ['13px', { lineHeight: '1.4',  fontWeight: '500' }],
        's-pista':           ['12px', { lineHeight: '1.4',  fontWeight: '400' }],

        // Escala de landing (§3.3)
        'l-hero':            ['56px', { lineHeight: '1.05', fontWeight: '700' }],
        'l-seccion':         ['34px', { lineHeight: '1.15', fontWeight: '600' }],
        'l-subtitulo':       ['24px', { lineHeight: '1.25', fontWeight: '500' }],
        'l-destacado':       ['19px', { lineHeight: '1.5',  fontWeight: '400' }],
        'l-cuerpo':          ['16px', { lineHeight: '1.65', fontWeight: '400' }],
        'l-pie':             ['13px', { lineHeight: '1.5',  fontWeight: '400' }],
      },

      borderRadius: {
        // Tarjeta 6px, chip 3px (§5.1)
        tarjeta: '6px',
        chip: '3px',
      },

      spacing: {
        // Densidad como token (§8.2). Solo altura de fila y padding vertical.
        'fila-comoda': '34px',
        'fila-compacta': '28px',
        marco: '54px',
      },

      outlineWidth: { foco: '2px' },
      outlineOffset: { foco: '2px' },

      // Ancho de línea de cuerpo (§3.6.5)
      maxWidth: {
        'texto-landing': '72ch',
        'texto-sistema': '90ch',
      },
    },
  },
  plugins: [],
} satisfies Config;

export default preset;
`;

writeFileSync(join(AQUI, 'tailwind-preset.ts'), preset);

// ── Reporte ────────────────────────────────────────────────────────────────

console.log(`\nMMI-DS v${VERSION} — generación de artefactos de color\n`);
console.log(`  paleta.lock.json    ${resultados.length} pares (${MODOS.length} modos)`);
console.log(`  tokens.css          ${Object.keys(semanticos).length} semánticos + ${Object.keys(marca).length} de marca, claro y oscuro`);
console.log(`  tailwind-preset.ts  preset Tailwind 3.4 sobre variables CSS\n`);

for (const m of MODOS) {
  const b = porModo[m].filter((r) => r.cumple !== null).length;
  const f = porModo[m].filter((r) => r.cumple === false).length;
  const marca_ = f === 0 ? 'OK' : `${f} FALLOS`;
  console.log(`  ${m.padEnd(7)} ${String(b).padStart(2)} bloqueantes  →  ${marca_}`);
}
console.log('');

if (fallos.length) {
  console.log(`  ${fallos.length} FALLOS:\n`);
  for (const f of fallos) {
    console.log(
      `    [${f.modo}] ${f.ratio.toFixed(2)}:1 < ${f.minimo}  ${f.frente} sobre ${f.fondo}`
    );
    console.log(`             ${f.hexFrente} sobre ${f.hexFondo} — ${f.motivo}`);
  }
  console.log('');
  process.exit(1);
}
