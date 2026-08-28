/**
 * REDES SOCIALES — R112
 *
 * Los enlaces a las cuentas del colegio. Parece el componente más tonto del
 * sistema y es el que más se hace mal: es un puñado de enlaces con un dibujo
 * dentro y sin una palabra, o sea el caso exacto en el que un lector de
 * pantalla anuncia «enlace» siete veces seguidas y ya está.
 *
 * TRES DECISIONES QUE NO SON DE ASPECTO:
 *
 *   1 · LOS COLORES DE MARCA NO ENTRAN. Ni el azul de Facebook, ni el degradado
 *       de Instagram. No es una preferencia: §2.5.5 dice que los colores
 *       autorizados son el panel de escalas y ampliarlo no es decisión de quien
 *       escribe un componente. Los iconos van en `currentColor` como los otros
 *       cuarenta y cinco, así que toman el color del texto que los rodea y
 *       funcionan igual en claro y en oscuro, que es más de lo que hace un
 *       logotipo de marca.
 *
 *       Van DIBUJADOS en el estilo del sistema —trazo de 1,5 sobre 24×24—, no
 *       calcados. Los logotipos son marcas registradas y vienen rellenos.
 *
 *   2 · EL NOMBRE ACCESIBLE LO LLEVA EL ENLACE, NO EL DIBUJO. Es la regla de
 *       §8.1 aplicada: el icono sale `aria-hidden` siempre y quien nombra es el
 *       control. Con `conNombre` el nombre está escrito y visible, y entonces
 *       el `aria-label` CONTIENE ese texto —SC 2.5.3 pide que lo que se ve esté
 *       dentro de lo que se oye, o quien dicta por voz no puede pulsarlo—.
 *
 *   3 · SI SE ABRE EN OTRA PESTAÑA, SE DICE. Abrirla sin avisar es SC 3.2.5. Va
 *       dentro del nombre accesible, no en un `title` que nadie oye.
 *
 * Y UNA QUE SÍ ES DE ASPECTO, pero decide el marcado: las tres formas —suelto,
 * en círculo y en cuadro— son la MISMA lista con otra clase. No son tres
 * componentes: un producto que quiera cambiar de forma no debería tener que
 * cambiar de importación.
 *
 * SE COMPONE, no se reconstruye: el dibujo es `Icono`. Lo propio es la lista.
 */
import { Icono, type NombreIcono } from './Icono';

/** Las siete que el sistema dibuja. Añadir una es añadir su trazo en los dos
 *  mapas de iconos — y `verificar-iconos.mjs` comprueba que coincidan. */
export type NombreRed = 'facebook' | 'instagram' | 'youtube' | 'tiktok'
  | 'whatsapp' | 'x' | 'linkedin';

/**
 * Cómo se llama cada una cuando hay que decirlo en voz alta.
 *
 * «X» a secas no se entiende dicho por un lector de pantalla —es una letra—,
 * así que lleva su antiguo nombre detrás. No es nostalgia: es que el nombre
 * accesible tiene que identificar el destino.
 */
export const NOMBRE_RED: Record<NombreRed, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  x: 'X',
  linkedin: 'LinkedIn',
};

/** Lo que se dice cuando el icono va solo y hay que identificar el destino. */
const PARA_OIR: Record<NombreRed, string> = { ...NOMBRE_RED, x: 'X, antes Twitter' };

export type EnlaceRed = {
  red: NombreRed;
  /** A dónde va. Se pasa entera, con protocolo. */
  url: string;
  /** Sustituye al nombre de la red. Para «Colegio Albert Einstein» en vez de
   *  «Facebook», cuando lo que importa es la cuenta y no la plataforma. */
  nombre?: string;
  /** El @usuario, bajo el nombre. Solo se pinta con `conNombre`. */
  usuario?: string;
};

