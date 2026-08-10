/**
 * TABLA DE DATOS
 *
 * El 80 % de la superficie del sistema, y lo que Control Administrativos V2.0
 * tuvo que reconstruir en 1.376 líneas mirando el catálogo.
 *
 * Trae el COMPORTAMIENTO, no solo el aspecto. Las cinco reglas que ellos
 * descubrieron pulsando —una prueba cada una, un día entero— están aquí
 * implementadas y probadas, con el número de regla de `comportamiento.md`:
 *
 *   R1 · «Filtros» despliega una fila dentro del <thead>, uno por columna
 *   R2 · al plegarla los valores se conservan
 *   R3 · el botón queda marcado mientras haya filtro
 *   R5 · al filtrar se vuelve a la página 1
 *   R7 · con una sola página no se pinta la paginación, pero el rango se queda
 *
 * Los estilos NO están aquí: vienen de `componentes.css`, que se extrae del
 * catálogo. Este archivo pone marcado y comportamiento; si además llevara
 * estilos, habría dos fuentes para lo mismo y divergirían.
 */

import { useMemo, useState, useId } from 'react';
import { Boton } from './Boton';
import { Chip } from './Chip';
import { Campo, Selector } from './Campo';
import { Paginacion } from './Paginacion';
import { SeleccionMultiple } from './Interruptor';

export type Columna<T> = {
  /** Clave estable. Se usa para ordenar, filtrar y ocultar. */
  clave: string;
  /** Encabezado visible. */
  titulo: string;
  /** Cómo se saca el valor de la fila. */
  valor: (fila: T) => string | number;
  /** Cómo se pinta. Por omisión, el valor tal cual. */
  pintar?: (fila: T) => React.ReactNode;
  /** ¿Se puede ordenar por esta columna? Por omisión, sí. */
  ordenable?: boolean;
  /** ¿Se puede filtrar por esta columna? Por omisión, sí. */
  filtrable?: boolean;
  /** R33 · dominio cerrado: las opciones posibles. Con esto el filtro es un
   *  SELECTOR y casa por IGUALDAD, no por texto contenido — quien teclea
   *  «vigente» recordando el sinónimo y no el literal concluye que no hay
   *  resultados, y «activo» está CONTENIDO en «inactivo». */
  opcionesFiltro?: string[];
  /** Alineación numérica a la derecha. */
  numerica?: boolean;
};

export type TablaDatosProps<T> = {
  columnas: Columna<T>[];
  filas: T[];
  /** Identificador estable de cada fila. Nunca el índice. */
  claveFila: (fila: T) => string;
  /** Título accesible de la tabla. Obligatorio: una tabla sin nombre no se
   *  puede distinguir de otra al navegar por regiones. */
  titulo: string;
  /** Tamaño de página inicial. El sistema ofrece 10 · 25 · 50 · todas. */
  porPagina?: number;
  /** Se llama al cambiar orden, filtros o página. Para persistir la
   *  preferencia donde corresponda —el perfil del usuario, no el navegador—. */
  alCambiar?: (estado: EstadoTabla) => void;
  /**
   * DÓNDE se ordena y se filtra.
   *
   *   `navegador` — sobre las filas recibidas. Vale cuando `filas` trae TODO.
   *   `servidor`  — la tabla no toca los datos: solo emite el estado por
   *                 `alCambiar` y pinta lo que le den.
   *
   * La distinción no es de rendimiento. Con paginación de servidor, ordenar en
   * el navegador ordena SOLO la página que se está viendo: el resultado parece
   * ordenado y no lo está. Lo midió Control Administrativos V2.0 en un registro
   * de asistencia que se exhibe ante inspección de trabajo — ahí una tabla que
   * miente tiene consecuencia legal.
   *
   * En `servidor` hay que pasar `total`, porque la tabla ya no puede contarlo.
   */
  modo?: 'navegador' | 'servidor';
  /** Obligatorio con `modo="servidor"`: cuántas filas hay EN TOTAL, no en esta
   *  página. Sin esto el pie diría «1–10 de 10» teniendo 380. */
  total?: number;
  /** Columnas que no se pueden ocultar. La que identifica cada fila va aquí:
   *  una tabla sin su identificador no identifica nada. */
  columnasFijas?: string[];
  /** R31 · columnas ocultas, CONTROLADAS. La elección de columnas es una
   *  preferencia de la persona, y una que no persiste no es una preferencia:
   *  con la pareja `ocultas`/`onOcultas` el producto la siembra al montar
   *  desde el perfil y la guarda al cambiar. Sin pasarla, la tabla se la
   *  gestiona sola, como siempre. */
  ocultas?: string[];
  onOcultas?: (ocultas: string[]) => void;
  /** R32 · acciones del producto en la barra —exportar, imprimir, por lotes—
   *  junto a «Filtros» y «Columnas». Solo el sitio: el comportamiento es del
   *  producto. Sin ranura, el CSV de cada consumidor flota encima de la
   *  tarjeta y se nota que no pertenece. */
  acciones?: React.ReactNode;
};

