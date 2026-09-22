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
import { Avatar } from '../../componentes/src/Avatar';
import { Segmentado } from '../../componentes/src/Segmentado';
import { TablaDatos } from '../../componentes/src/TablaDatos';
import { PanelPrivilegios, type ModuloPrivilegios, type ValorPrivilegios,
  type ColumnaPrivilegios } from '../../componentes/src/PanelPrivilegios';
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
      /* R156 · LA FILA DE TOTALES, y es la que cierra un reporte de asistencia:
         lo que permite ver que las filas cuadran sin repasarlas una a una.
         Ordena por cualquier columna y no se mueve; pasa de pagina y es la
         misma, porque resume TODAS las filas y no la que se esta viendo. */
      totales={{
        nombre: 'Total del mes',
        estado: <b>28 activos, 2 de baja</b>,
      }}
    />
  );
}

const donde = document.getElementById('marco-vivo');
if (donde) createRoot(donde).render(<MarcoVivo />);

/*
 * Las dos caras de la prop: sin anclar —que es lo que se entrega por omisión— y
 * anclada. La primera está porque **quien mira tiene que poder comparar**, no
 * porque la exija ningún candado: aquí decía que `verificar-omision` protestaría
 * sin ella y ERA FALSO. Ese candado solo evalúa un par cuando encuentra las dos
 * clases juntas en el marcado ESTÁTICO, y este paquete se corta antes de leer
 * nada. Lo cazó una auditoría, y merecía cazarse: dos decisiones del mismo
 * commit que se contradicen.
 *
 * Lo que sí sujeta el anclaje contra la hoja entregada son los cuatro casos
 * nombrados en `verificar-promesa`, añadidos por eso mismo.
 */
const conAncla = document.getElementById('tabla-viva-anclada');
if (conAncla) createRoot(conAncla).render(<TablaViva anclar={1} />);
const sinAncla = document.getElementById('tabla-viva-suelta');
if (sinAncla) createRoot(sinAncla).render(<TablaViva anclar={0} />);

/* ───────────────────────────────────────────────────────────────────────────
   R151 · LA MATRIZ, MONTADA Y VIVA

   Va viva y no de cartón por lo mismo que la tabla anclada: una celda de esta
   rejilla se decide con `columna`, `fila`, los cuatro motivos, `depende`,
   `clave` y `deshabilitado` a la vez. Eso escrito a mano diverge a la primera —y
   la maqueta de la LISTA, que se escribió a mano, divergió en ocho sitios y lo
   encontró una verificación, no un candado.
   ─────────────────────────────────────────────────────────────────────────── */

const COLUMNAS: ColumnaPrivilegios[] = [
  { id: 'ver', titulo: 'Ver' },
  { id: 'editar', titulo: 'Editar' },
  { id: 'crear', titulo: 'Crear' },
  { id: 'desactivar', titulo: 'Desactivar' },
  { id: 'reporte', titulo: 'Crear reporte' },
  { id: 'descargar', titulo: 'Descargar', aparte: true },
];

