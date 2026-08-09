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
import { Campo } from './Campo';
import { Paginacion } from './Paginacion';

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
}: TablaDatosProps<T>) {
  const id = useId();
  const [orden, setOrden] = useState<EstadoTabla['orden']>(null);
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(porPaginaInicial);
  // R1/R2 · plegar la fila de filtros NO borra los valores: son dos estados
  // distintos a propósito. Plegar es dejar de ver el control, no dejar de
  // filtrar.
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);

  const hayFiltro = Object.values(filtros).some((v) => v !== SIN_FILTRO);

  const avisar = (parcial: Partial<EstadoTabla>) =>
    alCambiar?.({ orden, filtros, pagina, porPagina, ...parcial });

  const filtradas = useMemo(() => {
    const activos = Object.entries(filtros).filter(([, v]) => v !== SIN_FILTRO);
    if (!activos.length) return filas;
    return filas.filter((fila) =>
      activos.every(([clave, texto]) => {
        const col = columnas.find((c) => c.clave === clave);
        if (!col) return true;
        return normalizar(String(col.valor(fila))).includes(normalizar(texto));
      })
    );
  }, [filas, filtros, columnas]);

  const ordenadas = useMemo(() => {
    if (!orden) return filtradas;
    const col = columnas.find((c) => c.clave === orden.clave);
    if (!col) return filtradas;
    const copia = [...filtradas];
    copia.sort((a, b) => {
      const r = comparar(col.valor(a), col.valor(b));
      return orden.dir === 'asc' ? r : -r;
    });
    return copia;
  }, [filtradas, orden, columnas]);

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = ordenadas.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);

  const desde = ordenadas.length === 0 ? 0 : (paginaSegura - 1) * porPagina + 1;
  const hasta = Math.min(paginaSegura * porPagina, ordenadas.length);

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
        </div>
        <div className="tb-barra-der">
          <span className="tb-rango">
            {/* R7 · el rango se queda aunque no haya paginación. */}
            {ordenadas.length === 0 ? 'Sin resultados' : `${desde}–${hasta} de ${ordenadas.length}`}
          </span>
        </div>
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
            {columnas.map((col) => {
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
            {columnas.map((col) => (
              <td key={col.clave} className="tb-f-celda">
                {col.filtrable !== false && (
                  <Campo
                    etiqueta={`Filtrar por ${col.titulo}`}
                    etiquetaOculta
                    type="text"
                    value={filtros[col.clave] ?? SIN_FILTRO}
                    onChange={(e) => cambiarFiltro(col.clave, e.target.value)}
                  />
                )}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibles.map((fila, i) => (
            <tr key={claveFila(fila)} className={i % 2 === 1 ? 'tb-alt' : undefined}>
              {columnas.map((col) => (
                <td key={col.clave} className={col.numerica ? 'tb-num' : undefined}>
                  {col.pintar ? col.pintar(fila) : col.valor(fila)}
                </td>
              ))}
            </tr>
          ))}
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
