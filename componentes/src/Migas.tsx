/**
 * MIGAS DE PAN
 *
 * Dónde estás dentro de la jerarquía. Seis reglas de estilo y ningún
 * comportamiento — y aun así se reconstruía mal, porque lo que hay que copiar
 * no se ve:
 *
 *   · `aria-label` en el `<nav>`. Sin él, quien navega por regiones oye
 *     «navegación» dos veces y no sabe cuál es cuál.
 *   · las barras con `aria-hidden`. Sin eso el lector lee «Sistema de diseño,
 *     barra inclinada, Elementos, barra inclinada, Interruptor».
 *   · `aria-current="page"` en el último. Es lo que dice que ahí estás, y es
 *     justo lo que se pierde al copiar solo el sombreado.
 *
 * UNA DECISIÓN CERRADA: el último nivel NUNCA es enlace. Un enlace a la página
 * en la que ya estás no lleva a ninguna parte, y quien tabula pasa por él sin
 * ganar nada. Por eso el último elemento de `ruta` ignora su `href` si lo trae.
 */

export type Miga = {
  texto: string;
  /** A dónde lleva. El ÚLTIMO nivel lo ignora: ahí ya estás. */
  href?: string;
};

export type MigasProps = {
  ruta: Miga[];
  /** Para enrutar sin recargar. Sin él, los enlaces navegan de verdad. */
  onIr?: (href: string) => void;
  /**
   * Cuántos niveles se ven en pantalla estrecha, contando el actual.
   *
   * Por omisión 2: el anterior y dónde estás. Con tres o más niveles las migas
   * no caben en un teléfono, y de las dos salidas habituales —colapsar los
   * intermedios en «…» o quedarse con el anterior— se eligió la segunda: en un
   * teléfono lo que se busca es volver, no situarse. Los niveles ocultos
   * siguen en el árbol de accesibilidad; solo se ocultan A LA VISTA.
   */
  visiblesEnMovil?: number;
};

export function Migas({ ruta, onIr, visiblesEnMovil = 2 }: MigasProps) {
  if (ruta.length === 0) return null;
  const corte = Math.max(0, ruta.length - visiblesEnMovil);

  return (
    <nav className="migas" aria-label="Ubicación">
      {ruta.map((m, i) => {
        const ultimo = i === ruta.length - 1;
        // Los de más atrás se ocultan A LA VISTA en móvil, no del lector: la
        // ubicación completa sigue siendo información, quepa o no en pantalla.
        const clase = [
          ultimo ? 'migas-actual' : '',
          i < corte ? 'migas-atras' : '',
        ].filter(Boolean).join(' ');

        return (
          <span key={m.texto + i} className="migas-tramo">
            {i > 0 && <span className="migas-sep" aria-hidden="true">/</span>}
            {ultimo || !m.href ? (
              <span className={clase} aria-current={ultimo ? 'page' : undefined}>{m.texto}</span>
            ) : (
              <a
                className={clase}
                href={m.href}
                onClick={onIr ? (e) => { e.preventDefault(); onIr(m.href!); } : undefined}
              >
                {m.texto}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}
