/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { Paginacion } from '../src/index';

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
export function Ejemplo12_0() {
  return (<>
<Paginacion
  total={1240}
  porPagina={10}
  pagina={pagina}
  onCambio={setPagina}
/>
  </>);
}

// Móvil: sin números
export function Ejemplo12_1() {
  return (<>
<Paginacion total={1240} porPagina={10} pagina={p} onCambio={setP} compacta />
  </>);
}

// Cargar más
export function Ejemplo12_2() {
  return (<>
<Paginacion variante="cargar-mas" restantes={215} porTanda={25} onCargar={cargar} />
  </>);
}