export type RedesSocialesProps = {
  /** En el orden en que se quieren. El componente no reordena nada. */
  redes: EnlaceRed[];
  /**
   * El marco del icono. `'solo'` por omisión — el icono desnudo, que es lo que
   * pide un pie de página y lo que menos ruido mete.
   *
   * `'circulo'` y `'cuadro'` dan un blanco de pulsación mayor, y por eso son
   * los que conviene en móvil: el icono suelto a 18px deja un objetivo de 18px,
   * y SC 2.5.8 pide 24. Con marco son 40.
   */
  forma?: 'solo' | 'circulo' | 'cuadro';
  /**
   * Con marco relleno en vez de contorneado. Sin marco no hace nada.
   *
   * El relleno usa el fondo hundido del sistema, no un color de marca — ver la
   * decisión 1 de arriba.
   */
  relleno?: boolean;
  /**
   * `'medio'` por omisión. Son los pasos de §8.1, no números libres:
   * chico 16 · medio 18 · grande 32.
   */
  tamano?: 'chico' | 'medio' | 'grande';
  /** Escribe el nombre al lado del icono. Cambia quién nombra el enlace. */
  conNombre?: boolean;
  /** `'fila'` por omisión. En columna, para una barra lateral o un contacto. */
  direccion?: 'fila' | 'columna';
  /**
   * Cómo se llama el grupo. «Redes sociales» por omisión.
   *
   * Va en el `<nav>`: con varias navegaciones en la misma página —el menú, las
   * migas, esto— sin nombre se anuncian todas igual y no se distinguen.
   */
  etiqueta?: string;
  /** Abrir en otra pestaña. Encendido: es lo normal en un enlace externo, y se
   *  avisa en el nombre accesible. */
  nuevaPestana?: boolean;
  className?: string;
};

const PASO = { chico: 'control', medio: 'texto', grande: 'estado' } as const;

export function RedesSociales({
  redes,
  forma = 'solo',
  relleno = false,
  tamano = 'medio',
  conNombre = false,
  direccion = 'fila',
  etiqueta = 'Redes sociales',
  nuevaPestana = true,
  className = '',
}: RedesSocialesProps) {
  // Sin enlaces no se pinta un `<nav>` vacío: un punto de referencia que no
  // lleva a ninguna parte es ruido para quien navega por ellos.
  if (!redes.length) return null;

  // Las clases se arman FUERA del JSX. Un ternario con literales dentro de
  // `className` deja al candado de huérfanas leyendo trozos sueltos —en R111 se
  // invento dos clases que no existian— y aqui llego a leer `.solo`.
  //
  // Y no hay una clase `rs` de raiz: NINGUNA regla la definiria, y una clase que
  // no pinta nada solo sirve para que alguien la use creyendo que si. El gancho
  // es `rs-fila` o `rs-columna`.
  const conMarco = forma !== 'solo';
  const clases = [
    `rs-${direccion}`,
    `rs-${tamano}`,
    conMarco ? `rs-${forma}` : '',
    conMarco && relleno ? 'rs-relleno' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <nav aria-label={etiqueta} className={clases}>
      <ul className="rs-lista">
        {redes.map((r) => {
          const suNombre = r.nombre ?? NOMBRE_RED[r.red];
          // Con el nombre escrito, el texto visible YA nombra el enlace. El
          // `aria-label` solo se pone para añadir el aviso de la pestaña, y
          // entonces tiene que EMPEZAR por lo que se ve (SC 2.5.3).
          const aviso = nuevaPestana ? ', se abre en una pestaña nueva' : '';
          const nombreAccesible = conNombre
            ? (aviso ? `${suNombre}${r.usuario ? ` ${r.usuario}` : ''}${aviso}` : undefined)
            : `${r.nombre ?? PARA_OIR[r.red]}${aviso}`;

          return (
            <li className="rs-item" key={`${r.red}-${r.url}`}>
              <a
                className="rs-enlace"
                href={r.url}
                aria-label={nombreAccesible}
                {...(nuevaPestana
                  // `noopener` no es opcional: sin él la página de destino puede
                  // tocar la nuestra por `window.opener`.
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                <span className="rs-marco">
                  <Icono nombre={r.red as NombreIcono} tam={PASO[tamano]} />
                </span>
                {conNombre && (
                  <span className="rs-txt">
                    <span className="rs-nombre">{suNombre}</span>
                    {r.usuario && <span className="rs-usuario">{r.usuario}</span>}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
