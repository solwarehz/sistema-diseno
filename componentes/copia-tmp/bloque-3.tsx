/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { Selector } from '../src/index';

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
// 3 a 8 opciones
export function Ejemplo3_0() {
  return (<>
<Selector etiqueta="Nivel" opciones={niveles} />
  </>);
}

// 9 o más: la búsqueda se activa sola
export function Ejemplo3_1() {
  return (<>
<Selector etiqueta="Apoderado" opciones={apoderados} />
  </>);
}

// Cientos: filtra contra el servidor
export function Ejemplo3_2() {
  return (<>
<Selector
  etiqueta="Apoderado"
  buscar={(texto) => api.apoderados.buscar(texto)}
  sinResultados={(t) => `Sin resultados para ${t}. Prueba con menos letras.`}
/>
  </>);
}
