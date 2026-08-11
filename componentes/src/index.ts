/**
 * Punto de entrada del sistema de diseño.
 *
 *   import { TablaDatos, Boton, Chip } from 'sistema-diseno-ae/componentes';
 *
 * Los estilos NO se importan desde aquí: van aparte y en este orden.
 *   import 'sistema-diseno-ae/tokens.css';
 *   import 'sistema-diseno-ae/componentes.css';
 */
export { TablaDatos, type Columna, type EstadoTabla } from './TablaDatos';
export { RangoFecha } from './RangoFecha';
export { ZonaAvisos } from './ZonaAvisos';
export { CargaImagen } from './CargaImagen';
export { CargaPdf, type PdfListo } from './CargaPdf';
export { AreaTexto } from './AreaTexto';
// El compresor viaja aparte del componente: un producto que suba PDF por su
// cuenta —desde un formulario que no usa `CargaPdf`— puede comprimir igual.
export { comprimirPdf, formatearPeso, ahorro, esPdf } from './interno/comprimir-pdf.mjs';
export { Confirmacion } from './Confirmacion';
export { Boton, type VarianteBoton } from './Boton';
export { Chip, type TonoChip } from './Chip';
export { Enlace } from './Enlace';
export { Campo, Selector } from './Campo';
export { CampoContrasena } from './CampoContrasena';
export { Avatar, colorIdentidad, iniciales } from './Avatar';
export { Paginacion } from './Paginacion';
export { Interruptor, SeleccionMultiple, type Opcion } from './Interruptor';
export { EstadoPantalla, Aviso, Progreso, type TipoEstado, type TonoAviso } from './Estados';
export { Tarjeta, TarjetaPersona } from './Tarjeta';
export { Horario, escribirHora, type BloqueHorario } from './Horario';
export { SelectorBusqueda, type OpcionBusqueda } from './SelectorBusqueda';
export { Nota } from './Nota';
export { MarcoApp, type GrupoNav, type OpcionNav } from './MarcoApp';
export { MenuUsuario, type Tema } from './MenuUsuario';
export { MarcaMenu } from './MarcaMenu';
export { Migas, type Miga } from './Migas';
export { Dialogo } from './Dialogo';
export { Icono, NOMBRES_ICONO, type NombreIcono, type TamanoIcono } from './Icono';
export { CabeceraPantalla } from './CabeceraPantalla';
export { PanelBarra, type ItemPanel } from './PanelBarra';
