/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { RangoFecha, atajosDeDias } from '../src/index';

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
// Sin `desde`/`hasta` se gobierna solo.
export function Ejemplo7_0() {
  return (<>
<RangoFecha titulo="Rango de fechas" />
  </>);
}

// Con ellas MANDAN: guarda lo que llegue y devuelvelo.
// El tipo del estado se ANOTA: sin el, useState infiere { desde: null }
// y setR no encaja en onCambio. Este bloque no compilaba por eso.
const [r, setR] = useState<{ desde: string | null; hasta: string | null }>({
  desde: null, hasta: null,
});

export function Ejemplo7_1() {
  return (<>
<RangoFecha
  titulo="Rango de fechas"
  desde={r.desde}
  hasta={r.hasta}
  onCambio={setR}
  maxDias={7}                  // el calendario IMPIDE pasar de ahi
  atajos={atajosDeDias(1, 3, 7)}   // con tope, los de meses no caben y no se pintan
  error={sinSede ? 'Seleccione sede' : undefined}
  deshabilitado={sinSede}      // sale del tabulador, no solo se ve apagado
  primerDia={1}                // lunes
/>
  </>);
}
