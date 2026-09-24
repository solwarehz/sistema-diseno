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
import { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { MarcoApp, type GrupoNav } from '../../componentes/src/MarcoApp';
import { Icono } from '../../componentes/src/Icono';
import { Avatar } from '../../componentes/src/Avatar';
import { Boton } from '../../componentes/src/Boton';
import { Segmentado } from '../../componentes/src/Segmentado';
/* R159 · La capacidad la calcula el SISTEMA, no esta pantalla. */
import { useCapacidadTablero, enPaginas, cuentaBurbuja } from '../../componentes/src/tablero';
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

/* R157 · EL TABLERO DENSO, montado y vivo: la rejilla, el anillo, el relieve,
   la burbuja, la superficie tonal y el indicador de «en vivo», a la vez, que es
   como se ven si conviven.
   Este comentario decia «y el carril con su cuenta de paradas» y era falso —
   `TableroVivo` no monta ningun carril—. El carril y los tonos que aqui no se
   usan van en la demo ESTATICA del catalogo, que ademas es la unica que los
   candados pueden leer: los del empate, la omision y el elemento cortan el
   documento en «script data-vivo», asi que nada de lo que monte este guion
   existe para ellos. */
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

type Persona = readonly [string, string, string, string, string];

/**
 * EL FLUJO EN VIVO, SIMULADO.
 *
 * El sistema de diseno **no trae socket.io ni ningun transporte**: de donde
 * salen los datos es del producto. Lo que el sistema tiene que garantizar es
 * otra cosa, y es la que no se ve en una demo estatica: **que la pieza se
 * comporte bien cuando los datos cambian DEBAJO**. Gente que marca y pasa de
 * «no asistio» a «asistio», la cuenta que se mueve, la rejilla que se recoloca
 * — y la pantalla en la que estas, que no puede quedarse mintiendo.
 *
 * Por eso el catalogo lo monta asi y no con una lista fija: los tres defectos
 * que este modo enseña —la parada que se queda fuera de rango, el rotulo que
 * anuncia lo que no cambio, y la foto que se recicla en otra persona— no
 * aparecen NUNCA si la lista no se mueve.
 */
function useFlujoSimulado(inicial: readonly Persona[], cada = 2200) {
  const [gente, setGente] = useState<readonly Persona[]>(inicial);
  const [ultimo, setUltimo] = useState('07:15');
  const [andando, setAndando] = useState(true);
  /* EL RELOJ NO RETROCEDE. La primera version sacaba una hora al azar en cada
     evento, y el rotulo llego a decir «ultimo dato 07:42» y despues «07:29»:
     un dato en vivo que va hacia atras es una cifra falsa en pantalla, y la
     regla de cero invencion no distingue entre inventar y desordenar. */
  const reloj = useRef(7 * 60 + 15);
  useEffect(() => {
    if (!andando) return undefined;
    const id = window.setInterval(() => {
      /* EL RELOJ AVANZA AQUI, FUERA DEL ACTUALIZADOR. Estuvo dentro, y un
         actualizador de estado tiene que ser PURO: React lo doble-invoca en
         modo estricto, asi que el reloj corria al doble —medido, siete avances
         en cuatro tics—. El catalogo no monta en modo estricto y por eso no se
         veia; el equipo que consume si lo usa, y es justo el patron contra el
         que el propio sistema predica. */
      /* Y al completarse el turno el reloj vuelve al principio con la lista. */
      if (!gente.some((g) => g[4] === 'error')) reloj.current = 7 * 60 + 15;
      reloj.current += 1 + Math.floor(Math.random() * 3);
      const h = reloj.current;
      const horaDelTic = `${String(Math.floor(h / 60)).padStart(2, '0')}:${String(h % 60).padStart(2, '0')}`;
      setUltimo(horaDelTic);
      setGente((antes) => {
        const fuera = antes.filter((g) => g[4] === 'error');
        /* CUANDO YA NO QUEDA NADIE FUERA, EL TURNO EMPIEZA DE NUEVO. No es
           adorno: al volver a la lista inicial el grupo «asistio» ENCOGE de 24
           a 18, y ahi es donde el carril podria quedarse apuntando a una
           parada que ya no existe. Una demo que solo crece no enseña eso. */
        if (!fuera.length) return inicial;
        const quien = fuera[Math.floor(Math.random() * fuera.length)];
        const hora = horaDelTic;
        /* SE DEVUELVE UNA LISTA NUEVA CON LA MISMA IDENTIDAD POR PERSONA. La
           clave de cada celda es el nombre completo, no el indice: si fuera el
           indice, al cambiar alguien de grupo React reutilizaria el nodo y la
           FOTO de una persona se quedaria puesta en otra. */
        return antes.map((g) => (g === quien
          ? [g[0], g[1], g[2], hora, 'exito'] as const satisfies Persona
          : g));
      });
    }, cada);
    return () => window.clearInterval(id);
  }, [andando, cada, inicial]);
  return { gente, ultimo, andando, setAndando };
}

function TableroVivo() {
  const [grupo, setGrupo] = useState<'exito' | 'error'>('exito');
  /* LOS DATOS CAMBIAN DEBAJO. Es lo que pidio el responsable —«que funcione
     como si tuviera socketio»— y es la unica forma de ver lo que una lista
     fija esconde. El transporte no es del sistema; el comportamiento, si. */
  const { gente, ultimo, andando, setAndando } = useFlujoSimulado(GENTE);
  const dentro = useMemo(() => gente.filter((g) => g[4] === 'exito'), [gente]);
  const fuera = useMemo(() => gente.filter((g) => g[4] === 'error'), [gente]);
  const lista = grupo === 'exito' ? dentro : fuera;
  /* R162 · SE ENGANCHA CON EL «ref» QUE DEVUELVE EL GANCHO, no con un
     «useRef» propio. Es la forma recomendada y la razon es de orden: un
     «RefObject» solo tiene nodo DESPUES de pintar, asi que el gancho tenia que
     adivinar cuando mirarlo; el «ref» de retorno es React quien lo llama, con
     el nodo en la mano, cada vez que cambia —y tambien cuando llega tarde
     porque la caja se monta detras de una condicion—. La firma vieja sigue
     funcionando: el gancho acepta los dos. */
  const { porPagina, ref: medirCaja } = useCapacidadTablero();
  const paginas = enPaginas(lista, porPagina);
  /* En que parada esta. Se lee del desplazamiento del propio carril y no de un
     boton, porque aqui se pasa de pagina DESLIZANDO: un estado que solo cambie
     al pulsar diria lo que el usuario no hizo. */
  const [actual, setActual] = useState(0);
  const carril = useRef<HTMLDivElement>(null);
  /* Y SE ACOTA AL NUMERO DE PANTALLAS QUE HAY AHORA. El estado solo lo escribia
     el desplazamiento, y nada lo comparaba con cuantas paginas quedan: al
     agrandar la caja de 18 paradas a 2, el carril seguia diciendo «Pantalla 20
     de 2» y sin ningun punto encendido — dentro de un «aria-live», que ademas
     lo anuncia. Se acota al leer, no al escribir, porque el numero de paginas
     cambia sin que nadie deslice. */
  const enPantalla = Math.min(actual, Math.max(0, paginas.length - 1));
  /* Y CUANDO LA LISTA ENCOGE, EL CARRIL VUELVE A UNA PARADA QUE EXISTE.
     Solo se ve con datos en movimiento: estando en la pantalla 4 de 4, si dos
     personas cambian de grupo quedan 3 paginas y el carril se queda desplazado
     donde ya no hay nada — el navegador acota el desplazamiento, pero no
     siempre dispara el evento que lo cuenta, asi que la tira podia seguir
     encendiendo un punto que ya no era el suyo. Se acota tambien aqui. */
  useEffect(() => {
    const el = carril.current;
    if (!el) return;
    const tope = Math.max(0, paginas.length - 1);
    if (actual <= tope) return;
    setActual(tope);
    const parada = el.children[tope] as HTMLElement | undefined;
    if (parada) el.scrollTo({ left: parada.offsetLeft });
  }, [paginas.length, actual]);
  const alDeslizar = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    /* SE BUSCA LA PARADA MAS CERCANA POR SU POSICION REAL, no se divide por el
       ancho. Dividir ignora el hueco de 12 px del carril —cada parada empieza
       en «i*(ancho+hueco)», no en «i*ancho»— y el error se acumula: medido con
       18 paradas, a partir de la 6 decia una de mas, y en la ultima decia
       «Pantalla 20 de 18» sin encender ningun punto. Falla desde la parada
       «ancho/(2*hueco)», asi que en un carril corto salta enseguida.
       Preguntar por «offsetLeft» no se puede equivocar: es donde esta cada
       parada, huecos incluidos. */
    const paradas = [...el.children] as HTMLElement[];
    if (!paradas.length) return;
    let i = 0;
    let mejor = Infinity;
    /* Y SE RESTA SOLO EL DESPLAZAMIENTO. Estuvo restando tambien
       «el.offsetLeft», y eso mezcla dos sistemas de coordenadas: desde que el
       carril es bloque contenedor —que entro para que «.sr-solo» no se escape
       del recorte— EL CARRIL ES EL «offsetParent» de sus paradas, asi que
       «p.offsetLeft» ya es relativo a el. Medido en el catalogo: 49 px de
       sesgo, y el punto encendido y el «aria-live» saltaban a la siguiente
       pantalla al 32 % de la actual. En reposo lo tapaba el anclaje —49 de 247—
       pero el sesgo es «car.offsetLeft», asi que en un producto que monte el
       carril bajo otro antepasado posicionado puede pasar de media pagina y
       entonces el indice EN REPOSO es siempre el equivocado.
       Un arreglo puede abrir otro defecto en otro sitio: esto lo destapo la
       auditoria mirando lo que el cambio de ayer habia movido. */
    paradas.forEach((p, k) => {
      const d = Math.abs(p.offsetLeft - el.scrollLeft);
      if (d < mejor) { mejor = d; i = k; }
    });
    setActual((v) => (v === i ? v : i));
  };
  return (
    <div className="muestra-tablero tbl-marco">
      {/* EL TEXTO QUE SOSTIENE EL COLOR: el recuento va aqui, con palabras, y
          el anillo de cada avatar solo lo REFUERZA. */}
      <Segmentado
        etiqueta="Grupo"
        etiquetaOculta
        opciones={[
          { valor: 'exito', texto: `Asistió ${dentro.length}` },
          { valor: 'error', texto: `No asistió ${fuera.length}` },
        ]}
        valor={grupo}
        onCambio={(v) => setGrupo(v as 'exito' | 'error')}
      />
      {/* R159 · SE LLENA EL AREA, Y LO QUE SOBRA VA A LA SIGUIENTE PAGINA.
          La capacidad la calcula el SISTEMA —«useCapacidadTablero»— y no esta
          pantalla: si la calculara cada producto, la misma rejilla acabaria con
          tres respuestas distintas. Aqui solo se mide la caja que el sistema
          pide medir. */}
      <div className={`sup sup-${grupo} tbl-lleno`} ref={medirCaja}>
        {/* SE MIDE EL CARRIL, NO LA SUPERFICIE DE FUERA. Cada parada mide lo
            mismo que el carril, y la superficie le quita su relleno y su borde
            —26 px medidos—: midiendo fuera, la cuenta salia para una caja mas
            grande que la real y la ultima fila quedaba CORTADA. */}
        {/* Y CUANDO NO HAY NADIE, SE DICE. Con el flujo en marcha el grupo
            «no asistio» llega a cero, y entonces se pintaba un tablero vacio y
            ya — teniendo el sistema sus superficies tonales y su texto para
            esto. Un vacio sin explicar se lee como «esto se rompio». */}
        {lista.length === 0 && (
          <p className="tbl-vacio">
            {grupo === 'error'
              ? 'Han marcado todos. No queda nadie por llegar.'
              : 'Todavia no ha marcado nadie.'}
          </p>
        )}
        <div className="car car-pagina" onScroll={alDeslizar} ref={carril}
             tabIndex={0} role="region"
             aria-label={`Personas, ${paginas.length} ${paginas.length === 1 ? 'pantalla' : 'pantallas'}`}>
          {paginas.map((pagina, i) => (
            <ul className="tn-densa tn-densa-llena" key={i}>
              {pagina.map(([corto, apellido, nombre, hora, tono]) => (
                <li key={nombre} className="tbl-persona">
                  <span className="tbl-foto">
                    <Avatar id={nombre} nombre={nombre} tamano="fluido"
                            estado={tono} elevacion="relieve" />
                    {tarde(hora) > 0 && <span className="badge">{cuentaBurbuja(tarde(hora), '+')}</span>}
                  </span>
                  {/* EL NOMBRE COMPLETO NO SE PIERDE NUNCA. Las dos lineas de
                      arriba son lo que se LEE de un vistazo; esto es lo que
                      queda si una se recorta, y es lo que dice un lector en vez
                      de deletrear «Rosa Quispe 06:48». */}
                  <span className="sr-solo">{nombre} · {hora}</span>
                  <span className="tbl-nom">{corto}</span>
                  <span className="tbl-ape">{apellido}</span>
                  <span className="tbl-hora" aria-hidden="true">{hora}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {/* LA PARADA EN CURSO SE SIGUE, no se da por hecha. Esto decia «i === 0» y
          «Pantalla 1», asi que el carril decia SIEMPRE que estabas en la
          primera por muchas que pasaras: de las tres condiciones de la regla 7,
          la (b) entregaba solo la mitad —cuantas hay, nunca donde estas—. Lo
          midio una auditoria deslizando hasta el final. */}
      {/* LA TIRA SE PINTA SIEMPRE, aunque haya una sola pantalla. Si apareciera
          y desapareciera, su alto entraria y saldria de la caja que se mide, y
          la capacidad tendria DOS puntos fijos: la misma caja daba 7x3 o 7x2
          segun si venias de una caja mayor o menor. Ocupando siempre, hay uno. */}
      <p className={`car-cuenta${paginas.length > 1 ? '' : ' car-cuenta-vacia'}`}
         aria-live="polite" aria-hidden={paginas.length > 1 ? undefined : true}>
        {paginas.map((_, i) => (
          <span key={i} className={`car-punto${i === enPantalla ? ' car-punto-aqui' : ''}`} />
        ))}
        <span className="sr-solo">Pantalla {enPantalla + 1} de {paginas.length}</span>
      </p>
      {/* EL ROTULO DICE LA HORA REAL DEL ULTIMO DATO, no una escrita a mano.
          Decia «07:15» fijo, y con el flujo en marcha eso es una cifra
          inventada en pantalla: lo que el sistema prohibe en su documentacion
          no puede hacerlo su propio catalogo. */}
      <p className="vivo">
        <span className="vivo-punto" /> En vivo · último dato {ultimo}
        {' · '}
        {/* SE COMPONE, NO SE RECONSTRUYE (politica §4bis-2): el control es un
            «Boton» terciario del sistema, no un «button» con clases propias. */}
        <Boton variante="terciaria" mini onClick={() => setAndando((v) => !v)}>
          {andando ? 'Pausar el flujo' : 'Reanudar el flujo'}
        </Boton>
      </p>
    </div>
  );
}

/**
 * EL MISMO TABLERO EN UN PADRE QUE NO COOPERA.
 *
 * Regla 16 del contrato: una pieza que depende de su padre se demuestra en un
 * padre que NO coopera. Estaba, y era marcado escrito a mano — que no demuestra
 * la pieza, demuestra un marcado: a 360 px la caja da para 2x2 y las seis
 * celdas fijas seguian ahi, enseñando el desplazamiento vertical que el
 * sistema promete que no existe. Ahora monta el gancho de verdad, con datos
 * que tambien se mueven, dentro de un contenedor liso sin flex.
 */
function TableroLisoVivo() {
  const { gente } = useFlujoSimulado(GENTE, 3100);
  const lista = useMemo(() => gente.filter((g) => g[4] === 'exito'), [gente]);
  const { porPagina, ref: medirCaja } = useCapacidadTablero();
  const paginas = enPaginas(lista, porPagina);
  return (
    <div className="sup sup-exito tbl-lleno" ref={medirCaja}>
      <div className="car car-pagina" tabIndex={0} role="region"
           aria-label={`Personas, ${paginas.length} ${paginas.length === 1 ? 'pantalla' : 'pantallas'}`}>
        {paginas.map((pagina, i) => (
          <ul className="tn-densa tn-densa-llena" key={i}>
            {pagina.map(([corto, apellido, nombre, hora, tono]) => (
              <li key={nombre} className="tbl-persona">
                <span className="tbl-foto">
                  <Avatar id={nombre} nombre={nombre} tamano="fluido"
                          estado={tono} elevacion="relieve" />
                  {tarde(hora) > 0 && <span className="badge">{cuentaBurbuja(tarde(hora), '+')}</span>}
                </span>
                <span className="sr-solo">{nombre} · {hora}</span>
                <span className="tbl-nom">{corto}</span>
                <span className="tbl-ape">{apellido}</span>
                <span className="tbl-hora" aria-hidden="true">{hora}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

const enTablero = document.getElementById('tablero-vivo');
if (enTablero) createRoot(enTablero).render(<TableroVivo />);

const enLiso = document.getElementById('tablero-liso-vivo');
if (enLiso) createRoot(enLiso).render(<TableroLisoVivo />);

const enMatriz = document.getElementById('matriz-viva');
if (enMatriz) createRoot(enMatriz).render(<MatrizViva />);
