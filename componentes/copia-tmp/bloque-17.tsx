/* GENERADO por verificar-copia.mjs. Se borra solo. */
import { PanelPrivilegios, privilegiosEfectivos, clavesEfectivas } from '../src/index';
import type { ColumnaPrivilegios, ModuloPrivilegios } from '../src/index';

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
// Las columnas las declara EL PANEL, no los módulos: una matriz con columnas
// distintas por fila no es una matriz, es una lista con más huecos.
const COLUMNAS: ColumnaPrivilegios[] = [
  { id: 'ver',       titulo: 'Ver' },
  { id: 'editar',    titulo: 'Editar' },
  { id: 'crear',     titulo: 'Crear' },
  { id: 'alta',      titulo: 'Dar de alta' },
  { id: 'descargar', titulo: 'Descargar', aparte: true },  // separada por una línea
];

const MODULOS: ModuloPrivilegios[] = [{
  id: 'personal',
  nombre: 'Personal',
  // Las filas son los RECURSOS, y aquí es donde tienen nombre.
  filas: [
    { id: 'trab', nombre: 'Trabajadores' },
    { id: 'cont', nombre: 'Contratos' },
  ],
  privilegios: [
    { id: 'trab-ver',    nombre: 'Ver trabajadores',  columna: 'ver',    fila: 'trab' },
    { id: 'trab-editar', nombre: 'Editar trabajador', columna: 'editar', fila: 'trab' },
    { id: 'trab-crear',  nombre: 'Crear trabajador',  columna: 'crear',  fila: 'trab',
      depende: 'trab-editar' },
    { id: 'cont-ver',    nombre: 'Ver contratos',     columna: 'ver',    fila: 'cont' },
    { id: 'cont-alta',   nombre: 'Dar de alta',       columna: 'alta',   fila: 'cont',
      claveGlobal: 'alta-contrato' },
    // El hueco que HABLA. Omitirlo sería un espacio en blanco entre cien
    // casillas, y nadie se enteraría de que esa acción existe para otro recurso.
    { id: 'cont-crear',  nombre: 'Crear contrato',    columna: 'crear',  fila: 'cont',
      cerrado: { tipo: 'noAplica', motivo: 'Un contrato se crea desde la ficha.' } },
    // Concedido y no repartible por quien mira: se ve el estado y se dice el porqué.
    { id: 'cont-desc',   nombre: 'Descargar contratos', columna: 'descargar', fila: 'cont',
      deshabilitado: true, ayuda: 'Solo lo concede Dirección.' },
  ],
}, {
  // R152 · OTRA PANTALLA, Y LA MISMA LLAVE. «Dar de alta» es el MISMO permiso
  // aqui y en Contrato: encender uno enciende el otro, y el aviso lo dice
  // nombrando el modulo. Para unir DENTRO de un modulo es «clave»; esto cruza
  // todos los modulos, incluidos los que se añadan despues.
  id: 'historia',
  nombre: 'Historia de contratos',
  filas: [{ id: 'hist', nombre: 'Historial' }],
  privilegios: [
    { id: 'hist-ver',  nombre: 'Ver historial',  columna: 'ver',   fila: 'hist' },
    { id: 'hist-alta', nombre: 'Dar de alta',    columna: 'alta',  fila: 'hist',
      claveGlobal: 'alta-contrato' },
  ],
}];

// CON «filas», «base» NOMBRA LA COLUMNA BASE, y manda sobre SU fila: sin «ver
// Contratos» no hay nada de Contratos, y eso no dice nada de Trabajadores.
// Si su dominio no funciona con un privilegio que manda, pase base={null}.
export function Ejemplo17_0() {
  return (<>
<PanelPrivilegios
  presentacion="matriz"
  columnas={COLUMNAS}
  modulos={MODULOS}
  base="ver"
  valor={valor}
  onCambio={(completo, efectivo) => {
    setValor(completo);   // lo que la pantalla muestra: NO borra nada
    guardar(efectivo);    // lo que de verdad rige: sin base, sin depende, sin cerrados
  }}
/>
  </>);
}

// R152 · Y para aplanar a «que llaves estan dadas», sin deducirlo:
//   una llave compartida esta concedida si sobrevive en AL MENOS UN modulo.
const llaves = clavesEfectivas(MODULOS, valor, 'ver');   // Set<string>
