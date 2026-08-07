/* ───────────────────────────────────────────────────────────────────────────
   PRESET DE TAILWIND 3.4 — Colegio Albert Einstein · MMI-DS v1.1.0

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
export const primitivas = {
  "azul": {
    "50": "#E9F5FF",
    "100": "#CFE8FF",
    "200": "#A0D0FF",
    "300": "#6CB2FF",
    "400": "#3A92F4",
    "500": "#1A79E1",
    "600": "#0063CB",
    "700": "#004EB2",
    "800": "#003B91",
    "900": "#002A6F"
  },
  "rojo": {
    "50": "#FFECE5",
    "100": "#FFD5C6",
    "200": "#FFAD95",
    "300": "#FF7D62",
    "400": "#FF4C37",
    "500": "#EE1F1B",
    "600": "#D40006",
    "700": "#B40000",
    "800": "#930000",
    "900": "#700000"
  },
  "oro": {
    "50": "#F9F3E7",
    "100": "#F1E4CA",
    "200": "#DFCA9C",
    "300": "#C6AB6B",
    "400": "#AA8E41",
    "500": "#917724",
    "600": "#7B630D",
    "700": "#655000",
    "800": "#4F3E00",
    "900": "#3B2D00"
  },
  "gris": {
    "0": "#FFFFFF",
    "50": "#F8F8F6",
    "100": "#F0EFEE",
    "200": "#E0DFDE",
    "300": "#C8C6C4",
    "400": "#A7A6A3",
    "500": "#8B8985",
    "600": "#6A6864",
    "700": "#5C5955",
    "800": "#474440",
    "900": "#2C2A25"
  }
} as const;

/** Semánticos. Lo único que un componente consume. */
export const semanticos = {
  "fondo-pagina": "#F8F8F6",
  "fondo-tarjeta": "#FFFFFF",
  "fondo-encabezado": "#F0EFEE",
  "fondo-fila-alt": "#F8F8F6",
  "fondo-fila-hover": "#E9F5FF",
  "texto-principal": "#2C2A25",
  "texto-secundario": "#6A6864",
  "texto-pista": "#6A6864",
  "texto-invertido": "#FFFFFF",
  "borde": "#E0DFDE",
  "borde-fuerte": "#C8C6C4",
  "borde-campo": "#8B8985",
  "accion": "#0063CB",
  "accion-hover": "#004EB2",
  "accion-activa": "#003B91",
  "accion-texto": "#FFFFFF",
  "accion-deshabilitada": "#C8C6C4",
  "accion-texto-desh": "#8B8985",
  "accion-2": "#655000",
  "enlace": "#0063CB",
  "marco-fondo": "#2C3D71",
  "marco-texto": "#FFFFFF",
  "marco-acento": "#DFCA9C",
  "marco-item-activo": "#1D3163",
  "foco": "#BE7A14",
  "foco-en-marco": "#F0C060",
  "exito-fondo": "#E3F4E1",
  "exito-texto": "#14521A",
  "exito-acento": "#338136",
  "aviso-fondo": "#FFEBD6",
  "aviso-texto": "#6B3B00",
  "aviso-acento": "#A46300",
  "error-fondo": "#FFE6DF",
  "error-texto": "#8F1017",
  "error-acento": "#D63231",
  "info-fondo": "#E9EEFF",
  "info-texto": "#02468A",
  "info-acento": "#2F71CE"
} as const;

/** Marca. Fuera del sistema: landing, impresos, escudo. Nunca en interfaz. */
export const marca = {
  "marca-rojo": "#E30613",
  "marca-oro": "#DEBD68",
  "marca-amarillo": "#FDF200",
  "marca-celeste": "#01ADED"
} as const;

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

      // Escala del sistema (§3.4). Prohibido `text-[Npx]` (§3.6.3).
      // Móvil bajo 640px se resuelve con las variantes `s-` de abajo.
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
