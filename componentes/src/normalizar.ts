/**
 * NORMALIZAR AL GUARDAR — la frontera de escritura, compartida
 *
 * Pedido del responsable (2026-08-10): que dé igual cómo escriba el usuario o
 * cómo llegue de una API — a la base de datos entra normalizado. Si cada
 * producto escribe su propio trim/lowercase salen distintos, que es la deriva
 * que este paquete existe para impedir.
 *
 * DÓNDE SE USA. En el producto, justo antes de grabar. NO dentro de `Campo`:
 * el componente no sabe a dónde viaja el dato, y normalizar mientras se
 * escribe cambia lo que la persona ve. La pantalla enseña lo que se teclea;
 * la base guarda lo normalizado.
 *
 * POR TIPO, no a ciegas:
 *
 *   · TODO recibe `trim` y colapso de espacios internos («Ana   María» es un
 *     error de tecleo, no dos datos).
 *   · `correo`, `usuario` y `codigo` bajan a minúsculas: ahí la minúscula es
 *     la forma canónica y dos mayúsculas distintas son EL MISMO dato.
 *   · `nombre` CONSERVA su caja. «QUISPE MAMANI, Rosa» en minúsculas es
 *     pérdida de dato en un registro que se exhibe ante inspección. Buscar
 *     sin sensibilidad ya lo resuelve la consulta (unaccent/pg_trgm, ver
 *     manual): no hace falta destruir la mayúscula en reposo.
 *   · `dni`, `ruc` y `telefono` quedan solo con dígitos (y el «+» inicial
 *     del teléfono): los espacios y guiones son formato de pantalla.
 *   · CONTRASEÑA: jamás. Ni trim ni caja — se guarda EXACTA (hasheada por el
 *     producto). Hoy no hay campo contraseña; la regla queda escrita para
 *     cuando lo haya: esta función no debe tocarla.
 */

export type TipoDato =
  | 'texto'     // campo genérico: trim + espacios + minúsculas
  | 'nombre'    // persona o entidad: trim + espacios, CONSERVA la caja
  | 'correo'
  | 'usuario'
  | 'codigo'
  | 'dni'
  | 'ruc'
  | 'telefono';

/** La forma en que un dato entra a la base, decidida UNA vez. */
export function alGuardar(valor: string, tipo: TipoDato = 'texto'): string {
  const plano = valor.trim().replace(/\s+/g, ' ');
  switch (tipo) {
    case 'nombre':
      return plano;
    case 'correo':
    case 'usuario':
    case 'codigo':
      return plano.toLowerCase();
    case 'dni':
    case 'ruc':
      return plano.replace(/\D/g, '');
    case 'telefono':
      // Conserva un «+» inicial si venía; el resto, solo dígitos.
      return (plano.startsWith('+') ? '+' : '') + plano.replace(/\D/g, '');
    case 'texto':
    default:
      return plano.toLowerCase();
  }
}
