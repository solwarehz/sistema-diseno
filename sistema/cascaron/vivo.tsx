/**
 * LOS COMPONENTES DE VERDAD, DENTRO DEL CATÁLOGO.
 *
 * MMI-DS §9.1 justifica no montar Storybook diciendo que «el catálogo importa
 * los componentes reales y **no puede divergir**». Lo que había era un HTML
 * escrito a mano que **sí puede divergir, y divergía**: en cuatro versiones
 * seguidas se persiguió la misma clase de defecto —el `title` que el catálogo
 * pintaba y el componente no, el hover que el catálogo demostraba y el
 * componente no hacía, la maqueta con enlaces y chevron que el componente no
 * produce nunca, la regla 12 que entró en el componente y no en el catálogo—.
 *
 * Esto es la pieza que faltaba: **el componente, montado y vivo**, servido en
 * la misma página que la maqueta para poder compararlos con el ratón. Lo pidió
 * el responsable el 2026-09-15: *«en el cascarón usa tus componentes, así podré
 * detectar algún cambio no solicitado»*.
 *
 * Se empaqueta con esbuild DENTRO del contenedor —React vive ahí— y el paquete
 * se incrusta en el HTML. Si el empaquetado falla, el generador **para**: un
 * catálogo que se quedara sin el componente vivo y no lo dijera sería
 * exactamente la mentira que esto viene a cerrar.
 */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MarcoApp, type GrupoNav } from '../../componentes/src/MarcoApp';
import { Icono } from '../../componentes/src/Icono';
import { TablaDatos } from '../../componentes/src/TablaDatos';
import { Chip } from '../../componentes/src/Chip';

/** La misma navegación que enseña la maqueta de al lado, para comparar. */
const NAV: GrupoNav[] = [
  { clave: 'panel', texto: 'Dashboard', href: '#panel', icono: <Icono nombre="panel" /> },
  {
    clave: 'matricula', texto: 'Matrícula', href: '#m', icono: <Icono nombre="matricula" />,
    hijos: [
      { clave: 'fichas', texto: 'Fichas', href: '#fichas' },
      { clave: 'traslados', texto: 'Traslados', href: '#traslados' },
      { clave: 'vacantes', texto: 'Vacantes', href: '#vacantes' },
    ],
  },
  {
    clave: 'asistencia', texto: 'Asistencia', href: '#a', icono: <Icono nombre="asistencia" />,
    hijos: [
      { clave: 'marcas', texto: 'Marcas del día', href: '#marcas' },
      { clave: 'justif', texto: 'Justificaciones', href: '#justif' },
    ],
  },
  { clave: 'usuarios', texto: 'Usuarios', href: '#u', icono: <Icono nombre="usuarios" /> },
  {
    clave: 'configuracion', texto: 'Configuración', href: '#c', icono: <Icono nombre="configuracion" />,
    alPie: true,
    hijos: [
      { clave: 'general', texto: 'General', href: '#general', icono: <Icono nombre="configuracion" /> },
      {
        clave: 'catalogos', texto: 'Catálogos', icono: <Icono nombre="libro" />,
        hijos: [
          { clave: 'sedes', texto: 'Sedes', href: '#sedes', icono: <Icono nombre="libro" /> },
          { clave: 'cargos', texto: 'Cargos', href: '#cargos', icono: <Icono nombre="libro" /> },
        ],
      },
    ],
  },
];

