/**
 * ICONOS COMO COMPONENTE DE REACT
 *
 * ARCHIVO GENERADO. No editar a mano.
 * Fuente: sistema/iconos/iconos.mjs → node sistema/iconos/generar-react.mjs
 *
 * Los mismos 40 trazos que usa el catálogo, como elementos de React.
 *
 * Existe para que NADIE tenga que usar `dangerouslySetInnerHTML`. El módulo
 * `iconos.mjs` devuelve cadenas de SVG —lo cómodo en una plantilla— y en React
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
 * lleva. Un botón de solo icono necesita `aria-label`, y `Boton` lo exige.
 */

export const TAMANOS_ICONO = {"etiqueta":14,"control":16,"texto":18,"estado":32} as const;

export type NombreIcono = keyof typeof TRAZOS_REACT;
export type TamanoIcono = keyof typeof TAMANOS_ICONO;

const TRAZOS_REACT = {
  academico: <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M12 15v6" /></>,
  administracion: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
  alerta: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16h.01" /></>,
  asistencia: <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></>,
  atras: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  camara: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3" /></>,
  campana: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  candado: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  capas: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
  cerrar: <><path d="M6 6l12 12M18 6 6 18" /></>,
  chevron: <><path d="m6 9 6 6 6-6" /></>,
  chevronDer: <><path d="m9 18 6-6-6-6" /></>,
  chevronIzq: <><path d="m15 18-6-6 6-6" /></>,
  columnas: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18" /></>,
  comunicaciones: <><path d="M4 14v-3a8 8 0 0 1 16 0v3" /><rect x="2" y="13" width="4" height="6" rx="1.5" /><rect x="18" y="13" width="4" height="6" rx="1.5" /></>,
  configuracion: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7" /></>,
  descargar: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>,
  descargar2: <><path d="M12 5v14M6 13l6 6 6-6" /></>,
  escritorio: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  filas: <><rect x="3" y="4" width="18" height="5" rx="1" /><rect x="3" y="13" width="18" height="5" rx="1" /></>,
  filasFinas: <><rect x="3" y="4" width="18" height="3" rx="1" /><rect x="3" y="10" width="18" height="3" rx="1" /><rect x="3" y="16" width="18" height="3" rx="1" /></>,
  filtro: <><path d="M3 5h18l-7 8v6l-4 2v-8Z" /></>,
  hamburguesa: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  libro: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
  luna: <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></>,
  lupa: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  mas: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  matricula: <><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6" /></>,
  movil: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>,
  ordenar: <><path d="m7 15 5 5 5-5M7 9l5-5 5 5" /></>,
  panel: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  panelIzq: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></>,
  roto: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
  salir: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  sobre: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></>,
  sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></>,
  subir: <><path d="M12 19V5M6 11l6-6 6 6" /></>,
  tesoreria: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  usuarios: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M17 6a3 3 0 0 1 0 6M18 20c0-2-1-3.5-2.5-4.5" /></>,
  visto: <><path d="m5 12 5 5L20 7" /></>,
} as const;

export type IconoProps = {
  nombre: NombreIcono;
  /** `etiqueta` 14 · `control` 16 · `texto` 18 · `estado` 32. No hay más. */
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
