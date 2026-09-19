/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { avisar } from '../src/index';

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
avisar.exito('Se guardó la asistencia de marzo');
avisar.info('Se exportaron 38 filas a CSV');
avisar.aviso('Se envió con 3 faltas sin justificar');

// El error no se va solo
avisar.error('No se guardó: falta el DNI de 2 trabajadores');

// Con deshacer: 10 s y el reloj se detiene al pasar por encima
avisar.exito('Se archivaron 12 expedientes', {
  accion: { texto: 'Deshacer', al: restaurar },
});
