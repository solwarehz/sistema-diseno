/**
 * CANDADO DE LINT — §7
 *
 * El candado documental dice «no cambies los colores».
 * Este hace que no se pueda: el build falla.
 *
 * Uso en el proyecto consumidor (ESLint 9, flat config):
 *
 *   import candado from 'sistema-diseno-ae/eslint';
 *   export default [ ...candado ];
 *
 * Y eso BASTA, desde la v1.67.0. Antes no: el candado no traía quién leyera
 * TypeScript, así que en cuanto tocaba un `.ts` o un `.tsx` ESLint moría con
 * «Parsing error» ANTES de llegar a ninguna regla. Lo reportó Control
 * Administrativos con el caso exacto —`import { type X }`, estándar desde
 * TypeScript 4.5— pero el defecto era más ancho: no se parseaba NADA de
 * TypeScript; ese import es solo donde lo notaron.
 *
 * Y la ironía, que es la parte que enseña: el `eslint.config.mjs` de ESTE
 * repositorio lleva el parser desde hace versiones, con un comentario que
 * explica justo este fallo. Sabíamos el problema, lo resolvimos para nosotros,
 * y entregamos el candado sin él documentando el uso que no funciona. Mismo
 * defecto que el reset `box-sizing` que no viajaba: lo que el sistema usa y no
 * entrega, el consumidor lo sufre.
 *
 * Qué prohíbe, y por qué cada regla existe:
 *
 *   1 · Hex crudo, rgb() y hsl()      §2.5.6 — si el color no viene del token,
 *                                     el candado de contraste no lo protege.
 *   2 · Valores arbitrarios Tailwind  §2.5.6 — bg-[#fff] evade el preset.
 *   3 · text-[Npx]                    §3.6.3 — solo los pasos de la escala.
 *   4 · outline-none / outline: none  §2.5.7 — es el defecto real detectado en
 *                                     los filtros (§1.3). Quien navega con
 *                                     teclado se pierde.
 *   5 · Primitivas en componentes     §2.5.1 — las primitivas existen para que
 *                                     los semánticos elijan, no para consumirse.
 *   6 · Colores de campaña            §2.5.5 — marca-amarillo (1,2:1) y
 *                                     marca-celeste (2,6:1) no entran al sistema.
 *   7 · Pesos prohibidos              §3.2 — cuatro pesos y ninguno más.
 */

// ── Quién lee TypeScript ────────────────────────────────────────────────────
// Se carga con `await import` y no con un `import` normal a propósito: si el
// consumidor no tiene `typescript-eslint`, el candado tiene que seguir
// sirviendo para sus `.js` en vez de reventar entero al importarse. Lo que NO
// puede volver a pasar es que falle en silencio con un «Parsing error» que
// parece un fallo del archivo del consumidor.
let parserTs = null;
try {
  const m = await import('typescript-eslint');
  parserTs = (m.default ?? m).parser ?? m.parser ?? null;
} catch {
  try {
    parserTs = (await import('@typescript-eslint/parser')).default ?? null;
  } catch {
    console.warn(
      '\n  [candado MMI-DS] No encuentro `typescript-eslint`, así que NO voy a revisar\n'
      + '  los archivos .ts/.tsx: sin analizador, ESLint no sabe leerlos.\n'
      + '  Instálalo —npm i -D typescript-eslint— o el candado solo cubre tu JavaScript.\n'
    );
  }
}

// ── Patrones ────────────────────────────────────────────────────────────────

const HEX_CRUDO = /#[0-9a-fA-F]{3,8}\b/;
const FUNCION_COLOR = /\b(rgba?|hsla?|color-mix|oklch|lab)\s*\(/;
const ARBITRARIO_TAILWIND = /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|shadow|accent|caret|divide|placeholder)-\[[^\]]+\]/;
const TAMANO_ARBITRARIO = /\btext-\[[^\]]*(?:px|rem|em)[^\]]*\]/;
const SIN_CONTORNO = /\boutline-none\b|outline\s*:\s*none/;
const PRIMITIVA = /\b(?:bg|text|border|ring|outline|fill|stroke|divide|placeholder)-primitiva-/;
const CAMPANA = /\b(?:bg|text|border|ring|outline|fill|stroke)-marca-(?:amarillo|celeste)\b/;
const PESO_PROHIBIDO = /\bfont-(?:thin|extralight|light|extrabold|black)\b/;