const MODULOS_MATRIZ: ModuloPrivilegios[] = [
  {
    id: 'personal', nombre: 'Personal',
    filas: [
      { id: 'trabajadores', nombre: 'Trabajadores' },
      { id: 'contratos', nombre: 'Contratos' },
    ],
    privilegios: [
      { id: 'tr-ver', nombre: 'Ver trabajadores', columna: 'ver', fila: 'trabajadores' },
      { id: 'tr-editar', nombre: 'Editar trabajador', columna: 'editar', fila: 'trabajadores' },
      { id: 'tr-crear', nombre: 'Crear trabajador', columna: 'crear', fila: 'trabajadores' },
      { id: 'tr-desactivar', nombre: 'Desactivar trabajador', columna: 'desactivar', fila: 'trabajadores',
        depende: 'tr-editar' },
      { id: 'tr-descargar', nombre: 'Descargar trabajadores', columna: 'descargar', fila: 'trabajadores' },
      { id: 'co-ver', nombre: 'Ver contratos', columna: 'ver', fila: 'contratos' },
      { id: 'co-editar', nombre: 'Editar contrato', columna: 'editar', fila: 'contratos' },
      { id: 'co-crear', nombre: 'Crear contrato', columna: 'crear', fila: 'contratos',
        cerrado: { tipo: 'ajeno', motivo: 'Crear contratos es del Jefe de personal.' } },
      /* EL HUECO QUE HABLA: la acción no existe para este recurso, y decirlo no
         es lo mismo que omitirlo. Es el argumento con el que llegó el R151. */
      { id: 'co-desactivar', nombre: 'Desactivar contrato', columna: 'desactivar', fila: 'contratos',
        cerrado: { tipo: 'noAplica', motivo: 'Un contrato no se apaga: se cierra con fecha.' } },
      { id: 'co-descargar', nombre: 'Descargar contratos', columna: 'descargar', fila: 'contratos' },
      /* R152 · LA MISMA LLAVE QUE «Reportes». «Crear reporte» es UN permiso
         ofrecido desde dos pantallas: encender uno enciende el otro, y el aviso
         nombra el módulo del compañero. Para unir DENTRO de un módulo está
         «clave»; esto cruza todos. */
      { id: 'co-reporte', nombre: 'Crear reporte', columna: 'reporte', fila: 'contratos',
        claveGlobal: 'crear-reporte' },
    ],
  },
  {
    id: 'reportes', nombre: 'Reportes',
    filas: [{ id: 'asistencia', nombre: 'Reporte de asistencia' }],
    privilegios: [
      { id: 're-ver', nombre: 'Ver reporte', columna: 'ver', fila: 'asistencia' },
      { id: 're-descargar', nombre: 'Descargar reporte', columna: 'descargar', fila: 'asistencia',
        deshabilitado: true },
      /* R152 · LA MISMA LLAVE QUE «Personal». Encender este enciende el de allí
         y al revés: es un solo permiso ofrecido desde dos pantallas. El aviso
         nombra el módulo del compañero — sin eso diría la verdad a medias. */
      { id: 're-crear', nombre: 'Crear reporte', columna: 'reporte', fila: 'asistencia',
        claveGlobal: 'crear-reporte' },
    ],
  },
];

function MatrizViva() {
  const [v, setV] = useState<ValorPrivilegios>({
    personal: { 'tr-ver': true, 'tr-editar': true, 'co-ver': true },
    reportes: { 're-ver': true, 're-descargar': true },
  });
  return (
    <PanelPrivilegios
      presentacion="matriz"
      columnas={COLUMNAS}
      modulos={MODULOS_MATRIZ}
      base={null}
      valor={v}
      onCambio={(completo) => setV(completo)}
    />
  );
}

/* R157 · EL TABLERO DENSO, montado y vivo. Las seis piezas a la vez, que es
   como se ve si conviven: la rejilla, el anillo, el relieve, la burbuja con
   tono, la superficie tonal y el carril con su cuenta de paradas. */
