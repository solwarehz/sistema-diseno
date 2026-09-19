/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { Segmentado } from '../src/index';

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
export function Ejemplo6_0() {
  return (<>
<Segmentado
  etiqueta="Documento"
  contexto="Trabajadores"
  valor={nivel}
  onCambio={guardarYAplicar}
  opciones={[
    { valor: 'completo', texto: 'Completo', ejemplo: '71602303',
      cerrado: 'Tú lo ves en parcial' },
    { valor: 'parcial',  texto: 'Parcial',  ejemplo: '*****303' },
  ]}
/>
  </>);
}

export function Ejemplo6_1() {
  return (<>
<Segmentado
  etiqueta="Privilegios"
  cerrado="No puedes conceder el reparto de privilegios"
  opciones={[]} valor="" onCambio={() => {}}
/>
  </>);
}