const reglas = [
  [HEX_CRUDO,            'Color hex crudo. Usa un token semántico del preset (§2.5.6). Si el token no existe, se añade en sistema/tokens/fuente.mjs y se regenera.'],
  [FUNCION_COLOR,        'rgb()/hsl() y funciones de color están prohibidas (§2.5.6). El candado de contraste no puede verificar lo que no pasa por el token. ÚNICA excepción, y solo en hojas de estilo: la sombra —box-shadow, text-shadow, drop-shadow—, que no lleva texto encima y ningún criterio de WCAG mide. En componentes la sombra viene por clase: usa var(--sombra-capa).'],
  [ARBITRARIO_TAILWIND,  'Valor arbitrario de Tailwind. Evade el preset y por tanto el contrato de color (§2.5.6).'],
  [TAMANO_ARBITRARIO,    'text-[Npx] está prohibido (§3.6.3). Usa un paso de la escala: text-s-cuerpo, text-s-interfaz, text-s-etiqueta…'],
  [SIN_CONTORNO,         'outline:none sin reemplazo de contraste equivalente está prohibido (§2.5.7). Es el defecto de §1.3: quien navega con teclado se pierde. Usa outline-foco / outline-foco-en-marco.'],
  [PRIMITIVA,            'Las primitivas no se consumen en componentes (§2.5.1). Existen para que los semánticos elijan. Usa el token semántico.'],
  [CAMPANA,              'marca-amarillo y marca-celeste no entran al sistema (§2.5.5). 1,2:1 y 2,6:1: no admiten texto. Son colores de campaña.'],
  [PESO_PROHIBIDO,       'Peso tipográfico prohibido (§3.2). Solo Regular 400, Medium 500, SemiBold 600 y Bold 700.'],
];

/**
 * Construye los selectores de no-restricted-syntax para un patrón dado.
 *
 * SOLO SE ESCAPA LA BARRA. El patrón se incrusta entre barras dentro del
 * selector —`Literal[value=/…/]`—, así que lo único que hay que escapar es la
 * barra que cerraría el literal antes de tiempo.
 *
 * Antes se DUPLICABAN las barras invertidas, y eso rompía el candado entero sin
 * que se notara. Medido sobre los ocho patrones: siete cambiaban de significado
 * —`\b` pasaba a ser «barra invertida seguida de b», que no caza nada— y el
 * octavo hacía reventar a ESLint con «Unterminated group» por el `\(` de las
 * funciones de color.
 *
 * Es el peor tipo de fallo: silencioso. Quien lo adoptaba creía estar protegido
 * y no lo estaba. Lo reportó el equipo de Control Administrativos V2.0 tras
 * usarlo un día en una aplicación real, y llevaba siete versiones entregándose
 * así. La prueba de `probar-candado.mjs` no lo cazaba porque probaba los
 * patrones y no su incrustación; ahora prueba las dos cosas.
 */
const selectores = ([patron, mensaje]) => {
  const fuente = patron.source.replace(/\//g, '\\/');
  return [
    { selector: `Literal[value=/${fuente}/]`, message: mensaje },
    { selector: `TemplateElement[value.raw=/${fuente}/]`, message: mensaje },
    { selector: `JSXAttribute[name.name="style"]`, message: 'Prohibido el atributo `style` en línea: evade el preset y el candado. Usa clases del sistema.' },
  ];
};

// El selector de `style` se repite en cada regla; se deduplica aquí.
const restringidos = [
  ...reglas.flatMap(([p, m]) => selectores([p, m]).slice(0, 2)),
  {
    selector: 'JSXAttribute[name.name="style"]',
    message: 'Prohibido el atributo `style` en línea: evade el preset y el candado (§2.5.6). Usa clases del sistema.',
  },
];

export default [
  // El analizador va PRIMERO y en su propio bloque: sin él, ESLint no sabe leer
  // un `.tsx` y muere antes de llegar a las reglas de abajo. Si no está
  // instalado no se añade nada y el candado sigue cubriendo el JavaScript.
  ...(parserTs
    ? [{
        name: 'mmi-ds/candado-ts',
        files: ['**/*.{ts,tsx,mts,cts}'],
        // Los archivos de DECLARACIÓN quedan fuera. No llevan color ni estilo
        // —son tipos— así que el candado no tiene nada que mirar en ellos, y
        // sí llevan directivas `eslint-disable` de reglas del plugin de
        // TypeScript que aquí no se registra: procesarlos solo produce ruido
        // sobre archivos que ninguna regla del sistema vigila.
        ignores: ['**/*.d.ts', '**/*.d.mts', '**/*.d.cts'],
        languageOptions: { parser: parserTs, parserOptions: { ecmaFeatures: { jsx: true } } },
      }]
    : []),
  {
    name: 'mmi-ds/candado',
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    ignores: [
      // El catálogo es el único lugar que puede mostrar primitivas y hex:
      // su trabajo es exhibir la paleta.
      'app/diseno/**',
      // Artefactos generados: su fuente es fuente.mjs, no se editan a mano.
      'sistema/tokens/paleta.lock.json',
      'sistema/tokens/tailwind-preset.ts',
      'sistema/tokens/tokens-light.css',
      'sistema/tokens/fuente.mjs',
      'sistema/tokens/generar.mjs',
      'sistema/candado/**',
      // Las herramientas que ESCRIBEN el sistema, no las que lo consumen. El
      // generador del catalogo lleva todo el CSS dentro de plantillas -hex
      // incluido, que es su trabajo- y el empaquetado lleva el LEEME, que
      // DOCUMENTA las prohibiciones y por tanto las nombra. Su salida no queda
      // sin verificar: la revisa auditar-cascaron.mjs, que es mas estricto.
      'sistema/cascaron/**',
      'sistema/paquete/**',
      'sistema/componentes/extraer.mjs',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...restringidos],
    },
  },
];

/** Exportado para poder probar el candado sin ESLint. Ver `probar-candado.mjs`. */
export const patrones = reglas.map(([patron, mensaje]) => ({ patron, mensaje }));
