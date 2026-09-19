/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { useConfirmar } from '../src/index';

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
const confirmar = useConfirmar();

async function eliminar(fila) {
  const ok = await confirmar({
    titulo: `Eliminar ${fila.nombre}`,
    linea: 'No se puede deshacer.',
    accion: 'Eliminar',
    tono: 'destructivo',      // destructivo · aviso
    marcar: fila.id,          // resalta la fila mientras se decide
  });
  if (!ok) return;
  await api.eliminar(fila.id);
  avisar.exito(`Se eliminó ${fila.nombre}`);
}
