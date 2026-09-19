/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { Progreso, ProgresoPasos } from '../src/index';

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
export function Ejemplo13_0() {
  return (<>
<Progreso
  etiqueta="Importando trabajadores"
  valor={74}
  total={120}
  unidad="filas"
/>
  </>);
}

export function Ejemplo13_1() {
  return (<>
<Progreso etiqueta="Trabajando" indeterminada />
  </>);
}

export function Ejemplo13_2() {
  return (<>
<Progreso etiqueta="Se detuvo" valor={46} total={120}
  error="Fila 46: el DNI 7123 no tiene 8 dígitos" />
  </>);
}

export function Ejemplo13_3() {
  return (<>
<ProgresoPasos pasos={pasos} actual={3} />
  </>);
}