const GENTE = [
  ['Rosa', 'Quispe', 'QUISPE MAMANI, Rosa', '06:48', 'exito'],
  ['Luis', 'Huamán', 'HUAMAN SOTO, Luis', '06:51', 'exito'],
  ['Ana', 'Ccahuana', 'CCAHUANA LIMA, Ana', '06:53', 'exito'],
  ['José', 'Pineda', 'PINEDA ROJAS, Jose', '06:55', 'exito'],
  ['Elva', 'Torres', 'TORRES BAUTISTA, Elva', '06:57', 'exito'],
  ['Mateo', 'Álvarez', 'ALVAREZ NINA, Mateo', '06:58', 'exito'],
  ['Nayeli', 'Shuan', 'SHUAN COLONIA, Nayeli', '07:00', 'exito'],
  ['Diego', 'Maguiña', 'MAGUIÑA ROSALES, Diego', '07:01', 'exito'],
  ['Karla', 'Jamanca', 'JAMANCA TARAZONA, Karla', '07:02', 'exito'],
  ['Aarón', 'Cochachin', 'COCHACHIN LEON, Aaron', '07:03', 'exito'],
  ['Milagros', 'Yauri', 'YAURI PALACIOS, Milagros', '07:04', 'exito'],
  ['Renzo', 'Obregón', 'OBREGON VIDAL, Renzo', '07:05', 'exito'],
  ['Fiorella', 'Antúnez', 'ANTUNEZ MEJIA, Fiorella', '07:06', 'exito'],
  ['Braulio', 'Norabuena', 'NORABUENA SALAS, Braulio', '07:07', 'exito'],
  ['Zoila', 'Chávez', 'CHAVEZ HUERTA, Zoila', '07:08', 'exito'],
  ['Iván', 'Loli', 'LOLI DEPAZ, Ivan', '07:09', 'exito'],
  ['Yuliana', 'Ramírez', 'RAMIREZ CADILLO, Yuliana', '07:12', 'exito'],
  ['Efraín', 'Sánchez', 'SANCHEZ MILLA, Efrain', '07:15', 'exito'],
  ['Sara', 'Vilca', 'VILCA APAZA, Sara', '—', 'error'],
  ['Pedro', 'Mamani', 'MAMANI CRUZ, Pedro', '—', 'error'],
  ['Betsabé', 'Giraldo', 'GIRALDO ROMERO, Betsabe', '—', 'error'],
  ['Wilmer', 'Rurush', 'RURUSH CASTRO, Wilmer', '—', 'error'],
  ['Kiara', 'Espinoza', 'ESPINOZA VEGA, Kiara', '—', 'error'],
  ['Nicolás', 'Trejo', 'TREJO ALVARADO, Nicolas', '—', 'error'],
] as const;

/* Minutos de tardanza sobre la hora de entrada (07:10). Leia solo los minutos
   —«hora.slice(3)»— y eso da «+38» para quien llego a las 06:48: el reloj no se
   parte por el dos puntos. Se comparan minutos absolutos. */
const ENTRADA = 7 * 60 + 10;
function tarde(hora: string): number {
  if (hora === '—') return 0;
  const [h, m] = hora.split(':').map(Number);
  return Math.max(0, h * 60 + m - ENTRADA);
}

function TableroVivo() {
  const [grupo, setGrupo] = useState<'exito' | 'error'>('exito');
  const dentro = GENTE.filter((g) => g[4] === 'exito');
  const fuera = GENTE.filter((g) => g[4] === 'error');
  const lista = grupo === 'exito' ? dentro : fuera;
  return (
    <div className="muestra-tablero">
      {/* EL TEXTO QUE SOSTIENE EL COLOR: el recuento va aqui, con palabras, y
          el anillo de cada avatar solo lo REFUERZA. */}
      <Segmentado
        etiqueta="Grupo"
        opciones={[
          { valor: 'exito', texto: `Asistió ${dentro.length}` },
          { valor: 'error', texto: `No asistió ${fuera.length}` },
        ]}
        valor={grupo}
        onCambio={(v) => setGrupo(v as 'exito' | 'error')}
      />
      <div className={`sup sup-${grupo}`}>
        <ul className="tn-densa">
          {lista.map(([corto, apellido, nombre, hora, tono]) => (
            <li key={nombre} className="tbl-persona">
              <span className="tbl-foto">
                <Avatar id={nombre} nombre={nombre} tamano="fluido"
                        estado={tono} elevacion="relieve" />
                {tarde(hora) > 0 && <span className="badge">+{tarde(hora)}</span>}
              </span>
              <span className="tbl-nom">{corto}</span>
              <span className="tbl-ape">{apellido}</span>
              <span className="tbl-hora">{hora}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="vivo"><span className="vivo-punto" /> En vivo · último dato 07:15</p>
    </div>
  );
}

const enTablero = document.getElementById('tablero-vivo');
if (enTablero) createRoot(enTablero).render(<TableroVivo />);

const enMatriz = document.getElementById('matriz-viva');
if (enMatriz) createRoot(enMatriz).render(<MatrizViva />);
