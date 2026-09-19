/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { CampoTexto } from '../src/index';

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
export function Ejemplo2_0() {
  return (<>
<CampoTexto
  etiqueta="Documento de identidad"
  pista="71234567"
  ayuda="Ocho dígitos, sin guiones ni puntos."
  obligatorio
/>
  </>);
}

export function Ejemplo2_1() {
  return (<>
<CampoTexto etiqueta="Observación" area rows={3} />
  </>);
}
export function Ejemplo2_2() {
  return (<>
<CampoTexto etiqueta="Monto" tipo="soles" />
  </>);
}
export function Ejemplo2_3() {
  return (<>
<CampoTexto etiqueta="Sede" valor="Huaraz" soloLectura />
  </>);
}
export function Ejemplo2_4() {
  return (<>
<CampoTexto etiqueta="DNI" valor="7123" error="Faltan 4 dígitos." />
  </>);
}
