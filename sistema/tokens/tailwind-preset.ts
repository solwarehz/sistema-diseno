/* ───────────────────────────────────────────────────────────────────────────
   PRESET DE TAILWIND 3.4 — Colegio Albert Einstein · MMI-DS v1.74.0

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
  "verde": {
    "50": "#E3F4E1",
    "100": "#D3EDCF",
    "200": "#B3DCAE",
    "300": "#96CC92",
    "400": "#78BB78",
    "500": "#5FA862",
    "600": "#46974A",
    "700": "#338136",
    "800": "#226B27",
    "900": "#14521A",
    "950": "#233521"
  },
  "ambar": {
    "50": "#FFEBD6",
    "100": "#FEDFBF",
    "200": "#FBC894",
    "300": "#F0C060",
    "400": "#DFA54B",
    "500": "#C88A3C",
    "600": "#BE7A14",
    "700": "#A46300",
    "800": "#884E00",
    "900": "#6B3B00",
    "950": "#402C16"
  },
  "indigo": {
    "50": "#F8F9FC",
    "100": "#E5E8F2",
    "200": "#B9C2DC",
    "300": "#8D9BC6",
    "400": "#6174B0",
    "500": "#45558A",
    "600": "#41507F",
    "700": "#39497A",
    "800": "#2C3D71",
    "900": "#1D3163"
  },
  "alerta": {
    "50": "#FFE6DF",
    "100": "#FFB8A9",
    "200": "#F99B8C",
    "300": "#EF8072",
    "400": "#E2665C",
    "500": "#D63231",
    "600": "#C32123",
    "700": "#AA181D",
    "800": "#8F1017",
    "900": "#4D241F",
    "950": "#33231F"
  },
  "informacion": {
    "50": "#E9EEFF",
    "100": "#BFD0FF",
    "200": "#9FBAF9",
    "300": "#84A7EE",
    "400": "#6D97DE",
    "500": "#2F71CE",
    "600": "#1C63BC",
    "700": "#0D55A5",
    "800": "#02468A",
    "900": "#273048",
    "950": "#303030"
  },
  "negro": {
    "50": "#EFEEEB",
    "100": "#C3C1BD",
    "200": "#989692",
    "300": "#8A8681",
    "400": "#6E6B67",
    "500": "#575451",
    "600": "#44423F",
    "650": "#3A3835",
    "700": "#363532",
    "750": "#2C2B29",
    "800": "#2A2927",
    "850": "#242422",
    "900": "#20201E",
    "950": "#1E1D1C",
    "1000": "#000000"
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
  "fondo-pagina": "var(--fondo-pagina)",
  "fondo-tarjeta": "var(--fondo-tarjeta)",
  "fondo-encabezado": "var(--fondo-encabezado)",
  "fondo-fila-alt": "var(--fondo-fila-alt)",
  "fondo-fila-hover": "var(--fondo-fila-hover)",
  "texto-principal": "var(--texto-principal)",
  "texto-secundario": "var(--texto-secundario)",
  "texto-pista": "var(--texto-pista)",
  "texto-invertido": "var(--texto-invertido)",
  "borde": "var(--borde)",
  "borde-fuerte": "var(--borde-fuerte)",
  "borde-campo": "var(--borde-campo)",
  "accion": "var(--accion)",
  "accion-hover": "var(--accion-hover)",
  "accion-activa": "var(--accion-activa)",
  "accion-texto": "var(--accion-texto)",
  "accion-deshabilitada": "var(--accion-deshabilitada)",
  "accion-texto-desh": "var(--accion-texto-desh)",
  "accion-2": "var(--accion-2)",
  "enlace": "var(--enlace)",
  "accion-2-fondo": "var(--accion-2-fondo)",
  "neutra-fondo": "var(--neutra-fondo)",
  "neutra-texto": "var(--neutra-texto)",
  "destructiva": "var(--destructiva)",
  "destructiva-hover": "var(--destructiva-hover)",
  "destructiva-texto": "var(--destructiva-texto)",
  "marco-fondo": "var(--marco-fondo)",
  "marco-texto": "var(--marco-texto)",
  "marco-acento": "var(--marco-acento)",
  "marco-item-activo": "var(--marco-item-activo)",
  "marco-nivel-1": "var(--marco-nivel-1)",
  "marco-nivel-2": "var(--marco-nivel-2)",
  "marco-borde": "var(--marco-borde)",
  "marco-texto-tenue": "var(--marco-texto-tenue)",
  "foco": "var(--foco)",
  "foco-en-marco": "var(--foco-en-marco)",
  "exito-fondo": "var(--exito-fondo)",
  "exito-texto": "var(--exito-texto)",
  "exito-acento": "var(--exito-acento)",
  "aviso-fondo": "var(--aviso-fondo)",
  "aviso-texto": "var(--aviso-texto)",
  "aviso-acento": "var(--aviso-acento)",
  "error-fondo": "var(--error-fondo)",
  "error-texto": "var(--error-texto)",
  "error-acento": "var(--error-acento)",
  "info-fondo": "var(--info-fondo)",
  "info-texto": "var(--info-texto)",
  "info-acento": "var(--info-acento)",
  "apagado-fondo": "var(--apagado-fondo)",
  "apagado-borde": "var(--apagado-borde)",
  "apagado-bolita": "var(--apagado-bolita)",
  "identidad-1": "var(--identidad-1)",
  "identidad-2": "var(--identidad-2)",
  "identidad-3": "var(--identidad-3)",
  "identidad-4": "var(--identidad-4)",
  "identidad-texto": "var(--identidad-texto)"
} as const;

/** Marca. Fuera del sistema: landing, impresos, escudo. Nunca en interfaz. */
export const marca = {
  "marca-rojo": "var(--marca-rojo)",
  "marca-rojo-panel": "var(--marca-rojo-panel)",
  "marca-oro": "var(--marca-oro)",
  "marca-amarillo": "var(--marca-amarillo)",
  "marca-celeste": "var(--marca-celeste)"
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
