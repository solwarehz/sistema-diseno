/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { EstadoPantalla } from '../src/index';

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
// El componente elige el estado; la pantalla no lo decide a mano
export function Ejemplo16_0() {
  return (<>
<EstadoPantalla
  cargando={cargando}
  error={error}
  consultado={consultado}       // false = nunca consultado
  vacio={filas.length === 0}
  existenDatos={totalSinFiltros > 0}   // distingue «sin resultados» de «primera vez»
  busqueda={texto}              // para nombrarlo en el título
  onReintentar={recargar}
  onQuitarFiltros={limpiar}
>
  <TablaDatos filas={filas} />
  </>);
}
</EstadoPantalla>
