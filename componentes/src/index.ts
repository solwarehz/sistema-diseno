/**
 * Punto de entrada del sistema de diseño.
 *
 * TODO lo que un componente exporta sale por aquí, incluidos los `*Props`. No
 * era así: el 2026-08-21 Control Administrativos reportó que `AjusteHorario`
 * no se exportaba —«lo deduzco del propio componente en vez de meter mano en el
 * paquete»— y al mirarlo aparecieron **42 de 105** exportaciones sin salida,
 * entre ellas los `Props` de todos y cada uno de los componentes. Un paquete
 * que obliga a deducir el tipo de una prop no ha publicado esa prop.
 *
 * Esta lista ya NO depende de acordarse: `verificar-entrega.mjs` falla si un
 * componente exporta algo que no llega hasta aquí.
 *
 *   import { TablaDatos, Boton, Chip } from 'sistema-diseno-ae/componentes';
 *
 * Los estilos NO se importan desde aquí: van aparte y en este orden.
 *   import 'sistema-diseno-ae/tokens.css';
 *   import 'sistema-diseno-ae/componentes.css';
 */
export { TablaDatos, type Columna, type EstadoTabla, type TablaDatosProps } from './TablaDatos';
export { RangoFecha, type RangoFechaProps } from './RangoFecha';
export { ZonaAvisos, type ZonaAvisosProps, type EnZonaAvisos } from './ZonaAvisos';
export { CargaImagen, type FormatoCarga, type CargaImagenProps } from './CargaImagen';
export { CargaId, MARCO_ID, type CaraId, type PasoId, type CargaIdProps } from './CargaId';
export { CargaPdf, type PdfListo, type CargaPdfProps } from './CargaPdf';
export { AreaTexto, type AreaTextoProps } from './AreaTexto';
// El compresor viaja aparte del componente: un producto que suba PDF por su
// cuenta —desde un formulario que no usa `CargaPdf`— puede comprimir igual.
export { comprimirPdf, formatearPeso, ahorro, esPdf } from './interno/comprimir-pdf.mjs';
export { Confirmacion, type ConfirmacionProps } from './Confirmacion';
export { Boton, type VarianteBoton, type BotonProps } from './Boton';
export { Chip, type TonoChip, type ChipProps } from './Chip';
export { Enlace, type EnlaceProps } from './Enlace';
export { Campo, Selector, type CampoProps, type SelectorProps } from './Campo';
export { CampoContrasena, type CampoContrasenaProps } from './CampoContrasena';
export { Avatar, colorIdentidad, iniciales, type TamanoAvatar, type AvatarProps } from './Avatar';
export { Paginacion, type PaginacionProps } from './Paginacion';
export { Interruptor, SeleccionMultiple, type Opcion, type InterruptorProps, type SeleccionMultipleProps } from './Interruptor';
export { Segmentado, type OpcionSegmento, type SegmentadoProps } from './Segmentado';
export { EstadoPantalla, Aviso, Progreso, type TipoEstado, type TonoAviso, type EstadoPantallaProps, type AvisoProps, type ProgresoProps } from './Estados';
export { Tarjeta, TarjetaAccion, TarjetaPersona, type TarjetaProps, type TarjetaAccionProps, type TarjetaPersonaProps } from './Tarjeta';
export { Horario, escribirHora, type BloqueHorario, type HorarioProps, type AjusteHorario } from './Horario';
export { SelectorBusqueda, type OpcionBusqueda, type SelectorBusquedaProps } from './SelectorBusqueda';
export { Nota, type NotaProps } from './Nota';
export { Mensaje, type IntencionMensaje, type MensajeProps } from './Mensaje';
export { MarcoApp, type GrupoNav, type OpcionNav, type MarcoAppProps } from './MarcoApp';
export { MenuUsuario, type Tema, type MenuUsuarioProps } from './MenuUsuario';
export { MarcaMenu, type MarcaMenuProps } from './MarcaMenu';
export { Migas, type Miga, type MigasProps } from './Migas';
export { Dialogo, type DialogoProps } from './Dialogo';
export { Icono, NOMBRES_ICONO, type NombreIcono, type TamanoIcono, type IconoProps, TAMANOS_ICONO } from './Icono';
export { CabeceraPantalla, type CabeceraPantallaProps } from './CabeceraPantalla';
export { PanelBarra, type ItemPanel, type PanelBarraProps } from './PanelBarra';
export { PanelPrivilegios, resumirPrivilegios, type PanelPrivilegiosProps, type Privilegio,
  type GrupoPrivilegios, type ModuloPrivilegios, type ValorPrivilegios } from './PanelPrivilegios';