function MarcoVivo() {
  const [activa, setActiva] = useState('fichas');
  const [plegado, setPlegado] = useState(false);
  return (
    <MarcoApp
      titulo="Colegio Albert Einstein"
      hrefInicio="#"
      navegacion={NAV}
      activa={activa}
      onNavegar={(clave) => setActiva(clave)}
      plegado={plegado}
      onPlegar={setPlegado}
      usuario={{
        id: 'u-1',
        nombre: 'PINEDA, José Isidro',
        correo: 'jose.pineda@ae.edu.pe',
        onSalir: () => {},
      }}
    >
      <div className="bloque">
        <p className="seccion-sub">
          Esto <strong>no es una maqueta</strong>: es <code>MarcoApp</code> montado y vivo, con
          la hoja que viaja. Lo que hagas aquí con el ratón es lo que hará en tu producto.
        </p>
        <p className="seccion-sub">Pantalla en curso: <strong>{activa}</strong>.</p>
      </div>
    </MarcoApp>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   R142 · LA TABLA, MONTADA Y VIVA — porque el anclaje no se puede maquetar

   La demo de la tabla del catálogo es marcado escrito a mano con un motor de
   JavaScript propio, y **ya divergió**: pinta `.tb-orden` y `.tb-flecha` donde
   el componente emite `.tb-th-btn` y `.tb-th-flecha`, y eso lleva versiones
   anotado como deuda.

   Con el anclaje no se puede repetir el truco. `anclarColumnas` reparte TRES
   clases distintas entre celdas según `numerada` y según cuál sea la última
   anclada, y eso escrito a mano diverge a la primera. Así que aquí va la tabla
   de verdad, con columnas suficientes para que el anclaje se pueda VER: con
   ocho no hace falta desplazar nada, y una demo que no se puede desplazar no
   demuestra un anclaje.
   ─────────────────────────────────────────────────────────────────────────── */

type FilaAsistencia = {
  dni: string;
  nombre: string;
  sede: string;
  estado: string;
} & Record<`d${number}`, number>;

const DIAS = Array.from({ length: 22 }, (_, i) => i + 1);

const PERSONAL: FilaAsistencia[] = [
  ['40123456', 'SIFUENTES DE PINEDA, Julia Trinidad', 'Sede Centro', 'Activo'],
  ['41987654', 'LEÓN TUYA, Mayori Esperanza', 'Sede Norte', 'Activo'],
  ['42555111', 'QUISPE HUAMÁN, Róger Antonio', 'Sede Sur', 'Cesado'],
  ['43222888', 'VÁSQUEZ ROJAS, Delia', 'Sede Centro', 'Activo'],
  ['44777333', 'MENDOZA CIEZA, Iván Alberto', 'Sede Este', 'Activo'],
  ['45111999', 'ROSALES PAJUELO, Nélida', 'Sede Norte', 'Cesado'],
].map(([dni, nombre, sede, estado], f) => ({
  dni, nombre, sede, estado,
  ...Object.fromEntries(DIAS.map((d) => [`d${d}`, (f * 7 + d * 3) % 480])),
})) as FilaAsistencia[];

const TONO_SEDE = {
  'Sede Centro': 'identidad-1',
  'Sede Norte': 'identidad-2',
  'Sede Sur': 'identidad-3',
  'Sede Este': 'identidad-4',
} as const;

const COLUMNAS_ASISTENCIA = [
  { clave: 'nombre', titulo: 'Trabajador', valor: (f: FilaAsistencia) => f.nombre },
  { clave: 'dni', titulo: 'DNI', valor: (f: FilaAsistencia) => f.dni },
  {
    clave: 'sede', titulo: 'Sede',
    valor: (f: FilaAsistencia) => f.sede,
    opcionesFiltro: ['Sede Centro', 'Sede Norte', 'Sede Sur', 'Sede Este'],
    pintar: (f: FilaAsistencia) => (
      <Chip tono={TONO_SEDE[f.sede as keyof typeof TONO_SEDE]}>{f.sede}</Chip>
    ),
  },
  {
    clave: 'estado', titulo: 'Estado',
    valor: (f: FilaAsistencia) => f.estado,
    opcionesFiltro: ['Activo', 'Cesado'],
    pintar: (f: FilaAsistencia) => (
      <Chip tono={f.estado === 'Activo' ? 'exito' : 'inactivo'}>{f.estado}</Chip>
    ),
  },
  ...DIAS.map((d) => ({
    clave: `d${d}`,
    titulo: String(d).padStart(2, '0'),
    valor: (f: FilaAsistencia) => f[`d${d}`],
    numerica: true,
    filtrable: false,
  })),
];

function TablaViva({ anclar }: { anclar: 0 | 1 }) {
  return (
    <TablaDatos
      titulo={anclar ? 'Asistencia del mes, con la primera columna anclada' : 'Asistencia del mes'}
      filas={PERSONAL}
      claveFila={(f) => f.dni}
      columnas={COLUMNAS_ASISTENCIA}
      anclarColumnas={anclar}
      porPagina={10}
      sustantivo="trabajadores"
      columnasSiempreVisibles={['nombre']}
    />
  );
}

const donde = document.getElementById('marco-vivo');
if (donde) createRoot(donde).render(<MarcoVivo />);

/* Las dos caras de la prop: sin anclar —que es lo que se entrega por
   omisión— y anclada. Sin la primera, `verificar-omision` tendría razón al
   protestar: el catálogo enseñaría el modificador y no la base. */
const conAncla = document.getElementById('tabla-viva-anclada');
if (conAncla) createRoot(conAncla).render(<TablaViva anclar={1} />);
const sinAncla = document.getElementById('tabla-viva-suelta');
if (sinAncla) createRoot(sinAncla).render(<TablaViva anclar={0} />);
