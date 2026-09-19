/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { Interruptor } from '../src/index';

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
export function Ejemplo4_0() {
  return (<>
<Interruptor
  etiqueta="Notificar tardanzas por correo"
  ayuda="Se envía un resumen a las 09:00."
  valor={activo}
  onCambio={guardarYAplicar}
/>
  </>);
}

export function Ejemplo4_1() {
  return (<>
<Interruptor etiqueta="Marcar desde el móvil" valor={x} deshabilitado />
  </>);
}