export type EstadoTabla = {
  orden: { clave: string; dir: 'asc' | 'desc' } | null;
  filtros: Record<string, string>;
  pagina: number;
  porPagina: number;
};

const SIN_FILTRO = '';

/** Comparación que no depende del idioma del navegador para los números. */
function comparar(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

/** Sin tildes y en minúsculas: «jose» tiene que encontrar «José». */
const normalizar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function TablaDatos<T>({
  columnas,
  filas,
  claveFila,
  titulo,
  porPagina: porPaginaInicial = 10,
  alCambiar,
  modo = 'navegador',
  total,
  columnasFijas = [],
  ocultas: ocultasFuera,
  onOcultas,
  acciones,
}: TablaDatosProps<T>) {
  if (process.env.NODE_ENV !== 'production' && modo === 'servidor' && total === undefined) {
    console.warn(
      'TablaDatos: con modo="servidor" hace falta `total`. Sin él el pie cuenta ' +
      'solo la página recibida y dice un número que no es.'
    );
  }
  const id = useId();
  const [orden, setOrden] = useState<EstadoTabla['orden']>(null);
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(porPaginaInicial);
  // R1/R2 · plegar la fila de filtros NO borra los valores: son dos estados
  // distintos a propósito. Plegar es dejar de ver el control, no dejar de
  // filtrar.
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  // R5 · qué columnas se ven. Arranca con todas: ocultar por omisión esconde
  // datos que nadie pidió esconder.
  // R31 · y CONTROLABLE desde fuera, con el mismo patrón que el plegado del
  // marco: si el producto pasa `ocultas`, esa es la verdad y aquí no se
  // duplica; si no la pasa, la tabla se la gestiona sola.
  const [ocultasDentro, setOcultasDentro] = useState<Set<string>>(new Set());
  const ocultas = ocultasFuera !== undefined ? new Set(ocultasFuera) : ocultasDentro;
  const setOcultas = (s: Set<string>) => {
    if (ocultasFuera === undefined) setOcultasDentro(s);
    onOcultas?.([...s]);
  };
  const [columnasAbierto, setColumnasAbierto] = useState(false);

  // Una columna FIJA no se puede quitar. No es un tope —cuántos datos quiere
  // ver cada persona es decisión suya— es un mínimo: una tabla sin la columna
  // que identifica cada fila no identifica nada.
  const esFija = (clave: string) => columnasFijas.includes(clave);
  const visiblesCols = columnas.filter((c) => !ocultas.has(c.clave) || esFija(c.clave));


  const hayFiltro = Object.values(filtros).some((v) => v !== SIN_FILTRO);

  const avisar = (parcial: Partial<EstadoTabla>) =>
    alCambiar?.({ orden, filtros, pagina, porPagina, ...parcial });

  const filtradas = useMemo(() => {
    // En `servidor` la tabla NO toca los datos: filtrar aquí sobre la página
    // recibida es justo el error que este modo existe para impedir.
    if (modo === 'servidor') return filas;
    const activos = Object.entries(filtros).filter(([, v]) => v !== SIN_FILTRO);
    if (!activos.length) return filas;
    return filas.filter((fila) =>
      activos.every(([clave, texto]) => {
        const col = columnas.find((c) => c.clave === clave);
        if (!col) return true;
        // R33 · dominio cerrado casa por IGUALDAD: con inclusión, elegir
        // «Activo» en el selector devolvería también los «Inactivo».
        return col.opcionesFiltro
          ? normalizar(String(col.valor(fila))) === normalizar(texto)
          : normalizar(String(col.valor(fila))).includes(normalizar(texto));
      })
    );
  }, [filas, filtros, columnas, modo]);

  const ordenadas = useMemo(() => {
    if (modo === 'servidor') return filtradas;
    if (!orden) return filtradas;
    const col = columnas.find((c) => c.clave === orden.clave);
    if (!col) return filtradas;
    const copia = [...filtradas];
    copia.sort((a, b) => {
      const r = comparar(col.valor(a), col.valor(b));
      return orden.dir === 'asc' ? r : -r;
    });
    return copia;
  }, [filtradas, orden, columnas, modo]);

  // En `servidor` el total lo dice quien consulta; en `navegador` lo cuenta la
  // tabla. Y en `servidor` NO se recorta: lo recibido ES la página.
  const cuantas = modo === 'servidor' ? (total ?? filas.length) : ordenadas.length;
  const totalPaginas = Math.max(1, Math.ceil(cuantas / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = modo === 'servidor'
    ? ordenadas
    : ordenadas.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);

  const desde = cuantas === 0 ? 0 : (paginaSegura - 1) * porPagina + 1;
  const hasta = Math.min(paginaSegura * porPagina, cuantas);

  function cambiarOrden(clave: string) {
    // R13 · ordenar no cambia de página ni pierde los filtros.
    const dir = orden?.clave === clave && orden.dir === 'asc' ? 'desc' : 'asc';
    const nuevo = { clave, dir } as const;
    setOrden(nuevo);
    avisar({ orden: nuevo });
  }

  function cambiarFiltro(clave: string, texto: string) {
    const nuevos = { ...filtros, [clave]: texto };
    setFiltros(nuevos);
    // R5 · al filtrar se vuelve a la página 1. Quedarse en la página 7 de un
    // resultado que ahora tiene 2 muestra una tabla vacía que parece un fallo.
    setPagina(1);
    avisar({ filtros: nuevos, pagina: 1 });
  }

  return (
    <div className="tb-envoltura">
      <div className="tb-barra">
        <div className="tb-barra-izq">
          <Boton
            variante="neutra"
            /* R3 · el botón queda marcado mientras haya filtro: con la fila
               plegada nada más lo indicaría, y una tabla filtrada que parece
               completa es un error de lectura. */
            className={hayFiltro ? 'activo' : ''}
            aria-expanded={filtrosVisibles}
            aria-controls={`${id}-filtros`}
            onClick={() => setFiltrosVisibles((v) => !v)}
          >
            Filtros
          </Boton>

          {/* R5 · elegir columnas. Se compone con SeleccionMultiple, que ya
              existe: un panel de casillas escrito aquí seria el mismo control
              con otro nombre. */}
          <Boton
            variante="neutra"
            aria-expanded={columnasAbierto}
            aria-controls={`${id}-columnas`}
            onClick={() => setColumnasAbierto((v) => !v)}
          >
            Columnas
          </Boton>
          {/* R32 · la ranura del producto: exportar, imprimir, por lotes.
              Solo el sitio — el comportamiento es de quien la llena. */}
          {acciones}
        </div>
        <div className="tb-barra-der">
          <span className="tb-rango">
            {/* R7 · el rango se queda aunque no haya paginación. */}
            {cuantas === 0 ? 'Sin resultados' : `${desde}–${hasta} de ${cuantas}`}
          </span>
        </div>
      </div>

      <div id={`${id}-columnas`} className="tb-columnas" hidden={!columnasAbierto}>
        <SeleccionMultiple
          titulo="Columnas visibles"
          opciones={columnas.map((c) => ({
            valor: c.clave,
            texto: c.titulo,
            ayuda: esFija(c.clave) ? 'Identifica la fila: no se puede quitar' : undefined,
          }))}
          valores={visiblesCols.map((c) => c.clave)}
          // Las fijas se reponen SIEMPRE. No se confía en deshabilitar el
          // control: un `disabled` se puede quitar desde el inspector, y esto
          // es un minimo de la tabla, no una sugerencia.
          onCambio={(elegidas) =>
            setOcultas(new Set(columnas.filter((c) => !elegidas.includes(c.clave) && !esFija(c.clave)).map((c) => c.clave)))
          }
        />
      </div>

      {/* R4 · los filtros puestos se listan encima: el botón dice «hay
          filtros», esta tira dice CUÁLES. */}
      <div className="tb-activos" hidden={!hayFiltro}>
        {Object.entries(filtros)
          .filter(([, v]) => v !== SIN_FILTRO)
          .map(([clave, v]) => {
            const col = columnas.find((c) => c.clave === clave);
            return (
              <Chip tono="info" key={clave}>
                {col?.titulo}: {v}
              </Chip>
            );
          })}
      </div>

      <table className="tb" aria-label={titulo}>
        <thead>
          <tr>
            {visiblesCols.map((col) => {
              const activa = orden?.clave === col.clave;
              const ordenable = col.ordenable !== false;
              return (
                <th
                  key={col.clave}
                  scope="col"
                  className="tb-th"
                  /* R11 · aria-sort en el <th>, y el disparador es un <button>
                     de verdad dentro. Un <th> con onClick no se anuncia ni se
                     alcanza con teclado. */
                  aria-sort={activa ? (orden!.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {ordenable ? (
                    <button type="button" className="tb-th-btn" onClick={() => cambiarOrden(col.clave)}>
                      <span className="tb-th-txt">{col.titulo}</span>
                      {/* R12 · flecha ADEMÁS de color: SC 1.4.1. */}
                      <span className="tb-th-flecha" aria-hidden="true">
                        {activa ? (orden!.dir === 'asc' ? '↑' : '↓') : ''}
                      </span>
                    </button>
                  ) : (
                    <span className="tb-th-txt">{col.titulo}</span>
                  )}
                </th>
              );
            })}
          </tr>
          {/* R1 · la fila de filtros va DENTRO del <thead>, uno por columna: el
              filtro vive sobre la columna que filtra o hay que recordar cuál
              era cuál. */}
          <tr id={`${id}-filtros`} className="tb-fila-filtros" hidden={!filtrosVisibles}>
            {/* `td` y no `th`: una celda de filtro NO es un encabezado de
                columna. Con `th` cada columna se anunciaba DOS VECES —«Horas» y
                «Filtrar por Horas»— y quien navega por encabezados tenía que
                pasar por el doble de paradas. Se vio al ponerle etiqueta de
                verdad: antes el `aria-label` del input no subía al `th` y el
                defecto quedaba tapado.
                Y la clase es la que el catálogo estiliza; el componente no la
                ponía, así que la fila salía sin fondo ni relleno. */}
            {visiblesCols.map((col) => (
              <td key={col.clave} className="tb-f-celda">
                {col.filtrable !== false && (
                  // R33 · dominio cerrado: se ELIGE, no se adivina el literal.
                  // Se compone con Selector, que ya existe; texto libre para
                  // el resto, como siempre.
                  col.opcionesFiltro ? (
                    <Selector
                      etiqueta={`Filtrar por ${col.titulo}`}
                      etiquetaOculta
                      opciones={col.opcionesFiltro.map((o) => ({ valor: o, texto: o }))}
                      vacio="Todas"
                      value={filtros[col.clave] ?? SIN_FILTRO}
                      onChange={(e) => cambiarFiltro(col.clave, e.target.value)}
                    />
                  ) : (
                    <Campo
                      etiqueta={`Filtrar por ${col.titulo}`}
                      etiquetaOculta
                      type="text"
                      value={filtros[col.clave] ?? SIN_FILTRO}
                      onChange={(e) => cambiarFiltro(col.clave, e.target.value)}
                    />
                  )
                )}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibles.map((fila, i) => (
            <tr key={claveFila(fila)} className={i % 2 === 1 ? 'tb-alt' : undefined}>
              {visiblesCols.map((col) => (
                <td key={col.clave} className={col.numerica ? 'tb-num' : undefined}>
                  {col.pintar ? col.pintar(fila) : col.valor(fila)}
                </td>
              ))}
            </tr>
          ))}
          {/* El vacío DICE POR QUÉ y da la salida. El catálogo lo tenía y el
              componente no: cero filas dejaba solo encabezados, y una tabla
              filtrada a vacío parece un fallo. El encabezado se queda — dice
              qué columnas habría. */}
          {visibles.length === 0 && (
            <tr>
              <td colSpan={visiblesCols.length} className="tb-vacio">
                <strong>Sin resultados.</strong><br />
                {hayFiltro ? (
                  <>
                    Prueba con menos filtros, o{' '}
                    <button
                      type="button"
                      className="tb-vacio-quitar"
                      onClick={() => {
                        setFiltros({});
                        setPagina(1);
                        avisar({ filtros: {}, pagina: 1 });
                      }}
                    >
                      quítalos todos
                    </button>.
                  </>
                ) : (
                  'No hay datos registrados todavía.'
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* R7 · con una sola página NO se pinta la paginación. El rango sí, y
          está arriba. */}
      {/* Se IMPORTA Paginacion en vez de rehacerla. Estaban las dos: 38 líneas
          aquí que reproducían lo que `Paginacion compacta` ya hacía, clase por
          clase. Copiar el aspecto no copia el resto —`aria-current` en la
          página en curso, la ventana con elipsis, la regla de no pintarse con
          una sola página— y el día que la paginación mejore, la de la tabla se
          queda como está. */}
      <Paginacion
        compacta
        de={titulo}
        pagina={paginaSegura}
        totalPaginas={totalPaginas}
        onPagina={(n) => { setPagina(n); avisar({ pagina: n }); }}
        porPagina={porPagina}
        onPorPagina={(n) => { setPorPagina(n); setPagina(1); avisar({ porPagina: n, pagina: 1 }); }}
      />
    </div>
  );
}
