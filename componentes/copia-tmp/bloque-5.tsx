/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { SeleccionMultiple, GrupoOpcion } from '../src/index';

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
export function Ejemplo5_0() {
  return (<>
<SeleccionMultiple
  leyenda="Aspectos observados en la visita de aula"
  ayuda="Marca todos los que apliquen."
  opciones={aspectos}
  valor={marcados}
  onCambio={setMarcados}
  seleccionarTodos
/>
  </>);
}

export function Ejemplo5_1() {
  return (<>
<GrupoOpcion
  leyenda="Resultado de la visita"
  opciones={resultados}
  valor={resultado}
  onCambio={setResultado}
/>
  </>);
}
