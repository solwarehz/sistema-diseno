/**
 * CANDADO DE LINT — §7
 *
 * El candado documental dice «no cambies los colores».
 * Este hace que no se pueda: el build falla.
 *
 * Uso en el proyecto consumidor (ESLint 9, flat config):
 *
 *   import candado from './sistema/candado/candado.eslint.config.mjs';
 *   export default [ ...candado ];
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
  [FUNCION_COLOR,        'rgb()/hsl() y funciones de color están prohibidas (§2.5.6). El candado de contraste no puede verificar lo que no pasa por el token.'],
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
    ],
    rules: {
      'no-restricted-syntax': ['error', ...restringidos],
    },
  },
];

/** Exportado para poder probar el candado sin ESLint. Ver `probar-candado.mjs`. */
export const patrones = reglas.map(([patron, mensaje]) => ({ patron, mensaje }));
