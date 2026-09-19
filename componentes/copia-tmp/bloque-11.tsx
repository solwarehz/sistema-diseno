/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { TablaDatos, Enlace } from '../src/index';

declare const valor: any;
declare const setValor: any;
declare const guardar: any;
declare const datos: any;
declare const filas: any;
declare const onCambio: any;
declare const pagina: any;
declare const setPagina: any;
declare const abierto: any;
declare const setAbierto: any;
declare const cargando: any;
declare const error: any;
declare const buscar: any;
declare const seleccion: any;
declare const setSeleccion: any;
declare const enviar: any;
declare const archivo: any;
declare const setArchivo: any;
export function Ejemplo11_0() {
  return (<>
<TablaDatos
  titulo="Personal"               // obligatorio: nombra la tabla para el lector
  filas={personal}
  claveFila={(f) => f.dni}        // obligatorio: identidad estable de la fila
  columnas={[
    { clave: 'nombre', titulo: 'Trabajador', valor: (f) => f.nombre },
    { clave: 'dni',    titulo: 'DNI',        valor: (f) => f.dni },
    { clave: 'estado', titulo: 'Estado',     valor: (f) => f.estado,
      opcionesFiltro: ['Activo', 'Cesado'],          // dominio cerrado: el filtro es un selector
      pintar: (f) => <Chip tono={f.estado === 'Activo' ? 'exito' : 'inactivo'}>{f.estado}</Chip> },
    { clave: 'tarde',  titulo: 'Min. tarde', valor: (f) => f.tarde, numerica: true },
  ]}
  porPagina={10}                  // 10 · 25 · 50 · 0 para todas
  columnasSiempreVisibles={['nombre']}   // las que NO se pueden ocultar desde «Columnas»
  anclarColumnas={1}              // la primera —y la N.o con ella— se queda quieta al desplazar
  acciones={<Boton mini onClick={exportar}>CSV</Boton>}
/>
  </>);
}
